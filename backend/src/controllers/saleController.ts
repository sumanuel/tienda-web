import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../types/auth';

// Función auxiliar para generar número de venta único
async function generateSaleNumber(storeId: string): Promise<string> {
  const today = new Date();
  const prefix = `VT-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
  
  // Buscar la última venta del día para este store
  const lastSale = await prisma.sale.findFirst({
    where: {
      storeId,
      saleNumber: { startsWith: prefix },
    },
    orderBy: { createdAt: 'desc' },
  });

  let sequence = 1;
  if (lastSale && lastSale.saleNumber) {
    const lastSequence = parseInt(lastSale.saleNumber.split('-')[3] || '0');
    sequence = lastSequence + 1;
  }

  return `${prefix}-${String(sequence).padStart(4, '0')}`;
}

// GET /api/sales
export async function listSales(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { storeId, paymentMethod, customerId, startDate, endDate } =
      req.query;

    // Validar que storeId pertenece al usuario
    if (storeId && typeof storeId === 'string') {
      const store = await prisma.store.findFirst({
        where: {
          id: storeId,
          userId: req.user.userId,
        },
      });

      if (!store) {
        return res
          .status(403)
          .json({ error: 'No tienes acceso a esta tienda' });
      }
    }

    const sales = await prisma.sale.findMany({
      where: {
        ...(storeId && typeof storeId === 'string' && { storeId }),
        ...(paymentMethod &&
          typeof paymentMethod === 'string' && { paymentMethod }),
        ...(customerId && typeof customerId === 'string' && { customerId }),
        ...(startDate &&
          typeof startDate === 'string' && {
            createdAt: { gte: new Date(startDate) },
          }),
        ...(endDate &&
          typeof endDate === 'string' && {
            createdAt: { lte: new Date(endDate) },
          }),
        store: {
          userId: req.user.userId, // Solo ventas de tiendas del usuario
        },
      },
      include: {
        items: {
          select: {
            id: true,
            productId: true,
            quantity: true,
            price: true,
            product: {
              select: {
                name: true,
                sku: true,
              },
            },
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ sales });
  } catch (error) {
    console.error('List sales error:', error);
    res.status(500).json({ error: 'Error al listar ventas' });
  }
}

// GET /api/sales/:id
export async function getSale(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { id } = req.params;

    const sale = await prisma.sale.findFirst({
      where: {
        id,
        store: {
          userId: req.user.userId, // Solo ventas de tiendas del usuario
        },
      },
      include: {
        items: {
          select: {
            id: true,
            productId: true,
            quantity: true,
            price: true,
            product: {
              select: {
                name: true,
                sku: true,
                barcode: true,
              },
            },
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!sale) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    res.json({ sale });
  } catch (error) {
    console.error('Get sale error:', error);
    res.status(500).json({ error: 'Error al obtener venta' });
  }
}

// POST /api/sales
export async function createSale(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { storeId, items, paymentMethod, customerId, cashierId, cashierName, amountReceived, change, notes } = req.body;

    // Validaciones
    if (!storeId) {
      return res.status(400).json({ error: 'El ID de la tienda es requerido' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ error: 'Debe agregar al menos un producto a la venta' });
    }

    if (
      !paymentMethod ||
      !['cash', 'card', 'transfer', 'mixed'].includes(paymentMethod)
    ) {
      return res.status(400).json({ error: 'Método de pago inválido' });
    }

    // Verificar que la tienda pertenece al usuario
    const store = await prisma.store.findFirst({
      where: {
        id: storeId,
        userId: req.user.userId,
      },
    });

    if (!store) {
      return res.status(403).json({ error: 'No tienes acceso a esta tienda' });
    }

    // Verificar cliente si se proporciona
    if (customerId) {
      const customer = await prisma.customer.findFirst({
        where: {
          id: customerId,
          storeId,
        },
      });

      if (!customer) {
        return res.status(404).json({ error: 'Cliente no encontrado' });
      }
    }

    // Validar items y verificar stock
    const productIds = items.map((item: any) => item.productId);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        storeId,
      },
    });

    if (products.length !== productIds.length) {
      return res
        .status(400)
        .json({ error: 'Uno o más productos no encontrados' });
    }

    // Verificar stock y calcular total
    let total = 0;
    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);

      if (!product) {
        return res
          .status(400)
          .json({ error: `Producto ${item.productId} no encontrado` });
      }

      if (item.quantity <= 0) {
        return res
          .status(400)
          .json({ error: `Cantidad inválida para ${product.name}` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          error: `Stock insuficiente para ${product.name}. Disponible: ${product.stock}, Solicitado: ${item.quantity}`,
        });
      }

      // Usar precio actual del producto si no se proporciona
      const itemPrice =
        item.price !== undefined ? parseFloat(item.price) : product.price;
      total += itemPrice * item.quantity;
    }

    // Crear venta y actualizar stock en una transacción
    const sale = await prisma.$transaction(async (tx) => {
      // Generar número de venta
      const saleNumber = await generateSaleNumber(storeId);
      
      // Crear venta
      const newSale = await tx.sale.create({
        data: {
          storeId,
          saleNumber,
          subtotal: total,
          tax: 0,
          discount: 0,
          total,
          paymentMethod,
          paymentStatus: 'paid',
          customerId: customerId || null,
          cashierId: cashierId || null,
          cashierName: cashierName || null,
          amountReceived: amountReceived !== undefined ? parseFloat(amountReceived) : null,
          change: change !== undefined ? parseFloat(change) : null,
          notes: notes || null,
          items: {
            create: items.map((item: any) => {
              const product = products.find((p) => p.id === item.productId)!;
              const itemPrice =
                item.price !== undefined
                  ? parseFloat(item.price)
                  : product.price;
              const itemSubtotal = itemPrice * item.quantity;

              return {
                productId: item.productId,
                quantity: item.quantity,
                price: itemPrice,
                cost: product.cost || 0,
                discount: 0,
                subtotal: itemSubtotal,
              };
            }),
          },
        },
        include: {
          items: {
            select: {
              id: true,
              productId: true,
              quantity: true,
              price: true,
              product: {
                select: {
                  name: true,
                  sku: true,
                },
              },
            },
          },
          customer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Actualizar stock de productos
      for (const item of items) {
        const product = products.find((p) => p.id === item.productId)!;
        const stockBefore = product.stock;
        const stockAfter = product.stock - item.quantity;
        
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });

        // Crear movimiento de inventario
        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            productName: product.name,
            productCode: product.sku || product.barcode || product.id.slice(0, 8),
            storeId: storeId,
            type: 'sale',
            quantity: -item.quantity,
            stockBefore,
            stockAfter,
            unitCost: product.cost || 0,
            totalCost: (product.cost || 0) * item.quantity,
            userId: req.user!.userId,
            userName: req.user!.name || 'Cajero',
            notes: `Venta ${saleNumber}`,
          },
        });
      }

      return newSale;
    });

    res.status(201).json({ sale });
  } catch (error) {
    console.error('Create sale error:', error);
    res.status(500).json({ error: 'Error al crear venta' });
  }
}

// DELETE /api/sales/:id (Cancelar venta)
export async function cancelSale(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { id } = req.params;

    // Verificar que la venta existe y pertenece al usuario
    const existingSale = await prisma.sale.findFirst({
      where: {
        id,
        store: {
          userId: req.user.userId,
        },
      },
      include: {
        items: true,
      },
    });

    if (!existingSale) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    // Cancelar venta y restaurar stock en una transacción
    await prisma.$transaction(async (tx) => {
      // Restaurar stock de productos
      for (const item of existingSale.items) {
        // Obtener información del producto
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: {
            id: true,
            name: true,
            sku: true,
            barcode: true,
            stock: true,
            cost: true,
          },
        });

        if (!product) continue;

        const stockBefore = product.stock;
        const stockAfter = product.stock + item.quantity;

        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });

        // Crear movimiento de inventario (reversa)
        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            productName: product.name,
            productCode: product.sku || product.barcode || product.id.slice(0, 8),
            storeId: existingSale.storeId,
            type: 'adjustment',
            quantity: item.quantity,
            stockBefore,
            stockAfter,
            unitCost: product.cost || 0,
            totalCost: (product.cost || 0) * item.quantity,
            userId: req.user!.userId,
            userName: req.user!.name || 'Usuario',
            notes: `Cancelación de venta ${existingSale.saleNumber || id}`,
          },
        });
      }

      // Marcar venta como cancelada en lugar de eliminarla
      await tx.sale.update({
        where: { id },
        data: {
          cancelledAt: new Date(),
        },
      });
    });

    res.json({ message: 'Venta cancelada exitosamente' });
  } catch (error) {
    console.error('Cancel sale error:', error);
    res.status(500).json({ error: 'Error al cancelar venta' });
  }
}

// GET /api/sales/stats/summary
export async function getSalesStats(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { storeId, startDate, endDate } = req.query;

    // Validar que storeId pertenece al usuario
    if (storeId && typeof storeId === 'string') {
      const store = await prisma.store.findFirst({
        where: {
          id: storeId,
          userId: req.user.userId,
        },
      });

      if (!store) {
        return res
          .status(403)
          .json({ error: 'No tienes acceso a esta tienda' });
      }
    }

    const whereClause = {
      ...(storeId && typeof storeId === 'string' && { storeId }),
      ...(startDate &&
        typeof startDate === 'string' && {
          createdAt: { gte: new Date(startDate) },
        }),
      ...(endDate &&
        typeof endDate === 'string' && {
          createdAt: { lte: new Date(endDate) },
        }),
      store: {
        userId: req.user.userId,
      },
    };

    const [totalSales, salesByPaymentMethod, totalRevenue] = await Promise.all([
      // Total de ventas
      prisma.sale.count({ where: whereClause }),

      // Ventas por método de pago
      prisma.sale.groupBy({
        by: ['paymentMethod'],
        where: whereClause,
        _count: true,
        _sum: {
          total: true,
        },
      }),

      // Ingresos totales
      prisma.sale.aggregate({
        where: whereClause,
        _sum: {
          total: true,
        },
      }),
    ]);

    res.json({
      totalSales,
      totalRevenue: totalRevenue._sum.total || 0,
      salesByPaymentMethod: salesByPaymentMethod.map((item) => ({
        paymentMethod: item.paymentMethod,
        count: item._count,
        total: item._sum.total || 0,
      })),
    });
  } catch (error) {
    console.error('Get sales stats error:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas de ventas' });
  }
}
