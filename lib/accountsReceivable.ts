import { getCustomersWithBalance } from '@/lib/customers';
import { getSuppliersWithBalance } from '@/lib/suppliers';
import { getStoreCustomerTransactions } from '@/lib/customerTransactions';
import { getStoreSupplierTransactions } from '@/lib/supplierTransactions';
import type {
  CustomerTransaction,
  SupplierTransaction,
  AgingData,
} from '@/types/transaction';

/**
 * Calcular aging de cartera (distribución por días de vencimiento)
 */
export function calculateAging(transactions: CustomerTransaction[]): AgingData {
  const now = new Date();

  const aging: AgingData = {
    current: 0, // 0-30 días
    days30: 0, // 31-60 días
    days60: 0, // 61-90 días
    days90: 0, // 90+ días
  };

  // Solo considerar cargos vencidos
  const overdueCharges = transactions.filter(
    (t) => t.type === 'charge' && t.dueDate && t.dueDate < now
  );

  overdueCharges.forEach((transaction) => {
    const daysOverdue = Math.floor(
      (now.getTime() - transaction.dueDate!.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysOverdue <= 30) {
      aging.current += transaction.amount;
    } else if (daysOverdue <= 60) {
      aging.days30 += transaction.amount;
    } else if (daysOverdue <= 90) {
      aging.days60 += transaction.amount;
    } else {
      aging.days90 += transaction.amount;
    }
  });

  return aging;
}

/**
 * Obtener resumen de cuentas por cobrar
 */
export async function getReceivablesSummary(storeId: string): Promise<{
  totalReceivable: number;
  overdueAmount: number;
  currentAmount: number;
  customersWithBalance: number;
  agingData: AgingData;
}> {
  try {
    // Obtener clientes con saldo
    const customers = await getCustomersWithBalance(storeId);

    // Calcular total por cobrar
    const totalReceivable = customers.reduce(
      (sum, customer) => sum + customer.balance,
      0
    );

    // Obtener todas las transacciones
    const allTransactions = await getStoreCustomerTransactions(storeId);

    // Calcular aging
    const agingData = calculateAging(allTransactions);

    // Calcular monto vencido (suma del aging)
    const overdueAmount =
      agingData.current +
      agingData.days30 +
      agingData.days60 +
      agingData.days90;

    // Monto vigente (total - vencido)
    const currentAmount = totalReceivable - overdueAmount;

    return {
      totalReceivable,
      overdueAmount,
      currentAmount,
      customersWithBalance: customers.length,
      agingData,
    };
  } catch (error) {
    console.error('Error obteniendo resumen de cuentas por cobrar:', error);
    throw error;
  }
}

/**
 * Obtener resumen de cuentas por pagar
 */
export async function getPayablesSummary(storeId: string): Promise<{
  totalPayable: number;
  overdueAmount: number;
  upcomingAmount: number;
  suppliersWithBalance: number;
}> {
  try {
    // Obtener proveedores con saldo
    const suppliers = await getSuppliersWithBalance(storeId);

    // Calcular total por pagar
    const totalPayable = suppliers.reduce(
      (sum, supplier) => sum + supplier.balance,
      0
    );

    // Obtener todas las transacciones
    const allTransactions = await getStoreSupplierTransactions(storeId);

    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    // Calcular monto vencido
    const overdueCharges = allTransactions.filter(
      (t) => t.type === 'charge' && t.dueDate && t.dueDate < now
    );
    const overdueAmount = overdueCharges.reduce((sum, t) => sum + t.amount, 0);

    // Calcular monto por vencer (próximos 7 días)
    const upcomingCharges = allTransactions.filter(
      (t) =>
        t.type === 'charge' &&
        t.dueDate &&
        t.dueDate >= now &&
        t.dueDate <= sevenDaysFromNow
    );
    const upcomingAmount = upcomingCharges.reduce(
      (sum, t) => sum + t.amount,
      0
    );

    return {
      totalPayable,
      overdueAmount,
      upcomingAmount,
      suppliersWithBalance: suppliers.length,
    };
  } catch (error) {
    console.error('Error obteniendo resumen de cuentas por pagar:', error);
    throw error;
  }
}
