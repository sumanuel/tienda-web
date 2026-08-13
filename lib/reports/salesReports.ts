/**
 * Servicio de Reportes de Ventas - Migrado a PostgreSQL
 */

import { apiClient } from '@/lib/api';
import type { SalesReportData, DateRange } from '@/types/reports';
import { format, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Obtiene el reporte completo de ventas para un rango de fechas
 */
export async function getSalesReport(
  storeId: string,
  dateRange: DateRange
): Promise<SalesReportData> {
  try {
    // Obtener ventas del período
    const response = await apiClient.getSales({
      storeId,
      startDate: dateRange.startDate.toISOString(),
      endDate: dateRange.endDate.toISOString(),
      limit: 10000,
    });

    const sales = response.sales;

    // Obtener estadísticas
    const statsResponse = await apiClient.getSalesStats({
      storeId,
      startDate: dateRange.startDate.toISOString(),
      endDate: dateRange.endDate.toISOString(),
    });

    // Calcular ventas por día
    const days = eachDayOfInterval({
      start: dateRange.startDate,
      end: dateRange.endDate,
    });

    const salesByDay = days.map((day) => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const daySales = sales.filter((sale) =>
        sale.createdAt.startsWith(dayStr)
      );

      return {
        date: format(day, 'dd MMM', { locale: es }),
        total: daySales.reduce((sum, sale) => sum + sale.total, 0),
        transactions: daySales.length,
      };
    });

    // Agrupar ventas por método de pago
    const paymentMethodMap = new Map<
      string,
      { total: number; transactions: number }
    >();

    sales.forEach((sale) => {
      const method = sale.paymentMethod;
      const existing = paymentMethodMap.get(method) || {
        total: 0,
        transactions: 0,
      };

      paymentMethodMap.set(method, {
        total: existing.total + sale.total,
        transactions: existing.transactions + 1,
      });
    });

    const salesByPaymentMethod = Array.from(paymentMethodMap.entries()).map(
      ([method, data]) => ({
        method,
        total: data.total,
        transactions: data.transactions,
      })
    );

    // Para obtener productos vendidos, necesitaríamos detalles de cada venta
    // Por ahora devolvemos datos básicos
    return {
      totalSales: statsResponse.stats.totalRevenue,
      totalTransactions: statsResponse.stats.totalSales,
      averageTicket: statsResponse.stats.averageTicket,
      topProduct: null, // Requiere consultar detalles de items
      salesByDay,
      salesByProduct: [], // Requiere consultar detalles de items
      salesByPaymentMethod,
      salesByHour: [], // Requiere análisis de timestamps
    };
  } catch (error: any) {
    console.error('Error generando reporte de ventas:', error);
    throw new Error('Error al generar reporte de ventas');
  }
}

/**
 * Obtener ventas por producto para un rango de fechas
 */
export async function getSalesProductReport(
  storeId: string,
  dateRange: DateRange
) {
  try {
    // Obtener todas las ventas del período
    const response = await apiClient.getSales({
      storeId,
      startDate: dateRange.startDate.toISOString(),
      endDate: dateRange.endDate.toISOString(),
      limit: 10000,
    });

    // Para obtener productos, necesitaríamos consultar cada venta individualmente
    // o tener un endpoint dedicado en el backend
    console.warn(
      'getSalesProductReport requiere detalles de items - implementación simplificada'
    );

    return {
      products: [],
      totalSales: response.sales.reduce((sum, sale) => sum + sale.total, 0),
      totalTransactions: response.sales.length,
    };
  } catch (error: any) {
    console.error('Error generando reporte de productos:', error);
    throw new Error('Error al generar reporte de productos');
  }
}
