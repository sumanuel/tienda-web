import {
  collection,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  runTransaction,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getSupplierById } from '@/lib/suppliers';
import type {
  SupplierTransaction,
  SupplierTransactionFormData,
  AccountStatus,
} from '@/types/transaction';

const SUPPLIER_TRANSACTIONS_COLLECTION = 'supplier_transactions';

/**
 * Crear pago a proveedor (reduce balance)
 * FIX BUG-109: Usa runTransaction para atomicidad
 */
export async function createSupplierPayment(
  storeId: string,
  supplierId: string,
  data: SupplierTransactionFormData,
  userId: string
): Promise<SupplierTransaction> {
  try {
    const transactionId = await runTransaction(db, async (transaction) => {
      // 1. Obtener proveedor actual
      const supplierRef = doc(db, 'suppliers', supplierId);
      const supplierDoc = await transaction.get(supplierRef);

      if (!supplierDoc.exists()) {
        throw new Error('Proveedor no encontrado');
      }

      const currentBalance = supplierDoc.data().balance || 0;

      // 2. Validar que el pago no exceda el saldo
      if (data.amount > currentBalance) {
        throw new Error(
          `El pago ($${data.amount.toFixed(2)}) no puede ser mayor al saldo actual ($${currentBalance.toFixed(2)})`
        );
      }

      // 3. Actualizar balance del proveedor
      const newBalance = currentBalance - data.amount;

      transaction.update(supplierRef, {
        balance: newBalance,
        updatedAt: Timestamp.now(),
      });

      // 4. Crear registro de transacción
      const transactionData = {
        storeId,
        supplierId,
        type: 'payment' as const,
        amount: data.amount,
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
        createdBy: userId,
        createdAt: Timestamp.now(),
      };

      const newDocRef = doc(collection(db, SUPPLIER_TRANSACTIONS_COLLECTION));
      transaction.set(newDocRef, transactionData);

      return newDocRef.id;
    });

    // Obtener la transacción creada
    const createdTransaction = await getSupplierTransactionById(transactionId);
    if (!createdTransaction) {
      throw new Error('Error al obtener transacción creada');
    }

    return createdTransaction;
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
    const transactionId = await runTransaction(db, async (transaction) => {
      // 1. Obtener proveedor actual
      const supplierRef = doc(db, 'suppliers', supplierId);
      const supplierDoc = await transaction.get(supplierRef);

      if (!supplierDoc.exists()) {
        throw new Error('Proveedor no encontrado');
      }

      const currentBalance = supplierDoc.data().balance || 0;
      const newBalance = currentBalance + amount;

      // 2. Actualizar balance del proveedor
      transaction.update(supplierRef, {
        balance: newBalance,
        updatedAt: Timestamp.now(),
      });

      // 3. Crear registro de transacción
      const transactionData = {
        storeId,
        supplierId,
        type: 'charge' as const,
        amount,
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
        dueDate: Timestamp.fromDate(dueDate),
        notes,
        createdBy: userId,
        createdAt: Timestamp.now(),
      };

      const newDocRef = doc(collection(db, SUPPLIER_TRANSACTIONS_COLLECTION));
      transaction.set(newDocRef, transactionData);

      return newDocRef.id;
    });

    const createdTransaction = await getSupplierTransactionById(transactionId);
    if (!createdTransaction) {
      throw new Error('Error al obtener transacción creada');
    }

    return createdTransaction;
  } catch (error: any) {
    console.error('Error creando cargo de proveedor:', error);
    throw new Error(error.message || 'Error al crear cargo');
  }
}

/**
 * Obtener transacción por ID
 */
async function getSupplierTransactionById(
  id: string
): Promise<SupplierTransaction | null> {
  try {
    const q = query(
      collection(db, SUPPLIER_TRANSACTIONS_COLLECTION),
      where('__name__', '==', id)
    );
    const docSnap = await getDocs(q);

    if (docSnap.empty) {
      return null;
    }

    const data = docSnap.docs[0].data();
    return {
      id: docSnap.docs[0].id,
      storeId: data.storeId,
      supplierId: data.supplierId,
      type: data.type,
      amount: data.amount,
      balanceBefore: data.balanceBefore,
      balanceAfter: data.balanceAfter,
      paymentMethod: data.paymentMethod,
      purchaseOrderId: data.purchaseOrderId,
      dueDate: data.dueDate?.toDate(),
      notes: data.notes,
      createdBy: data.createdBy,
      createdAt: data.createdAt.toDate(),
    } as SupplierTransaction;
  } catch (error) {
    console.error('Error obteniendo transacción:', error);
    return null;
  }
}

/**
 * Obtener todas las transacciones de un proveedor
 */
export async function getSupplierTransactions(
  supplierId: string
): Promise<SupplierTransaction[]> {
  try {
    const q = query(
      collection(db, SUPPLIER_TRANSACTIONS_COLLECTION),
      where('supplierId', '==', supplierId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        storeId: data.storeId,
        supplierId: data.supplierId,
        type: data.type,
        amount: data.amount,
        balanceBefore: data.balanceBefore,
        balanceAfter: data.balanceAfter,
        paymentMethod: data.paymentMethod,
        purchaseOrderId: data.purchaseOrderId,
        dueDate: data.dueDate?.toDate(),
        notes: data.notes,
        createdBy: data.createdBy,
        createdAt: data.createdAt.toDate(),
      } as SupplierTransaction;
    });
  } catch (error) {
    console.error('Error obteniendo transacciones de proveedor:', error);
    throw error;
  }
}

/**
 * Obtener estado de cuenta de un proveedor
 */
export async function getSupplierAccountStatus(
  supplierId: string
): Promise<AccountStatus | null> {
  try {
    const supplier = await getSupplierById(supplierId);
    if (!supplier) {
      throw new Error('Proveedor no encontrado');
    }

    const transactions = await getSupplierTransactions(supplierId);

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
      supplierId: supplier.id,
      name: supplier.name,
      rif: supplier.rif,
      currentBalance: supplier.balance,
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
 * Obtener proveedores con saldo por vencer (próximos 7 días)
 */
export async function getUpcomingPayables(
  storeId: string
): Promise<AccountStatus[]> {
  try {
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    // Obtener todas las transacciones tipo 'charge' próximas a vencer
    const q = query(
      collection(db, SUPPLIER_TRANSACTIONS_COLLECTION),
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
        supplierId: data.supplierId,
        type: data.type,
        amount: data.amount,
        balanceBefore: data.balanceBefore,
        balanceAfter: data.balanceAfter,
        dueDate: data.dueDate?.toDate(),
        createdBy: data.createdBy,
        createdAt: data.createdAt.toDate(),
      } as SupplierTransaction;
    });

    // Filtrar solo transacciones que vencen en los próximos 7 días
    const upcomingTransactions = transactions.filter(
      (t) => t.dueDate && t.dueDate >= now && t.dueDate <= sevenDaysFromNow
    );

    // Agrupar por proveedor
    const supplierIds = [
      ...new Set(upcomingTransactions.map((t) => t.supplierId)),
    ];

    const accountStatuses: AccountStatus[] = [];

    for (const supplierId of supplierIds) {
      const status = await getSupplierAccountStatus(supplierId);
      if (status && status.currentBalance > 0) {
        accountStatuses.push(status);
      }
    }

    // Ordenar por fecha de vencimiento más próxima
    return accountStatuses.sort((a, b) => {
      const aEarliest = a.transactions
        .filter((t) => t.type === 'charge' && t.dueDate)
        .sort((x, y) => (x.dueDate! < y.dueDate! ? -1 : 1))[0]?.dueDate;
      const bEarliest = b.transactions
        .filter((t) => t.type === 'charge' && t.dueDate)
        .sort((x, y) => (x.dueDate! < y.dueDate! ? -1 : 1))[0]?.dueDate;

      if (!aEarliest) return 1;
      if (!bEarliest) return -1;
      return aEarliest < bEarliest ? -1 : 1;
    });
  } catch (error) {
    console.error('Error obteniendo proveedores próximos a vencer:', error);
    return [];
  }
}

/**
 * Obtener todas las transacciones de una tienda
 */
export async function getStoreSupplierTransactions(
  storeId: string
): Promise<SupplierTransaction[]> {
  try {
    const q = query(
      collection(db, SUPPLIER_TRANSACTIONS_COLLECTION),
      where('storeId', '==', storeId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        storeId: data.storeId,
        supplierId: data.supplierId,
        type: data.type,
        amount: data.amount,
        balanceBefore: data.balanceBefore,
        balanceAfter: data.balanceAfter,
        paymentMethod: data.paymentMethod,
        purchaseOrderId: data.purchaseOrderId,
        dueDate: data.dueDate?.toDate(),
        notes: data.notes,
        createdBy: data.createdBy,
        createdAt: data.createdAt.toDate(),
      } as SupplierTransaction;
    });
  } catch (error) {
    console.error('Error obteniendo transacciones de tienda:', error);
    return [];
  }
}
