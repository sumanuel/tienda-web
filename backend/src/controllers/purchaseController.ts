import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middleware/authMiddleware';
import { nextDocumentNumber } from '../utils/documentNumber';
import { changeStock } from '../utils/stock';
import { lockSupplier } from '../utils/ledgerLock';
import { BusinessError, sendError } from '../utils/errors';
import {
  validatePurchaseData,
  validateCancelPurchase,
  validatePurchasesQuery,
} from '../utils/purchaseValidator';
import { parseRangeStart, parseRangeEnd } from '../utils/dateRange';

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
        where.createdAt.gte = parseRangeStart(startDate);
      }
      if (endDate && typeof endDate === 'string') {
        where.createdAt.lte = parseRangeEnd(endDate);
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
      const purchaseNumber = await nextDocumentNumber(
        tx,
        purchaseData.storeId,
        'purchase'
      );

      const productIds: string[] = [
        ...new Set<string>(
          purchaseData.items.map((item: any) => item.productId)
        ),
      ];
      const products = await tx.product.findMany({
        where: { id: { in: productIds }, storeId: purchaseData.storeId },
        select: {
          id: true,
          name: true,
          sku: true,
          barcode: true,
          trackInventory: true,
        },
      });
      const productMap = new Map(products.map((p) => [p.id, p]));
      if (productMap.size !== productIds.length) {
        throw new BusinessError(
          'Uno o más productos no existen en esta tienda',
          404
        );
      }

      const buyer = await tx.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });

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

      const purchaseItems = [];
      for (const item of purchaseData.items) {
        const product = productMap.get(item.productId)!;

        purchaseItems.push(
          await tx.purchaseItem.create({
            data: {
              purchaseId: purchase.id,
              productId: item.productId,
              productName: product.name,
              quantity: item.quantity,
              cost: item.cost,
              localCost: item.localCost,
              referenceCost: item.referenceCost,
              subtotal: item.subtotal,
              subtotalLocal: item.subtotalLocal,
              subtotalReference: item.subtotalReference,
              costSnapshot: item.costSnapshot || null,
            },
          })
        );

        if (product.trackInventory) {
          const { stockBefore, stockAfter } = await changeStock(tx, {
            productId: product.id,
            storeId: purchaseData.storeId,
            delta: item.quantity,
            productName: product.name,
          });

          await tx.inventoryMovement.create({
            data: {
              productId: product.id,
              productName: product.name,
              productCode:
                product.sku || product.barcode || product.id.slice(0, 8),
              type: 'purchase',
              quantity: item.quantity,
              stockBefore,
              stockAfter,
              unitCost: item.cost,
              totalCost: item.subtotal,
              userId,
              userName: buyer?.name || 'Usuario',
              reason: `Compra ${purchaseNumber}`,
              storeId: purchaseData.storeId,
            },
          });
        }
      }

      // Compra a crédito: deuda con el proveedor (libro serializado por proveedor)
      if (purchaseData.paymentMethod === 'credito') {
        await lockSupplier(tx, purchaseData.supplierId);

        const currentBalance = await tx.supplierTransaction.aggregate({
          where: { supplierId: purchaseData.supplierId },
          _sum: { amount: true },
        });

        await tx.supplierTransaction.create({
          data: {
            supplierId: purchaseData.supplierId,
            type: 'purchase',
            amount: purchaseData.total,
            balance: (currentBalance._sum.amount || 0) + purchaseData.total,
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
  } catch (error) {
    return sendError(res, error, 'Error al crear la compra');
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

    const purchaseId: string = Array.isArray(id) ? id[0] : id;
    const cancelReason: string = typeof reason === 'string' ? reason : '';

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
          returns: { select: { id: true } },
        },
      });

      if (!purchase) {
        throw new BusinessError('Compra no encontrada', 404);
      }

      if (purchase.returns.length > 0) {
        throw new BusinessError(
          'La compra tiene devoluciones registradas y no puede cancelarse',
          409
        );
      }

      // Marcar como cancelada solo si no lo estaba (idempotente ante cancelaciones simultáneas)
      const marked = await tx.purchase.updateMany({
        where: { id: purchaseId, status: { not: 'cancelled' } },
        data: {
          status: 'cancelled',
          cancelReason,
          cancelledBy: userId,
          cancelledAt: new Date(),
        },
      });
      if (marked.count === 0) {
        throw new BusinessError('La compra ya está cancelada', 409);
      }
      const updatedPurchase = await tx.purchase.findUniqueOrThrow({
        where: { id: purchaseId },
      });

      // Revertir stock de productos (falla si ya se vendió y no alcanza)
      for (const item of purchase.items) {
        const product = await tx.product.findFirst({
          where: { id: item.productId, storeId: purchase.storeId },
          select: {
            trackInventory: true,
            name: true,
            sku: true,
            barcode: true,
          },
        });

        if (product?.trackInventory) {
          const { stockBefore, stockAfter } = await changeStock(tx, {
            productId: item.productId,
            storeId: purchase.storeId,
            delta: -item.quantity,
            productName: product.name,
            insufficientMessage: `No hay stock suficiente de "${product.name}" para revertir la compra (parte ya se vendió o salió del inventario)`,
          });

          await tx.inventoryMovement.create({
            data: {
              productId: item.productId,
              productName: product.name,
              productCode:
                product.sku || product.barcode || item.productId.slice(0, 8),
              type: 'purchase_cancellation',
              quantity: -item.quantity,
              stockBefore,
              stockAfter,
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

      // Revertir la deuda generada si la compra fue a crédito
      const charges = purchase.transactions.filter(
        (transaction) => transaction.type === 'purchase'
      );
      if (charges.length > 0) {
        await lockSupplier(tx, purchase.supplierId);

        for (const charge of charges) {
          const currentBalance = await tx.supplierTransaction.aggregate({
            where: { supplierId: purchase.supplierId },
            _sum: { amount: true },
          });

          await tx.supplierTransaction.create({
            data: {
              supplierId: purchase.supplierId,
              type: 'payment',
              amount: -charge.amount,
              balance: (currentBalance._sum.amount || 0) - charge.amount,
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
  } catch (error) {
    return sendError(res, error, 'Error al cancelar la compra');
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
      whereClause.createdAt = { gte: parseRangeStart(startDate) };
    }

    if (endDate && typeof endDate === 'string') {
      whereClause.createdAt = {
        ...whereClause.createdAt,
        lte: parseRangeEnd(endDate),
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
