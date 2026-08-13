/**
 * Servicio de Inventario - Migrado a PostgreSQL
 */

import { apiClient } from '@/lib/api';
import type {
  InventoryMovement,
  InventoryMovementFormData,
  KardexEntry,
  StockAlert,
} from '@/types/inventory';

/**
 * Registrar movimiento de inventario con transacción
 */
export async function registerInventoryMovement(
  storeId: string,
  userId: string,
  userName: string,
  data: InventoryMovementFormData
): Promise<InventoryMovement> {
  try {
    // Mapear tipo de movimiento: entry -> sale/purchase/adjustment, exit -> damage
    let type: 'damage' | 'adjustment';
    let quantity: number;

    if (data.type === 'entry') {
      type = 'adjustment';
      quantity = data.quantity; // Positivo para entradas
    } else {
      // exit -> damage o adjustment negativo
      if (data.reason === 'damage') {
        type = 'damage';
        quantity = data.quantity; // Positivo (el backend lo hace negativo)
      } else {
        type = 'adjustment';
        quantity = -data.quantity; // Negativo para salidas
      }
    }

    const response = await apiClient.createInventoryAdjustment({
      storeId,
      productId: data.productId,
      type,
      quantity: Math.abs(quantity),
      reason: data.reason || undefined,
      notes: data.notes || undefined,
    });

    return {
      id: response.movement.id,
      storeId: response.movement.storeId,
      productId: response.movement.productId,
      productName: response.movement.productName,
      productCode: response.movement.productCode,
      type: data.type, // Mantener tipo original (entry/exit)
      quantity: quantity,
      stockBefore: response.movement.stockBefore,
      stockAfter: response.movement.stockAfter,
      unitCost: response.movement.unitCost,
      totalCost: response.movement.totalCost,
      supplierId: data.supplierId,
      reason: response.movement.reason || undefined,
      notes: response.movement.notes || undefined,
      userId: response.movement.userId,
      userName: response.movement.userName,
      createdAt: new Date(response.movement.createdAt),
    };
  } catch (error: any) {
    console.error('Error registrando movimiento:', error);
    throw new Error(error.message || 'Error al registrar movimiento');
  }
}

/**
 * Obtener movimientos de inventario por tienda
 */
export async function getInventoryMovements(
  storeId: string,
  productId?: string
): Promise<InventoryMovement[]> {
  try {
    const response = await apiClient.getInventoryMovements({
      storeId,
      productId: productId || undefined,
      limit: 1000,
    });

    return response.movements.map((movement) => ({
      id: movement.id,
      storeId: movement.storeId,
      productId: movement.productId,
      productName: movement.productName,
      productCode: movement.productCode,
      type: movement.type === 'sale' ? 'exit' : 'entry', // Mapear tipos
      quantity: movement.quantity,
      stockBefore: movement.stockBefore,
      stockAfter: movement.stockAfter,
      unitCost: movement.unitCost,
      totalCost: movement.totalCost,
      supplierId: undefined,
      reason: movement.reason || undefined,
      notes: movement.notes || undefined,
      userId: movement.userId,
      userName: movement.userName,
      createdAt: new Date(movement.createdAt),
    }));
  } catch (error: any) {
    console.error('Error obteniendo movimientos:', error);
    throw new Error('Error al obtener movimientos');
  }
}

/**
 * Generar Kardex de producto
 */
export async function generateKardex(
  storeId: string,
  productId: string
): Promise<KardexEntry[]> {
  try {
    const response = await apiClient.getProductMovements(productId);

    return response.movements.map((movement) => ({
      date: new Date(movement.createdAt),
      reference: `MOV-${movement.id.substring(0, 8).toUpperCase()}`,
      type: movement.type,
      quantityIn: movement.quantity > 0 ? movement.quantity : 0,
      quantityOut: movement.quantity < 0 ? Math.abs(movement.quantity) : 0,
      balance: movement.stockAfter,
      unitCost: movement.unitCost,
      totalCost: movement.totalCost,
    }));
  } catch (error: any) {
    console.error('Error generando kardex:', error);
    throw new Error('Error al generar kardex');
  }
}

/**
 * Obtener alertas de stock bajo activas
 */
export async function getStockAlerts(storeId: string): Promise<StockAlert[]> {
  try {
    // Usar el endpoint de low stock
    const response = await apiClient.getLowStock(storeId);

    return response.products.map((product) => ({
      id: product.id,
      storeId,
      productId: product.id,
      productName: product.name,
      productCode: product.code,
      currentStock: product.stock,
      minStock: product.minStock,
      status: product.status as 'active' | 'resolved',
      createdAt: new Date(),
      resolvedAt: undefined,
    }));
  } catch (error: any) {
    console.error('Error obteniendo alertas:', error);
    throw new Error('Error al obtener alertas');
  }
}

/**
 * Obtener reporte de stock
 */
export async function getStockReport(storeId: string) {
  try {
    const response = await apiClient.getStockReport(storeId);

    return {
      products: response.report.map((item) => ({
        id: item.id,
        code: item.code,
        name: item.name,
        category: item.category,
        stock: item.stock,
        minStock: item.minStock,
        cost: item.cost,
        totalValue: item.totalValue,
        status: item.status,
      })),
      summary: response.summary,
    };
  } catch (error: any) {
    console.error('Error obteniendo reporte de stock:', error);
    throw new Error('Error al obtener reporte de stock');
  }
}

/**
 * Resolver alerta de stock (legacy - ahora se resuelve automáticamente)
 */
export async function resolveStockAlert(alertId: string): Promise<void> {
  console.warn(
    'resolveStockAlert es legacy - las alertas se resuelven automáticamente'
  );
  // No-op: Las alertas se resuelven automáticamente cuando el stock sube
}
