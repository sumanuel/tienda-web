import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product } from '@/types/product';
import { InventoryReportData } from '@/types/reports';

const PRODUCTS_COLLECTION = 'products';

/**
 * Obtiene el reporte completo de inventario
 */
export async function getInventoryReport(
  storeId: string
): Promise<InventoryReportData> {
  const productsQuery = query(
    collection(db, PRODUCTS_COLLECTION),
    where('storeId', '==', storeId)
  );

  const snapshot = await getDocs(productsQuery);
  const products: Product[] = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Product[];

  // Valor total
  const totalValue = products.reduce(
    (sum, p) => sum + (p.cost || 0) * p.stock,
    0
  );

  const totalProducts = products.length;
  const lowStockProducts = products.filter(
    (p) => p.stock < 10 && p.stock >= 5
  ).length;
  const outOfStockProducts = products.filter((p) => p.stock < 5).length;

  // Valor por categoría
  const categoryMap = new Map<string, { value: number; quantity: number }>();

  products.forEach((product) => {
    const category = product.category || 'Sin Categoría';
    const existing = categoryMap.get(category) || { value: 0, quantity: 0 };

    categoryMap.set(category, {
      value: existing.value + (product.cost || 0) * product.stock,
      quantity: existing.quantity + product.stock,
    });
  });

  const valueByCategory = Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      value: data.value,
      quantity: data.quantity,
    }))
    .sort((a, b) => b.value - a.value);

  // Distribución de stock
  const stockDistribution = Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      count: data.quantity,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    totalValue,
    totalProducts,
    lowStockProducts,
    outOfStockProducts,
    inventoryTurnover: 0, // TODO: Calcular con histórico de ventas
    valueByCategory,
    stockDistribution,
    recentMovements: [], // TODO: Implementar con histórico
    topRotation: [], // TODO: Implementar con histórico de ventas
  };
}
