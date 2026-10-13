import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middleware/authMiddleware';
import { nextDocumentNumber } from '../utils/documentNumber';
import { changeStock } from '../utils/stock';
import { lockSupplier } from '../utils/ledgerLock';
import { BusinessError, sendError } from '../utils/errors';
import { parsePagination } from '../utils/pagination';
import { round2, toUsd } from '../utils/money';
import { validatePurchaseReturnData } from '../utils/purchaseValidator';

/**
 * GET /api/purchase-returns
 * Lista devoluciones de compra con filtros opcionales
 */
export async function listPurchaseReturns(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { storeId, supplierId, page = '1', limit = '50' } = req.query;

    if (!storeId || typeof storeId !== 'string') {
      return res.status(400).json({ error: 'El ID de tienda es requerido' });
    }

    const store = await prisma.store.findFirst({
      where: { id: storeId, userId: req.user.userId },
    });

    if (!store) {
      return res.status(403).json({ error: 'No tienes acceso a esta tienda' });
    }

    const where: any = {
      storeId,
      store: { userId: req.user.userId },
    };

    if (supplierId && typeof supplierId === 'string') {
      where.supplierId = supplierId;
    }

    const {
      page: pageNum,
      limit: limitNum,
      skip,
    } = parsePagination(page, limit, 1000);

    const [purchaseReturns, total] = await Promise.all([
      prisma.purchaseReturn.findMany({
        where,
        include: {
          items: {
            include: {
              product: {
                select: { id: true, name: true, sku: true, barcode: true },
              },
            },
          },
          supplier: {
            select: { id: true, name: true, taxId: true },
          },
          purchase: {
            select: { id: true, purchaseNumber: true },
          },
          creditNote: { select: { id: true, noteNumber: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.purchaseReturn.count({ where }),
    ]);

    return res.status(200).json({
      purchaseReturns,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error('Error al listar devoluciones de compra:', error);
    return sendError(res, error, 'Error al listar devoluciones de compra');
  }
}

/**
 * GET /api/purchase-returns/:id
 */
export async function getPurchaseReturn(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { id } = req.params as { id: string };

    const purchaseReturn = await prisma.purchaseReturn.findFirst({
      where: {
        id,
        store: { userId: req.user.userId },
      },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, sku: true, barcode: true },
            },
          },
        },
        supplier: {
          select: { id: true, name: true, taxId: true, phone: true },
        },
        purchase: {
          select: { id: true, purchaseNumber: true, invoiceNumber: true },
        },
        creditNote: { select: { id: true, noteNumber: true } },
        transactions: true,
      },
    });

    if (!purchaseReturn) {
      return res.status(404).json({ error: 'Devolución no encontrada' });
    }

    return res.status(200).json({ purchaseReturn });
  } catch (error: any) {
    console.error('Error al obtener devolución de compra:', error);
    return sendError(res, error, 'Error al obtener la devolución');
  }
}

/**
 * POST /api/purchase-returns
 * Crea una devolución de compra: reduce stock y acredita al proveedor
 */
export async function createPurchaseReturn(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const returnData = req.body;
    const userId = req.user.userId;

    const validationErrors = validatePurchaseReturnData(returnData);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Datos de devolución inválidos',
        details: validationErrors,
      });
    }

    const store = await prisma.store.findFirst({
      where: { id: returnData.storeId, userId: req.user.userId },
    });

    if (!store) {
      return res.status(403).json({ error: 'No tienes acceso a esta tienda' });
    }

    const supplier = await prisma.supplier.findFirst({
      where: { id: returnData.supplierId, storeId: returnData.storeId },
    });

    if (!supplier) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const returnNumber = await nextDocumentNumber(
        tx,
        returnData.storeId,
        'purchase_return'
      );

      if (returnData.purchaseId) {
        const relatedPurchase = await tx.purchase.findFirst({
          where: {
            id: returnData.purchaseId,
            storeId: returnData.storeId,
            supplierId: returnData.supplierId,
            status: 'completed',
          },
          select: { id: true },
        });
        if (!relatedPurchase) {
          throw new BusinessError(
            'La compra indicada no existe, no es de este proveedor o está cancelada',
            404
          );
        }
      }

      const productIds: string[] = [
        ...new Set<string>(returnData.items.map((item: any) => item.productId)),
      ];
      const products = await tx.product.findMany({
        where: { id: { in: productIds }, storeId: returnData.storeId },
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

      const operator = await tx.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });

      const purchaseReturn = await tx.purchaseReturn.create({
        data: {
          returnNumber,
          storeId: returnData.storeId,
          supplierId: returnData.supplierId,
          purchaseId: returnData.purchaseId || null,
          userId,
          reason: returnData.reason,
          subtotal: returnData.subtotal,
          total: returnData.total,
          currency: returnData.currency || 'VES',
          localCurrency: returnData.localCurrency || 'VES',
          referenceCurrency: returnData.referenceCurrency || 'USD',
          exchangeRate: returnData.exchangeRate || 0,
          totalReference: returnData.totalReference || null,
        },
      });

      const returnItems = [];
      for (const item of returnData.items) {
        const product = productMap.get(item.productId)!;

        returnItems.push(
          await tx.purchaseReturnItem.create({
            data: {
              purchaseReturnId: purchaseReturn.id,
              productId: item.productId,
              productName: product.name,
              quantity: item.quantity,
              cost: item.cost,
              subtotal: item.subtotal,
              purchaseItemId: item.purchaseItemId || null,
            },
          })
        );

        // Los productos vuelven al proveedor: baja de stock atómica
        if (product.trackInventory) {
          const { stockBefore, stockAfter } = await changeStock(tx, {
            productId: product.id,
            storeId: returnData.storeId,
            delta: -item.quantity,
            productName: product.name,
            insufficientMessage: `Stock insuficiente para devolver "${product.name}"`,
          });

          await tx.inventoryMovement.create({
            data: {
              productId: product.id,
              productName: product.name,
              productCode:
                product.sku || product.barcode || product.id.slice(0, 8),
              type: 'purchase_return',
              quantity: -item.quantity,
              stockBefore,
              stockAfter,
              unitCost: item.cost,
              totalCost: item.subtotal,
              userId,
              userName: operator?.name || 'Usuario',
              reason: `Devolución ${returnNumber}: ${returnData.reason}`,
              storeId: returnData.storeId,
            },
          });
        }
      }

      // Acreditar al proveedor (reduce la deuda / genera saldo a favor)
      await lockSupplier(tx, returnData.supplierId);
      const currentBalance = await tx.supplierTransaction.aggregate({
        where: { supplierId: returnData.supplierId },
        _sum: { amount: true },
      });

      // El libro del proveedor está en USD
      const returnUsd = toUsd(
        returnData.total,
        returnData.totalReference,
        returnData.exchangeRate
      );
      const newBalance = (currentBalance._sum.amount || 0) - returnUsd;

      await tx.supplierTransaction.create({
        data: {
          supplierId: returnData.supplierId,
          type: 'payment',
          amount: -returnUsd,
          balance: newBalance,
          notes: `Devolución ${returnNumber}: ${returnData.reason}`,
          purchaseReturnId: purchaseReturn.id,
        },
      });

      // Si la devolución deja saldo a favor (compra ya pagada o más de lo que
      // se debía), se emite una nota de crédito por ese exceso
      let creditNote = null;
      if (newBalance < -0.005) {
        const creditUsd = round2(Math.min(returnUsd, -newBalance));
        const rate = returnData.exchangeRate || 0;

        creditNote = await tx.creditNote.create({
          data: {
            noteNumber: await nextDocumentNumber(
              tx,
              returnData.storeId,
              'credit_note'
            ),
            storeId: returnData.storeId,
            supplierId: returnData.supplierId,
            purchaseReturnId: purchaseReturn.id,
            amountUsd: creditUsd,
            amountVes: round2(
              rate
                ? creditUsd * rate
                : returnUsd
                  ? (returnData.total * creditUsd) / returnUsd
                  : 0
            ),
            exchangeRate: rate,
            notes: `Devolución ${returnNumber}`,
          },
        });
      }

      return { purchaseReturn, items: returnItems, creditNote };
    });

    const completeReturn = await prisma.purchaseReturn.findUnique({
      where: { id: result.purchaseReturn.id },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, sku: true, barcode: true },
            },
          },
        },
        supplier: { select: { id: true, name: true, taxId: true } },
        purchase: { select: { id: true, purchaseNumber: true } },
        transactions: true,
      },
    });

    return res.status(201).json({
      message: 'Devolución de compra creada exitosamente',
      purchaseReturn: completeReturn,
      creditNote: result.creditNote,
    });
  } catch (error) {
    return sendError(res, error, 'Error al crear la devolución de compra');
  }
}
