import { round2, toUsd } from './money';

/**
 * Agregaciones de los reportes en USD. Son funciones puras (sin base de datos
 * ni reloj propio) para poder probarlas: los controladores solo consultan y
 * delegan aquí. Sale.total y Purchase.total están en la moneda del documento
 * (normalmente VES), así que cada documento se convierte con su monto de
 * referencia o su tasa antes de sumarse.
 */

export interface MoneyDoc {
  createdAt: Date;
  total: number;
  totalReference: number | null;
  exchangeRate: number;
}

export interface SaleDoc extends MoneyDoc {
  paymentMethod: string;
}

export interface SaleItemDoc {
  productId: string;
  productName: string;
  quantity: number;
  subtotal: number;
  subtotalLocal: number;
  subtotalReference: number;
}

export interface SaleWithItemsDoc extends SaleDoc {
  items: SaleItemDoc[];
}

// Mes y día calendario locales del servidor (mismo criterio que los filtros
// de fecha, ver utils/dateRange)
export function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function dayKey(date: Date) {
  return `${monthKey(date)}-${String(date.getDate()).padStart(2, '0')}`;
}

// Ventas antiguas sin tasa ni monto en USD: no hay con qué convertirlas
const isUnconverted = (usd: number, total: number) => usd === 0 && total > 0;

const saleUsd = (sale: MoneyDoc) =>
  toUsd(sale.total, sale.totalReference, sale.exchangeRate);

/**
 * Meses (yyyy-MM) que toca el período, incluidos los que no tuvieron
 * movimientos. Devuelve null si el período supera `max` meses.
 */
export function listMonthKeys(from: Date, to: Date, max: number) {
  const keys: string[] = [];
  const cursor = new Date(from.getFullYear(), from.getMonth(), 1);
  while (cursor <= to) {
    if (keys.length >= max) return null;
    keys.push(monthKey(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return keys;
}

/**
 * Estado de resultados mensual: ingresos (ventas) contra egresos (compras
 * menos devoluciones a proveedores). Los documentos fuera de `months` se
 * ignoran en el desglose mensual.
 */
export function buildFinancialReport(
  months: string[],
  sales: SaleDoc[],
  purchases: MoneyDoc[],
  returns: MoneyDoc[]
) {
  const buckets = new Map(
    months.map((month) => [month, { revenue: 0, purchases: 0, returns: 0 }])
  );
  const byMethod = new Map<string, { revenue: number; count: number }>();
  let unconvertedSales = 0;

  for (const sale of sales) {
    const usd = saleUsd(sale);
    if (isUnconverted(usd, sale.total)) unconvertedSales += 1;

    const bucket = buckets.get(monthKey(sale.createdAt));
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
    const bucket = buckets.get(monthKey(purchase.createdAt));
    if (bucket) bucket.purchases += saleUsd(purchase);
  }

  for (const purchaseReturn of returns) {
    const bucket = buckets.get(monthKey(purchaseReturn.createdAt));
    if (bucket) bucket.returns += saleUsd(purchaseReturn);
  }

  const monthRows = Array.from(buckets.entries()).map(([month, value]) => {
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

  return {
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
  };
}

interface Bucket {
  totalUsd: number;
  count: number;
}

function bump(
  map: Map<string | number, Bucket>,
  key: string | number,
  usd: number
) {
  const bucket = map.get(key) ?? { totalUsd: 0, count: 0 };
  bucket.totalUsd += usd;
  bucket.count += 1;
  map.set(key, bucket);
}

const rows = (map: Map<string | number, Bucket>) =>
  Array.from(map.entries()).map(([key, value]) => ({
    key,
    totalUsd: round2(value.totalUsd),
    count: value.count,
  }));

/** Valor en USD de una línea de venta: su referencia, o su monto local / tasa */
function itemUsd(item: SaleItemDoc, exchangeRate: number) {
  if (item.subtotalReference > 0) return item.subtotalReference;
  return exchangeRate > 0
    ? (item.subtotalLocal || item.subtotal) / exchangeRate
    : 0;
}

/** Reporte de ventas del período: totales y desgloses por día, método, hora y producto */
export function buildSalesReport(sales: SaleWithItemsDoc[]) {
  const byDay = new Map<string | number, Bucket>();
  const byMethod = new Map<string | number, Bucket>();
  const byHour = new Map<string | number, Bucket>();
  const byProduct = new Map<
    string,
    { productName: string; quantity: number; totalUsd: number }
  >();
  let totalUsd = 0;
  let unconvertedSales = 0;

  for (const sale of sales) {
    const usd = saleUsd(sale);
    if (isUnconverted(usd, sale.total)) unconvertedSales += 1;

    totalUsd += usd;
    bump(byDay, dayKey(sale.createdAt), usd);
    bump(byMethod, sale.paymentMethod, usd);
    bump(byHour, sale.createdAt.getHours(), usd);

    for (const item of sale.items) {
      const product = byProduct.get(item.productId) ?? {
        productName: item.productName,
        quantity: 0,
        totalUsd: 0,
      };
      product.quantity += item.quantity;
      product.totalUsd += itemUsd(item, sale.exchangeRate);
      byProduct.set(item.productId, product);
    }
  }

  const products = Array.from(byProduct.entries())
    .map(([productId, value]) => ({
      productId,
      productName: value.productName,
      quantity: value.quantity,
      totalUsd: round2(value.totalUsd),
    }))
    .sort((a, b) => b.totalUsd - a.totalUsd);

  // El más vendido es el de mayor cantidad; en empate queda el primero
  const topProduct = products.reduce<(typeof products)[number] | null>(
    (best, product) =>
      !best || product.quantity > best.quantity ? product : best,
    null
  );

  return {
    summary: {
      totalUsd: round2(totalUsd),
      count: sales.length,
      averageUsd: sales.length > 0 ? round2(totalUsd / sales.length) : 0,
    },
    topProduct,
    byDay: rows(byDay).map(({ key, ...rest }) => ({
      date: String(key),
      ...rest,
    })),
    byPaymentMethod: rows(byMethod)
      .map(({ key, ...rest }) => ({ method: String(key), ...rest }))
      .sort((a, b) => b.totalUsd - a.totalUsd),
    byHour: rows(byHour).map(({ key, ...rest }) => ({
      hour: Number(key),
      ...rest,
    })),
    byProduct: products,
    unconvertedSales,
  };
}

export interface SaleStatsDoc {
  total: number;
  tax: number;
  totalReference: number | null;
  exchangeRate: number;
  paymentMethod: string;
}

/** Estadísticas de un conjunto de ventas completadas, en USD */
export function buildSalesStats(sales: SaleStatsDoc[]) {
  let totalRevenue = 0;
  let totalTax = 0;
  let unconvertedSales = 0;
  const byMethod = new Map<string, { count: number; total: number }>();

  for (const sale of sales) {
    const usd = toUsd(sale.total, sale.totalReference, sale.exchangeRate);
    if (isUnconverted(usd, sale.total)) unconvertedSales += 1;

    totalRevenue += usd;
    // El impuesto guarda la proporción del total de la venta
    totalTax += sale.total > 0 ? usd * (sale.tax / sale.total) : 0;

    const method = byMethod.get(sale.paymentMethod) ?? { count: 0, total: 0 };
    method.count += 1;
    method.total += usd;
    byMethod.set(sale.paymentMethod, method);
  }

  return {
    totalRevenue: round2(totalRevenue),
    totalTax: round2(totalTax),
    averageSale: sales.length > 0 ? round2(totalRevenue / sales.length) : 0,
    salesCount: sales.length,
    salesByPaymentMethod: Array.from(byMethod.entries()).map(
      ([method, value]) => ({
        paymentMethod: method,
        count: value.count,
        total: round2(value.total),
      })
    ),
    unconvertedSales,
  };
}

export const TREND_DAYS = 30;

/**
 * Límites de fechas del panel para el instante `now`: hoy, el mes en curso,
 * el mismo tramo (día 1 hasta el mismo día) del mes anterior, acotado a la
 * longitud de ese mes, y el inicio de la tendencia de TREND_DAYS días.
 */
export function dashboardWindows(now: Date) {
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const daysInPrevMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    0
  ).getDate();
  const endOfPrevSpan = new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    Math.min(now.getDate(), daysInPrevMonth),
    23,
    59,
    59,
    999
  );
  const startOfTrend = new Date(startOfToday);
  startOfTrend.setDate(startOfTrend.getDate() - (TREND_DAYS - 1));

  return {
    startOfToday,
    startOfMonth,
    startOfPrevMonth,
    endOfPrevSpan,
    startOfTrend,
    // Desde cuándo hay que consultar ventas para cubrir todas las ventanas
    earliest: new Date(
      Math.min(startOfPrevMonth.getTime(), startOfTrend.getTime())
    ),
  };
}

/** Resumen de ventas del panel: hoy, mes, mes anterior y tendencia diaria */
export function buildDashboardSales(sales: MoneyDoc[], now: Date) {
  const {
    startOfToday,
    startOfMonth,
    startOfPrevMonth,
    endOfPrevSpan,
    startOfTrend,
  } = dashboardWindows(now);

  const sum = (): Bucket => ({ totalUsd: 0, count: 0 });
  const today = sum();
  const month = sum();
  const previousMonth = sum();
  const byDay = new Map<string, Bucket>();

  for (let i = 0; i < TREND_DAYS; i++) {
    const day = new Date(startOfTrend);
    day.setDate(startOfTrend.getDate() + i);
    byDay.set(dayKey(day), sum());
  }

  for (const sale of sales) {
    const usd = saleUsd(sale);
    const at = sale.createdAt;

    if (at >= startOfToday) {
      today.totalUsd += usd;
      today.count += 1;
    }
    if (at >= startOfMonth) {
      month.totalUsd += usd;
      month.count += 1;
    } else if (at >= startOfPrevMonth && at <= endOfPrevSpan) {
      previousMonth.totalUsd += usd;
      previousMonth.count += 1;
    }

    const bucket = byDay.get(dayKey(at));
    if (bucket) {
      bucket.totalUsd += usd;
      bucket.count += 1;
    }
  }

  const finish = (value: Bucket) => ({
    totalUsd: round2(value.totalUsd),
    count: value.count,
  });

  return {
    today: finish(today),
    month: finish(month),
    previousMonth: finish(previousMonth),
    byDay: Array.from(byDay.entries()).map(([date, value]) => ({
      date,
      ...finish(value),
    })),
  };
}
