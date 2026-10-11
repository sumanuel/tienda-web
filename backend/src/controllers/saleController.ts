import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middleware/authMiddleware';
import {
  validateSaleData,
  validateCancelSale,
  validateSalesQuery,
} from '../utils/saleValidator';
import { parseRangeStart, parseRangeEnd } from '../utils/dateRange';
import { nextDocumentNumber } from '../utils/documentNumber';
import { changeStock } from '../utils/stock';
import { BusinessError, sendError } from '../utils/errors';

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
        where.createdAt.gte = parseRangeStart(startDate);
      }
      if (endDate && typeof endDate === 'string') {
        where.createdAt.lte = parseRangeEnd(endDate);
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
      // 3.1. Número de venta consecutivo (atómico por tienda)
      const saleNumber = await nextDocumentNumber(tx, saleData.storeId, 'sale');

      // 3.2. Productos y cliente deben pertenecer a la tienda de la venta
      const productIds: string[] = [
        ...new Set<string>(saleData.items.map((item: any) => item.productId)),
      ];
      const products = await tx.product.findMany({
        where: { id: { in: productIds }, storeId: saleData.storeId },
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

      let customer: {
        id: string;
        name: string;
        documentNumber: string | null;
      } | null = null;
      if (saleData.customerId) {
        customer = await tx.customer.findFirst({
          where: { id: saleData.customerId, storeId: saleData.storeId },
          select: { id: true, name: true, documentNumber: true },
        });
        if (!customer) {
          throw new BusinessError('Cliente no encontrado en esta tienda', 404);
        }
      }
      if (saleData.paymentMethod === 'por_cobrar' && !customer) {
        throw new BusinessError(
          'Debes seleccionar un cliente para ventas por cobrar'
        );
      }

      const cashier = await tx.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });

      // 3.3. Crear la venta
      const sale = await tx.sale.create({
        data: {
          saleNumber,
          storeId: saleData.storeId,
          customerId: customer?.id ?? null,
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

      // 3.4. Items y descuento de stock (atómico: nunca queda negativo)
      const saleItems = [];
      for (const item of saleData.items) {
        const product = productMap.get(item.productId)!;

        saleItems.push(
          await tx.saleItem.create({
            data: {
              saleId: sale.id,
              productId: item.productId,
              productName: product.name,
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
          })
        );

        if (product.trackInventory) {
          const { stockBefore, stockAfter } = await changeStock(tx, {
            productId: product.id,
            storeId: saleData.storeId,
            delta: -item.quantity,
            productName: product.name,
          });

          await tx.inventoryMovement.create({
            data: {
              productId: product.id,
              productName: product.name,
              productCode:
                product.sku || product.barcode || product.id.slice(0, 8),
              type: 'sale',
              quantity: -item.quantity,
              stockBefore,
              stockAfter,
              unitCost: item.price,
              totalCost: item.subtotal,
              userId: userId,
              userName: cashier?.name || 'Cajero',
              reason: `Venta ${saleNumber}`,
              storeId: saleData.storeId,
            },
          });
        }
      }

      // 3.5. Venta a crédito: cuenta por cobrar y cargo en el libro del cliente
      if (saleData.paymentMethod === 'por_cobrar' && customer) {
        await tx.receivable.create({
          data: {
            storeId: saleData.storeId,
            saleId: sale.id,
            customerId: customer.id,
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

        await tx.customer.update({
          where: { id: customer.id },
          data: { balance: { increment: saleData.total } },
        });

        const ledger = await tx.customerTransaction.aggregate({
          where: { customerId: customer.id },
          _sum: { amount: true },
        });
        await tx.customerTransaction.create({
          data: {
            customerId: customer.id,
            type: 'credit',
            amount: saleData.total,
            balance: (ledger._sum.amount || 0) + saleData.total,
            saleId: sale.id,
            notes: `Venta ${saleNumber}`,
          },
        });
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
  } catch (error) {
    return sendError(res, error, 'Error al crear la venta');
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
    const saleId: string = Array.isArray(id) ? id[0] : id;
    const cancelReason: string = typeof reason === 'string' ? reason : '';

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
        throw new BusinessError('Venta no encontrada', 404);
      }

      // Marcar como cancelada solo si no lo estaba (idempotente ante cancelaciones simultáneas)
      const marked = await tx.sale.updateMany({
        where: { id: saleId, status: { not: 'cancelled' } },
        data: {
          status: 'cancelled',
          cancelReason: cancelReason,
          cancelledBy: userId,
          cancelledAt: new Date(),
        },
      });
      if (marked.count === 0) {
        throw new BusinessError('La venta ya está cancelada', 409);
      }
      const updatedSale = await tx.sale.findUniqueOrThrow({
        where: { id: saleId },
      });

      // Revertir stock de productos
      for (const item of sale.items) {
        const product = await tx.product.findFirst({
          where: { id: item.productId, storeId: sale.storeId },
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
            storeId: sale.storeId,
            delta: item.quantity,
            productName: product.name,
          });

          await tx.inventoryMovement.create({
            data: {
              productId: item.productId,
              productName: product.name,
              productCode:
                product.sku || product.barcode || item.productId.slice(0, 8),
              type: 'sale_cancellation',
              quantity: item.quantity,
              stockBefore,
              stockAfter,
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

      // Si tiene cuenta por cobrar, cancelarla y revertir la deuda del cliente
      if (sale.receivable) {
        await tx.receivable.update({
          where: { id: sale.receivable.id },
          data: { status: 'cancelled' },
        });

        if (sale.customerId) {
          await tx.customer.update({
            where: { id: sale.customerId },
            data: { balance: { decrement: sale.receivable.balance } },
          });

          const charge = await tx.customerTransaction.findFirst({
            where: { saleId: sale.id, type: 'credit' },
          });
          if (charge) {
            const ledger = await tx.customerTransaction.aggregate({
              where: { customerId: sale.customerId },
              _sum: { amount: true },
            });
            await tx.customerTransaction.create({
              data: {
                customerId: sale.customerId,
                type: 'payment',
                amount: -charge.amount,
                balance: (ledger._sum.amount || 0) - charge.amount,
                saleId: sale.id,
                notes: `Cancelación de venta ${sale.saleNumber}`,
              },
            });
          }
        }
      }

      return updatedSale;
    });

    return res.status(200).json({
      message: 'Venta cancelada exitosamente',
      sale: result,
    });
  } catch (error) {
    return sendError(res, error, 'Error al cancelar la venta');
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
      whereClause.createdAt = { gte: parseRangeStart(startDate) };
    }

    if (endDate && typeof endDate === 'string') {
      whereClause.createdAt = {
        ...whereClause.createdAt,
        lte: parseRangeEnd(endDate),
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
