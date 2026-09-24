import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middleware/authMiddleware';
import { validatePurchaseReturnData } from '../utils/purchaseValidator';

/**
 * Genera un número consecutivo único para devoluciones de compra
 */
async function generateReturnNumber(
  storeId: string,
  prefix: string = 'DEV'
): Promise<string> {
  const lastReturn = await prisma.purchaseReturn.findFirst({
    where: {
      storeId,
      returnNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      returnNumber: true,
    },
  });

  let nextNumber = 1;

  if (lastReturn) {
    const numberPart = lastReturn.returnNumber.split('-')[1];
    if (numberPart) {
      nextNumber = parseInt(numberPart, 10) + 1;
    }
  }

  const paddedNumber = nextNumber.toString().padStart(6, '0');
  return `${prefix}-${paddedNumber}`;
}

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

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

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
    return res.status(500).json({
      error: 'Error al listar devoluciones de compra',
      details: error.message,
    });
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
        transactions: true,
      },
    });

    if (!purchaseReturn) {
      return res.status(404).json({ error: 'Devolución no encontrada' });
    }

    return res.status(200).json({ purchaseReturn });
  } catch (error: any) {
    console.error('Error al obtener devolución de compra:', error);
    return res.status(500).json({
      error: 'Error al obtener la devolución',
      details: error.message,
    });
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
      // Validar stock suficiente para devolver
      for (const item of returnData.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: { stock: true, trackInventory: true, name: true },
        });

        if (!product) {
          throw new Error(`Producto ${item.productId} no encontrado`);
        }

        if (product.trackInventory && product.stock < item.quantity) {
          throw new Error(
            `Stock insuficiente para devolver "${product.name}". Disponible: ${product.stock}, Solicitado: ${item.quantity}`
          );
        }
      }

      const returnNumber = await generateReturnNumber(returnData.storeId);

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

      const returnItems = await Promise.all(
        returnData.items.map(async (item: any) => {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
            select: { name: true },
          });

          return tx.purchaseReturnItem.create({
            data: {
              purchaseReturnId: purchaseReturn.id,
              productId: item.productId,
              productName: product?.name || 'Producto sin nombre',
              quantity: item.quantity,
              cost: item.cost,
              subtotal: item.subtotal,
              purchaseItemId: item.purchaseItemId || null,
            },
          });
        })
      );

      // Decrementar stock (los productos vuelven al proveedor)
      for (const item of returnData.items) {
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
            data: { stock: { decrement: item.quantity } },
          });

          await tx.inventoryMovement.create({
            data: {
              productId: item.productId,
              productName: product.name,
              productCode:
                product.sku || product.barcode || item.productId.slice(0, 8),
              type: 'purchase_return',
              quantity: -item.quantity,
              stockBefore: product.stock,
              stockAfter: product.stock - item.quantity,
              unitCost: item.cost,
              totalCost: item.subtotal,
              userId,
              userName: 'Usuario',
              reason: `Devolución ${returnNumber}: ${returnData.reason}`,
              storeId: returnData.storeId,
            },
          });
        }
      }

      // Acreditar al proveedor (reduce la deuda / genera saldo a favor)
      const currentBalance = await tx.supplierTransaction.aggregate({
        where: { supplierId: returnData.supplierId },
        _sum: { amount: true },
      });

      const newBalance = (currentBalance._sum.amount || 0) - returnData.total;

      await tx.supplierTransaction.create({
        data: {
          supplierId: returnData.supplierId,
          type: 'payment',
          amount: -returnData.total,
          balance: newBalance,
          notes: `Devolución ${returnNumber}: ${returnData.reason}`,
          purchaseReturnId: purchaseReturn.id,
        },
      });

      return { purchaseReturn, items: returnItems };
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
    });
  } catch (error: any) {
    console.error('Error al crear devolución de compra:', error);
    return res.status(500).json({
      error: 'Error al crear la devolución de compra',
      details: error.message,
    });
  }
}
