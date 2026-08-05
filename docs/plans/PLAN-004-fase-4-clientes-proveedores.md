# PLAN-004: Fase 4 - Clientes y Proveedores

**Feature ID**: FEATURE-001-FASE-4  
**Fecha Creación**: 2026-08-05  
**Estimación Total**: 28 horas  
**Prioridad**: Alta  
**Dependencias**: Fase 3 (Inventario) completada

---

## 📋 Resumen Ejecutivo

Implementar gestión completa de **Clientes** y **Proveedores** con CRUD, historial de operaciones y vinculación con ventas/compras.

**Objetivos**:

- CRUD de clientes con datos de contacto y crédito
- CRUD de proveedores con control de deudas
- Historial de compras por cliente (desde sales)
- Historial de operaciones con proveedor (desde products/inventory movements)
- Integración con POS (seleccionar cliente en venta)
- Reportes básicos de clientes y proveedores

---

## 🏗️ Arquitectura de Datos

### Modelo: Customer

```typescript
interface Customer {
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

interface CustomerFormData {
  name: string;
  document: string;
  phone?: string;
  email?: string;
  address?: string;
  creditLimit?: number;
  notes?: string;
}
```

### Modelo: Supplier

```typescript
interface Supplier {
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

interface SupplierFormData {
  name: string;
  rif: string;
  phone?: string;
  email?: string;
  contactPerson?: string;
  notes?: string;
}
```

---

## 🔥 Firestore Collections

### customers

```javascript
{
  storeId: string,          // índice compuesto
  name: string,
  document: string,         // índice compuesto con storeId (unicidad)
  phone: string,
  email: string,
  address: string,
  creditLimit: number,
  balance: number,
  notes: string,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### suppliers

```javascript
{
  storeId: string,          // índice compuesto
  name: string,
  rif: string,              // índice compuesto con storeId (unicidad)
  phone: string,
  email: string,
  contactPerson: string,
  balance: number,
  notes: string,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

## 📝 Tareas de Implementación

### Tarea 1: Crear Tipos TypeScript (1h)

**Archivo**: `types/customer.ts`

```typescript
export interface Customer {
  id: string;
  storeId: string;
  name: string;
  document: string;
  phone?: string;
  email?: string;
  address?: string;
  creditLimit?: number;
  balance: number;
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
```

**Archivo**: `types/supplier.ts`

```typescript
export interface Supplier {
  id: string;
  storeId: string;
  name: string;
  rif: string;
  phone?: string;
  email?: string;
  contactPerson?: string;
  balance: number;
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
```

---

### Tarea 2: Servicios Firestore (4h)

**Archivo**: `lib/customers.ts`

```typescript
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

/**
 * Crear cliente
 */
export async function createCustomer(
  storeId: string,
  data: CustomerFormData
): Promise<Customer> {
  try {
    // Validar documento único
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
      balance: 0,
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
 * Obtener clientes por tienda
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
 * Buscar clientes por nombre o documento
 */
export async function searchCustomers(
  storeId: string,
  searchTerm: string
): Promise<Customer[]> {
  const customers = await getCustomers(storeId);

  const term = searchTerm.toLowerCase();
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
      collection(db, 'sales'),
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
```

**Archivo**: `lib/suppliers.ts` (similar a customers, adaptar campos)

```typescript
// Código similar a lib/customers.ts pero con campos de Supplier
// Funciones: createSupplier, getSuppliers, getSupplierById, updateSupplier, deleteSupplier, searchSuppliers
```

---

### Tarea 3: Store Zustand (1h)

**Archivo**: `store/customersStore.ts`

```typescript
import { create } from 'zustand';
import { Customer } from '@/types/customer';

interface CustomersState {
  customers: Customer[];
  loading: boolean;
  error: string | null;

  // Actions
  setCustomers: (customers: Customer[]) => void;
  addCustomer: (customer: Customer) => void;
  updateCustomer: (customerId: string, data: Partial<Customer>) => void;
  removeCustomer: (customerId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useCustomersStore = create<CustomersState>((set) => ({
  customers: [],
  loading: false,
  error: null,

  setCustomers: (customers) => set({ customers }),
  addCustomer: (customer) =>
    set((state) => ({ customers: [...state.customers, customer] })),
  updateCustomer: (customerId, data) =>
    set((state) => ({
      customers: state.customers.map((c) =>
        c.id === customerId ? { ...c, ...data } : c
      ),
    })),
  removeCustomer: (customerId) =>
    set((state) => ({
      customers: state.customers.filter((c) => c.id !== customerId),
    })),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  reset: () =>
    set({
      customers: [],
      loading: false,
      error: null,
    }),
}));
```

**Archivo**: `store/suppliersStore.ts` (similar)

---

### Tarea 4: Componente CustomerForm (2h)

**Archivo**: `components/customers/CustomerForm.tsx`

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CustomerFormData } from '@/types/customer';

const customerSchema = z.object({
  name: z.string().min(2, 'Nombre debe tener al menos 2 caracteres'),
  document: z.string().min(5, 'Documento requerido'),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  address: z.string().optional(),
  creditLimit: z.number().min(0).optional(),
  notes: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

interface CustomerFormProps {
  initialData?: CustomerFormData;
  onSubmit: (data: CustomerFormData) => Promise<void>;
  onCancel: () => void;
}

export default function CustomerForm({
  initialData,
  onSubmit,
  onCancel,
}: CustomerFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: initialData || {
      name: '',
      document: '',
      phone: '',
      email: '',
      address: '',
      creditLimit: 0,
      notes: '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Nombre *
          </label>
          <input
            {...register('name')}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        {/* Documento */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Documento (RIF/CI) *
          </label>
          <input
            {...register('document')}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
          />
          {errors.document && (
            <p className="mt-1 text-sm text-red-600">{errors.document.message}</p>
          )}
        </div>

        {/* Teléfono */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Teléfono
          </label>
          <input
            {...register('phone')}
            type="tel"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            {...register('email')}
            type="email"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        {/* Dirección */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            Dirección
          </label>
          <textarea
            {...register('address')}
            rows={2}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </div>

        {/* Límite de Crédito */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Límite de Crédito
          </label>
          <input
            {...register('creditLimit', { valueAsNumber: true })}
            type="number"
            min="0"
            step="0.01"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </div>

        {/* Notas */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            Notas
          </label>
          <textarea
            {...register('notes')}
            rows={3}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </div>
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-300"
        >
          {isSubmitting ? 'Guardando...' : initialData ? 'Actualizar' : 'Crear'}
        </button>
      </div>
    </form>
  );
}
```

---

### Tarea 5: Componente CustomersTable (2h)

**Archivo**: `components/customers/CustomersTable.tsx`

```typescript
'use client';

import { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table';
import { Customer } from '@/types/customer';
import { Search, Edit, Trash2, Eye } from 'lucide-react';

interface CustomersTableProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onDelete: (customerId: string) => void;
  onView: (customer: Customer) => void;
}

export default function CustomersTable({
  customers,
  onEdit,
  onDelete,
  onView,
}: CustomersTableProps) {
  const [globalFilter, setGlobalFilter] = useState('');

  const columns = useMemo<ColumnDef<Customer>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Nombre',
        cell: (info) => (
          <span className="font-medium text-gray-900">{info.getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'document',
        header: 'Documento',
      },
      {
        accessorKey: 'phone',
        header: 'Teléfono',
        cell: (info) => info.getValue() || '—',
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: (info) => info.getValue() || '—',
      },
      {
        accessorKey: 'balance',
        header: 'Por Cobrar',
        cell: (info) => {
          const balance = info.getValue() as number;
          return (
            <span className={balance > 0 ? 'text-orange-600 font-semibold' : ''}>
              ${balance.toFixed(2)}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Acciones',
        cell: ({ row }) => (
          <div className="flex gap-2">
            <button
              onClick={() => onView(row.original)}
              className="text-blue-600 hover:text-blue-800"
              title="Ver historial"
            >
              <Eye size={18} />
            </button>
            <button
              onClick={() => onEdit(row.original)}
              className="text-blue-600 hover:text-blue-800"
              title="Editar"
            >
              <Edit size={18} />
            </button>
            <button
              onClick={() => onDelete(row.original.id)}
              className="text-red-600 hover:text-red-800"
              title="Eliminar"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ),
      },
    ],
    [onEdit, onDelete, onView]
  );

  const table = useReactTable({
    data: customers,
    columns,
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <div className="space-y-4">
      {/* Búsqueda */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          size={20}
        />
        <input
          type="text"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Buscar clientes..."
          className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4"
        />
      </div>

      {/* Tabla */}
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-sm font-semibold text-gray-700"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 text-sm text-gray-900">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Mostrando {table.getRowModel().rows.length} de {customers.length}{' '}
          clientes
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="rounded bg-blue-600 px-3 py-1 text-sm text-white disabled:bg-gray-300"
          >
            Anterior
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="rounded bg-blue-600 px-3 py-1 text-sm text-white disabled:bg-gray-300"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

### Tarea 6: Componente SupplierForm (2h)

Similar a CustomerForm pero con campos de Supplier (rif, contactPerson en vez de creditLimit).

---

### Tarea 7: Componente SuppliersTable (2h)

Similar a CustomersTable.

---

### Tarea 8: Página de Clientes (3h)

**Archivo**: `app/dashboard/customers/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCustomersStore } from '@/store/customersStore';
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '@/lib/customers';
import { Customer, CustomerFormData } from '@/types/customer';
import CustomersTable from '@/components/customers/CustomersTable';
import CustomerForm from '@/components/customers/CustomerForm';
import { Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CustomersPage() {
  const { profile } = useAuth();
  const { customers, setCustomers, addCustomer, updateCustomer: updateCustomerStore, removeCustomer } = useCustomersStore();
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      if (!profile?.storeId) return;
      setLoading(true);
      const data = await getCustomers(profile.storeId);
      setCustomers(data);
    } catch (error) {
      toast.error('Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: CustomerFormData) => {
    try {
      if (!profile?.storeId) return;
      const newCustomer = await createCustomer(profile.storeId, data);
      addCustomer(newCustomer);
      toast.success('Cliente creado exitosamente');
      setShowForm(false);
    } catch (error: any) {
      toast.error(error.message || 'Error al crear cliente');
    }
  };

  const handleUpdate = async (data: CustomerFormData) => {
    try {
      if (!editingCustomer) return;
      await updateCustomer(editingCustomer.id, data);
      updateCustomerStore(editingCustomer.id, data);
      toast.success('Cliente actualizado exitosamente');
      setEditingCustomer(null);
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar cliente');
    }
  };

  const handleDelete = async (customerId: string) => {
    if (!confirm('¿Está seguro de eliminar este cliente?')) return;

    try {
      await deleteCustomer(customerId);
      removeCustomer(customerId);
      toast.success('Cliente eliminado');
    } catch (error) {
      toast.error('Error al eliminar cliente');
    }
  };

  const handleView = (customer: Customer) => {
    setViewingCustomer(customer);
    // Cargar historial de ventas del cliente
  };

  if (loading) {
    return <div className="p-6">Cargando clientes...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-gray-600">{customers.length} clientes registrados</p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingCustomer(null);
          }}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          {showForm || editingCustomer ? (
            <>
              <X size={20} />
              Cancelar
            </>
          ) : (
            <>
              <Plus size={20} />
              Nuevo Cliente
            </>
          )}
        </button>
      </div>

      {/* Formulario */}
      {(showForm || editingCustomer) && (
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">
            {editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}
          </h2>
          <CustomerForm
            initialData={editingCustomer || undefined}
            onSubmit={editingCustomer ? handleUpdate : handleCreate}
            onCancel={() => {
              setShowForm(false);
              setEditingCustomer(null);
            }}
          />
        </div>
      )}

      {/* Tabla */}
      <CustomersTable
        customers={customers}
        onEdit={(customer) => {
          setEditingCustomer(customer);
          setShowForm(false);
        }}
        onDelete={handleDelete}
        onView={handleView}
      />

      {/* Modal de Historial (TODO: implementar en siguiente iteración) */}
      {viewingCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full">
            <h2 className="text-xl font-bold mb-4">
              Historial de {viewingCustomer.name}
            </h2>
            <p className="text-gray-600">Historial de ventas próximamente...</p>
            <button
              onClick={() => setViewingCustomer(null)}
              className="mt-4 rounded-lg bg-gray-600 px-4 py-2 text-white"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

### Tarea 9: Página de Proveedores (3h)

Similar a CustomersPage pero con suppliers.

---

### Tarea 10: Actualizar Sidebar (1h)

**Archivo**: `components/layout/Sidebar.tsx`

Agregar items de menú:

```typescript
const menuItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/pos', icon: ShoppingCart, label: 'Punto de Venta' },
  { href: '/dashboard/products', icon: Package, label: 'Productos' },
  {
    label: 'Inventario',
    icon: PackageSearch,
    submenu: [
      { href: '/dashboard/inventory/movements', label: 'Movimientos' },
      { href: '/dashboard/inventory/kardex', label: 'Kardex' },
      { href: '/dashboard/inventory/valuation', label: 'Valorización' },
    ],
  },
  // ✅ NUEVO
  { href: '/dashboard/customers', icon: Users, label: 'Clientes' },
  { href: '/dashboard/suppliers', icon: TruckIcon, label: 'Proveedores' },
  { href: '/dashboard/reports', icon: BarChart3, label: 'Reportes' },
  { href: '/dashboard/settings', icon: Settings, label: 'Configuración' },
];
```

---

### Tarea 11: Integrar con POS (2h)

Modificar `app/dashboard/pos/page.tsx` para permitir seleccionar cliente opcional en venta.

**Cambios**:

```typescript
// Agregar state para cliente seleccionado
const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

// Cargar clientes
useEffect(() => {
  loadCustomers();
}, []);

// Dropdown de selección de cliente (opcional)
<div className="mb-4">
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Cliente (Opcional)
  </label>
  <select
    value={selectedCustomer?.id || ''}
    onChange={(e) => {
      const customer = customers.find((c) => c.id === e.target.value);
      setSelectedCustomer(customer || null);
    }}
    className="w-full rounded-lg border border-gray-300 px-3 py-2"
  >
    <option value="">Sin cliente (venta genérica)</option>
    {customers.map((customer) => (
      <option key={customer.id} value={customer.id}>
        {customer.name} - {customer.document}
      </option>
    ))}
  </select>
</div>

// Al procesar venta, incluir customerId
const sale = await processSale(profile.storeId, profile.id, {
  items: cartItems,
  currency,
  customerId: selectedCustomer?.id, // ✅ Opcional
});
```

---

### Tarea 12: Tests Manuales y Validación (2h)

- Crear cliente con todos los campos
- Validar unicidad de documento
- Editar cliente existente
- Eliminar cliente
- Buscar cliente en tabla
- Crear proveedor
- CRUD completo de proveedor
- Seleccionar cliente en POS
- Verificar que venta se asocia al cliente
- Validar que historial carga correctamente

---

## 📦 Firestore Indexes Requeridos

```javascript
// customers
{
  collectionGroup: "customers",
  queryScope: "COLLECTION",
  fields: [
    { fieldPath: "storeId", order: "ASCENDING" },
    { fieldPath: "name", order: "ASCENDING" }
  ]
}

{
  collectionGroup: "customers",
  queryScope: "COLLECTION",
  fields: [
    { fieldPath: "storeId", order: "ASCENDING" },
    { fieldPath: "document", order: "ASCENDING" }
  ]
}

// suppliers
{
  collectionGroup: "suppliers",
  queryScope: "COLLECTION",
  fields: [
    { fieldPath: "storeId", order: "ASCENDING" },
    { fieldPath: "name", order: "ASCENDING" }
  ]
}

{
  collectionGroup: "suppliers",
  queryScope: "COLLECTION",
  fields: [
    { fieldPath: "storeId", order: "ASCENDING" },
    { fieldPath: "rif", order: "ASCENDING" }
  ]
}

// sales (para historial de clientes)
{
  collectionGroup: "sales",
  queryScope: "COLLECTION",
  fields: [
    { fieldPath: "storeId", order: "ASCENDING" },
    { fieldPath: "customerId", order: "ASCENDING" },
    { fieldPath: "createdAt", order: "DESCENDING" }
  ]
}
```

---

## 🔒 Firestore Rules

```javascript
// Customers
match /customers/{customerId} {
  allow read: if request.auth != null &&
    resource.data.storeId == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.storeId;
  allow create: if request.auth != null &&
    request.resource.data.storeId == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.storeId;
  allow update: if request.auth != null &&
    resource.data.storeId == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.storeId;
  allow delete: if request.auth != null &&
    resource.data.storeId == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.storeId;
}

// Suppliers
match /suppliers/{supplierId} {
  allow read: if request.auth != null &&
    resource.data.storeId == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.storeId;
  allow create: if request.auth != null &&
    request.resource.data.storeId == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.storeId;
  allow update: if request.auth != null &&
    resource.data.storeId == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.storeId;
  allow delete: if request.auth != null &&
    resource.data.storeId == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.storeId;
}
```

---

## ⚠️ Consideraciones y Validaciones

### Validaciones Frontend

- Documento único por tienda
- Email válido (regex)
- Teléfono formato válido (opcional)
- creditLimit >= 0
- Nombre mínimo 2 caracteres

### Validaciones Backend

- Duplicado de documento en createCustomer
- StoreId siempre requerido
- Balance inicial siempre 0

### Edge Cases

- Cliente sin email/phone (campos opcionales)
- Eliminar cliente con historial de ventas (¿permitir?)
- Proveedor con productos asociados (¿bloquear eliminación?)
- Balance negativo (no permitido, siempre >= 0)

---

## 📊 Estimación de Tiempo

| Tarea      | Descripción         | Horas   |
| ---------- | ------------------- | ------- |
| 1          | Tipos TypeScript    | 1       |
| 2          | Servicios Firestore | 4       |
| 3          | Store Zustand       | 1       |
| 4          | CustomerForm        | 2       |
| 5          | CustomersTable      | 2       |
| 6          | SupplierForm        | 2       |
| 7          | SuppliersTable      | 2       |
| 8          | Página Clientes     | 3       |
| 9          | Página Proveedores  | 3       |
| 10         | Actualizar Sidebar  | 1       |
| 11         | Integrar POS        | 2       |
| 12         | Tests manuales      | 2       |
| **Buffer** | Imprevistos (15%)   | 3       |
| **TOTAL**  |                     | **28h** |

---

## ✅ Criterios de Aceptación

- [ ] Crear cliente con validación de documento único
- [ ] Listar clientes ordenados por nombre
- [ ] Editar cliente existente
- [ ] Eliminar cliente (con confirmación)
- [ ] Buscar clientes por nombre/documento/teléfono/email
- [ ] Crear proveedor con validación de RIF único
- [ ] Listar proveedores ordenados por nombre
- [ ] Editar proveedor existente
- [ ] Eliminar proveedor (con confirmación)
- [ ] Seleccionar cliente opcional en POS
- [ ] Venta asociada a cliente correctamente
- [ ] Historial de ventas por cliente (básico)
- [ ] Build exitoso sin errores TypeScript
- [ ] Responsive en desktop (1366x768+)

---

## 🚀 Siguientes Pasos (Fase 5)

Después de completar esta fase:

1. **Fase 5: Cuentas por Cobrar/Pagar**
   - Ventas a crédito
   - Registro de abonos
   - Saldos por cliente
   - Compras a crédito a proveedores
   - Pagos a proveedores

2. **Mejoras a Clientes/Proveedores (opcional)**
   - Exportar listado a Excel
   - Filtros avanzados (por balance, fecha registro)
   - Gráficos de clientes frecuentes
   - Tags/categorías de clientes

---

**Fecha Creación**: 2026-08-05  
**Autor**: @planificador  
**Aprobación**: Pendiente  
**Próximo Paso**: Implementación por @programador-senior
