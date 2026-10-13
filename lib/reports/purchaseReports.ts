/**
 * Servicio de Reportes de Compras: el backend agrega los datos del período
 * (GET /api/purchases/report) y aquí solo se completan los días sin compras.
 */

import { apiClient } from '@/lib/api';
import type { PurchasesReportData, DateRange } from '@/types/reports';
import { format, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';

interface PurchasesReportResponse {
  summary: {
    totalLocal: number;
    totalReference: number;
    count: number;
    averageLocal: number;
    averageReference: number;
    taxLocal: number;
  };
  credit: { totalLocal: number; totalReference: number; count: number };
  returns: { totalLocal: number; totalReference: number; count: number };
  byDay: {
    date: string;
    totalLocal: number;
    totalReference: number;
    count: number;
  }[];
  byPaymentMethod: {
    method: string;
    totalLocal: number;
    totalReference: number;
    count: number;
  }[];
  bySupplier: {
    supplierId: string;
    name: string;
    totalLocal: number;
    totalReference: number;
    count: number;
  }[];
  byProduct: {
    productId: string;
    productName: string;
    quantity: number;
    totalLocal: number;
    totalReference: number;
  }[];
}

const round2 = (value: number) => Math.round(value * 100) / 100;

export async function getPurchasesReport(
  storeId: string,
  dateRange: DateRange
): Promise<PurchasesReportData> {
  try {
    // Fechas como día calendario local: el backend las interpreta así
    const params = new URLSearchParams({
      storeId,
      startDate: format(dateRange.startDate, 'yyyy-MM-dd'),
      endDate: format(dateRange.endDate, 'yyyy-MM-dd'),
    });

    const report = await apiClient.get<PurchasesReportResponse>(
      `/api/purchases/report?${params.toString()}`
    );

    const byDayKey = new Map(report.byDay.map((day) => [day.date, day]));
    const days = eachDayOfInterval({
      start: dateRange.startDate,
      end: dateRange.endDate,
    });

    return {
      totalLocal: report.summary.totalLocal,
      totalReference: report.summary.totalReference,
      purchasesCount: report.summary.count,
      averageLocal: report.summary.averageLocal,
      averageReference: report.summary.averageReference,
      taxLocal: report.summary.taxLocal,
      creditLocal: report.credit.totalLocal,
      creditReference: report.credit.totalReference,
      creditCount: report.credit.count,
      returnsLocal: report.returns.totalLocal,
      returnsReference: report.returns.totalReference,
      returnsCount: report.returns.count,
      netLocal: round2(report.summary.totalLocal - report.returns.totalLocal),
      netReference: round2(
        report.summary.totalReference - report.returns.totalReference
      ),
      byDay: days.map((day) => {
        const data = byDayKey.get(format(day, 'yyyy-MM-dd'));
        return {
          date: format(day, 'dd MMM', { locale: es }),
          totalLocal: data?.totalLocal ?? 0,
          totalReference: data?.totalReference ?? 0,
          count: data?.count ?? 0,
        };
      }),
      byPaymentMethod: report.byPaymentMethod,
      bySupplier: report.bySupplier,
      byProduct: report.byProduct,
    };
  } catch (error) {
    console.error('Error generando reporte de compras:', error);
    throw new Error('Error al generar reporte de compras');
  }
}
