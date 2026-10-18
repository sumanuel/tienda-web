import type { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type {
  DateRange,
  FinancialReportData,
  InventoryReportData,
  PurchasesReportData,
  SalesReportData,
} from '@/types/reports';

const BRAND: [number, number, number] = [31, 122, 89];
const MARGIN = 14;

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  credito: 'Crédito',
  por_cobrar: 'Por cobrar',
  pago_movil: 'Pago móvil',
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
};

const paymentLabel = (method: string) =>
  PAYMENT_METHOD_LABELS[method] ?? method;

const numberFormat = new Intl.NumberFormat('es-VE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const num = (value: number) => numberFormat.format(value);

type Cell = string | number;

interface TableSection {
  title: string;
  head: string[];
  body: Cell[][];
  // Columnas (por índice) alineadas a la derecha: cifras
  numeric?: number[];
  emptyMessage?: string;
}

/**
 * Documento A4 vertical con encabezado, secciones en tabla y pie de página.
 * jsPDF se carga al exportar para no sumarlo al bundle de la página.
 */
async function createReport(title: string, subtitleLines: string[]) {
  const [{ default: JsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  const doc: jsPDF = new JsPDF();
  const pageHeight = doc.internal.pageSize.height;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...BRAND);
  doc.text(title, MARGIN, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(90, 90, 90);
  let y = 27;
  for (const line of subtitleLines) {
    doc.text(line, MARGIN, y);
    y += 5;
  }
  doc.text(
    `Generado: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}`,
    MARGIN,
    y
  );
  doc.setTextColor(0, 0, 0);
  y += 10;

  const lastTableBottom = () =>
    (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY;

  const addTable = ({
    title: sectionTitle,
    head,
    body,
    numeric = [],
    emptyMessage = 'Sin datos en este período',
  }: TableSection) => {
    // Evita dejar un título huérfano al final de la página
    if (y > pageHeight - 45) {
      doc.addPage();
      y = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(sectionTitle, MARGIN, y);
    y += 3;

    if (body.length === 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(120, 120, 120);
      doc.text(emptyMessage, MARGIN, y + 6);
      doc.setTextColor(0, 0, 0);
      y += 16;
      return;
    }

    const columnStyles = Object.fromEntries(
      numeric.map((index) => [index, { halign: 'right' as const }])
    );
    autoTable(doc, {
      startY: y,
      head: [head],
      body: body.map((row) => row.map(String)),
      margin: { left: MARGIN, right: MARGIN },
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: BRAND, textColor: 255 },
      alternateRowStyles: { fillColor: [245, 247, 246] },
      columnStyles,
      // Las cabeceras de cifras se alinean igual que sus columnas
      didParseCell: (hook) => {
        if (hook.section === 'head' && numeric.includes(hook.column.index)) {
          hook.cell.styles.halign = 'right';
        }
      },
    });
    y = (lastTableBottom() ?? y) + 10;
  };

  const save = (footerLabel: string, filePrefix: string) => {
    const pages = doc.getNumberOfPages();
    for (let page = 1; page <= pages; page++) {
      doc.setPage(page);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      const footerY = doc.internal.pageSize.height - 8;
      doc.text(`T-Suma · ${footerLabel}`, MARGIN, footerY);
      doc.text(
        `Página ${page} de ${pages}`,
        doc.internal.pageSize.width - MARGIN,
        footerY,
        { align: 'right' }
      );
    }
    doc.save(`${filePrefix}_${format(new Date(), 'yyyy-MM-dd_HHmm')}.pdf`);
  };

  return { doc, addTable, save };
}

const periodLine = (range: DateRange) =>
  `Período: ${format(range.startDate, 'dd/MM/yyyy')} - ${format(range.endDate, 'dd/MM/yyyy')}`;

/**
 * Los reportes de ventas, inventario y financiero guardan USD; el equivalente
 * en VES se calcula con la tasa vigente, igual que en pantalla.
 */
function usdColumns(exchangeRate?: number) {
  const withVes = !!exchangeRate;
  return {
    heads: (label: string) =>
      withVes ? [`${label} (USD)`, `${label} (VES)`] : [`${label} (USD)`],
    cells: (usd: number): string[] =>
      withVes ? [num(usd), num(usd * (exchangeRate as number))] : [num(usd)],
    note: withVes
      ? `Montos en USD; equivalente en VES a la tasa actual (1 USD = ${num(exchangeRate as number)} VES)`
      : 'Montos en USD',
  };
}

export async function exportPurchasesReportToPDF(
  data: PurchasesReportData,
  dateRange: DateRange
) {
  const report = await createReport('Reporte de Compras', [
    periodLine(dateRange),
  ]);

  report.addTable({
    title: 'Resumen',
    head: ['', 'VES', 'USD'],
    numeric: [1, 2],
    body: [
      ['Total compras', num(data.totalLocal), num(data.totalReference)],
      ['Compra promedio', num(data.averageLocal), num(data.averageReference)],
      ['Compras a crédito', num(data.creditLocal), num(data.creditReference)],
      ['Devoluciones', num(data.returnsLocal), num(data.returnsReference)],
      [
        'Neto (compras - devoluciones)',
        num(data.netLocal),
        num(data.netReference),
      ],
    ],
  });

  report.addTable({
    title: 'Cantidades',
    head: ['Concepto', 'Valor'],
    numeric: [1],
    body: [
      ['Número de compras', data.purchasesCount],
      ['Compras a crédito', data.creditCount],
      ['Devoluciones', data.returnsCount],
      ['IVA (VES)', num(data.taxLocal)],
    ],
  });

  report.addTable({
    title: 'Compras por día',
    head: ['Fecha', 'Compras', 'Total (VES)', 'Total (USD)'],
    numeric: [1, 2, 3],
    body: data.byDay
      .filter((day) => day.count > 0)
      .map((day) => [
        day.date,
        day.count,
        num(day.totalLocal),
        num(day.totalReference),
      ]),
  });

  report.addTable({
    title: 'Detalle por proveedor',
    head: ['Proveedor', 'Compras', 'Total (VES)', 'Total (USD)'],
    numeric: [1, 2, 3],
    body: data.bySupplier.map((supplier) => [
      supplier.name,
      supplier.count,
      num(supplier.totalLocal),
      num(supplier.totalReference),
    ]),
  });

  report.addTable({
    title: 'Productos más comprados',
    head: ['Producto', 'Cantidad', 'Total (VES)', 'Total (USD)'],
    numeric: [1, 2, 3],
    body: data.byProduct.map((product) => [
      product.productName,
      product.quantity,
      num(product.totalLocal),
      num(product.totalReference),
    ]),
  });

  report.addTable({
    title: 'Métodos de pago',
    head: ['Método', 'Compras', 'Total (VES)', 'Total (USD)'],
    numeric: [1, 2, 3],
    body: data.byPaymentMethod.map((method) => [
      paymentLabel(method.method),
      method.count,
      num(method.totalLocal),
      num(method.totalReference),
    ]),
  });

  report.save('Reporte de Compras', 'reporte-compras');
}

export async function exportSalesReportToPDF(
  data: SalesReportData,
  dateRange: DateRange,
  exchangeRate?: number
) {
  const usd = usdColumns(exchangeRate);
  const report = await createReport('Reporte de Ventas', [
    periodLine(dateRange),
    usd.note,
  ]);

  report.addTable({
    title: 'Resumen',
    head: ['', ...usd.heads('Monto')],
    numeric: [1, 2],
    body: [
      ['Total ventas', ...usd.cells(data.totalSales)],
      ['Ticket promedio', ...usd.cells(data.averageTicket)],
    ],
  });

  report.addTable({
    title: 'Indicadores',
    head: ['Concepto', 'Valor'],
    numeric: [1],
    body: [
      ['Transacciones', data.totalTransactions],
      [
        'Producto más vendido',
        data.topProduct
          ? `${data.topProduct.name} (${data.topProduct.quantity})`
          : 'N/A',
      ],
    ],
  });

  report.addTable({
    title: 'Ventas por día',
    head: ['Fecha', 'Transacciones', ...usd.heads('Total')],
    numeric: [1, 2, 3],
    body: data.salesByDay
      .filter((day) => day.transactions > 0)
      .map((day) => [day.date, day.transactions, ...usd.cells(day.total)]),
  });

  report.addTable({
    title: 'Detalle por producto',
    head: ['Producto', 'Cantidad', ...usd.heads('Total')],
    numeric: [1, 2, 3],
    body: data.salesByProduct.map((product) => [
      product.productName,
      product.quantity,
      ...usd.cells(product.total),
    ]),
  });

  report.addTable({
    title: 'Métodos de pago',
    head: ['Método', 'Transacciones', ...usd.heads('Total')],
    numeric: [1, 2, 3],
    body: data.salesByPaymentMethod.map((method) => [
      paymentLabel(method.method),
      method.transactions,
      ...usd.cells(method.total),
    ]),
  });

  report.addTable({
    title: 'Ventas por hora',
    head: ['Hora', 'Transacciones', ...usd.heads('Total')],
    numeric: [1, 2, 3],
    body: data.salesByHour
      .filter((hour) => hour.transactions > 0)
      .map((hour) => [
        `${String(hour.hour).padStart(2, '0')}:00`,
        hour.transactions,
        ...usd.cells(hour.total),
      ]),
  });

  report.save('Reporte de Ventas', 'reporte-ventas');
}

export async function exportInventoryReportToPDF(
  data: InventoryReportData,
  exchangeRate?: number
) {
  const usd = usdColumns(exchangeRate);
  const report = await createReport('Reporte de Inventario', [
    `Situación al ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}`,
    usd.note,
  ]);

  report.addTable({
    title: 'Resumen',
    head: ['', ...usd.heads('Monto')],
    numeric: [1, 2],
    body: [['Valor total del inventario', ...usd.cells(data.totalValue)]],
  });

  report.addTable({
    title: 'Indicadores',
    head: ['Concepto', 'Valor'],
    numeric: [1],
    body: [
      ['Total de productos', data.totalProducts],
      ['Productos con stock bajo', data.lowStockProducts],
      ['Productos sin stock', data.outOfStockProducts],
    ],
  });

  report.addTable({
    title: 'Valorización por categoría',
    head: ['Categoría', 'Unidades', ...usd.heads('Valor')],
    numeric: [1, 2, 3],
    emptyMessage: 'Sin productos registrados',
    body: data.valueByCategory.map((category) => [
      category.category,
      category.quantity,
      ...usd.cells(category.value),
    ]),
  });

  report.save('Reporte de Inventario', 'reporte-inventario');
}

export async function exportFinancialReportToPDF(
  data: FinancialReportData,
  dateRange: DateRange,
  exchangeRate?: number
) {
  const usd = usdColumns(exchangeRate);
  const report = await createReport('Reporte Financiero', [
    periodLine(dateRange),
    usd.note,
  ]);

  report.addTable({
    title: 'Resumen financiero',
    head: ['', ...usd.heads('Monto')],
    numeric: [1, 2],
    body: [
      ['Total ingresos', ...usd.cells(data.totalRevenue)],
      ['Total egresos (compras netas)', ...usd.cells(data.totalExpenses)],
      ['Resultado del período', ...usd.cells(data.grossProfit)],
      ['Cuentas por cobrar', ...usd.cells(data.accountsReceivable)],
      ['Cuentas por pagar', ...usd.cells(data.accountsPayable)],
    ],
  });

  report.addTable({
    title: 'Indicadores',
    head: ['Concepto', 'Valor'],
    numeric: [1],
    body: [['Margen de utilidad', `${num(data.profitMargin)} %`]],
  });

  report.addTable({
    title: 'Distribución de ingresos',
    head: ['Fuente', ...usd.heads('Monto')],
    numeric: [1, 2],
    body: data.revenueDistribution.map((item) => [
      item.source,
      ...usd.cells(item.amount),
    ]),
  });

  report.save('Reporte Financiero', 'reporte-financiero');
}
