/**
 * Servicio de Clientes - Migrado a PostgreSQL
 */

import { apiClient } from '@/lib/api';
import type { Customer, CustomerFormData } from '@/types/customer';

/**
 * Crear cliente
 */
export async function createCustomer(
  storeId: string,
  data: CustomerFormData
): Promise<Customer> {
  try {
    const response = await apiClient.createCustomer({
      storeId,
      name: data.name,
      email: data.email || undefined,
      phone: data.phone || undefined,
      taxId: data.document || undefined, // document → taxId
      address: data.address || undefined,
    });

    return {
      id: response.customer.id,
      storeId: response.customer.storeId,
      name: response.customer.name,
      email: response.customer.email || '',
      phone: response.customer.phone || '',
      document: response.customer.taxId || '', // taxId → document
      address: response.customer.address || '',
      balance: response.customer.balance,
      createdAt: new Date(response.customer.createdAt),
      updatedAt: new Date(response.customer.updatedAt),
    };
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
    const response = await apiClient.getCustomers({ storeId, limit: 1000 });

    return response.customers.map((customer) => ({
      id: customer.id,
      storeId: customer.storeId,
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      document: customer.taxId || '', // taxId → document
      address: customer.address || '',
      balance: customer.balance,
      createdAt: new Date(customer.createdAt),
      updatedAt: new Date(customer.updatedAt),
    }));
  } catch (error: any) {
    console.error('Error obteniendo clientes:', error);
    throw new Error('Error al obtener clientes');
  }
}

/**
 * Obtener cliente por ID
 */
export async function getCustomerById(id: string): Promise<Customer | null> {
  try {
    const response = await apiClient.getCustomer(id);

    return {
      id: response.customer.id,
      storeId: response.customer.storeId,
      name: response.customer.name,
      email: response.customer.email || '',
      phone: response.customer.phone || '',
      document: response.customer.taxId || '', // taxId → document
      address: response.customer.address || '',
      balance: response.customer.balance,
      createdAt: new Date(response.customer.createdAt),
      updatedAt: new Date(response.customer.updatedAt),
    };
  } catch (error: any) {
    console.error('Error obteniendo cliente:', error);
    return null;
  }
}

/**
 * Actualizar cliente
 */
export async function updateCustomer(
  id: string,
  data: Partial<CustomerFormData>
): Promise<void> {
  try {
    await apiClient.updateCustomer(id, {
      name: data.name,
      email: data.email || undefined,
      phone: data.phone || undefined,
      taxId: data.document || undefined, // document → taxId
      address: data.address || undefined,
    });
  } catch (error: any) {
    console.error('Error actualizando cliente:', error);
    throw new Error(error.message || 'Error al actualizar cliente');
  }
}

/**
 * Eliminar cliente
 */
export async function deleteCustomer(id: string): Promise<void> {
  try {
    await apiClient.deleteCustomer(id);
  } catch (error: any) {
    console.error('Error eliminando cliente:', error);
    throw new Error(error.message || 'Error al eliminar cliente');
  }
}

/**
 * Actualizar balance del cliente (legacy - ya no se usa directamente)
 * El balance se actualiza automáticamente a través de transacciones
 */
export async function updateCustomerBalance(
  customerId: string,
  amount: number
): Promise<void> {
  // No-op: El balance se calcula automáticamente en el backend
  console.warn(
    'updateCustomerBalance es legacy - usar transacciones en su lugar'
  );
}
