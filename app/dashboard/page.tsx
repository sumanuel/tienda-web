'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useInventoryStore } from '@/store/inventoryStore';
import { getStockAlerts } from '@/lib/inventory';
import { StockAlertsCardV2 } from '@/components/dashboard/StockAlertsCardV2';
import { TasaActivaCardV2 } from '@/components/dashboard/TasaActivaCardV2';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { TrendChartPlaceholder } from '@/components/dashboard/TrendChartPlaceholder';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import {
  DollarSign,
  Package,
  ShoppingCart,
  Users,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const { alerts, setAlerts } = useInventoryStore();
  const { activeRate, loading: ratesLoading } = useExchangeRates(
    profile?.storeId || ''
  );
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
    <div className="to-tsuma-primary-bg/30 min-h-screen space-y-6 bg-gradient-to-br from-gray-50 p-6 dark:from-slate-950 dark:to-slate-950">
      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-slate-100">
          ¡Bienvenido, {profile?.name || 'fotos'}!
        </h1>
        <p className="mt-1 text-gray-600 dark:text-slate-400">
          Resumen de tu negocio en tiempo real
        </p>
      </div>

      {/* Tasa Activa - Featured Card */}
      {!ratesLoading && activeRate && activeRate.usdToVes > 0 && (
        <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <TasaActivaCardV2
            rate={activeRate.usdToVes}
            fromCurrency="USD"
            toCurrency="VES"
            updatedAt={activeRate.updatedAt}
            trend={{
              value: '+2.3%',
              isPositive: true,
            }}
            onUpdate={() => router.push('/dashboard/exchange-rates')}
          />
        </div>
      )}

      {/* KPI Metrics Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Ventas del Día"
          value="$0.00"
          subtitle="Próximamente con datos reales"
          icon={DollarSign}
          tone="accent"
          trend={{
            value: '+0%',
            isPositive: true,
          }}
          className="animate-slide-up"
          style={{ animationDelay: '0.2s' } as React.CSSProperties}
        />

        <MetricCard
          title="Ventas del Mes"
          value="$0.00"
          subtitle="vs mes pasado: 0%"
          icon={Calendar}
          tone="accent"
          trend={{
            value: '+0%',
            isPositive: true,
          }}
          action={{
            label: 'Ver historial',
            onClick: () => router.push('/dashboard/sales'),
          }}
          className="animate-slide-up"
          style={{ animationDelay: '0.3s' } as React.CSSProperties}
        />

        <MetricCard
          title="Productos"
          value="0"
          subtitle="Total en inventario"
          icon={Package}
          tone="warning"
          action={{
            label: 'Gestionar',
            onClick: () => router.push('/dashboard/products'),
          }}
          className="animate-slide-up"
          style={{ animationDelay: '0.4s' } as React.CSSProperties}
        />

        <MetricCard
          title="Clientes"
          value="0"
          subtitle="Clientes registrados"
          icon={Users}
          tone="neutral"
          action={{
            label: 'Ver todos',
            onClick: () => router.push('/dashboard/customers'),
          }}
          className="animate-slide-up"
          style={{ animationDelay: '0.5s' } as React.CSSProperties}
        />
      </div>

      {/* Alertas de Stock */}
      <div className="animate-slide-up" style={{ animationDelay: '0.6s' }}>
        <StockAlertsCardV2 alerts={alerts} loading={loadingAlerts} />
      </div>

      {/* Tendencia de Ventas */}
      <div className="animate-slide-up" style={{ animationDelay: '0.7s' }}>
        <TrendChartPlaceholder />
      </div>
    </div>
  );
}
