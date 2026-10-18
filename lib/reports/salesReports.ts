/**
 * Servicio de Reportes de Ventas: el backend agrega el período en USD
 * (GET /api/reports/sales) y aquí solo se completan los días y las horas sin
 * ventas para las gráficas.
 */

import { apiClient } from '@/lib/api';
import type { SalesReportData, DateRange } from '@/types/reports';
import { format, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';

interface SalesReportResponse {
  summary: { totalUsd: number; count: number; averageUsd: number };
  topProduct: {
    productId: string;
    productName: string;
    quantity: number;
    totalUsd: number;
  } | null;
  byDay: { date: string; totalUsd: number; count: number }[];
  byPaymentMethod: { method: string; totalUsd: number; count: number }[];
  byHour: { hour: number; totalUsd: number; count: number }[];
  byProduct: {
    productId: string;
    productName: string;
    quantity: number;
    totalUsd: number;
  }[];
  unconvertedSales: number;
}

/**
 * Obtiene el reporte completo de ventas para un rango de fechas
 */
export async function getSalesReport(
  storeId: string,
  dateRange: DateRange
): Promise<SalesReportData> {
  try {
    // Fechas como día calendario local: el backend las interpreta así
    const params = new URLSearchParams({
      storeId,
      startDate: format(dateRange.startDate, 'yyyy-MM-dd'),
      endDate: format(dateRange.endDate, 'yyyy-MM-dd'),
    });

    const report = await apiClient.get<SalesReportResponse>(
      `/api/reports/sales?${params.toString()}`
    );

    const byDayKey = new Map(report.byDay.map((day) => [day.date, day]));
    const days = eachDayOfInterval({
      start: dateRange.startDate,
      end: dateRange.endDate,
    });

    const byHourKey = new Map(report.byHour.map((hour) => [hour.hour, hour]));

    return {
      totalSales: report.summary.totalUsd,
      totalTransactions: report.summary.count,
      averageTicket: report.summary.averageUsd,
      unconvertedSales: report.unconvertedSales,
      topProduct: report.topProduct
        ? {
            id: report.topProduct.productId,
            name: report.topProduct.productName,
            quantity: report.topProduct.quantity,
            total: report.topProduct.totalUsd,
          }
        : null,
      salesByDay: days.map((day) => {
        const data = byDayKey.get(format(day, 'yyyy-MM-dd'));
        return {
          date: format(day, 'dd MMM', { locale: es }),
          total: data?.totalUsd ?? 0,
          transactions: data?.count ?? 0,
        };
      }),
      salesByProduct: report.byProduct.map((product) => ({
        productId: product.productId,
        productName: product.productName,
        quantity: product.quantity,
        total: product.totalUsd,
      })),
      salesByPaymentMethod: report.byPaymentMethod.map((method) => ({
        method: method.method,
        total: method.totalUsd,
        transactions: method.count,
      })),
      salesByHour: Array.from({ length: 24 }, (_, hour) => ({
        hour,
        total: byHourKey.get(hour)?.totalUsd ?? 0,
        transactions: byHourKey.get(hour)?.count ?? 0,
      })),
    };
  } catch (error) {
    console.error('Error generando reporte de ventas:', error);
    throw new Error('Error al generar reporte de ventas');
  }
}
