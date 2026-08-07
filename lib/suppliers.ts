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
  runTransaction,
} from 'firebase/firestore';
import { Supplier, SupplierFormData } from '@/types/supplier';

const SUPPLIERS_COLLECTION = 'suppliers';
const PRODUCTS_COLLECTION = 'products';

/**
 * Crear proveedor
 * FIX BUG-108: Usa runTransaction para validación atómica
 * FIX BUG-111: Normaliza RIF a uppercase para unicidad case-insensitive
 */
export async function createSupplier(
  storeId: string,
  data: SupplierFormData
): Promise<Supplier> {
  try {
    // Normalizar RIF a uppercase para unicidad case-insensitive
    const normalizedRif = data.rif.toUpperCase().trim();

    // Usar transaction para garantizar atomicidad (validación + creación)
    const newSupplierId = await runTransaction(db, async (transaction) => {
      // Validar unicidad DENTRO de la transaction
      const existingQuery = query(
        collection(db, SUPPLIERS_COLLECTION),
        where('storeId', '==', storeId),
        where('rif', '==', normalizedRif)
      );

      const existing = await getDocs(existingQuery);

      if (!existing.empty) {
        throw new Error(`Ya existe un proveedor con RIF ${normalizedRif}`);
      }

      // Crear documento dentro de la transaction
      const supplierData = {
        storeId,
        ...data,
        rif: normalizedRif, // Guardar normalizado
        balance: 0, // Balance inicial siempre 0
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const newDocRef = doc(collection(db, SUPPLIERS_COLLECTION));
      transaction.set(newDocRef, supplierData);

      return newDocRef.id;
    });

    // Obtener el proveedor recién creado
    const createdSupplier = await getSupplierById(newSupplierId);
    if (!createdSupplier) {
      throw new Error('Error al obtener proveedor creado');
    }

    return createdSupplier;
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
/**
 * Actualizar balance del proveedor con cambio relativo
 * FIX BUG-109: Usa runTransaction para prevenir race conditions
 * @param supplierId - ID del proveedor
 * @param amountChange - Cambio relativo (positivo para cargo, negativo para abono)
 * @returns Nuevo balance después del cambio
 */
export async function updateSupplierBalance(
  supplierId: string,
  amountChange: number
): Promise<number> {
  try {
    const newBalance = await runTransaction(db, async (transaction) => {
      const supplierRef = doc(db, SUPPLIERS_COLLECTION, supplierId);
      const supplierDoc = await transaction.get(supplierRef);

      if (!supplierDoc.exists()) {
        throw new Error('Proveedor no encontrado');
      }

      const currentBalance = supplierDoc.data().balance || 0;
      const calculatedBalance = currentBalance + amountChange;

      if (calculatedBalance < 0) {
        throw new Error(
          `El balance no puede ser negativo. Balance actual: ${currentBalance}, cambio: ${amountChange}`
        );
      }

      transaction.update(supplierRef, {
        balance: calculatedBalance,
        updatedAt: Timestamp.now(),
      });

      return calculatedBalance;
    });

    return newBalance;
  } catch (error: any) {
    console.error('Error actualizando balance del proveedor:', error);
    throw new Error(error.message || 'Error al actualizar balance');
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
