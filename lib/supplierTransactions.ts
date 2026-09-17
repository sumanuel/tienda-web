/**
 * Servicio de Transacciones de Proveedores - Migrado a PostgreSQL
 */

import { apiClient } from '@/lib/api';
import type {
  AccountStatus,
  SupplierTransaction,
  SupplierTransactionFormData,
} from '@/types/transaction';

/**
 * Crear pago a proveedor (reduce balance)
 */
export async function createSupplierPayment(
  storeId: string,
  supplierId: string,
  data: SupplierTransactionFormData,
  userId: string
): Promise<SupplierTransaction> {
  try {
    const response = await apiClient.createSupplierTransaction(supplierId, {
      type: 'payment',
      amount: data.amount,
      description: data.notes || undefined,
    });

    return {
      id: response.transaction.id,
      storeId,
      supplierId: response.transaction.supplierId,
      type: 'payment',
      amount: Math.abs(response.transaction.amount),
      balanceBefore: response.balance - response.transaction.amount,
      balanceAfter: response.balance,
      paymentMethod: data.paymentMethod,
      dueDate: response.transaction.dueDate
        ? new Date(response.transaction.dueDate)
        : undefined,
      notes: response.transaction.notes || undefined,
      createdBy: userId,
      createdAt: new Date(response.transaction.createdAt),
    };
  } catch (error: any) {
    console.error('Error creando pago a proveedor:', error);
    throw new Error(error.message || 'Error al crear pago');
  }
}

/**
 * Crear cargo de proveedor (compra a crédito que aumenta balance)
 */
export async function createSupplierCharge(
  storeId: string,
  supplierId: string,
  amount: number,
  dueDate: Date,
  userId: string,
  notes?: string
): Promise<SupplierTransaction> {
  try {
    const response = await apiClient.createSupplierTransaction(supplierId, {
      type: 'purchase',
      amount,
      description: notes || 'Compra a crédito',
    });

    return {
      id: response.transaction.id,
      storeId,
      supplierId: response.transaction.supplierId,
      type: 'charge',
      amount: response.transaction.amount,
      balanceBefore: response.balance - response.transaction.amount,
      balanceAfter: response.balance,
      dueDate,
      notes: response.transaction.notes || undefined,
      createdBy: userId,
      createdAt: new Date(response.transaction.createdAt),
    };
  } catch (error: any) {
    console.error('Error creando cargo de proveedor:', error);
    throw new Error(error.message || 'Error al crear cargo');
  }
}

/**
 * Obtener todas las transacciones de un proveedor
 */
export async function getSupplierTransactions(
  supplierId: string
): Promise<SupplierTransaction[]> {
  try {
    const response = await apiClient.getSupplierTransactions(supplierId);

    return response.transactions.map((transaction) => ({
      id: transaction.id,
      storeId: '', // No disponible en la respuesta
      supplierId: transaction.supplierId,
      type: transaction.type === 'purchase' ? 'charge' : 'payment',
      amount: Math.abs(transaction.amount),
      balanceBefore: 0, // No disponible directamente
      balanceAfter: transaction.balance,
      paymentMethod: undefined,
      dueDate: transaction.dueDate ? new Date(transaction.dueDate) : undefined,
      notes: transaction.notes || undefined,
      createdBy: '', // No disponible en la respuesta
      createdAt: new Date(transaction.createdAt),
    }));
  } catch (error: any) {
    console.error('Error obteniendo transacciones de proveedor:', error);
    throw new Error('Error al obtener transacciones');
  }
}

/**
 * Obtener estado de cuenta de un proveedor
 */
export async function getSupplierAccountStatus(supplierId: string) {
  try {
    const response = await apiClient.getSupplierTransactions(supplierId);
    const transactions = response.transactions.map((transaction) => ({
      id: transaction.id,
      storeId: '',
      supplierId: transaction.supplierId,
      type: transaction.type === 'purchase' ? 'charge' : 'payment',
      amount: Math.abs(transaction.amount),
      balanceBefore: 0,
      balanceAfter: transaction.balance,
      paymentMethod: undefined,
      dueDate: transaction.dueDate ? new Date(transaction.dueDate) : undefined,
      notes: transaction.notes || undefined,
      createdBy: '',
      createdAt: new Date(transaction.createdAt),
    }));

    const overdueCharges = transactions.filter(
      (transaction) =>
        transaction.type === 'charge' &&
        transaction.dueDate &&
        transaction.dueDate < new Date()
    );

    const status: AccountStatus = {
      supplierId,
      name: response.supplier?.name || 'Proveedor',
      rif: response.supplier?.taxId || response.supplier?.rif || '',
      currentBalance: response.balance,
      transactions,
      totalCharges: transactions
        .filter((transaction) => transaction.type === 'charge')
        .reduce((sum, transaction) => sum + transaction.amount, 0),
      totalPayments: transactions
        .filter((transaction) => transaction.type === 'payment')
        .reduce((sum, transaction) => sum + transaction.amount, 0),
      overdueAmount: overdueCharges.reduce(
        (sum, transaction) => sum + transaction.amount,
        0
      ),
      overdueCount: overdueCharges.length,
    };

    return status;
  } catch (error) {
    console.error('Error obteniendo estado de cuenta:', error);
    throw new Error('Error al obtener estado de cuenta');
  }
}

/**
 * Obtener cuentas por pagar próximas
 */
export async function getUpcomingPayables(storeId: string) {
  try {
    // Si el endpoint especializado no existe, retornar datos vacíos
    // En lugar de fallar completamente
    try {
      const response = await apiClient.request<{
        payables: Array<{
          supplier: {
            id: string;
            name: string;
            email?: string;
            phone?: string;
          };
          totalAmount: number;
          earliestDueDate: string;
          transactions: any[];
        }>;
        total: number;
        count: number;
        daysAhead: number;
      }>(`/api/suppliers/upcoming-payables?storeId=${storeId}&days=7`);

      const payables = response.payables.map((item) => ({
        id: item.supplier.id,
        storeId,
        name: item.supplier.name,
        email: item.supplier.email,
        phone: item.supplier.phone,
        balance: -item.totalAmount, // Negativo porque es lo que debemos
        dueDate: item.earliestDueDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      return {
        payables,
        totalUpcoming: response.total,
      };
    } catch (apiError: any) {
      // Si el endpoint no existe (404) o proveedor no encontrado, retornar vacío
      if (
        apiError.message?.includes('no encontrado') ||
        apiError.message?.includes('404')
      ) {
        console.warn(
          'Endpoint /api/suppliers/upcoming-payables no disponible, retornando datos vacíos'
        );
        return {
          payables: [],
          totalUpcoming: 0,
        };
      }
      throw apiError;
    }
  } catch (error: any) {
    console.error('Error obteniendo pagos próximos:', error);
    throw new Error('Error al obtener pagos próximos');
  }
}
