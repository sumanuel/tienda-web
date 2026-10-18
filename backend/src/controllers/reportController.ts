import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middleware/authMiddleware';
import { sendError } from '../utils/errors';
import { parseRangeStart, parseRangeEnd } from '../utils/dateRange';
import { round2, toUsd } from '../utils/money';
import { validatePurchasesQuery } from '../utils/purchaseValidator';

// Mes calendario local del servidor (mismo criterio que los filtros de fecha)
function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

// Un estado de resultados mensual de más de 10 años no tiene sentido y
// evitaría cargar demasiados documentos en memoria
const MAX_MONTHS = 120;

/**
 * GET /api/reports/financial?storeId&startDate&endDate
 * Estado de resultados por mes en USD: ingresos (ventas completadas) contra
 * egresos (compras completadas menos devoluciones a proveedores). Los montos
 * de cada documento se convierten con su propia tasa (toUsd), igual que el
 * reporte de compras.
 */
export async function getFinancialReport(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { storeId, startDate, endDate } = req.query;

    const validationErrors = validatePurchasesQuery({
      storeId,
      startDate,
      endDate,
    });
    if (typeof startDate !== 'string' || typeof endDate !== 'string') {
      validationErrors.push({
        field: 'startDate',
        message: 'El período (startDate y endDate) es requerido',
      });
    }
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Parámetros de búsqueda inválidos',
        details: validationErrors,
      });
    }

    const store = await prisma.store.findFirst({
      where: { id: storeId as string, userId: req.user.userId },
      select: { id: true },
    });
    if (!store) {
      return res.status(403).json({ error: 'No tienes acceso a esta tienda' });
    }

    const from = parseRangeStart(startDate as string);
    const to = parseRangeEnd(endDate as string);

    // Meses del período, también los que no tuvieron movimientos
    const months = new Map<
      string,
      { revenue: number; purchases: number; returns: number }
    >();
    const cursor = new Date(from.getFullYear(), from.getMonth(), 1);
    while (cursor <= to) {
      if (months.size >= MAX_MONTHS) {
        return res.status(400).json({
          error: `El período no puede superar ${MAX_MONTHS} meses`,
        });
      }
      months.set(monthKey(cursor), { revenue: 0, purchases: 0, returns: 0 });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    const createdAt = { gte: from, lte: to };
    const where = { storeId: store.id, status: 'completed', createdAt };

    const [sales, purchases, returns] = await Promise.all([
      prisma.sale.findMany({
        where,
        select: {
          createdAt: true,
          total: true,
          totalReference: true,
          exchangeRate: true,
          paymentMethod: true,
        },
      }),
      prisma.purchase.findMany({
        where,
        select: {
          createdAt: true,
          total: true,
          totalReference: true,
          exchangeRate: true,
        },
      }),
      prisma.purchaseReturn.findMany({
        where,
        select: {
          createdAt: true,
          total: true,
          totalReference: true,
          exchangeRate: true,
        },
      }),
    ]);

    const byMethod = new Map<string, { revenue: number; count: number }>();
    let unconvertedSales = 0;

    for (const sale of sales) {
      const usd = toUsd(sale.total, sale.totalReference, sale.exchangeRate);
      // Ventas antiguas sin tasa ni monto en USD: no hay con qué convertirlas
      if (usd === 0 && sale.total > 0) unconvertedSales += 1;

      const bucket = months.get(monthKey(sale.createdAt));
      if (bucket) bucket.revenue += usd;

      const method = byMethod.get(sale.paymentMethod) ?? {
        revenue: 0,
        count: 0,
      };
      method.revenue += usd;
      method.count += 1;
      byMethod.set(sale.paymentMethod, method);
    }

    for (const purchase of purchases) {
      const bucket = months.get(monthKey(purchase.createdAt));
      if (bucket) {
        bucket.purchases += toUsd(
          purchase.total,
          purchase.totalReference,
          purchase.exchangeRate
        );
      }
    }

    for (const purchaseReturn of returns) {
      const bucket = months.get(monthKey(purchaseReturn.createdAt));
      if (bucket) {
        bucket.returns += toUsd(
          purchaseReturn.total,
          purchaseReturn.totalReference,
          purchaseReturn.exchangeRate
        );
      }
    }

    const monthRows = Array.from(months.entries()).map(([month, value]) => {
      const revenueUsd = round2(value.revenue);
      const purchasesUsd = round2(value.purchases);
      const returnsUsd = round2(value.returns);
      const expensesUsd = round2(purchasesUsd - returnsUsd);
      return {
        month,
        revenueUsd,
        purchasesUsd,
        returnsUsd,
        expensesUsd,
        profitUsd: round2(revenueUsd - expensesUsd),
      };
    });

    const revenueUsd = round2(
      monthRows.reduce((sum, row) => sum + row.revenueUsd, 0)
    );
    const expensesUsd = round2(
      monthRows.reduce((sum, row) => sum + row.expensesUsd, 0)
    );

    return res.status(200).json({
      months: monthRows,
      totals: {
        revenueUsd,
        expensesUsd,
        profitUsd: round2(revenueUsd - expensesUsd),
      },
      byPaymentMethod: Array.from(byMethod.entries())
        .map(([method, value]) => ({
          method,
          revenueUsd: round2(value.revenue),
          count: value.count,
        }))
        .sort((a, b) => b.revenueUsd - a.revenueUsd),
      unconvertedSales,
    });
  } catch (error: any) {
    console.error('Error al generar el reporte financiero:', error);
    return sendError(res, error, 'Error al generar el reporte financiero');
  }
}
