/**
 * Servicio de Proveedores - CRUD y operaciones de negocio
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
import { Supplier, SupplierFormData } from '@/types/supplier';

const SUPPLIERS_COLLECTION = 'suppliers';
const PRODUCTS_COLLECTION = 'products';

/**
 * Crear proveedor
 */
export async function createSupplier(
  storeId: string,
  data: SupplierFormData
): Promise<Supplier> {
  try {
    // Validar RIF único por tienda
    const existing = await getDocs(
      query(
        collection(db, SUPPLIERS_COLLECTION),
        where('storeId', '==', storeId),
        where('rif', '==', data.rif)
      )
    );

    if (!existing.empty) {
      throw new Error(`Ya existe un proveedor con RIF ${data.rif}`);
    }

    const supplierData = {
      storeId,
      ...data,
      balance: 0, // Balance inicial siempre 0
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(
      collection(db, SUPPLIERS_COLLECTION),
      supplierData
    );

    return {
      id: docRef.id,
      ...supplierData,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Supplier;
  } catch (error: any) {
    console.error('Error creando proveedor:', error);
    throw new Error(error.message || 'Error al crear proveedor');
  }
}

/**
 * Obtener todos los proveedores de una tienda
 */
export async function getSuppliers(storeId: string): Promise<Supplier[]> {
  try {
    const q = query(
      collection(db, SUPPLIERS_COLLECTION),
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
      } as Supplier;
    });
  } catch (error) {
    console.error('Error obteniendo proveedores:', error);
    throw error;
  }
}

/**
 * Obtener proveedor por ID
 */
export async function getSupplierById(
  supplierId: string
): Promise<Supplier | null> {
  try {
    const docRef = doc(db, SUPPLIERS_COLLECTION, supplierId);
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
    } as Supplier;
  } catch (error) {
    console.error('Error obteniendo proveedor:', error);
    throw error;
  }
}

/**
 * Actualizar proveedor
 */
export async function updateSupplier(
  supplierId: string,
  data: Partial<SupplierFormData>
): Promise<void> {
  try {
    const docRef = doc(db, SUPPLIERS_COLLECTION, supplierId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error actualizando proveedor:', error);
    throw error;
  }
}

/**
 * Eliminar proveedor
 */
export async function deleteSupplier(supplierId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, SUPPLIERS_COLLECTION, supplierId));
  } catch (error) {
    console.error('Error eliminando proveedor:', error);
    throw error;
  }
}

/**
 * Buscar proveedores por término (nombre, RIF, contacto)
 */
export async function searchSuppliers(
  storeId: string,
  searchTerm: string
): Promise<Supplier[]> {
  const suppliers = await getSuppliers(storeId);

  if (!searchTerm.trim()) {
    return suppliers;
  }

  const term = searchTerm.toLowerCase().trim();
  return suppliers.filter(
    (supplier) =>
      supplier.name.toLowerCase().includes(term) ||
      supplier.rif.toLowerCase().includes(term) ||
      supplier.phone?.toLowerCase().includes(term) ||
      supplier.email?.toLowerCase().includes(term) ||
      supplier.contactPerson?.toLowerCase().includes(term)
  );
}

/**
 * Obtener productos asociados a un proveedor
 */
export async function getSupplierProducts(
  storeId: string,
  supplierId: string
): Promise<any[]> {
  try {
    const productsQuery = query(
      collection(db, PRODUCTS_COLLECTION),
      where('storeId', '==', storeId),
      where('supplierId', '==', supplierId),
      orderBy('name', 'asc')
    );

    const snapshot = await getDocs(productsQuery);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error obteniendo productos del proveedor:', error);
    throw error;
  }
}

/**
 * Actualizar balance del proveedor
 */
export async function updateSupplierBalance(
  supplierId: string,
  newBalance: number
): Promise<void> {
  try {
    if (newBalance < 0) {
      throw new Error('El balance no puede ser negativo');
    }

    const docRef = doc(db, SUPPLIERS_COLLECTION, supplierId);
    await updateDoc(docRef, {
      balance: newBalance,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error actualizando balance del proveedor:', error);
    throw error;
  }
}

/**
 * Obtener proveedores con balance pendiente
 */
export async function getSuppliersWithBalance(
  storeId: string
): Promise<Supplier[]> {
  const suppliers = await getSuppliers(storeId);
  return suppliers.filter((s) => s.balance > 0);
}
