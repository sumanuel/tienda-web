/**
 * Servicio de Proveedores - Migrado a PostgreSQL
 */

import { apiClient } from '@/lib/api';
import type { Supplier, SupplierFormData } from '@/types/supplier';

/**
 * Crear proveedor
 */
export async function createSupplier(
  storeId: string,
  data: SupplierFormData
): Promise<Supplier> {
  try {
    const response = await apiClient.createSupplier({
      storeId,
      name: data.name,
      email: data.email || undefined,
      phone: data.phone || undefined,
      taxId: data.rif || undefined, // rif → taxId
      address: data.address || undefined,
    });

    return {
      id: response.supplier.id,
      storeId: response.supplier.storeId,
      name: response.supplier.name,
      email: response.supplier.email || '',
      phone: response.supplier.phone || '',
      rif: response.supplier.taxId || '', // taxId → rif
      address: response.supplier.address || '',
      balance: response.supplier.balance,
      createdAt: new Date(response.supplier.createdAt),
      updatedAt: new Date(response.supplier.updatedAt),
    };
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
    const response = await apiClient.getSuppliers({ storeId, limit: 1000 });

    return response.suppliers.map((supplier) => ({
      id: supplier.id,
      storeId: supplier.storeId,
      name: supplier.name,
      email: supplier.email || '',
      phone: supplier.phone || '',
      rif: supplier.taxId || '', // taxId → rif
      address: supplier.address || '',
      balance: supplier.balance,
      createdAt: new Date(supplier.createdAt),
      updatedAt: new Date(supplier.updatedAt),
    }));
  } catch (error: any) {
    console.error('Error obteniendo proveedores:', error);
    throw new Error('Error al obtener proveedores');
  }
}

/**
 * Obtener proveedor por ID
 */
export async function getSupplierById(id: string): Promise<Supplier | null> {
  try {
    const response = await apiClient.getSupplier(id);

    return {
      id: response.supplier.id,
      storeId: response.supplier.storeId,
      name: response.supplier.name,
      email: response.supplier.email || '',
      phone: response.supplier.phone || '',
      rif: response.supplier.taxId || '', // taxId → rif
      address: response.supplier.address || '',
      balance: response.supplier.balance,
      createdAt: new Date(response.supplier.createdAt),
      updatedAt: new Date(response.supplier.updatedAt),
    };
  } catch (error: any) {
    console.error('Error obteniendo proveedor:', error);
    return null;
  }
}

/**
 * Actualizar proveedor
 */
export async function updateSupplier(
  id: string,
  data: Partial<SupplierFormData>
): Promise<void> {
  try {
    await apiClient.updateSupplier(id, {
      name: data.name,
      email: data.email || undefined,
      phone: data.phone || undefined,
      taxId: data.rif || undefined, // rif → taxId
      address: data.address || undefined,
    });
  } catch (error: any) {
    console.error('Error actualizando proveedor:', error);
    throw new Error(error.message || 'Error al actualizar proveedor');
  }
}

/**
 * Eliminar proveedor
 */
export async function deleteSupplier(id: string): Promise<void> {
  try {
    await apiClient.deleteSupplier(id);
  } catch (error: any) {
    console.error('Error eliminando proveedor:', error);
    throw new Error(error.message || 'Error al eliminar proveedor');
  }
}

/**
 * Actualizar balance del proveedor (legacy - ya no se usa directamente)
 * El balance se actualiza automáticamente a través de transacciones
 */
export async function updateSupplierBalance(
  supplierId: string,
  amount: number
): Promise<void> {
  // No-op: El balance se calcula automáticamente en el backend
  console.warn(
    'updateSupplierBalance es legacy - usar transacciones en su lugar'
  );
}

/**
 * Obtener productos asociados a un proveedor
 */
export async function getSupplierProducts(storeId: string, supplierId: string) {
  try {
    const response = await apiClient.request<{
      products: any[];
      supplierId: string;
      note?: string;
    }>(`/suppliers/${supplierId}/products`);

    const products = response.products.map((product) => ({
      id: product.id,
      storeId: product.storeId || storeId,
      code: product.sku || '',
      barcode: product.barcode,
      name: product.name,
      category: product.category,
      cost: product.cost,
      prices: {
        VES: product.priceVES || 0,
        USD: product.priceUSD || product.price || 0,
      },
      stock: product.stock,
      minStock: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    return {
      products,
      totalProducts: products.length,
    };
  } catch (error: any) {
    console.error('Error obteniendo productos del proveedor:', error);
    throw new Error('Error al obtener productos del proveedor');
  }
}

/**
 * Obtener proveedores con balance pendiente
 */
export async function getSuppliersWithBalance(storeId: string) {
  try {
    const response = await apiClient.getSuppliers({ storeId, limit: 1000 });

    return response.suppliers
      .filter((supplier) => supplier.balance > 0)
      .map((supplier) => ({
        id: supplier.id,
        storeId: supplier.storeId,
        name: supplier.name,
        email: supplier.email || '',
        phone: supplier.phone || '',
        rif: supplier.taxId || '',
        address: supplier.address || '',
        balance: supplier.balance,
        createdAt: new Date(supplier.createdAt),
        updatedAt: new Date(supplier.updatedAt),
      }));
  } catch (error: any) {
    console.error('Error obteniendo proveedores con balance:', error);
    throw new Error('Error al obtener proveedores con balance');
  }
}
