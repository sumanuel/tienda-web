import { FinancialReportData, DateRange } from '@/types/reports';
import { getSalesReport } from './salesReports';
import {
  getReceivablesSummary,
  getPayablesSummary,
} from '@/lib/accountsReceivable';
import { eachMonthOfInterval, format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Obtiene el reporte financiero completo
 */
export async function getFinancialReport(
  storeId: string,
  dateRange: DateRange
): Promise<FinancialReportData> {
  // Obtener datos de ventas
  const salesData = await getSalesReport(storeId, dateRange);

  // Obtener cuentas por cobrar/pagar
  const receivablesSummary = await getReceivablesSummary(storeId);
  const payablesSummary = await getPayablesSummary(storeId);

  const totalRevenue = salesData.totalSales;
  const totalExpenses = 0; // TODO: Implementar con sistema de gastos
  const grossProfit = totalRevenue - totalExpenses;
  const profitMargin =
    totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  // Estado de resultados por mes
  const months = eachMonthOfInterval({
    start: dateRange.startDate,
    end: dateRange.endDate,
  });

  const incomeStatement = months.map((month) => ({
    month: format(month, 'MMM yyyy', { locale: es }),
    revenue: 0, // TODO: Calcular ventas del mes
    expenses: 0, // TODO: Calcular gastos del mes
    profit: 0,
  }));

  // Distribución de ingresos por método de pago
  const revenueDistribution = salesData.salesByPaymentMethod.map((pm) => ({
    source:
      pm.method === 'cash'
        ? 'Efectivo'
        : pm.method === 'card'
          ? 'Tarjeta'
          : pm.method === 'transfer'
            ? 'Transferencia'
            : 'Crédito',
    amount: pm.total,
  }));

  return {
    totalRevenue,
    totalExpenses,
    grossProfit,
    profitMargin,
    accountsReceivable: receivablesSummary.totalReceivable,
    accountsPayable: payablesSummary.totalPayable,
    incomeStatement,
    revenueDistribution,
  };
}
