import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  runTransaction,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { updateCustomerBalance, getCustomerById } from '@/lib/customers';
import type {
  CustomerTransaction,
  CustomerTransactionFormData,
  AccountStatus,
} from '@/types/transaction';

const CUSTOMER_TRANSACTIONS_COLLECTION = 'customer_transactions';

/**
 * Crear abono de cliente (pago que reduce balance)
 * FIX BUG-109: Usa runTransaction para atomicidad
 */
export async function createCustomerPayment(
  storeId: string,
  customerId: string,
  data: CustomerTransactionFormData,
  userId: string
): Promise<CustomerTransaction> {
  try {
    const transactionId = await runTransaction(db, async (transaction) => {
      // 1. Obtener cliente actual
      const customerRef = doc(db, 'customers', customerId);
      const customerDoc = await transaction.get(customerRef);

      if (!customerDoc.exists()) {
        throw new Error('Cliente no encontrado');
      }

      const currentBalance = customerDoc.data().balance || 0;

      // 2. Validar que el abono no exceda el saldo
      if (data.amount > currentBalance) {
        throw new Error(
          `El abono ($${data.amount.toFixed(2)}) no puede ser mayor al saldo actual ($${currentBalance.toFixed(2)})`
        );
      }

      // 3. Actualizar balance del cliente (usando función corregida en Fase 4)
      const newBalance = currentBalance - data.amount;

      transaction.update(customerRef, {
        balance: newBalance,
        updatedAt: Timestamp.now(),
      });

      // 4. Crear registro de transacción
      const transactionData = {
        storeId,
        customerId,
        type: 'payment' as const,
        amount: data.amount,
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
        createdBy: userId,
        createdAt: Timestamp.now(),
      };

      const newDocRef = doc(collection(db, CUSTOMER_TRANSACTIONS_COLLECTION));
      transaction.set(newDocRef, transactionData);

      return newDocRef.id;
    });

    // Obtener la transacción creada
    const createdTransaction = await getCustomerTransactionById(transactionId);
    if (!createdTransaction) {
      throw new Error('Error al obtener transacción creada');
    }

    return createdTransaction;
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
    const transactionId = await runTransaction(db, async (transaction) => {
      // 1. Obtener cliente actual
      const customerRef = doc(db, 'customers', customerId);
      const customerDoc = await transaction.get(customerRef);

      if (!customerDoc.exists()) {
        throw new Error('Cliente no encontrado');
      }

      const currentBalance = customerDoc.data().balance || 0;
      const newBalance = currentBalance + amount;

      // 2. Actualizar balance del cliente
      transaction.update(customerRef, {
        balance: newBalance,
        updatedAt: Timestamp.now(),
      });

      // 3. Crear registro de transacción
      const transactionData = {
        storeId,
        customerId,
        type: 'charge' as const,
        amount,
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
        saleId,
        dueDate: Timestamp.fromDate(dueDate),
        createdBy: userId,
        createdAt: Timestamp.now(),
      };

      const newDocRef = doc(collection(db, CUSTOMER_TRANSACTIONS_COLLECTION));
      transaction.set(newDocRef, transactionData);

      return newDocRef.id;
    });

    const createdTransaction = await getCustomerTransactionById(transactionId);
    if (!createdTransaction) {
      throw new Error('Error al obtener transacción creada');
    }

    return createdTransaction;
  } catch (error: any) {
    console.error('Error creando cargo de cliente:', error);
    throw new Error(error.message || 'Error al crear cargo');
  }
}

/**
 * Obtener transacción por ID
 * FIX BUG-112: Usa getDoc() directo en lugar de query ineficiente
 */
async function getCustomerTransactionById(
  id: string
): Promise<CustomerTransaction | null> {
  try {
    const docRef = doc(db, CUSTOMER_TRANSACTIONS_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      storeId: data.storeId,
      customerId: data.customerId,
      type: data.type,
      amount: data.amount,
      balanceBefore: data.balanceBefore,
      balanceAfter: data.balanceAfter,
      paymentMethod: data.paymentMethod,
      saleId: data.saleId,
      dueDate: data.dueDate?.toDate(),
      notes: data.notes,
      createdBy: data.createdBy,
      createdAt: data.createdAt.toDate(),
    } as CustomerTransaction;
  } catch (error) {
    console.error('Error obteniendo transacción:', error);
    return null;
  }
}

/**
 * Obtener todas las transacciones de un cliente
 */
export async function getCustomerTransactions(
  customerId: string
): Promise<CustomerTransaction[]> {
  try {
    const q = query(
      collection(db, CUSTOMER_TRANSACTIONS_COLLECTION),
      where('customerId', '==', customerId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        storeId: data.storeId,
        customerId: data.customerId,
        type: data.type,
        amount: data.amount,
        balanceBefore: data.balanceBefore,
        balanceAfter: data.balanceAfter,
        paymentMethod: data.paymentMethod,
        saleId: data.saleId,
        dueDate: data.dueDate?.toDate(),
        notes: data.notes,
        createdBy: data.createdBy,
        createdAt: data.createdAt.toDate(),
      } as CustomerTransaction;
    });
  } catch (error) {
    console.error('Error obteniendo transacciones de cliente:', error);
    throw error;
  }
}

/**
 * Obtener estado de cuenta de un cliente
 */
export async function getCustomerAccountStatus(
  customerId: string
): Promise<AccountStatus | null> {
  try {
    const customer = await getCustomerById(customerId);
    if (!customer) {
      throw new Error('Cliente no encontrado');
    }

    const transactions = await getCustomerTransactions(customerId);

    // Calcular totales
    const totalCharges = transactions
      .filter((t) => t.type === 'charge')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalPayments = transactions
      .filter((t) => t.type === 'payment')
      .reduce((sum, t) => sum + t.amount, 0);

    // Calcular monto vencido
    const now = new Date();
    const overdueCharges = transactions.filter(
      (t) => t.type === 'charge' && t.dueDate && t.dueDate < now
    );

    const overdueAmount = overdueCharges.reduce((sum, t) => sum + t.amount, 0);

    return {
      customerId: customer.id,
      name: customer.name,
      document: customer.document,
      currentBalance: customer.balance,
      transactions,
      totalCharges,
      totalPayments,
      overdueAmount,
      overdueCount: overdueCharges.length,
    };
  } catch (error) {
    console.error('Error obteniendo estado de cuenta:', error);
    return null;
  }
}

/**
 * Obtener clientes con saldo vencido
 */
export async function getOverdueCustomers(
  storeId: string
): Promise<AccountStatus[]> {
  try {
    const now = new Date();

    // Obtener todas las transacciones tipo 'charge' vencidas
    const q = query(
      collection(db, CUSTOMER_TRANSACTIONS_COLLECTION),
      where('storeId', '==', storeId),
      where('type', '==', 'charge'),
      orderBy('dueDate', 'asc')
    );

    const querySnapshot = await getDocs(q);

    const transactions = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        storeId: data.storeId,
        customerId: data.customerId,
        type: data.type,
        amount: data.amount,
        balanceBefore: data.balanceBefore,
        balanceAfter: data.balanceAfter,
        saleId: data.saleId,
        dueDate: data.dueDate?.toDate(),
        createdBy: data.createdBy,
        createdAt: data.createdAt.toDate(),
      } as CustomerTransaction;
    });

    // Filtrar solo transacciones vencidas
    const overdueTransactions = transactions.filter(
      (t) => t.dueDate && t.dueDate < now
    );

    // Agrupar por cliente
    const customerIds = [
      ...new Set(overdueTransactions.map((t) => t.customerId)),
    ];

    const accountStatuses: AccountStatus[] = [];

    for (const customerId of customerIds) {
      const status = await getCustomerAccountStatus(customerId);
      if (status && status.overdueAmount > 0) {
        accountStatuses.push(status);
      }
    }

    // Ordenar por monto vencido DESC
    return accountStatuses.sort((a, b) => b.overdueAmount - a.overdueAmount);
  } catch (error) {
    console.error('Error obteniendo clientes vencidos:', error);
    return [];
  }
}

/**
 * Obtener todas las transacciones de una tienda
 */
export async function getStoreCustomerTransactions(
  storeId: string
): Promise<CustomerTransaction[]> {
  try {
    const q = query(
      collection(db, CUSTOMER_TRANSACTIONS_COLLECTION),
      where('storeId', '==', storeId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        storeId: data.storeId,
        customerId: data.customerId,
        type: data.type,
        amount: data.amount,
        balanceBefore: data.balanceBefore,
        balanceAfter: data.balanceAfter,
        paymentMethod: data.paymentMethod,
        saleId: data.saleId,
        dueDate: data.dueDate?.toDate(),
        notes: data.notes,
        createdBy: data.createdBy,
        createdAt: data.createdAt.toDate(),
      } as CustomerTransaction;
    });
  } catch (error) {
    console.error('Error obteniendo transacciones de tienda:', error);
    return [];
  }
}
