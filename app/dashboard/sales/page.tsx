'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSales } from '@/hooks/useSales';
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
  const [sales, setSales] = useState<Sale[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1,
  });
  const [filters, setFilters] = useState<Filters>({
    startDate: '',
    endDate: '',
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
          onRefresh={loadSales}
        />
      )}
    </div>
  );
}
