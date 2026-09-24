'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePurchases } from '@/hooks/usePurchases';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { PurchasesTable } from '@/components/purchases/PurchasesTable';
import { PurchaseFilters } from '@/components/purchases/PurchaseFilters';
import { SidePanel } from '@/components/common/SidePanel';
import PurchaseForm from '@/components/purchases/PurchaseForm';
import { Loader2, ShoppingBag, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { Purchase } from '@/hooks/usePurchases';
import type { CreatePurchaseData } from '@/hooks/usePurchases';

interface Filters {
  startDate?: string;
  endDate?: string;
  supplierId?: string;
  status?: string;
  page: number;
  limit: number;
}

export default function PurchasesPage() {
  const { profile } = useAuth();
  const { getPurchases, createPurchase, loading } = usePurchases();
  const { activeRate } = useExchangeRates(profile?.storeId || '');
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1,
  });
  const today = new Date().toISOString().split('T')[0];
  const [filters, setFilters] = useState<Filters>({
    startDate: today,
    endDate: today,
    supplierId: '',
    status: '',
    page: 1,
    limit: 20,
  });

  const loadPurchases = async () => {
    if (!profile?.storeId) return;

    try {
      const response = await getPurchases({
        storeId: profile.storeId,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        supplierId: filters.supplierId || undefined,
        status: filters.status || undefined,
        page: filters.page,
        limit: filters.limit,
      });

      if (response) {
        setPurchases(response.purchases);
        setPagination(response.pagination);
      }
    } catch (error: any) {
      console.error('Error loading purchases:', error);
      toast.error(error.message || 'Error al cargar el historial de compras');
    }
  };

  useEffect(() => {
    if (profile?.storeId) {
      loadPurchases();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.storeId, filters]);

  const handleFiltersChange = (newFilters: Filters) => {
    setFilters(newFilters);
  };

  const handlePageChange = (newPage: number) => {
    setFilters({ ...filters, page: newPage });
  };

  const handleCreatePurchase = async (data: CreatePurchaseData) => {
    try {
      const purchase = await createPurchase(data);
      if (purchase) {
        toast.success(`Compra ${purchase.purchaseNumber} registrada exitosamente`);
        setShowForm(false);
        loadPurchases();
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al registrar la compra');
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
            <div className="bg-brand-primary-light text-brand-primary flex h-11 w-11 items-center justify-center rounded-xl">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                Compras
              </h1>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Registra y consulta las compras realizadas a proveedores.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-brand-primary hover:bg-brand-primary-dark flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nueva Compra
          </button>
        </div>
      </div>

      {/* Filtros */}
      <PurchaseFilters
        storeId={profile.storeId}
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

      {/* Tabla de compras */}
      {loading && purchases.length === 0 ? (
        <div className="text-brand-primary flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-12 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Loader2 className="mb-4 h-8 w-8 animate-spin" />
          <p className="text-gray-500 dark:text-slate-400">
            Cargando compras...
          </p>
        </div>
      ) : (
        <PurchasesTable
          purchases={purchases}
          pagination={pagination}
          onPageChange={handlePageChange}
          onRefresh={loadPurchases}
        />
      )}

      {/* Panel de nueva compra */}
      <SidePanel
        open={showForm}
        onClose={() => setShowForm(false)}
        title="Nueva Compra"
        subtitle="Registra una compra a proveedor y actualiza el inventario."
      >
        <PurchaseForm
          storeId={profile.storeId}
          exchangeRate={activeRate?.usdToVes || 0}
          onSubmit={handleCreatePurchase}
          onCancel={() => setShowForm(false)}
        />
      </SidePanel>
    </div>
  );
}
