/**
 * Página de Gestión de Clientes
 */

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCustomersStore } from '@/store/customersStore';
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerSalesHistory,
} from '@/lib/customers';
import { Customer, CustomerFormData } from '@/types/customer';
import CustomersTable from '@/components/customers/CustomersTable';
import CustomerForm from '@/components/customers/CustomerForm';
import {
  Plus,
  X,
  DollarSign,
  Users,
  AlertCircle,
  UserRound,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function CustomersPage() {
  const { profile } = useAuth();
  const {
    customers,
    setCustomers,
    addCustomer: addCustomerToStore,
    updateCustomer: updateCustomerInStore,
    removeCustomer,
  } = useCustomersStore();

  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [salesHistory, setSalesHistory] = useState<any[]>([]);

  useEffect(() => {
    loadCustomers();
  }, [profile?.storeId]);

  const loadCustomers = async () => {
    try {
      if (!profile?.storeId) return;
      setLoading(true);
      const data = await getCustomers(profile.storeId);
      setCustomers(data);
    } catch (error) {
      console.error('Error cargando clientes:', error);
      toast.error('Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: CustomerFormData) => {
    try {
      if (!profile?.storeId) return;
      const newCustomer = await createCustomer(profile.storeId, data);
      addCustomerToStore(newCustomer);
      toast.success('Cliente creado exitosamente');
      setShowForm(false);
    } catch (error: any) {
      console.error('Error creando cliente:', error);
      toast.error(error.message || 'Error al crear cliente');
    }
  };

  const handleUpdate = async (data: CustomerFormData) => {
    try {
      if (!editingCustomer) return;
      await updateCustomer(editingCustomer.id, data);
      updateCustomerInStore(editingCustomer.id, data);
      toast.success('Cliente actualizado exitosamente');
      setEditingCustomer(null);
    } catch (error: any) {
      console.error('Error actualizando cliente:', error);
      toast.error(error.message || 'Error al actualizar cliente');
    }
  };

  const handleDelete = async (customerId: string) => {
    try {
      await deleteCustomer(customerId);
      removeCustomer(customerId);
      toast.success('Cliente eliminado');
    } catch (error) {
      console.error('Error eliminando cliente:', error);
      toast.error('Error al eliminar cliente');
    }
  };

  const handleView = async (customer: Customer) => {
    try {
      if (!profile?.storeId) return;
      setViewingCustomer(customer);
      const history = await getCustomerSalesHistory(
        profile.storeId,
        customer.id
      );
      setSalesHistory(history.sales || []);
    } catch (error) {
      console.error('Error cargando historial:', error);
      toast.error('Error al cargar historial del cliente');
    }
  };

  // Estadísticas
  const stats = {
    total: customers.length,
    withBalance: customers.filter((c) => c.balance > 0).length,
    totalBalance: customers.reduce((sum, c) => sum + c.balance, 0),
  };

  if (loading) {
    return (
      <div className="min-h-screen space-y-6 bg-gray-50 p-6">
        <div className="animate-pulse rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="h-7 w-52 rounded bg-gray-200" />
          <div className="mt-3 h-4 w-80 rounded bg-gray-100" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-32 rounded-2xl border border-gray-200 bg-white shadow-sm" />
          <div className="h-32 rounded-2xl border border-gray-200 bg-white shadow-sm" />
          <div className="h-32 rounded-2xl border border-gray-200 bg-white shadow-sm" />
        </div>
        <div className="h-96 rounded-2xl border border-gray-200 bg-white shadow-sm" />
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6 bg-gray-50 p-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="bg-brand-primary-light text-brand-primary flex h-11 w-11 items-center justify-center rounded-xl">
              <UserRound className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
              <p className="text-sm text-gray-500">
                Gestiona datos de contacto, saldos pendientes e historial de
                compras.
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-600">
            {customers.length} clientes registrados
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingCustomer(null);
          }}
          className="bg-brand-primary hover:bg-brand-primary-dark inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-colors"
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

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-brand-primary-light rounded-xl p-3">
              <Users className="text-brand-primary" size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                Total Clientes
              </p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-100 p-3">
              <AlertCircle className="text-amber-700" size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                Con Saldo Pendiente
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.withBalance}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-green-100 p-3">
              <DollarSign className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                Total por Cobrar
              </p>
              <p className="text-2xl font-bold text-gray-900">
                ${stats.totalBalance.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Formulario */}
      {(showForm || editingCustomer) && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
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

      <CustomersTable
        customers={customers}
        onEdit={(customer) => {
          setEditingCustomer(customer);
          setShowForm(false);
        }}
        onDelete={handleDelete}
        onView={handleView}
      />

      {viewingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[85vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Historial de {viewingCustomer.name}
              </h2>
              <button
                onClick={() => {
                  setViewingCustomer(null);
                  setSalesHistory([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="mb-4 rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-gray-600">Documento</p>
                  <p className="font-medium">{viewingCustomer.document}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Balance Actual</p>
                  <p className="text-lg font-bold text-orange-600">
                    ${viewingCustomer.balance.toFixed(2)}
                  </p>
                </div>
                {viewingCustomer.phone && (
                  <div>
                    <p className="text-sm text-gray-600">Teléfono</p>
                    <p className="font-medium">{viewingCustomer.phone}</p>
                  </div>
                )}
                {viewingCustomer.email && (
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{viewingCustomer.email}</p>
                  </div>
                )}
              </div>
            </div>

            <h3 className="mb-3 text-lg font-semibold">Historial de Compras</h3>
            {salesHistory.length === 0 ? (
              <p className="py-8 text-center text-gray-500">
                Este cliente aún no ha realizado compras
              </p>
            ) : (
              <div className="space-y-2">
                {salesHistory.map((sale) => (
                  <div
                    key={sale.id}
                    className="rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Venta #{sale.saleNumber}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(sale.createdAt).toLocaleString('es-VE')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">
                          ${sale.total.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-600">{sale.currency}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setViewingCustomer(null);
                  setSalesHistory([]);
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
