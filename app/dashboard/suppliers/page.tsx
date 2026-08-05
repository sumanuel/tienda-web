/**
 * Página de Gestión de Proveedores
 */

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
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
import { Plus, X, DollarSign, TruckIcon, Package } from 'lucide-react';
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
      const products = await getSupplierProducts(profile.storeId, supplier.id);
      setSupplierProducts(products);
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="text-gray-600">Cargando proveedores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Proveedores</h1>
          <p className="text-gray-600">{suppliers.length} proveedores registrados</p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingSupplier(null);
          }}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
        >
          {showForm || editingSupplier ? (
            <>
              <X size={20} />
              Cancelar
            </>
          ) : (
            <>
              <Plus size={20} />
              Nuevo Proveedor
            </>
          )}
        </button>
      </div>

      {/* Estadísticas */}
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-100 p-3">
              <TruckIcon className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Proveedores</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-orange-100 p-3">
              <DollarSign className="text-orange-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Con Saldo Pendiente</p>
              <p className="text-2xl font-bold text-gray-900">{stats.withBalance}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-red-100 p-3">
              <DollarSign className="text-red-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total por Pagar</p>
              <p className="text-2xl font-bold text-gray-900">
                ${stats.totalBalance.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Formulario */}
      {(showForm || editingSupplier) && (
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            {editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
          </h2>
          <SupplierForm
            initialData={editingSupplier || undefined}
            onSubmit={editingSupplier ? handleUpdate : handleCreate}
            onCancel={() => {
              setShowForm(false);
              setEditingSupplier(null);
            }}
          />
        </div>
      )}

      {/* Tabla */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <SuppliersTable
          suppliers={suppliers}
          onEdit={(supplier) => {
            setEditingSupplier(supplier);
            setShowForm(false);
          }}
          onDelete={handleDelete}
          onView={handleView}
        />
      </div>

      {/* Modal de Productos */}
      {viewingSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="max-h-[80vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Productos de {viewingSupplier.name}
              </h2>
              <button
                onClick={() => {
                  setViewingSupplier(null);
                  setSupplierProducts([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="mb-4 rounded-lg bg-gray-50 p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">RIF/NIT</p>
                  <p className="font-medium">{viewingSupplier.rif}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Balance Actual</p>
                  <p className="text-lg font-bold text-red-600">
                    ${viewingSupplier.balance.toFixed(2)}
                  </p>
                </div>
                {viewingSupplier.contactPerson && (
                  <div>
                    <p className="text-sm text-gray-600">Contacto</p>
                    <p className="font-medium">{viewingSupplier.contactPerson}</p>
                  </div>
                )}
                {viewingSupplier.phone && (
                  <div>
                    <p className="text-sm text-gray-600">Teléfono</p>
                    <p className="font-medium">{viewingSupplier.phone}</p>
                  </div>
                )}
              </div>
            </div>

            <h3 className="mb-3 text-lg font-semibold flex items-center gap-2">
              <Package size={20} />
              Productos Asociados
            </h3>
            {supplierProducts.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No hay productos asociados a este proveedor
              </p>
            ) : (
              <div className="space-y-2">
                {supplierProducts.map((product) => (
                  <div
                    key={product.id}
                    className="rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-gray-600">
                          Código: {product.code} | Stock: {product.stock}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">
                          ${product.prices?.USD?.toFixed(2) || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-600">{product.category}</p>
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
                className="rounded-lg bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
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
