/**
 * Servicio de Clientes - CRUD y operaciones de negocio
 */

import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  runTransaction,
} from 'firebase/firestore';
import { Customer, CustomerFormData } from '@/types/customer';

const CUSTOMERS_COLLECTION = 'customers';
const SALES_COLLECTION = 'sales';

/**
 * Crear cliente
 * FIX BUG-108: Usa runTransaction para validación atómica
 * FIX BUG-111: Normaliza documento a uppercase para unicidad case-insensitive
 */
export async function createCustomer(
  storeId: string,
  data: CustomerFormData
): Promise<Customer> {
  try {
    // Normalizar documento a uppercase para unicidad case-insensitive
    const normalizedDocument = data.document.toUpperCase().trim();

    // Usar transaction para garantizar atomicidad (validación + creación)
    const newCustomerId = await runTransaction(db, async (transaction) => {
      // Validar unicidad DENTRO de la transaction
      const existingQuery = query(
        collection(db, CUSTOMERS_COLLECTION),
        where('storeId', '==', storeId),
        where('document', '==', normalizedDocument)
      );

      const existing = await getDocs(existingQuery);

      if (!existing.empty) {
        throw new Error(
          `Ya existe un cliente con documento ${normalizedDocument}`
        );
      }

      // Crear documento dentro de la transaction
      const customerData = {
        storeId,
        ...data,
        document: normalizedDocument, // Guardar normalizado
        balance: 0, // Balance inicial siempre 0
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const newDocRef = doc(collection(db, CUSTOMERS_COLLECTION));
      transaction.set(newDocRef, customerData);

      return newDocRef.id;
    });

    // Obtener el cliente recién creado
    const createdCustomer = await getCustomerById(newCustomerId);
    if (!createdCustomer) {
      throw new Error('Error al obtener cliente creado');
    }

    return createdCustomer;
  } catch (error: any) {
    console.error('Error creando cliente:', error);
    throw new Error(error.message || 'Error al crear cliente');
  }
}

/**
 * Obtener todos los clientes de una tienda
 */
export async function getCustomers(storeId: string): Promise<Customer[]> {
  try {
    const q = query(
      collection(db, CUSTOMERS_COLLECTION),
      where('storeId', '==', storeId),
      orderBy('name', 'asc')
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as Customer;
    });
  } catch (error) {
    console.error('Error obteniendo clientes:', error);
    throw error;
  }
}

/**
 * Obtener cliente por ID
 */
export async function getCustomerById(
  customerId: string
): Promise<Customer | null> {
  try {
    const docRef = doc(db, CUSTOMERS_COLLECTION, customerId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    } as Customer;
  } catch (error) {
    console.error('Error obteniendo cliente:', error);
    throw error;
  }
}

/**
 * Actualizar cliente
 */
export async function updateCustomer(
  customerId: string,
  data: Partial<CustomerFormData>
): Promise<void> {
  try {
    const docRef = doc(db, CUSTOMERS_COLLECTION, customerId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error actualizando cliente:', error);
    throw error;
  }
}

/**
 * Eliminar cliente
 */
export async function deleteCustomer(customerId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, CUSTOMERS_COLLECTION, customerId));
  } catch (error) {
    console.error('Error eliminando cliente:', error);
    throw error;
  }
}

/**
 * Buscar clientes por término (nombre, documento, teléfono, email)
 */
export async function searchCustomers(
  storeId: string,
  searchTerm: string
): Promise<Customer[]> {
  const customers = await getCustomers(storeId);

  if (!searchTerm.trim()) {
    return customers;
  }

  const term = searchTerm.toLowerCase().trim();
  return customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(term) ||
      customer.document.toLowerCase().includes(term) ||
      customer.phone?.toLowerCase().includes(term) ||
      customer.email?.toLowerCase().includes(term)
  );
}

/**
 * Obtener historial de compras del cliente
 */
export async function getCustomerSalesHistory(
  storeId: string,
  customerId: string
): Promise<any[]> {
  try {
    const salesQuery = query(
      collection(db, SALES_COLLECTION),
      where('storeId', '==', storeId),
      where('customerId', '==', customerId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(salesQuery);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
      };
    });
  } catch (error) {
    console.error('Error obteniendo historial del cliente:', error);
    throw error;
  }
}

/**
 * Actualizar balance del cliente con cambio relativo
 * FIX BUG-109: Usa runTransaction para prevenir race conditions
 * @param customerId - ID del cliente
 * @param amountChange - Cambio relativo (positivo para cargo, negativo para abono)
 * @returns Nuevo balance después del cambio
 */
export async function updateCustomerBalance(
  customerId: string,
  amountChange: number
): Promise<number> {
  try {
    const newBalance = await runTransaction(db, async (transaction) => {
      const customerRef = doc(db, CUSTOMERS_COLLECTION, customerId);
      const customerDoc = await transaction.get(customerRef);

      if (!customerDoc.exists()) {
        throw new Error('Cliente no encontrado');
      }

      const currentBalance = customerDoc.data().balance || 0;
      const calculatedBalance = currentBalance + amountChange;

      if (calculatedBalance < 0) {
        throw new Error(
          `El balance no puede ser negativo. Balance actual: ${currentBalance}, cambio: ${amountChange}`
        );
      }

      transaction.update(customerRef, {
        balance: calculatedBalance,
        updatedAt: Timestamp.now(),
      });

      return calculatedBalance;
    });

    return newBalance;
  } catch (error: any) {
    console.error('Error actualizando balance del cliente:', error);
    throw new Error(error.message || 'Error al actualizar balance');
  }
}

/**
 * Obtener clientes con balance pendiente
 */
export async function getCustomersWithBalance(
  storeId: string
): Promise<Customer[]> {
  const customers = await getCustomers(storeId);
  return customers.filter((c) => c.balance > 0);
}
