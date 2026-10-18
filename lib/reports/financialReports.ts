import { apiClient } from '@/lib/api';
import { FinancialReportData, DateRange } from '@/types/reports';
import {
  getReceivablesSummary,
  getPayablesSummary,
} from '@/lib/accountsReceivable';
import { paymentMethodLabel } from '@/lib/reports/paymentMethods';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface FinancialReportResponse {
  months: {
    month: string; // yyyy-MM
    revenueUsd: number;
    expensesUsd: number;
    profitUsd: number;
  }[];
  totals: { revenueUsd: number; expensesUsd: number; profitUsd: number };
  byPaymentMethod: { method: string; revenueUsd: number; count: number }[];
  unconvertedSales: number;
}

const monthLabel = (key: string) => {
  const [year, month] = key.split('-').map(Number);
  return format(new Date(year, month - 1, 1), 'MMM yyyy', { locale: es });
};

/**
 * Obtiene el reporte financiero completo. El backend calcula en USD, mes a
 * mes, los ingresos (ventas completadas) y los egresos (compras menos
 * devoluciones a proveedores), cada documento con su propia tasa.
 */
export async function getFinancialReport(
  storeId: string,
  dateRange: DateRange
): Promise<FinancialReportData> {
  const params = new URLSearchParams({
    storeId,
    startDate: format(dateRange.startDate, 'yyyy-MM-dd'),
    endDate: format(dateRange.endDate, 'yyyy-MM-dd'),
  });

  const [report, receivablesSummary, payablesSummary] = await Promise.all([
    apiClient.get<FinancialReportResponse>(
      `/api/reports/financial?${params.toString()}`
    ),
    getReceivablesSummary(storeId),
    getPayablesSummary(storeId),
  ]);

  const totalRevenue = report.totals.revenueUsd;
  const totalExpenses = report.totals.expensesUsd;
  const grossProfit = report.totals.profitUsd;
  const profitMargin =
    totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  return {
    totalRevenue,
    totalExpenses,
    grossProfit,
    profitMargin,
    accountsReceivable: receivablesSummary.totalReceivable,
    accountsPayable: payablesSummary.totalPayable,
    unconvertedSales: report.unconvertedSales,
    incomeStatement: report.months.map((row) => ({
      month: monthLabel(row.month),
      revenue: row.revenueUsd,
      expenses: row.expensesUsd,
      profit: row.profitUsd,
    })),
    revenueDistribution: report.byPaymentMethod.map((method) => ({
      source: paymentMethodLabel(method.method),
      amount: method.revenueUsd,
    })),
  };
}
