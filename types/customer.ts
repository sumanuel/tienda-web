/**
 * Customer (Cliente) - Gestión de clientes con historial de compras
 */

export interface Customer {
  id: string;
  storeId: string;
  name: string;
  document: string; // RIF, CI, DNI
  phone?: string;
  email?: string;
  address?: string;
  creditLimit?: number; // Límite de crédito permitido
  balance: number; // Por cobrar (ventas a crédito - pagos)
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerFormData {
  name: string;
  document: string;
  phone?: string;
  email?: string;
  address?: string;
  creditLimit?: number;
  notes?: string;
}
