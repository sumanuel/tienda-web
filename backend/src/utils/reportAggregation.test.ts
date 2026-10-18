import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  TREND_DAYS,
  buildDashboardSales,
  buildFinancialReport,
  buildSalesReport,
  buildSalesStats,
  dashboardWindows,
  dayKey,
  listMonthKeys,
  monthKey,
  type MoneyDoc,
  type SaleDoc,
  type SaleItemDoc,
  type SaleWithItemsDoc,
} from './reportAggregation';

// Las fechas se arman con el constructor local, igual que los controladores,
// para que las pruebas no dependan de la zona horaria de la máquina
const at = (y: number, m: number, d: number, h = 12, min = 0) =>
  new Date(y, m - 1, d, h, min);

// Venta en VES con su equivalente en USD guardado (el caso normal del POS)
const sale = (
  when: Date,
  totalVes: number,
  totalUsd: number | null,
  rate = 854.1,
  paymentMethod = 'cash'
): SaleDoc => ({
  createdAt: when,
  total: totalVes,
  totalReference: totalUsd,
  exchangeRate: rate,
  paymentMethod,
});

const doc = (
  when: Date,
  totalVes: number,
  totalUsd: number | null,
  rate = 854.1
): MoneyDoc => ({
  createdAt: when,
  total: totalVes,
  totalReference: totalUsd,
  exchangeRate: rate,
});

const item = (
  productId: string,
  quantity: number,
  subtotalReference: number,
  extra: Partial<SaleItemDoc> = {}
): SaleItemDoc => ({
  productId,
  productName: `Producto ${productId}`,
  quantity,
  subtotal: 0,
  subtotalLocal: 0,
  subtotalReference,
  ...extra,
});

const withItems = (base: SaleDoc, items: SaleItemDoc[]): SaleWithItemsDoc => ({
  ...base,
  items,
});

describe('monthKey / dayKey', () => {
  it('rellenan con ceros el mes y el día', () => {
    assert.equal(monthKey(at(2026, 3, 5)), '2026-03');
    assert.equal(dayKey(at(2026, 3, 5)), '2026-03-05');
    assert.equal(dayKey(at(2026, 12, 31, 23, 59)), '2026-12-31');
  });
});

describe('listMonthKeys', () => {
  it('devuelve un solo mes si el período está dentro de él', () => {
    assert.deepEqual(listMonthKeys(at(2026, 10, 3), at(2026, 10, 28), 120), [
      '2026-10',
    ]);
  });

  it('cruza el cambio de año', () => {
    assert.deepEqual(listMonthKeys(at(2025, 12, 15), at(2026, 2, 1), 120), [
      '2025-12',
      '2026-01',
      '2026-02',
    ]);
  });

  it('incluye el mes del inicio aunque el período empiece a mitad de mes', () => {
    const keys = listMonthKeys(at(2026, 8, 31), at(2026, 9, 1), 120);
    assert.deepEqual(keys, ['2026-08', '2026-09']);
  });

  it('acepta exactamente el máximo y rechaza uno más', () => {
    assert.equal(listMonthKeys(at(2026, 1, 1), at(2026, 12, 31), 12)?.length, 12);
    assert.equal(listMonthKeys(at(2026, 1, 1), at(2027, 1, 1), 12), null);
  });

  it('un período invertido no tiene meses', () => {
    assert.deepEqual(listMonthKeys(at(2026, 10, 1), at(2026, 9, 1), 120), []);
  });
});

describe('buildFinancialReport', () => {
  const months = ['2026-08', '2026-09', '2026-10'];

  it('suma las ventas por su monto en USD, no por el total en VES', () => {
    const report = buildFinancialReport(
      months,
      [sale(at(2026, 10, 5), 854.1, 1), sale(at(2026, 10, 6), 1708.2, 2)],
      [],
      []
    );

    assert.equal(report.totals.revenueUsd, 3);
    assert.equal(report.months[2].revenueUsd, 3);
  });

  it('deriva el USD de la tasa cuando falta el monto de referencia', () => {
    const report = buildFinancialReport(
      months,
      [sale(at(2026, 9, 10), 1000, null, 500)],
      [],
      []
    );

    assert.equal(report.months[1].revenueUsd, 2);
    assert.equal(report.unconvertedSales, 0);
  });

  it('cuenta aparte las ventas sin monto en USD ni tasa y no las suma', () => {
    const report = buildFinancialReport(
      months,
      [sale(at(2026, 8, 25), 1.15, null, 0), sale(at(2026, 8, 26), 854.1, 1)],
      [],
      []
    );

    assert.equal(report.unconvertedSales, 1);
    assert.equal(report.totals.revenueUsd, 1);
  });

  it('egresos = compras menos devoluciones, mes a mes', () => {
    const report = buildFinancialReport(
      months,
      [],
      [doc(at(2026, 10, 2), 4200, 4.2), doc(at(2026, 9, 2), 1000, 1)],
      [doc(at(2026, 10, 9), 3100, 3.1), doc(at(2026, 9, 9), 1000, 1)]
    );

    assert.deepEqual(
      report.months.map((m) => [m.month, m.purchasesUsd, m.returnsUsd, m.expensesUsd]),
      [
        ['2026-08', 0, 0, 0],
        ['2026-09', 1, 1, 0],
        ['2026-10', 4.2, 3.1, 1.1],
      ]
    );
    assert.equal(report.totals.expensesUsd, 1.1);
  });

  it('el resultado es ingresos menos egresos y puede ser negativo', () => {
    const report = buildFinancialReport(
      months,
      [sale(at(2026, 10, 5), 854.1, 1)],
      [doc(at(2026, 10, 2), 2562.3, 3)],
      []
    );

    assert.equal(report.months[2].profitUsd, -2);
    assert.equal(report.totals.profitUsd, -2);
  });

  it('incluye los meses sin movimientos con ceros', () => {
    const report = buildFinancialReport(months, [], [], []);

    assert.equal(report.months.length, 3);
    for (const row of report.months) {
      assert.equal(row.revenueUsd, 0);
      assert.equal(row.expensesUsd, 0);
      assert.equal(row.profitUsd, 0);
    }
    assert.deepEqual(report.byPaymentMethod, []);
  });

  it('ignora en el desglose mensual los documentos de meses fuera del período', () => {
    const report = buildFinancialReport(
      ['2026-10'],
      [sale(at(2026, 9, 30), 854.1, 1), sale(at(2026, 10, 1), 854.1, 1)],
      [],
      []
    );

    assert.equal(report.totals.revenueUsd, 1);
  });

  it('agrupa los ingresos por método de pago, de mayor a menor', () => {
    const report = buildFinancialReport(
      months,
      [
        sale(at(2026, 10, 1), 854.1, 1, 854.1, 'cash'),
        sale(at(2026, 10, 2), 2562.3, 3, 854.1, 'card'),
        sale(at(2026, 10, 3), 854.1, 1, 854.1, 'cash'),
      ],
      [],
      []
    );

    assert.deepEqual(report.byPaymentMethod, [
      { method: 'card', revenueUsd: 3, count: 1 },
      { method: 'cash', revenueUsd: 2, count: 2 },
    ]);
  });

  it('redondea a 2 decimales sin arrastrar errores de punto flotante', () => {
    const report = buildFinancialReport(
      ['2026-10'],
      [sale(at(2026, 10, 1), 1, 0.1), sale(at(2026, 10, 2), 1, 0.2)],
      [],
      []
    );

    assert.equal(report.totals.revenueUsd, 0.3);
  });

  it('los totales son la suma de los meses', () => {
    const report = buildFinancialReport(
      months,
      [sale(at(2026, 8, 1), 1, 100), sale(at(2026, 10, 1), 1, 50)],
      [doc(at(2026, 9, 1), 1, 30), doc(at(2026, 10, 1), 1, 20)],
      []
    );

    assert.equal(
      report.totals.revenueUsd,
      report.months.reduce((sum, m) => sum + m.revenueUsd, 0)
    );
    assert.equal(
      report.totals.expensesUsd,
      report.months.reduce((sum, m) => sum + m.expensesUsd, 0)
    );
    assert.equal(report.totals.profitUsd, 100);
  });
});

describe('buildSalesReport', () => {
  it('sin ventas devuelve ceros y sin producto más vendido', () => {
    const report = buildSalesReport([]);

    assert.deepEqual(report.summary, { totalUsd: 0, count: 0, averageUsd: 0 });
    assert.equal(report.topProduct, null);
    assert.deepEqual(report.byDay, []);
    assert.deepEqual(report.byProduct, []);
    assert.equal(report.unconvertedSales, 0);
  });

  it('calcula total, cantidad y ticket promedio en USD', () => {
    const report = buildSalesReport([
      withItems(sale(at(2026, 10, 18, 9), 1708.2, 2), []),
      withItems(sale(at(2026, 10, 18, 11), 854.1, 1), []),
      withItems(sale(at(2026, 10, 18, 15), 854.1, 1), []),
    ]);

    assert.deepEqual(report.summary, { totalUsd: 4, count: 3, averageUsd: 1.33 });
  });

  it('desglosa por día, hora y método de pago', () => {
    const report = buildSalesReport([
      withItems(sale(at(2026, 10, 17, 9), 854.1, 1, 854.1, 'cash'), []),
      withItems(sale(at(2026, 10, 18, 9), 854.1, 1, 854.1, 'cash'), []),
      withItems(sale(at(2026, 10, 18, 14), 2562.3, 3, 854.1, 'card'), []),
    ]);

    assert.deepEqual(report.byDay, [
      { date: '2026-10-17', totalUsd: 1, count: 1 },
      { date: '2026-10-18', totalUsd: 4, count: 2 },
    ]);
    assert.deepEqual(report.byHour, [
      { hour: 9, totalUsd: 2, count: 2 },
      { hour: 14, totalUsd: 3, count: 1 },
    ]);
    assert.deepEqual(report.byPaymentMethod, [
      { method: 'card', totalUsd: 3, count: 1 },
      { method: 'cash', totalUsd: 2, count: 2 },
    ]);
  });

  it('agrupa por producto y ordena por monto en USD', () => {
    const report = buildSalesReport([
      withItems(sale(at(2026, 10, 18), 1, 5), [
        item('a', 10, 2),
        item('b', 1, 5),
      ]),
      withItems(sale(at(2026, 10, 18), 1, 1), [item('a', 5, 1)]),
    ]);

    assert.deepEqual(
      report.byProduct.map((p) => [p.productId, p.quantity, p.totalUsd]),
      [
        ['b', 1, 5],
        ['a', 15, 3],
      ]
    );
  });

  it('el producto más vendido es el de mayor cantidad, no el de mayor monto', () => {
    const report = buildSalesReport([
      withItems(sale(at(2026, 10, 18), 1, 10), [
        item('caro', 1, 9),
        item('barato', 20, 1),
      ]),
    ]);

    assert.equal(report.topProduct?.productId, 'barato');
    assert.equal(report.topProduct?.quantity, 20);
  });

  it('una línea sin referencia en USD se deriva de su monto local y la tasa', () => {
    const report = buildSalesReport([
      withItems(sale(at(2026, 10, 18), 1000, null, 500), [
        item('a', 2, 0, { subtotalLocal: 1000 }),
      ]),
    ]);

    assert.equal(report.byProduct[0].totalUsd, 2);
  });

  it('una línea sin referencia ni tasa no suma nada', () => {
    const report = buildSalesReport([
      withItems(sale(at(2026, 10, 18), 10, null, 0), [
        item('a', 2, 0, { subtotalLocal: 10 }),
      ]),
    ]);

    assert.equal(report.byProduct[0].totalUsd, 0);
    assert.equal(report.unconvertedSales, 1);
  });
});

describe('buildSalesStats', () => {
  const stat = (
    total: number,
    totalReference: number | null,
    tax: number,
    paymentMethod = 'cash',
    exchangeRate = 854.1
  ) => ({ total, totalReference, tax, paymentMethod, exchangeRate });

  it('sin ventas devuelve ceros', () => {
    assert.deepEqual(buildSalesStats([]), {
      totalRevenue: 0,
      totalTax: 0,
      averageSale: 0,
      salesCount: 0,
      salesByPaymentMethod: [],
      unconvertedSales: 0,
    });
  });

  it('convierte cada venta a USD antes de sumar', () => {
    const stats = buildSalesStats([
      stat(854.1, 1, 0),
      stat(2562.3, 3, 0, 'card'),
    ]);

    assert.equal(stats.totalRevenue, 4);
    assert.equal(stats.averageSale, 2);
    assert.equal(stats.salesCount, 2);
    assert.deepEqual(stats.salesByPaymentMethod, [
      { paymentMethod: 'cash', count: 1, total: 1 },
      { paymentMethod: 'card', count: 1, total: 3 },
    ]);
  });

  it('el impuesto en USD conserva la proporción del total de cada venta', () => {
    // 16 de 116 de impuesto sobre una venta de USD 11,60
    const stats = buildSalesStats([stat(116, 11.6, 16)]);

    assert.equal(stats.totalTax, 1.6);
  });

  it('una venta con total 0 no produce impuesto NaN', () => {
    const stats = buildSalesStats([stat(0, 0, 0)]);

    assert.equal(stats.totalTax, 0);
    assert.equal(stats.unconvertedSales, 0);
  });

  it('informa las ventas que no se pueden convertir', () => {
    const stats = buildSalesStats([stat(1.15, null, 0, 'cash', 0), stat(854.1, 1, 0)]);

    assert.equal(stats.unconvertedSales, 1);
    assert.equal(stats.totalRevenue, 1);
    assert.equal(stats.salesCount, 2);
  });
});

describe('dashboardWindows', () => {
  it('a mitad de mes: hoy, mes en curso y mismo tramo del mes anterior', () => {
    const w = dashboardWindows(at(2026, 10, 18, 15, 30));

    assert.deepEqual(w.startOfToday, new Date(2026, 9, 18));
    assert.deepEqual(w.startOfMonth, new Date(2026, 9, 1));
    assert.deepEqual(w.startOfPrevMonth, new Date(2026, 8, 1));
    assert.deepEqual(w.endOfPrevSpan, new Date(2026, 8, 18, 23, 59, 59, 999));
    assert.deepEqual(w.startOfTrend, new Date(2026, 8, 19));
    assert.deepEqual(w.earliest, new Date(2026, 8, 1));
  });

  it('acota el tramo anterior a la longitud del mes anterior (31 de marzo, febrero de 28 días)', () => {
    const w = dashboardWindows(at(2026, 3, 31));

    assert.deepEqual(w.endOfPrevSpan, new Date(2026, 1, 28, 23, 59, 59, 999));
  });

  it('en enero el mes anterior es diciembre del año anterior', () => {
    const w = dashboardWindows(at(2026, 1, 15));

    assert.deepEqual(w.startOfPrevMonth, new Date(2025, 11, 1));
    assert.deepEqual(w.endOfPrevSpan, new Date(2025, 11, 15, 23, 59, 59, 999));
  });

  it('la tendencia cubre exactamente TREND_DAYS días terminando hoy', () => {
    const w = dashboardWindows(at(2026, 10, 18));
    const days =
      Math.round((w.startOfToday.getTime() - w.startOfTrend.getTime()) / 86_400_000) + 1;

    assert.equal(days, TREND_DAYS);
  });
});

describe('buildDashboardSales', () => {
  const now = at(2026, 10, 18, 15);

  it('clasifica las ventas en hoy, mes y mismo tramo del mes anterior', () => {
    const result = buildDashboardSales(
      [
        doc(at(2026, 10, 18, 9), 854.1, 1), // hoy
        doc(at(2026, 10, 10, 9), 1708.2, 2), // este mes, no hoy
        doc(at(2026, 9, 10, 9), 2562.3, 3), // mes anterior, dentro del tramo
        doc(at(2026, 9, 25, 9), 854.1, 1), // mes anterior, fuera del tramo
      ],
      now
    );

    assert.deepEqual(result.today, { totalUsd: 1, count: 1 });
    assert.deepEqual(result.month, { totalUsd: 3, count: 2 });
    assert.deepEqual(result.previousMonth, { totalUsd: 3, count: 1 });
  });

  it('respeta los límites: el primer instante del mes cuenta en el mes en curso', () => {
    const result = buildDashboardSales(
      [
        doc(new Date(2026, 9, 1, 0, 0, 0, 0), 854.1, 1),
        doc(new Date(2026, 8, 30, 23, 59, 59, 999), 854.1, 1),
      ],
      now
    );

    assert.deepEqual(result.month, { totalUsd: 1, count: 1 });
    // El 30 de septiembre queda fuera del tramo 1-18 del mes anterior
    assert.deepEqual(result.previousMonth, { totalUsd: 0, count: 0 });
  });

  it('la venta de ayer a las 23:59 no cuenta como de hoy', () => {
    const result = buildDashboardSales(
      [doc(new Date(2026, 9, 17, 23, 59, 59, 999), 854.1, 1)],
      now
    );

    assert.deepEqual(result.today, { totalUsd: 0, count: 0 });
    assert.deepEqual(result.month, { totalUsd: 1, count: 1 });
  });

  it('la tendencia tiene un día por cada uno de los últimos 30, con ceros', () => {
    const result = buildDashboardSales([doc(at(2026, 10, 18, 9), 854.1, 1)], now);

    assert.equal(result.byDay.length, TREND_DAYS);
    assert.equal(result.byDay[0].date, '2026-09-19');
    assert.equal(result.byDay[TREND_DAYS - 1].date, '2026-10-18');
    assert.deepEqual(result.byDay[TREND_DAYS - 1], {
      date: '2026-10-18',
      totalUsd: 1,
      count: 1,
    });
    assert.equal(result.byDay.filter((d) => d.count > 0).length, 1);
  });

  it('las ventas anteriores a la ventana no entran en la tendencia', () => {
    const result = buildDashboardSales(
      [doc(at(2026, 9, 1, 9), 854.1, 1), doc(at(2026, 9, 19, 9), 854.1, 1)],
      now
    );

    assert.equal(result.byDay[0].date, '2026-09-19');
    assert.equal(result.byDay[0].count, 1);
    assert.equal(result.byDay.reduce((sum, d) => sum + d.count, 0), 1);
  });

  it('suma el USD de cada venta, no el total en VES', () => {
    const result = buildDashboardSales(
      [doc(at(2026, 10, 18, 9), 85410, 100), doc(at(2026, 10, 18, 10), 854.1, 1)],
      now
    );

    assert.equal(result.today.totalUsd, 101);
  });

  it('sin ventas todo es cero', () => {
    const result = buildDashboardSales([], now);

    assert.deepEqual(result.today, { totalUsd: 0, count: 0 });
    assert.deepEqual(result.month, { totalUsd: 0, count: 0 });
    assert.deepEqual(result.previousMonth, { totalUsd: 0, count: 0 });
    assert.equal(result.byDay.length, TREND_DAYS);
  });
});
