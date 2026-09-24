import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middleware/authMiddleware';
import {
  validatePurchaseData,
  validateCancelPurchase,
  validatePurchasesQuery,
} from '../utils/purchaseValidator';

/**
 * Genera un número consecutivo único para compras
 */
async function generatePurchaseNumber(
  storeId: string,
  prefix: string = 'COM'
): Promise<string> {
  const lastPurchase = await prisma.purchase.findFirst({
    where: {
      storeId,
      purchaseNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      purchaseNumber: true,
    },
  });

  let nextNumber = 1;

  if (lastPurchase) {
    const numberPart = lastPurchase.purchaseNumber.split('-')[1];
    if (numberPart) {
      nextNumber = parseInt(numberPart, 10) + 1;
    }
  }

  const paddedNumber = nextNumber.toString().padStart(6, '0');
  return `${prefix}-${paddedNumber}`;
}

/**
 * GET /api/purchases
 * Lista compras con filtros opcionales
 */
export async function listPurchases(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const {
      storeId,
      supplierId,
      status,
      startDate,
      endDate,
      page = '1',
      limit = '50',
    } = req.query;

    const validationErrors = validatePurchasesQuery({
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

    const where: any = {
      ...(storeId && typeof storeId === 'string' && { storeId }),
      store: {
        userId: req.user.userId,
      },
    };

    if (supplierId && typeof supplierId === 'string') {
      where.supplierId = supplierId;
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
        end.setUTCHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [purchases, total] = await Promise.all([
      prisma.purchase.findMany({
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
          supplier: {
            select: {
              id: true,
              name: true,
              taxId: true,
              phone: true,
            },
          },
          user: {
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
      prisma.purchase.count({ where }),
    ]);

    return res.status(200).json({
      purchases,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error('Error al listar compras:', error);
    return res
      .status(500)
      .json({ error: 'Error al listar compras', details: error.message });
  }
}

/**
 * GET /api/purchases/:id
 * Obtiene detalle completo de una compra
 */
export async function getPurchase(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { id } = req.params as { id: string };

    const purchase = await prisma.purchase.findFirst({
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
        supplier: {
          select: {
            id: true,
            name: true,
            taxId: true,
            phone: true,
            email: true,
            address: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        transactions: true,
      },
    });

    if (!purchase) {
      return res.status(404).json({ error: 'Compra no encontrada' });
    }

    return res.status(200).json({ purchase });
  } catch (error: any) {
    console.error('Error al obtener compra:', error);
    return res
      .status(500)
      .json({ error: 'Error al obtener la compra', details: error.message });
  }
}

/**
 * POST /api/purchases
 * Crea una nueva compra con gestión transaccional completa
 */
export async function createPurchase(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const purchaseData = req.body;
    const userId = req.user.userId;

    const validationErrors = validatePurchaseData(purchaseData);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Datos de compra inválidos',
        details: validationErrors,
      });
    }

    const store = await prisma.store.findFirst({
      where: {
        id: purchaseData.storeId,
        userId: req.user.userId,
      },
    });

    if (!store) {
      return res.status(403).json({ error: 'No tienes acceso a esta tienda' });
    }

    const supplier = await prisma.supplier.findFirst({
      where: {
        id: purchaseData.supplierId,
        storeId: purchaseData.storeId,
      },
    });

    if (!supplier) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const purchaseNumber = await generatePurchaseNumber(
        purchaseData.storeId
      );

      const purchase = await tx.purchase.create({
        data: {
          purchaseNumber,
          storeId: purchaseData.storeId,
          supplierId: purchaseData.supplierId,
          userId,
          invoiceNumber: purchaseData.invoiceNumber || null,
          subtotal: purchaseData.subtotal,
          tax: purchaseData.tax,
          discount: purchaseData.discount || 0,
          total: purchaseData.total,
          currency: purchaseData.currency || 'VES',
          localCurrency: purchaseData.localCurrency || 'VES',
          referenceCurrency: purchaseData.referenceCurrency || 'USD',
          exchangeRate: purchaseData.exchangeRate || 0,
          totalReference: purchaseData.totalReference || null,
          paymentMethod: purchaseData.paymentMethod,
          dueDate: purchaseData.dueDate ? new Date(purchaseData.dueDate) : null,
          paid:
            purchaseData.paymentMethod === 'credito'
              ? 0
              : purchaseData.paid || purchaseData.total,
          status: 'completed',
          notes: purchaseData.notes || null,
        },
      });

      const purchaseItems = await Promise.all(
        purchaseData.items.map(async (item: any) => {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
            select: { name: true },
          });

          return tx.purchaseItem.create({
            data: {
              purchaseId: purchase.id,
              productId: item.productId,
              productName: product?.name || 'Producto sin nombre',
              quantity: item.quantity,
              cost: item.cost,
              localCost: item.localCost,
              referenceCost: item.referenceCost,
              subtotal: item.subtotal,
              subtotalLocal: item.subtotalLocal,
              subtotalReference: item.subtotalReference,
              costSnapshot: item.costSnapshot || null,
            },
          });
        })
      );

      // Incrementar stock de productos con trackInventory
      for (const item of purchaseData.items) {
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

          await tx.inventoryMovement.create({
            data: {
              productId: item.productId,
              productName: product.name,
              productCode:
                product.sku || product.barcode || item.productId.slice(0, 8),
              type: 'purchase',
              quantity: item.quantity,
              stockBefore: product.stock,
              stockAfter: product.stock + item.quantity,
              unitCost: item.cost,
              totalCost: item.subtotal,
              userId,
              userName: 'Usuario',
              reason: `Compra ${purchaseNumber}`,
              storeId: purchaseData.storeId,
            },
          });
        }
      }

      // Si es compra a crédito, crear transacción de proveedor (deuda)
      if (purchaseData.paymentMethod === 'credito') {
        const currentBalance = await tx.supplierTransaction.aggregate({
          where: { supplierId: purchaseData.supplierId },
          _sum: { amount: true },
        });

        const newBalance =
          (currentBalance._sum.amount || 0) + purchaseData.total;

        await tx.supplierTransaction.create({
          data: {
            supplierId: purchaseData.supplierId,
            type: 'purchase',
            amount: purchaseData.total,
            balance: newBalance,
            dueDate: purchaseData.dueDate
              ? new Date(purchaseData.dueDate)
              : null,
            notes: purchaseData.invoiceNumber
              ? `Compra ${purchaseNumber} - Factura ${purchaseData.invoiceNumber}`
              : `Compra ${purchaseNumber}`,
            purchaseId: purchase.id,
          },
        });
      }

      return { purchase, items: purchaseItems };
    });

    const completePurchase = await prisma.purchase.findUnique({
      where: { id: result.purchase.id },
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
        supplier: {
          select: {
            id: true,
            name: true,
            taxId: true,
            phone: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        transactions: true,
      },
    });

    return res.status(201).json({
      message: 'Compra creada exitosamente',
      purchase: completePurchase,
    });
  } catch (error: any) {
    console.error('Error al crear compra:', error);
    return res.status(500).json({
      error: 'Error al crear la compra',
      details: error.message,
    });
  }
}

/**
 * DELETE /api/purchases/:id (Cancelar compra)
 * Cancela una compra y revierte el inventario y la deuda generada
 */
export async function cancelPurchase(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.userId;

    const purchaseId: string = typeof id === 'string' ? id : id[0];
    const cancelReason: string =
      typeof reason === 'string' ? reason : reason[0];

    const validationErrors = validateCancelPurchase(purchaseId, cancelReason);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Datos de cancelación inválidos',
        details: validationErrors,
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const purchase = await tx.purchase.findFirst({
        where: {
          id: purchaseId,
          store: {
            userId: req.user!.userId,
          },
        },
        include: {
          items: true,
          transactions: true,
        },
      });

      if (!purchase) {
        throw new Error('Compra no encontrada');
      }

      if (purchase.status === 'cancelled') {
        throw new Error('La compra ya está cancelada');
      }

      const updatedPurchase = await tx.purchase.update({
        where: { id: purchaseId },
        data: {
          status: 'cancelled',
          cancelReason,
          cancelledBy: userId,
          cancelledAt: new Date(),
        },
      });

      // Revertir stock de productos
      for (const item of purchase.items) {
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

          await tx.inventoryMovement.create({
            data: {
              productId: item.productId,
              productName: product.name,
              productCode:
                product.sku || product.barcode || item.productId.slice(0, 8),
              type: 'purchase_cancellation',
              quantity: -item.quantity,
              stockBefore: product.stock,
              stockAfter: product.stock - item.quantity,
              unitCost: item.cost,
              totalCost: item.subtotal,
              userId,
              userName: 'Usuario',
              reason: `Cancelación de compra ${purchase.purchaseNumber}: ${cancelReason}`,
              storeId: purchase.storeId,
            },
          });
        }
      }

      // Revertir deuda generada si la compra fue a crédito
      if (purchase.transactions.length > 0) {
        for (const transaction of purchase.transactions) {
          const currentBalance = await tx.supplierTransaction.aggregate({
            where: { supplierId: purchase.supplierId },
            _sum: { amount: true },
          });

          const newBalance =
            (currentBalance._sum.amount || 0) - transaction.amount;

          await tx.supplierTransaction.create({
            data: {
              supplierId: purchase.supplierId,
              type: 'payment',
              amount: -transaction.amount,
              balance: newBalance,
              notes: `Reversión por cancelación de compra ${purchase.purchaseNumber}`,
              purchaseId: purchase.id,
            },
          });
        }
      }

      return updatedPurchase;
    });

    return res.status(200).json({
      message: 'Compra cancelada exitosamente',
      purchase: result,
    });
  } catch (error: any) {
    console.error('Error al cancelar compra:', error);
    return res.status(500).json({
      error: 'Error al cancelar la compra',
      details: error.message,
    });
  }
}

/**
 * GET /api/purchases/stats/summary
 * Estadísticas de compras
 */
export async function getPurchaseStats(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { storeId, startDate, endDate } = req.query;

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
      end.setUTCHours(23, 59, 59, 999);
      whereClause.createdAt = {
        ...whereClause.createdAt,
        lte: end,
      };
    }

    const [totalPurchases, purchasesCount, purchasesByMethod] =
      await Promise.all([
        prisma.purchase.aggregate({
          where: whereClause,
          _sum: {
            total: true,
            tax: true,
          },
          _avg: {
            total: true,
          },
        }),
        prisma.purchase.count({ where: whereClause }),
        prisma.purchase.groupBy({
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
      totalSpent: totalPurchases._sum.total || 0,
      totalTax: totalPurchases._sum.tax || 0,
      averagePurchase: totalPurchases._avg.total || 0,
      purchasesCount,
      purchasesByPaymentMethod: purchasesByMethod.map((method) => ({
        paymentMethod: method.paymentMethod,
        count: method._count.id,
        total: method._sum.total || 0,
      })),
    });
  } catch (error: any) {
    console.error('Error al obtener estadísticas de compras:', error);
    return res
      .status(500)
      .json({ error: 'Error al obtener estadísticas', details: error.message });
  }
}
