'use client';

import { useState, useEffect } from 'react';
import { todayLocal } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useSales } from '@/hooks/useSales';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { getSalesStats, type SalesStats } from '@/lib/salesStats';
import { DualCurrency } from '@/components/common/DualCurrency';
import { SalesTable } from '@/components/sales/SalesTable';
import { SalesFilters } from '@/components/sales/SalesFilters';
import { Loader2, Receipt } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { Sale, SalesResponse } from '@/hooks/useSales';

interface Filters {
  startDate?: string;
  endDate?: string;
  customerId?: string;
  paymentMethod?: string;
  status?: string;
  page: number;
  limit: number;
}

export default function SalesPage() {
  const { profile } = useAuth();
  const { getSales, loading } = useSales();
  const { activeRate } = useExchangeRates(profile?.storeId || '');
  const exchangeRate = activeRate?.usdToVes;
  const [stats, setStats] = useState<SalesStats | null>(null);
  const [statsNonce, setStatsNonce] = useState(0);
  const [sales, setSales] = useState<Sale[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1,
  });
  const today = todayLocal();
  const [filters, setFilters] = useState<Filters>({
    startDate: today,
    endDate: today,
    customerId: '',
    paymentMethod: '',
    status: '',
    page: 1,
    limit: 20,
  });

  useEffect(() => {
    if (profile?.storeId) {
      loadSales();
    }
  }, [profile?.storeId, filters]);

  // Resumen en USD de las ventas completadas que cumplen los filtros. El
  // estado cancelado no tiene resumen: las canceladas no suman ingresos
  useEffect(() => {
    const storeId = profile?.storeId;
    if (!storeId || filters.status === 'cancelled') return;

    let cancelled = false;
    getSalesStats({
      storeId,
      startDate: filters.startDate,
      endDate: filters.endDate,
      paymentMethod: filters.paymentMethod,
      customerId: filters.customerId,
    })
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch((error) => console.error('Error cargando el resumen:', error));

    return () => {
      cancelled = true;
    };
  }, [
    profile?.storeId,
    filters.startDate,
    filters.endDate,
    filters.paymentMethod,
    filters.customerId,
    filters.status,
    statsNonce,
  ]);

  const loadSales = async () => {
    if (!profile?.storeId) return;

    try {
      const response = await getSales({
        storeId: profile.storeId,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        paymentMethod: filters.paymentMethod || undefined,
        status: filters.status || undefined,
        page: filters.page,
        limit: filters.limit,
      });

      if (response) {
        setSales(response.sales);
        setPagination(response.pagination);
      } else {
        toast.error('Error al cargar el historial de ventas');
      }
    } catch (error: any) {
      console.error('Error loading sales:', error);
      toast.error(error.message || 'Error al cargar el historial de ventas');
    }
  };

  const handleFiltersChange = (newFilters: Filters) => {
    setFilters(newFilters);
  };

  const handlePageChange = (newPage: number) => {
    setFilters({ ...filters, page: newPage });
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
        <div className="flex items-center gap-3">
          <div className="bg-brand-primary-light text-brand-primary flex h-11 w-11 items-center justify-center rounded-xl">
            <Receipt className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
              Historial de Ventas
            </h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Consulta y administra todas las ventas realizadas.
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <SalesFilters filters={filters} onFiltersChange={handleFiltersChange} />

      {/* Resumen del período */}
      {filters.status !== 'cancelled' && stats && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-slate-400">
              Ventas completadas
            </p>
            <p className="mt-1 font-mono text-2xl font-bold text-gray-900 tabular-nums dark:text-slate-100">
              {stats.salesCount}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-slate-400">
              Total vendido
            </p>
            <DualCurrency
              usd={stats.totalRevenue}
              exchangeRate={exchangeRate}
              size="lg"
              align="left"
            />
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-slate-400">
              Ticket promedio
            </p>
            <DualCurrency
              usd={stats.averageSale}
              exchangeRate={exchangeRate}
              size="lg"
              align="left"
            />
          </div>
        </div>
      )}

      {filters.status !== 'cancelled' && (stats?.unconvertedSales ?? 0) > 0 && (
        <p className="text-xs text-amber-700 dark:text-amber-400">
          {stats?.unconvertedSales} venta(s) antigua(s) no tienen monto en USD
          ni tasa de cambio y no se incluyen en el total.
        </p>
      )}

      {/* Tabla de ventas */}
      {loading && sales.length === 0 ? (
        <div className="text-brand-primary flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-12 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Loader2 className="mb-4 h-8 w-8 animate-spin" />
          <p className="text-gray-500 dark:text-slate-400">
            Cargando ventas...
          </p>
        </div>
      ) : (
        <SalesTable
          sales={sales}
          pagination={pagination}
          onPageChange={handlePageChange}
          onRefresh={() => {
            loadSales();
            setStatsNonce((value) => value + 1);
          }}
        />
      )}
    </div>
  );
}
