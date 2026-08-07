import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Sale } from '@/types/sale';
import { SalesReportData, DateRange } from '@/types/reports';
import { format, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';

const SALES_COLLECTION = 'sales';

/**
 * Obtiene el reporte completo de ventas para un rango de fechas
 */
export async function getSalesReport(
  storeId: string,
  dateRange: DateRange
): Promise<SalesReportData> {
  const salesQuery = query(
    collection(db, SALES_COLLECTION),
    where('storeId', '==', storeId),
    where('createdAt', '>=', Timestamp.fromDate(dateRange.startDate)),
    where('createdAt', '<=', Timestamp.fromDate(dateRange.endDate))
  );

  const snapshot = await getDocs(salesQuery);
  const sales: Sale[] = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
    creditDueDate: doc.data().creditDueDate?.toDate(),
  })) as Sale[];

  // Calcular métricas
  const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
  const totalTransactions = sales.length;
  const averageTicket =
    totalTransactions > 0 ? totalSales / totalTransactions : 0;

  // Top producto
  const productSales = new Map<
    string,
    { name: string; quantity: number; total: number }
  >();

  sales.forEach((sale) => {
    sale.items.forEach((item) => {
      const existing = productSales.get(item.productId) || {
        name: item.productName,
        quantity: 0,
        total: 0,
      };

      productSales.set(item.productId, {
        name: item.productName,
        quantity: existing.quantity + item.quantity,
        total: existing.total + item.price * item.quantity,
      });
    });
  });

  const topProduct =
    productSales.size > 0
      ? Array.from(productSales.entries()).sort(
          (a, b) => b[1].quantity - a[1].quantity
        )[0]
      : null;

  // Ventas por día
  const days = eachDayOfInterval({
    start: dateRange.startDate,
    end: dateRange.endDate,
  });

  const salesByDay = days.map((day) => {
    const daySales = sales.filter(
      (sale) =>
        sale.createdAt &&
        format(sale.createdAt, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
    );

    return {
      date: format(day, 'dd MMM', { locale: es }),
      total: daySales.reduce((sum, sale) => sum + sale.total, 0),
      transactions: daySales.length,
    };
  });

  // Ventas por producto
  const salesByProduct = Array.from(productSales.entries())
    .map(([productId, data]) => ({
      productId,
      productName: data.name,
      quantity: data.quantity,
      total: data.total,
    }))
    .sort((a, b) => b.total - a.total);

  // Ventas por método de pago
  const paymentMethodSales = new Map<
    string,
    { total: number; transactions: number }
  >();

  sales.forEach((sale) => {
    const method = sale.paymentMethod;
    const existing = paymentMethodSales.get(method) || {
      total: 0,
      transactions: 0,
    };

    paymentMethodSales.set(method, {
      total: existing.total + sale.total,
      transactions: existing.transactions + 1,
    });
  });

  const salesByPaymentMethod = Array.from(paymentMethodSales.entries()).map(
    ([method, data]) => ({
      method,
      total: data.total,
      transactions: data.transactions,
    })
  );

  // Ventas por hora
  const hourSales = Array.from({ length: 24 }, (_, hour) => {
    const hourSalesData = sales.filter(
      (sale) => sale.createdAt && sale.createdAt.getHours() === hour
    );

    return {
      hour,
      total: hourSalesData.reduce((sum, sale) => sum + sale.total, 0),
      transactions: hourSalesData.length,
    };
  }).filter((hour) => hour.transactions > 0);

  return {
    totalSales,
    totalTransactions,
    averageTicket,
    topProduct: topProduct
      ? {
          id: topProduct[0],
          name: topProduct[1].name,
          quantity: topProduct[1].quantity,
          total: topProduct[1].total,
        }
      : null,
    salesByDay,
    salesByProduct,
    salesByPaymentMethod,
    salesByHour: hourSales,
  };
}
