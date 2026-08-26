import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middleware/authMiddleware';
import {
  validateSaleData,
  validateCancelSale,
  validateSalesQuery,
} from '../utils/saleValidator';

/**
 * Genera un número consecutivo único para ventas
 */
async function generateSaleNumber(
  storeId: string,
  prefix: string = 'VEN'
): Promise<string> {
  const lastSale = await prisma.sale.findFirst({
    where: {
      storeId,
      saleNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      saleNumber: true,
    },
  });

  let nextNumber = 1;

  if (lastSale) {
    const numberPart = lastSale.saleNumber.split('-')[1];
    if (numberPart) {
      nextNumber = parseInt(numberPart, 10) + 1;
    }
  }

  const paddedNumber = nextNumber.toString().padStart(6, '0');
  return `${prefix}-${paddedNumber}`;
}

/**
 * GET /api/sales
 * Lista ventas con filtros opcionales
 */
export async function listSales(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const {
      storeId,
      customerId,
      paymentMethod,
      status,
      startDate,
      endDate,
      page = '1',
      limit = '50',
    } = req.query;

    // Validar parámetros
    const validationErrors = validateSalesQuery({
      storeId,
      startDate,
      endDate,
    });
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Parámetros de búsqueda inválidos',
        details: validationErrors,
      });
    }

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

    // Construir filtros
    const where: any = {
      ...(storeId && typeof storeId === 'string' && { storeId }),
      store: {
        userId: req.user.userId,
      },
    };

    if (customerId && typeof customerId === 'string') {
      where.customerId = customerId;
    }

    if (paymentMethod && typeof paymentMethod === 'string') {
      where.paymentMethod = paymentMethod;
    }

    if (status && typeof status === 'string') {
      where.status = status;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate && typeof startDate === 'string') {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate && typeof endDate === 'string') {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    // Paginación
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Obtener ventas y total
    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
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
              documentNumber: true,
              phone: true,
            },
          },
          cashier: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limitNum,
      }),
      prisma.sale.count({ where }),
    ]);

    return res.status(200).json({
      sales,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error('Error al listar ventas:', error);
    return res
      .status(500)
      .json({ error: 'Error al listar ventas', details: error.message });
  }
}

/**
 * GET /api/sales/:id
 * Obtiene detalle completo de una venta
 */
export async function getSale(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { id } = req.params as { id: string };

    const sale = await prisma.sale.findFirst({
      where: {
        id,
        store: {
          userId: req.user.userId,
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                barcode: true,
                category: true,
              },
            },
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            documentNumber: true,
            phone: true,
            email: true,
            address: true,
          },
        },
        cashier: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        receivable: {
          include: {
            payments: true,
          },
        },
      },
    });

    if (!sale) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    return res.status(200).json({ sale });
  } catch (error: any) {
    console.error('Error al obtener venta:', error);
    return res
      .status(500)
      .json({ error: 'Error al obtener la venta', details: error.message });
  }
}

/**
 * POST /api/sales
 * Crea una nueva venta con gestión transaccional completa
 */
export async function createSale(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const saleData = req.body;
    const userId = req.user.userId;

    // 1. Validar datos de entrada
    const validationErrors = validateSaleData(saleData);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Datos de venta inválidos',
        details: validationErrors,
      });
    }

    // 2. Verificar que la tienda pertenece al usuario
    const store = await prisma.store.findFirst({
      where: {
        id: saleData.storeId,
        userId: req.user.userId,
      },
    });

    if (!store) {
      return res.status(403).json({ error: 'No tienes acceso a esta tienda' });
    }

    // 3. Ejecutar en transacción para garantizar integridad
    const result = await prisma.$transaction(async (tx) => {
      // 3.1. Generar número de venta consecutivo
      const saleNumber = await generateSaleNumber(saleData.storeId);

      // 3.2. Verificar stock de productos si tienen trackInventory = true
      for (const item of saleData.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: { stock: true, trackInventory: true, name: true },
        });

        if (!product) {
          throw new Error(`Producto ${item.productId} no encontrado`);
        }

        if (product.trackInventory && product.stock < item.quantity) {
          throw new Error(
            `Stock insuficiente para el producto "${product.name}". Disponible: ${product.stock}, Requerido: ${item.quantity}`
          );
        }
      }

      // 3.3. Crear la venta
      const sale = await tx.sale.create({
        data: {
          saleNumber,
          storeId: saleData.storeId,
          customerId: saleData.customerId || null,
          userId: userId,
          subtotal: saleData.subtotal,
          tax: saleData.tax,
          discount: saleData.discount || 0,
          total: saleData.total,
          currency: saleData.currency || 'VES',
          localCurrency: saleData.localCurrency || 'VES',
          referenceCurrency: saleData.referenceCurrency || 'USD',
          exchangeRate: saleData.exchangeRate || 0,
          totalReference: saleData.totalReference || null,
          paymentMethod: saleData.paymentMethod,
          referenceNumber: saleData.referenceNumber || null,
          paid: saleData.paid || saleData.total,
          change: saleData.change || 0,
          status: 'completed',
          notes: saleData.notes || null,
          monetarySnapshot: saleData.monetarySnapshot || null,
        },
      });

      // 3.4. Crear items de venta
      const saleItems = await Promise.all(
        saleData.items.map(async (item: any) => {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
            select: { name: true },
          });

          return tx.saleItem.create({
            data: {
              saleId: sale.id,
              productId: item.productId,
              productName: product?.name || 'Producto sin nombre',
              quantity: item.quantity,
              price: item.price,
              localPrice: item.localPrice,
              referencePrice: item.referencePrice,
              subtotal: item.subtotal,
              subtotalLocal: item.subtotalLocal,
              subtotalReference: item.subtotalReference,
              priceSnapshot: item.priceSnapshot || null,
              iva: item.iva || 0,
            },
          });
        })
      );

      // 3.5. Actualizar stock de productos con trackInventory
      for (const item of saleData.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: {
            trackInventory: true,
            stock: true,
            name: true,
            sku: true,
            barcode: true,
          },
        });

        if (product?.trackInventory) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });

          // Registrar movimiento de inventario
          await tx.inventoryMovement.create({
            data: {
              productId: item.productId,
              productName: product.name,
              productCode:
                product.sku || product.barcode || item.productId.slice(0, 8),
              type: 'sale',
              quantity: -item.quantity,
              stockBefore: product.stock,
              stockAfter: product.stock - item.quantity,
              unitCost: item.price,
              totalCost: item.subtotal,
              userId: userId,
              userName: 'Cajero',
              reason: `Venta ${saleNumber}`,
              storeId: saleData.storeId,
            },
          });
        }
      }

      // 3.6. Si es venta a crédito (por_cobrar), crear cuenta por cobrar
      if (saleData.paymentMethod === 'por_cobrar' && saleData.customerId) {
        const customer = await tx.customer.findUnique({
          where: { id: saleData.customerId },
          select: { name: true, documentNumber: true },
        });

        if (customer) {
          await tx.receivable.create({
            data: {
              storeId: saleData.storeId,
              saleId: sale.id,
              customerId: saleData.customerId,
              customerName: customer.name,
              documentNumber: customer.documentNumber || null,
              amount: saleData.total,
              baseCurrency: saleData.referenceCurrency || 'USD',
              referenceAmount: saleData.totalReference || saleData.total,
              exchangeRateAtCreation: saleData.exchangeRate || 1,
              amountPaid: 0,
              balance: saleData.total,
              description: `Venta ${saleNumber}`,
              invoiceNumber: saleNumber,
              status: 'pending',
            },
          });

          // Actualizar balance del cliente
          await tx.customer.update({
            where: { id: saleData.customerId },
            data: {
              balance: {
                increment: saleData.total,
              },
            },
          });
        }
      }

      return { sale, items: saleItems };
    });

    // 4. Obtener venta completa con relaciones
    const completeSale = await prisma.sale.findUnique({
      where: { id: result.sale.id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
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
            documentNumber: true,
            phone: true,
          },
        },
        cashier: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        receivable: true,
      },
    });

    return res.status(201).json({
      message: 'Venta creada exitosamente',
      sale: completeSale,
    });
  } catch (error: any) {
    console.error('Error al crear venta:', error);
    return res.status(500).json({
      error: 'Error al crear la venta',
      details: error.message,
    });
  }
}

/**
 * DELETE /api/sales/:id (Cancelar venta)
 * Cancela una venta y revierte el inventario
 */
export async function cancelSale(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.userId;

    // Asegurar que id y reason son strings
    const saleId: string = typeof id === 'string' ? id : id[0];
    const cancelReason: string =
      typeof reason === 'string' ? reason : reason[0];

    // Validar
    const validationErrors = validateCancelSale(saleId, cancelReason);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Datos de cancelación inválidos',
        details: validationErrors,
      });
    }

    // Ejecutar cancelación en transacción
    const result = await prisma.$transaction(async (tx) => {
      // Obtener venta actual
      const sale = await tx.sale.findFirst({
        where: {
          id: saleId,
          store: {
            userId: req.user!.userId,
          },
        },
        include: {
          items: true,
          receivable: true,
        },
      });

      if (!sale) {
        throw new Error('Venta no encontrada');
      }

      if (sale.status === 'cancelled') {
        throw new Error('La venta ya está cancelada');
      }

      // Marcar venta como cancelada
      const updatedSale = await tx.sale.update({
        where: { id: saleId },
        data: {
          status: 'cancelled',
          cancelReason: cancelReason,
          cancelledBy: userId,
          cancelledAt: new Date(),
        },
      });

      // Revertir stock de productos
      if (sale.items) {
        for (const item of sale.items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
            select: {
              trackInventory: true,
              stock: true,
              name: true,
              sku: true,
              barcode: true,
            },
          });

          if (product?.trackInventory) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: {
                  increment: item.quantity,
                },
              },
            });

            // Registrar movimiento de inventario de reversión
            await tx.inventoryMovement.create({
              data: {
                productId: item.productId,
                productName: product.name,
                productCode:
                  product.sku || product.barcode || item.productId.slice(0, 8),
                type: 'sale_cancellation',
                quantity: item.quantity,
                stockBefore: product.stock,
                stockAfter: product.stock + item.quantity,
                unitCost: item.price,
                totalCost: item.subtotal,
                userId: userId,
                userName: 'Cajero',
                reason: `Cancelación de venta ${sale.saleNumber}: ${cancelReason}`,
                storeId: sale.storeId,
              },
            });
          }
        }
      }

      // Si tiene cuenta por cobrar, cancelarla
      if (sale.receivable) {
        await tx.receivable.update({
          where: { id: sale.receivable.id },
          data: {
            status: 'cancelled',
          },
        });

        // Revertir balance del cliente
        if (sale.customerId) {
          await tx.customer.update({
            where: { id: sale.customerId },
            data: {
              balance: {
                decrement: sale.receivable.balance,
              },
            },
          });
        }
      }

      return updatedSale;
    });

    return res.status(200).json({
      message: 'Venta cancelada exitosamente',
      sale: result,
    });
  } catch (error: any) {
    console.error('Error al cancelar venta:', error);
    return res.status(500).json({
      error: 'Error al cancelar la venta',
      details: error.message,
    });
  }
}

/**
 * GET /api/sales/stats/summary
 * Estadísticas de ventas
 */
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

    const whereClause: any = {
      ...(storeId && typeof storeId === 'string' && { storeId }),
      status: 'completed',
      store: {
        userId: req.user.userId,
      },
    };

    if (startDate && typeof startDate === 'string') {
      whereClause.createdAt = { gte: new Date(startDate) };
    }

    if (endDate && typeof endDate === 'string') {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      whereClause.createdAt = {
        ...whereClause.createdAt,
        lte: end,
      };
    }

    // Obtener estadísticas
    const [totalSales, salesCount, salesByMethod] = await Promise.all([
      // Total de ventas
      prisma.sale.aggregate({
        where: whereClause,
        _sum: {
          total: true,
          tax: true,
        },
        _avg: {
          total: true,
        },
      }),
      // Cantidad de ventas
      prisma.sale.count({ where: whereClause }),
      // Ventas por método de pago
      prisma.sale.groupBy({
        by: ['paymentMethod'],
        where: whereClause,
        _count: {
          id: true,
        },
        _sum: {
          total: true,
        },
      }),
    ]);

    return res.status(200).json({
      totalRevenue: totalSales._sum.total || 0,
      totalTax: totalSales._sum.tax || 0,
      averageSale: totalSales._avg.total || 0,
      salesCount,
      salesByPaymentMethod: salesByMethod.map((method) => ({
        paymentMethod: method.paymentMethod,
        count: method._count.id,
        total: method._sum.total || 0,
      })),
    });
  } catch (error: any) {
    console.error('Error al obtener estadísticas:', error);
    return res
      .status(500)
      .json({ error: 'Error al obtener estadísticas', details: error.message });
  }
}
