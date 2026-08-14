/**
 * Servicio de Transacciones de Clientes - Migrado a PostgreSQL
 */

import { apiClient } from '@/lib/api';
import type {
  CustomerTransaction,
  CustomerTransactionFormData,
} from '@/types/transaction';

/**
 * Crear abono de cliente (pago que reduce balance)
 */
export async function createCustomerPayment(
  storeId: string,
  customerId: string,
  data: CustomerTransactionFormData,
  userId: string
): Promise<CustomerTransaction> {
  try {
    const response = await apiClient.createCustomerTransaction(customerId, {
      type: 'payment',
      amount: data.amount,
      description: data.notes || undefined,
    });

    return {
      id: response.transaction.id,
      storeId,
      customerId: response.transaction.customerId,
      type: 'payment',
      amount: response.transaction.amount,
      balanceBefore: response.balance - response.transaction.amount, // Calculado
      balanceAfter: response.balance,
      paymentMethod: data.paymentMethod,
      saleId: response.transaction.saleId || undefined,
      dueDate: response.transaction.dueDate
        ? new Date(response.transaction.dueDate)
        : undefined,
      notes: response.transaction.notes || undefined,
      createdBy: userId,
      createdAt: new Date(response.transaction.createdAt),
    };
  } catch (error: any) {
    console.error('Error creando abono de cliente:', error);
    throw new Error(error.message || 'Error al crear abono');
  }
}

/**
 * Crear cargo de cliente (venta a crédito que aumenta balance)
 */
export async function createCustomerCharge(
  storeId: string,
  customerId: string,
  saleId: string,
  amount: number,
  dueDate: Date,
  userId: string
): Promise<CustomerTransaction> {
  try {
    const response = await apiClient.createCustomerTransaction(customerId, {
      type: 'credit',
      amount,
      description: `Venta a crédito - Sale #${saleId}`,
    });

    return {
      id: response.transaction.id,
      storeId,
      customerId: response.transaction.customerId,
      type: 'charge',
      amount: response.transaction.amount,
      balanceBefore: response.balance - response.transaction.amount,
      balanceAfter: response.balance,
      saleId,
      dueDate,
      createdBy: userId,
      createdAt: new Date(response.transaction.createdAt),
    };
  } catch (error: any) {
    console.error('Error creando cargo de cliente:', error);
    throw new Error(error.message || 'Error al crear cargo');
  }
}

/**
 * Obtener todas las transacciones de un cliente
 */
export async function getCustomerTransactions(
  customerId: string
): Promise<CustomerTransaction[]> {
  try {
    const response = await apiClient.getCustomerTransactions(customerId);

    return response.transactions.map((transaction) => ({
      id: transaction.id,
      storeId: '', // No disponible en la respuesta
      customerId: transaction.customerId,
      type: transaction.type === 'credit' ? 'charge' : 'payment',
      amount: Math.abs(transaction.amount),
      balanceBefore: 0, // No disponible directamente
      balanceAfter: transaction.balance,
      paymentMethod: undefined,
      saleId: transaction.saleId || undefined,
      dueDate: transaction.dueDate ? new Date(transaction.dueDate) : undefined,
      notes: transaction.notes || undefined,
      createdBy: '', // No disponible en la respuesta
      createdAt: new Date(transaction.createdAt),
    }));
  } catch (error: any) {
    console.error('Error obteniendo transacciones de cliente:', error);
    throw new Error('Error al obtener transacciones');
  }
}

/**
 * Obtener estado de cuenta de un cliente
 */
export async function getCustomerAccountStatus(customerId: string) {
  try {
    const response = await apiClient.getCustomerTransactions(customerId);

    return {
      currentBalance: response.balance,
      totalCharges: response.transactions
        .filter((t) => t.type === 'credit')
        .reduce((sum, t) => sum + t.amount, 0),
      totalPayments: response.transactions
        .filter((t) => t.type === 'payment')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0),
      lastTransaction: response.transactions[0]
        ? new Date(response.transactions[0].createdAt)
        : undefined,
    };
  } catch (error) {
    console.error('Error obteniendo estado de cuenta:', error);
    throw new Error('Error al obtener estado de cuenta');
  }
}

/**
 * Obtener clientes con cuentas vencidas
 */
export async function getOverdueCustomers(storeId: string) {
  try {
    const response = await apiClient.request<{
      customers: Array<{
        customer: {
          id: string;
          name: string;
          email?: string;
          phone?: string;
        };
        totalOverdue: number;
        daysOverdue: number;
        oldestDueDate: string;
        transactions: any[];
      }>;
      total: number;
      count: number;
    }>(`/customers/overdue/list?storeId=${storeId}`);

    const customers = response.customers.map((item) => ({
      id: item.customer.id,
      storeId,
      name: item.customer.name,
      email: item.customer.email,
      phone: item.customer.phone,
      balance: item.totalOverdue,
      daysOverdue: item.daysOverdue,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    return {
      customers,
      totalOverdue: response.total,
    };
  } catch (error: any) {
    console.error('Error obteniendo clientes vencidos:', error);
    throw new Error('Error al obtener clientes vencidos');
  }
}
