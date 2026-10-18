import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middleware/authMiddleware';
import { sendError } from '../utils/errors';
import { parseRangeStart, parseRangeEnd } from '../utils/dateRange';
import { validatePurchasesQuery } from '../utils/purchaseValidator';
import {
  buildDashboardSales,
  buildFinancialReport,
  buildSalesReport,
  dashboardWindows,
  listMonthKeys,
} from '../utils/reportAggregation';

// Un estado de resultados mensual de más de 10 años no tiene sentido y
// evitaría cargar demasiados documentos en memoria
const MAX_MONTHS = 120;

/**
 * Valida la sesión, el período y la propiedad de la tienda de los reportes con
 * rango de fechas. Devuelve la tienda y las fechas, o ya respondió el error.
 */
async function resolvePeriod(req: AuthRequest, res: Response) {
  if (!req.user) {
    res.status(401).json({ error: 'No autenticado' });
    return null;
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
    res.status(400).json({
      error: 'Parámetros de búsqueda inválidos',
      details: validationErrors,
    });
    return null;
  }

  const store = await prisma.store.findFirst({
    where: { id: storeId as string, userId: req.user.userId },
    select: { id: true },
  });
  if (!store) {
    res.status(403).json({ error: 'No tienes acceso a esta tienda' });
    return null;
  }

  return {
    storeId: store.id,
    from: parseRangeStart(startDate as string),
    to: parseRangeEnd(endDate as string),
  };
}

/**
 * GET /api/reports/financial?storeId&startDate&endDate
 * Estado de resultados por mes en USD: ingresos (ventas completadas) contra
 * egresos (compras completadas menos devoluciones a proveedores). Los montos
 * de cada documento se convierten con su propia tasa (toUsd), igual que el
 * reporte de compras.
 */
export async function getFinancialReport(req: AuthRequest, res: Response) {
  try {
    const period = await resolvePeriod(req, res);
    if (!period) return;

    const months = listMonthKeys(period.from, period.to, MAX_MONTHS);
    if (!months) {
      return res.status(400).json({
        error: `El período no puede superar ${MAX_MONTHS} meses`,
      });
    }

    const where = {
      storeId: period.storeId,
      status: 'completed',
      createdAt: { gte: period.from, lte: period.to },
    };
    const moneySelect = {
      createdAt: true,
      total: true,
      totalReference: true,
      exchangeRate: true,
    };

    const [sales, purchases, returns] = await Promise.all([
      prisma.sale.findMany({
        where,
        select: { ...moneySelect, paymentMethod: true },
      }),
      prisma.purchase.findMany({ where, select: moneySelect }),
      prisma.purchaseReturn.findMany({ where, select: moneySelect }),
    ]);

    return res
      .status(200)
      .json(buildFinancialReport(months, sales, purchases, returns));
  } catch (error: any) {
    console.error('Error al generar el reporte financiero:', error);
    return sendError(res, error, 'Error al generar el reporte financiero');
  }
}

/**
 * GET /api/reports/sales?storeId&startDate&endDate
 * Reporte de ventas del período en USD. Cada venta se convierte con su propio
 * monto de referencia (o su tasa), porque Sale.total está en la moneda de la
 * venta (normalmente VES) y no puede sumarse como USD.
 */
export async function getSalesReport(req: AuthRequest, res: Response) {
  try {
    const period = await resolvePeriod(req, res);
    if (!period) return;

    const sales = await prisma.sale.findMany({
      where: {
        storeId: period.storeId,
        status: 'completed',
        createdAt: { gte: period.from, lte: period.to },
      },
      select: {
        createdAt: true,
        total: true,
        totalReference: true,
        exchangeRate: true,
        paymentMethod: true,
        items: {
          select: {
            productId: true,
            productName: true,
            quantity: true,
            subtotal: true,
            subtotalLocal: true,
            subtotalReference: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return res.status(200).json(buildSalesReport(sales));
  } catch (error: any) {
    console.error('Error al generar el reporte de ventas:', error);
    return sendError(res, error, 'Error al generar el reporte de ventas');
  }
}

/**
 * GET /api/reports/dashboard?storeId
 * Resumen del panel principal: ventas de hoy y del mes (en USD, convertidas
 * venta a venta), comparación contra el mismo tramo del mes anterior, conteo
 * de productos y clientes y la tendencia de los últimos 30 días.
 */
export async function getDashboardSummary(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { storeId } = req.query;
    if (typeof storeId !== 'string' || !storeId) {
      return res.status(400).json({ error: 'El ID de tienda es requerido' });
    }

    const store = await prisma.store.findFirst({
      where: { id: storeId, userId: req.user.userId },
      select: { id: true },
    });
    if (!store) {
      return res.status(403).json({ error: 'No tienes acceso a esta tienda' });
    }

    const now = new Date();

    const [sales, products, customers] = await Promise.all([
      prisma.sale.findMany({
        where: {
          storeId: store.id,
          status: 'completed',
          createdAt: { gte: dashboardWindows(now).earliest },
        },
        select: {
          createdAt: true,
          total: true,
          totalReference: true,
          exchangeRate: true,
        },
      }),
      prisma.product.count({ where: { storeId: store.id } }),
      prisma.customer.count({ where: { storeId: store.id } }),
    ]);

    return res.status(200).json({
      ...buildDashboardSales(sales, now),
      products,
      customers,
    });
  } catch (error: any) {
    console.error('Error al generar el resumen del panel:', error);
    return sendError(res, error, 'Error al generar el resumen del panel');
  }
}
