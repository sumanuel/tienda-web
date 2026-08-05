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
} from 'firebase/firestore';
import { Customer, CustomerFormData } from '@/types/customer';

const CUSTOMERS_COLLECTION = 'customers';
const SALES_COLLECTION = 'sales';

/**
 * Crear cliente
 */
export async function createCustomer(
  storeId: string,
  data: CustomerFormData
): Promise<Customer> {
  try {
    // Validar documento único por tienda
    const existing = await getDocs(
      query(
        collection(db, CUSTOMERS_COLLECTION),
        where('storeId', '==', storeId),
        where('document', '==', data.document)
      )
    );

    if (!existing.empty) {
      throw new Error(`Ya existe un cliente con documento ${data.document}`);
    }

    const customerData = {
      storeId,
      ...data,
      balance: 0, // Balance inicial siempre 0
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(
      collection(db, CUSTOMERS_COLLECTION),
      customerData
    );

    return {
      id: docRef.id,
      ...customerData,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Customer;
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
 * Actualizar balance del cliente
 */
export async function updateCustomerBalance(
  customerId: string,
  newBalance: number
): Promise<void> {
  try {
    if (newBalance < 0) {
      throw new Error('El balance no puede ser negativo');
    }

    const docRef = doc(db, CUSTOMERS_COLLECTION, customerId);
    await updateDoc(docRef, {
      balance: newBalance,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error actualizando balance del cliente:', error);
    throw error;
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
