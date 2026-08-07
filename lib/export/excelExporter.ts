import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { SalesReportData, DateRange } from '@/types/reports';

/**
 * Exporta datos genéricos a Excel
 */
export async function exportToExcel(data: any[], filename: string) {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(data);

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${format(new Date(), 'yyyy-MM-dd_HHmm', { locale: es })}.xlsx`;
  link.click();

  window.URL.revokeObjectURL(url);
}

/**
 * Exporta reporte de ventas a Excel con múltiples hojas
 */
export async function exportSalesReportToExcel(
  reportData: SalesReportData,
  dateRange: DateRange
) {
  const workbook = XLSX.utils.book_new();

  // Hoja 1: Resumen
  const summary = [
    ['REPORTE DE VENTAS'],
    [
      'Período',
      `${format(dateRange.startDate, 'dd/MM/yyyy')} - ${format(dateRange.endDate, 'dd/MM/yyyy')}`,
    ],
    [],
    ['Total Ventas', reportData.totalSales],
    ['Total Transacciones', reportData.totalTransactions],
    ['Ticket Promedio', reportData.averageTicket],
    [],
    ['Producto Más Vendido', reportData.topProduct?.name || 'N/A'],
    ['Cantidad Vendida', reportData.topProduct?.quantity || 0],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summary);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');

  // Hoja 2: Ventas por Día
  const dailySales = reportData.salesByDay.map((day) => ({
    Fecha: day.date,
    'Ventas ($)': day.total,
    Transacciones: day.transactions,
  }));

  const dailySheet = XLSX.utils.json_to_sheet(dailySales);
  XLSX.utils.book_append_sheet(workbook, dailySheet, 'Ventas por Día');

  // Hoja 3: Ventas por Producto
  const productSales = reportData.salesByProduct.map((product) => ({
    Producto: product.productName,
    Cantidad: product.quantity,
    'Total ($)': product.total,
  }));

  const productSheet = XLSX.utils.json_to_sheet(productSales);
  XLSX.utils.book_append_sheet(workbook, productSheet, 'Ventas por Producto');

  // Hoja 4: Ventas por Método de Pago
  const paymentMethodSales = reportData.salesByPaymentMethod.map((pm) => ({
    'Método de Pago': pm.method,
    'Total ($)': pm.total,
    Transacciones: pm.transactions,
  }));

  const paymentSheet = XLSX.utils.json_to_sheet(paymentMethodSales);
  XLSX.utils.book_append_sheet(workbook, paymentSheet, 'Métodos de Pago');

  // Exportar
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `reporte-ventas_${format(new Date(), 'yyyy-MM-dd_HHmm')}.xlsx`;
  link.click();

  window.URL.revokeObjectURL(url);
}

/**
 * Exporta reporte de inventario a Excel
 */
export async function exportInventoryReportToExcel(reportData: any) {
  const workbook = XLSX.utils.book_new();

  // Hoja 1: Resumen
  const summary = [
    ['REPORTE DE INVENTARIO'],
    ['Fecha', format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })],
    [],
    ['Valor Total', reportData.totalValue],
    ['Total Productos', reportData.totalProducts],
    ['Stock Bajo', reportData.lowStockProducts],
    ['Sin Stock', reportData.outOfStockProducts],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summary);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');

  // Hoja 2: Valor por Categoría
  const categoryData = reportData.valueByCategory.map((cat: any) => ({
    Categoría: cat.category,
    Cantidad: cat.quantity,
    'Valor ($)': cat.value,
  }));

  const categorySheet = XLSX.utils.json_to_sheet(categoryData);
  XLSX.utils.book_append_sheet(workbook, categorySheet, 'Valor por Categoría');

  // Exportar
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `reporte-inventario_${format(new Date(), 'yyyy-MM-dd_HHmm')}.xlsx`;
  link.click();

  window.URL.revokeObjectURL(url);
}

/**
 * Exporta reporte financiero a Excel
 */
export async function exportFinancialReportToExcel(
  reportData: any,
  dateRange: DateRange
) {
  const workbook = XLSX.utils.book_new();

  // Hoja 1: Resumen
  const summary = [
    ['REPORTE FINANCIERO'],
    [
      'Período',
      `${format(dateRange.startDate, 'dd/MM/yyyy')} - ${format(dateRange.endDate, 'dd/MM/yyyy')}`,
    ],
    [],
    ['Total Ingresos', reportData.totalRevenue],
    ['Total Egresos', reportData.totalExpenses],
    ['Utilidad Bruta', reportData.grossProfit],
    ['Margen de Utilidad (%)', reportData.profitMargin.toFixed(2)],
    [],
    ['Cuentas por Cobrar', reportData.accountsReceivable],
    ['Cuentas por Pagar', reportData.accountsPayable],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summary);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');

  // Hoja 2: Distribución de Ingresos
  const revenueData = reportData.revenueDistribution.map((item: any) => ({
    Fuente: item.source,
    'Monto ($)': item.amount,
  }));

  const revenueSheet = XLSX.utils.json_to_sheet(revenueData);
  XLSX.utils.book_append_sheet(workbook, revenueSheet, 'Distribución Ingresos');

  // Exportar
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `reporte-financiero_${format(new Date(), 'yyyy-MM-dd_HHmm')}.xlsx`;
  link.click();

  window.URL.revokeObjectURL(url);
}
