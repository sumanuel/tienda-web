/**
 * Página de Gestión de Proveedores
 */

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { useSuppliersStore } from '@/store/suppliersStore';
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getSupplierProducts,
} from '@/lib/suppliers';
import { Supplier, SupplierFormData } from '@/types/supplier';
import SuppliersTable from '@/components/suppliers/SuppliersTable';
import SupplierForm from '@/components/suppliers/SupplierForm';
import { SidePanel } from '@/components/common/SidePanel';
import { DualCurrency } from '@/components/common/DualCurrency';
import {
  Plus,
  X,
  DollarSign,
  TruckIcon,
  Package,
  BadgeDollarSign,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function SuppliersPage() {
  const { profile } = useAuth();
  const {
    suppliers,
    setSuppliers,
    addSupplier: addSupplierToStore,
    updateSupplier: updateSupplierInStore,
    removeSupplier,
  } = useSuppliersStore();
  const { activeRate } = useExchangeRates(profile?.storeId || '');
  const exchangeRate = activeRate?.usdToVes;

  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [viewingSupplier, setViewingSupplier] = useState<Supplier | null>(null);
  const [supplierProducts, setSupplierProducts] = useState<any[]>([]);

  useEffect(() => {
    loadSuppliers();
  }, [profile?.storeId]);

  const loadSuppliers = async () => {
    try {
      if (!profile?.storeId) return;
      setLoading(true);
      const data = await getSuppliers(profile.storeId);
      setSuppliers(data);
    } catch (error) {
      console.error('Error cargando proveedores:', error);
      toast.error('Error al cargar proveedores');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: SupplierFormData) => {
    try {
      if (!profile?.storeId) return;
      const newSupplier = await createSupplier(profile.storeId, data);
      addSupplierToStore(newSupplier);
      toast.success('Proveedor creado exitosamente');
      setShowForm(false);
    } catch (error: any) {
      console.error('Error creando proveedor:', error);
      toast.error(error.message || 'Error al crear proveedor');
    }
  };

  const handleUpdate = async (data: SupplierFormData) => {
    try {
      if (!editingSupplier) return;
      await updateSupplier(editingSupplier.id, data);
      updateSupplierInStore(editingSupplier.id, data);
      toast.success('Proveedor actualizado exitosamente');
      setEditingSupplier(null);
    } catch (error: any) {
      console.error('Error actualizando proveedor:', error);
      toast.error(error.message || 'Error al actualizar proveedor');
    }
  };

  const handleDelete = async (supplierId: string) => {
    try {
      await deleteSupplier(supplierId);
      removeSupplier(supplierId);
      toast.success('Proveedor eliminado');
    } catch (error) {
      console.error('Error eliminando proveedor:', error);
      toast.error('Error al eliminar proveedor');
    }
  };

  const handleView = async (supplier: Supplier) => {
    try {
      if (!profile?.storeId) return;
      setViewingSupplier(supplier);
      const productsData = await getSupplierProducts(
        profile.storeId,
        supplier.id
      );
      setSupplierProducts(productsData.products || []);
    } catch (error) {
      console.error('Error cargando productos del proveedor:', error);
      toast.error('Error al cargar productos del proveedor');
    }
  };

  // Estadísticas
  const stats = {
    total: suppliers.length,
    withBalance: suppliers.filter((s) => s.balance > 0).length,
    totalBalance: suppliers.reduce((sum, s) => sum + s.balance, 0),
  };

  if (loading) {
    return (
      <div className="min-h-screen space-y-6 bg-gray-50 p-6 dark:bg-slate-950">
        <div className="animate-pulse rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="h-7 w-52 rounded bg-gray-200 dark:bg-slate-700" />
          <div className="mt-3 h-4 w-80 rounded bg-gray-100 dark:bg-slate-800" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-32 rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900" />
          <div className="h-32 rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900" />
          <div className="h-32 rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900" />
        </div>
        <div className="h-96 rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900" />
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6 bg-gray-50 p-6 dark:bg-slate-950">
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between dark:border-slate-800 dark:bg-slate-900">
        <div>
          <div className="flex items-center gap-3">
            <div className="bg-brand-primary-light text-brand-primary flex h-11 w-11 items-center justify-center rounded-xl">
              <TruckIcon className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                Proveedores
              </h1>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Controla contactos, productos asociados y compromisos de pago.
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-600 dark:text-slate-400">
            {suppliers.length} proveedores registrados
          </p>
        </div>
        <button
          onClick={() => {
            setEditingSupplier(null);
            setShowForm(true);
          }}
          className="bg-brand-primary hover:bg-brand-primary-dark inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-colors"
        >
          <Plus size={20} />
          Nuevo Proveedor
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="bg-brand-primary-light rounded-xl p-3">
              <TruckIcon className="text-brand-primary" size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-slate-400">
                Total Proveedores
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                {stats.total}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-100 p-3 dark:bg-amber-950">
              <BadgeDollarSign
                className="text-amber-700 dark:text-amber-400"
                size={24}
              />
            </div>
            <div>
              <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-slate-400">
                Con Saldo Pendiente
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                {stats.withBalance}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-red-100 p-3 dark:bg-red-950">
              <DollarSign
                className="text-red-600 dark:text-red-400"
                size={24}
              />
            </div>
            <div>
              <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-slate-400">
                Total por Pagar
              </p>
              <DualCurrency
                usd={stats.totalBalance}
                exchangeRate={exchangeRate}
                size="lg"
                align="left"
              />
            </div>
          </div>
        </div>
      </div>

      <SidePanel
        open={showForm || !!editingSupplier}
        onClose={() => {
          setShowForm(false);
          setEditingSupplier(null);
        }}
        title={editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
        subtitle={
          editingSupplier
            ? `Actualiza los datos de ${editingSupplier.name}.`
            : 'Registra un nuevo proveedor en tu directorio.'
        }
      >
        <SupplierForm
          initialData={editingSupplier || undefined}
          onSubmit={editingSupplier ? handleUpdate : handleCreate}
          onCancel={() => {
            setShowForm(false);
            setEditingSupplier(null);
          }}
        />
      </SidePanel>

      <SuppliersTable
        suppliers={suppliers}
        onEdit={(supplier) => {
          setEditingSupplier(supplier);
          setShowForm(false);
        }}
        onDelete={handleDelete}
        onView={handleView}
        exchangeRate={exchangeRate}
      />

      {viewingSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[85vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
                Productos de {viewingSupplier.name}
              </h2>
              <button
                onClick={() => {
                  setViewingSupplier(null);
                  setSupplierProducts([]);
                }}
                className="text-gray-400 hover:text-gray-600 dark:text-slate-400 dark:text-slate-500 dark:hover:text-slate-300"
              >
                <X size={24} />
              </button>
            </div>

            <div className="mb-4 rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-slate-800 dark:bg-slate-950">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-gray-600 dark:text-slate-400">
                    RIF/NIT
                  </p>
                  <p className="font-medium">{viewingSupplier.rif}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-slate-400">
                    Balance Actual
                  </p>
                  <DualCurrency
                    usd={viewingSupplier.balance}
                    exchangeRate={exchangeRate}
                    primaryClassName="text-red-600 dark:text-red-400"
                    align="left"
                  />
                </div>
                {viewingSupplier.contactPerson && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-slate-400">
                      Contacto
                    </p>
                    <p className="font-medium">
                      {viewingSupplier.contactPerson}
                    </p>
                  </div>
                )}
                {viewingSupplier.phone && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-slate-400">
                      Teléfono
                    </p>
                    <p className="font-medium">{viewingSupplier.phone}</p>
                  </div>
                )}
              </div>
            </div>

            <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-slate-100">
              <Package size={20} />
              Productos Asociados
            </h3>
            {supplierProducts.length === 0 ? (
              <p className="py-8 text-center text-gray-500 dark:text-slate-400">
                No hay productos asociados a este proveedor
              </p>
            ) : (
              <div className="space-y-3">
                {supplierProducts.map((product) => (
                  <div
                    key={product.id}
                    className="rounded-2xl border border-gray-200 p-4 transition-colors hover:bg-gray-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-800"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-gray-600 dark:text-slate-400">
                          Código: {product.code} | Stock: {product.stock}
                        </p>
                      </div>
                      <div className="text-right">
                        {product.prices?.USD ? (
                          <DualCurrency
                            usd={product.prices.USD}
                            exchangeRate={exchangeRate}
                          />
                        ) : (
                          <p className="text-lg font-bold">N/A</p>
                        )}
                        <p className="text-sm text-gray-600 dark:text-slate-400">
                          {product.category}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setViewingSupplier(null);
                  setSupplierProducts([]);
                }}
                className="rounded-xl bg-gray-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 dark:bg-slate-700 dark:hover:bg-slate-600"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
