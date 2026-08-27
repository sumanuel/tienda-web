'use client';

import { AlertTriangle, CheckCircle, XCircle, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StockAlert {
  id: string;
  productName: string;
  currentStock: number;
  minStock: number;
  status: 'active' | 'resolved';
}

interface StockAlertsCardV2Props {
  alerts: StockAlert[];
  loading?: boolean;
}

export function StockAlertsCardV2({
  alerts,
  loading = false,
}: StockAlertsCardV2Props) {
  const activeAlerts = alerts.filter((a) => a.status === 'active');
  const criticalAlerts = activeAlerts.filter((a) => a.currentStock === 0);
  const lowStockAlerts = activeAlerts.filter((a) => a.currentStock > 0);

  const hasAlerts = activeAlerts.length > 0;
  const hasCritical = criticalAlerts.length > 0;

  if (loading) {
    return (
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-5 w-32 rounded bg-gray-200" />
          <div className="h-12 w-full rounded bg-gray-200" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-2xl border-2 bg-white p-6 shadow-sm transition-all duration-300',
        !hasAlerts && 'border-tsuma-primary/30 bg-tsuma-primary-bg',
        hasAlerts && !hasCritical && 'border-amber-300 bg-amber-50',
        hasCritical && 'border-red-300 bg-red-50'
      )}
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Alertas de Stock
        </h3>
        {hasAlerts && (
          <span
            className={cn(
              'rounded-full px-3 py-1 text-xs font-bold',
              hasCritical ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'
            )}
          >
            {activeAlerts.length}
          </span>
        )}
      </div>

      {/* Content */}
      {!hasAlerts ? (
        <div className="flex items-center gap-3 rounded-xl bg-white p-4">
          <CheckCircle className="text-tsuma-primary h-12 w-12 flex-shrink-0" />
          <div>
            <p className="font-medium text-gray-900">¡Todo en orden!</p>
            <p className="text-sm text-gray-600">
              No hay alertas de stock en este momento
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Summary */}
          <div
            className={cn(
              'flex items-center gap-3 rounded-xl p-4',
              hasCritical ? 'bg-red-100' : 'bg-amber-100'
            )}
          >
            {hasCritical ? (
              <XCircle className="h-10 w-10 flex-shrink-0 text-red-600" />
            ) : (
              <AlertTriangle className="h-10 w-10 flex-shrink-0 text-amber-600" />
            )}
            <div className="flex-1">
              <p
                className={cn(
                  'font-semibold',
                  hasCritical ? 'text-red-900' : 'text-amber-900'
                )}
              >
                {hasCritical
                  ? '¡Stock crítico! Reabastece ya'
                  : `Stock bajo en ${activeAlerts.length} producto${activeAlerts.length > 1 ? 's' : ''}`}
              </p>
              <p
                className={cn(
                  'text-sm',
                  hasCritical ? 'text-red-700' : 'text-amber-700'
                )}
              >
                {hasCritical
                  ? `${criticalAlerts.length} producto${criticalAlerts.length > 1 ? 's' : ''} agotado${criticalAlerts.length > 1 ? 's' : ''}`
                  : 'Revisa tu inventario y realiza pedidos'}
              </p>
            </div>
          </div>

          {/* Alert List (primeros 3) */}
          <div className="space-y-2">
            {activeAlerts.slice(0, 3).map((alert) => (
              <div
                key={alert.id}
                className="flex items-center gap-3 rounded-lg bg-white p-3"
              >
                <Package className="h-5 w-5 text-gray-400" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {alert.productName}
                  </p>
                  <p className="text-xs text-gray-500">
                    Stock: {alert.currentStock} / Min: {alert.minStock}
                  </p>
                </div>
                <span
                  className={cn(
                    'flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
                    alert.currentStock === 0
                      ? 'bg-red-100 text-red-700'
                      : 'bg-amber-100 text-amber-700'
                  )}
                >
                  {alert.currentStock === 0 ? 'Agotado' : 'Bajo'}
                </span>
              </div>
            ))}
          </div>

          {/* View All Link */}
          {activeAlerts.length > 3 && (
            <button className="text-tsuma-primary hover:bg-tsuma-primary-light hover:text-tsuma-primary-dark w-full rounded-lg bg-white py-2 text-sm font-medium transition-colors">
              Ver todos ({activeAlerts.length})
            </button>
          )}
        </div>
      )}
    </div>
  );
}
