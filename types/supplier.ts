/**
 * Supplier (Proveedor) - Gestión de proveedores con control de compras
 */

export interface Supplier {
  id: string;
  storeId: string;
  name: string;
  rif: string; // RIF o NIT
  phone?: string;
  email?: string;
  contactPerson?: string; // Nombre del contacto
  balance: number; // Por pagar (compras a crédito - pagos)
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SupplierFormData {
  name: string;
  rif: string;
  phone?: string;
  email?: string;
  contactPerson?: string;
  notes?: string;
}
