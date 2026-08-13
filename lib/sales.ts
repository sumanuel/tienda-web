/**
 * Servicio de Ventas - Migrado a PostgreSQL
 */

import { apiClient } from '@/lib/api';
import type { Sale, SaleItem } from '@/types/sale';

/**
 * Procesar venta (con actualización de inventario)
 */
export async function processSale(
  storeId: string,
  cashierId: string,
  cashierName: string,
  items: SaleItem[],
  currency: string,
  paymentMethod: 'cash' | 'card' | 'transfer' | 'credit',
  amountReceived?: number,
  customerId?: string,
  customerName?: string,
  creditDueDate?: Date
): Promise<Sale> {
  try {
    // Validar venta a crédito
    if (paymentMethod === 'credit') {
      if (!customerId) {
        throw new Error('Debe seleccionar un cliente para ventas a crédito');
      }
      if (!creditDueDate) {
        throw new Error(
          'Debe especificar fecha de vencimiento para ventas a crédito'
        );
      }
    }

    const response = await apiClient.createSale({
      storeId,
      customerId: customerId || undefined,
      customerName: customerName || undefined,
      items: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.price,
        discount: item.discount || 0,
      })),
      currency,
      paymentMethod,
      amountReceived: amountReceived || undefined,
      notes: undefined,
    });

    return {
      id: response.sale.id,
      storeId: response.sale.storeId,
      saleNumber: response.sale.saleNumber,
      customerId: response.sale.customerId || undefined,
      customerName: response.sale.customerName || undefined,
      cashierId: response.sale.cashierId,
      cashierName: response.sale.cashierName,
      items: response.sale.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        productCode: item.productCode,
        quantity: item.quantity,
        price: item.unitPrice,
        discount: item.discount,
        subtotal: item.subtotal,
      })),
      subtotal: response.sale.subtotal,
      discount: response.sale.discount,
      tax: response.sale.tax,
      total: response.sale.total,
      currency: response.sale.currency,
      exchangeRateSnapshot: {}, // No disponible en backend actual
      paymentMethod: response.sale.paymentMethod as
        | 'cash'
        | 'card'
        | 'transfer'
        | 'credit',
      paymentStatus: response.sale.paymentStatus as 'paid' | 'credit',
      amountReceived: response.sale.amountReceived || undefined,
      change: response.sale.change || undefined,
      creditDueDate: creditDueDate,
      amountDue: paymentMethod === 'credit' ? response.sale.total : 0,
      status: 'completed',
      createdAt: new Date(response.sale.createdAt),
    };
  } catch (error: any) {
    console.error('Error processing sale:', error);
    throw new Error(error.message || 'Error al procesar venta');
  }
}

/**
 * Obtener ventas de una tienda
 */
export async function getSales(storeId: string): Promise<Sale[]> {
  try {
    const response = await apiClient.getSales({ storeId, limit: 1000 });

    return response.sales.map((sale) => ({
      id: sale.id,
      storeId: sale.storeId,
      saleNumber: sale.saleNumber,
      customerId: sale.customerId || undefined,
      customerName: sale.customerName || undefined,
      cashierId: sale.cashierId,
      cashierName: sale.cashierName,
      items: [], // No disponible en listado, se carga en getSaleById
      subtotal: 0, // No disponible en listado
      discount: 0, // No disponible en listado
      tax: 0, // No disponible en listado
      total: sale.total,
      currency: sale.currency,
      exchangeRateSnapshot: {},
      paymentMethod: sale.paymentMethod as 'cash' | 'card' | 'transfer' | 'credit',
      paymentStatus: sale.paymentStatus as 'paid' | 'credit',
      amountReceived: undefined,
      change: undefined,
      creditDueDate: undefined,
      amountDue: 0,
      status: sale.cancelledAt ? 'cancelled' : 'completed',
      createdAt: new Date(sale.createdAt),
      cancelledAt: sale.cancelledAt ? new Date(sale.cancelledAt) : undefined,
    }));
  } catch (error: any) {
    console.error('Error getting sales:', error);
    throw new Error('Error al obtener ventas');
  }
}

/**
 * Obtener venta por ID
 */
export async function getSaleById(saleId: string): Promise<Sale | null> {
  try {
    const response = await apiClient.getSale(saleId);

    return {
      id: response.sale.id,
      storeId: response.sale.storeId,
      saleNumber: response.sale.saleNumber,
      customerId: response.sale.customerId || undefined,
      customerName: response.sale.customerName || undefined,
      cashierId: response.sale.cashierId,
      cashierName: response.sale.cashierName,
      items: response.sale.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        productCode: item.productCode,
        quantity: item.quantity,
        price: item.unitPrice,
        discount: item.discount,
        subtotal: item.subtotal,
      })),
      subtotal: response.sale.subtotal,
      discount: response.sale.discount,
      tax: response.sale.tax,
      total: response.sale.total,
      currency: response.sale.currency,
      exchangeRateSnapshot: {},
      paymentMethod: response.sale.paymentMethod as
        | 'cash'
        | 'card'
        | 'transfer'
        | 'credit',
      paymentStatus: response.sale.paymentStatus as 'paid' | 'credit',
      amountReceived: response.sale.amountReceived || undefined,
      change: response.sale.change || undefined,
      creditDueDate: undefined, // No disponible en backend actual
      amountDue: 0, // No disponible en backend actual
      status: response.sale.cancelledAt ? 'cancelled' : 'completed',
      createdAt: new Date(response.sale.createdAt),
      cancelledAt: response.sale.cancelledAt
        ? new Date(response.sale.cancelledAt)
        : undefined,
      notes: response.sale.notes || undefined,
    };
  } catch (error: any) {
    console.error('Error getting sale:', error);
    return null;
  }
}

/**
 * Cancelar venta
 */
export async function cancelSale(saleId: string): Promise<void> {
  try {
    await apiClient.cancelSale(saleId);
  } catch (error: any) {
    console.error('Error cancelling sale:', error);
    throw new Error(error.message || 'Error al cancelar venta');
  }
}

/**
 * Obtener estadísticas de ventas
 */
export async function getSalesStats(
  storeId: string,
  startDate?: Date,
  endDate?: Date
) {
  try {
    const response = await apiClient.getSalesStats({
      storeId,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
    });

    return {
      totalSales: response.stats.totalSales,
      totalRevenue: response.stats.totalRevenue,
      averageTicket: response.stats.averageTicket,
      totalItems: response.stats.totalItems,
    };
  } catch (error: any) {
    console.error('Error getting sales stats:', error);
    throw new Error('Error al obtener estadísticas de ventas');
  }
}

/**
 * Obtener ventas de un cliente
 */
export async function getCustomerSales(
  storeId: string,
  customerId: string
): Promise<Sale[]> {
  try {
    const response = await apiClient.getSales({ storeId, customerId, limit: 1000 });

    return response.sales.map((sale) => ({
      id: sale.id,
      storeId: sale.storeId,
      saleNumber: sale.saleNumber,
      customerId: sale.customerId || undefined,
      customerName: sale.customerName || undefined,
      cashierId: sale.cashierId,
      cashierName: sale.cashierName,
      items: [],
      subtotal: 0,
      discount: 0,
      tax: 0,
      total: sale.total,
      currency: sale.currency,
      exchangeRateSnapshot: {},
      paymentMethod: sale.paymentMethod as 'cash' | 'card' | 'transfer' | 'credit',
      paymentStatus: sale.paymentStatus as 'paid' | 'credit',
      amountReceived: undefined,
      change: undefined,
      creditDueDate: undefined,
      amountDue: 0,
      status: sale.cancelledAt ? 'cancelled' : 'completed',
      createdAt: new Date(sale.createdAt),
      cancelledAt: sale.cancelledAt ? new Date(sale.cancelledAt) : undefined,
    }));
  } catch (error: any) {
    console.error('Error getting customer sales:', error);
    throw new Error('Error al obtener ventas del cliente');
  }
}
