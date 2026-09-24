'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePurchaseReturns } from '@/hooks/usePurchaseReturns';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { PurchaseReturnsTable } from '@/components/purchases/PurchaseReturnsTable';
import { SidePanel } from '@/components/common/SidePanel';
import PurchaseReturnForm from '@/components/purchases/PurchaseReturnForm';
import { Loader2, Undo2, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type {
  PurchaseReturn,
  CreatePurchaseReturnData,
} from '@/hooks/usePurchaseReturns';

export default function PurchaseReturnsPage() {
  const { profile } = useAuth();
  const { getPurchaseReturns, createPurchaseReturn, loading } =
    usePurchaseReturns();
  const { activeRate } = useExchangeRates(profile?.storeId || '');
  const [purchaseReturns, setPurchaseReturns] = useState<PurchaseReturn[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1,
  });

  const loadReturns = async (page: number) => {
    if (!profile?.storeId) return;

    try {
      const response = await getPurchaseReturns({
        storeId: profile.storeId,
        page,
        limit: pagination.limit,
      });

      if (response) {
        setPurchaseReturns(response.purchaseReturns);
        setPagination(response.pagination);
      }
    } catch (error: any) {
      console.error('Error loading purchase returns:', error);
      toast.error(
        error.message || 'Error al cargar las devoluciones de compra'
      );
    }
  };

  useEffect(() => {
    if (profile?.storeId) {
      loadReturns(pagination.page);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.storeId]);

  const handleCreateReturn = async (data: CreatePurchaseReturnData) => {
    try {
      const purchaseReturn = await createPurchaseReturn(data);
      if (purchaseReturn) {
        toast.success(
          `Devolución ${purchaseReturn.returnNumber} registrada exitosamente`
        );
        setShowForm(false);
        loadReturns(1);
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al registrar la devolución');
    }
  };

  if (!profile) {
    return (
      <div className="text-brand-primary flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6 bg-gray-50 p-6 dark:bg-slate-950">
      {/* Header */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
              <Undo2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                Devoluciones de Compras
              </h1>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Registra productos devueltos a proveedores y su acreditación.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-brand-primary hover:bg-brand-primary-dark flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nueva Devolución
          </button>
        </div>
      </div>

      {/* Tabla de devoluciones */}
      {loading && purchaseReturns.length === 0 ? (
        <div className="text-brand-primary flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-12 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Loader2 className="mb-4 h-8 w-8 animate-spin" />
          <p className="text-gray-500 dark:text-slate-400">
            Cargando devoluciones...
          </p>
        </div>
      ) : (
        <PurchaseReturnsTable
          purchaseReturns={purchaseReturns}
          pagination={pagination}
          onPageChange={loadReturns}
        />
      )}

      {/* Panel de nueva devolución */}
      <SidePanel
        open={showForm}
        onClose={() => setShowForm(false)}
        title="Nueva Devolución de Compra"
        subtitle="Devuelve productos a un proveedor y acredita el monto correspondiente."
      >
        <PurchaseReturnForm
          storeId={profile.storeId}
          exchangeRate={activeRate?.usdToVes || 0}
          onSubmit={handleCreateReturn}
          onCancel={() => setShowForm(false)}
        />
      </SidePanel>
    </div>
  );
}
