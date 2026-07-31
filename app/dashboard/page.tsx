'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useInventoryStore } from '@/store/inventoryStore';
import { getStockAlerts } from '@/lib/inventory';
import StockAlertsCard from '@/components/inventory/StockAlertsCard';
import { DollarSign, Package, ShoppingCart, Users } from 'lucide-react';

export default function DashboardPage() {
  const { profile } = useAuth();
  const { alerts, setAlerts } = useInventoryStore();
  const [loadingAlerts, setLoadingAlerts] = useState(false);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      if (!profile?.storeId) return;
      setLoadingAlerts(true);
      const data = await getStockAlerts(profile.storeId);
      setAlerts(data);
    } catch (error) {
      console.error('Error cargando alertas:', error);
    } finally {
      setLoadingAlerts(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          ¡Bienvenido, {profile?.name}!
        </h1>
        <p className="text-slate-600">Resumen de tu negocio</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">
                Ventas del Día
              </p>
              <p className="text-2xl font-bold text-slate-900">$0.00</p>
              <p className="text-xs text-slate-500">
                Próximamente con datos reales
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-slate-400" />
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Productos</p>
              <p className="text-2xl font-bold text-slate-900">0</p>
              <p className="text-xs text-slate-500">Total en inventario</p>
            </div>
            <Package className="h-8 w-8 text-slate-400" />
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">
                Ventas del Mes
              </p>
              <p className="text-2xl font-bold text-slate-900">0</p>
              <p className="text-xs text-slate-500">Transacciones</p>
            </div>
            <ShoppingCart className="h-8 w-8 text-slate-400" />
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Clientes</p>
              <p className="text-2xl font-bold text-slate-900">0</p>
              <p className="text-xs text-slate-500">Clientes registrados</p>
            </div>
            <Users className="h-8 w-8 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Alertas de Stock Bajo */}
      {!loadingAlerts && <StockAlertsCard alerts={alerts} />}

      {/* Placeholder para gráficos */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Tendencia de Ventas
        </h2>
        <div className="flex h-64 items-center justify-center text-slate-400">
          Gráfico próximamente (Fase 6)
        </div>
      </div>
    </div>
  );
}
