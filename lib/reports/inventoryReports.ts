/**
 * Servicio de Reportes de Inventario - Migrado a PostgreSQL
 */

import { apiClient } from '@/lib/api';
import type { InventoryReportData } from '@/types/reports';

/**
 * Obtiene el reporte completo de inventario
 */
export async function getInventoryReport(
  storeId: string
): Promise<InventoryReportData> {
  try {
    const response = await apiClient.getStockReport(storeId);

    // Agrupar valor por categoría
    const categoryMap = new Map<string, { value: number; quantity: number }>();

    response.report.forEach((product) => {
      const category = product.category || 'Sin Categoría';
      const existing = categoryMap.get(category) || { value: 0, quantity: 0 };

      categoryMap.set(category, {
        value: existing.value + product.totalValue,
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

    // Distribución de stock por categoría
    const stockDistribution = Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        count: data.quantity,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      totalValue: response.summary.totalValue,
      totalProducts: response.summary.totalProducts,
      lowStockProducts: response.summary.lowStockProducts,
      outOfStockProducts: response.summary.outOfStockProducts,
      inventoryTurnover: 0, // TODO: Calcular con histórico de ventas
      valueByCategory,
      stockDistribution,
      recentMovements: [], // TODO: Implementar con endpoint de movimientos
      topRotation: [], // TODO: Implementar con histórico de ventas
    };
  } catch (error: any) {
    console.error('Error generando reporte de inventario:', error);
    throw new Error('Error al generar reporte de inventario');
  }
}

/**
 * Obtener productos con rotación alta (más vendidos)
 */
export async function getTopRotationProducts(storeId: string) {
  try {
    console.warn(
      'getTopRotationProducts requiere análisis de histórico - implementación pendiente'
    );

    return {
      products: [],
      period: { startDate: new Date(), endDate: new Date() },
    };
  } catch (error: any) {
    console.error('Error obteniendo productos de alta rotación:', error);
    throw new Error('Error al obtener productos de alta rotación');
  }
}
