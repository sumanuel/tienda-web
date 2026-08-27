'use client';

import { ArrowRightLeft, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TasaActivaCardV2Props {
  rate: number;
  fromCurrency?: string;
  toCurrency?: string;
  updatedAt?: string | null;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  onUpdate?: () => void;
  loading?: boolean;
}

export function TasaActivaCardV2({
  rate,
  fromCurrency = 'USD',
  toCurrency = 'VES',
  updatedAt,
  trend,
  onUpdate,
  loading = false,
}: TasaActivaCardV2Props) {
  const formattedDate = updatedAt
    ? new Date(updatedAt).toLocaleDateString('es-VE', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Sin actualizar';

  if (loading) {
    return (
      <div className="from-tsuma-primary-bg rounded-2xl border bg-gradient-to-br to-white p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-24 rounded bg-gray-200" />
          <div className="h-10 w-40 rounded bg-gray-200" />
          <div className="h-3 w-32 rounded bg-gray-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="group border-tsuma-primary/20 from-tsuma-primary-bg relative overflow-hidden rounded-2xl border bg-gradient-to-br to-white p-6 shadow-sm backdrop-blur-xl transition-all duration-300 hover:shadow-lg">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-tsuma-primary-dark text-xs font-semibold tracking-wide uppercase">
            TASA ACTIVA
          </p>
          <span className="bg-tsuma-primary rounded-full px-2 py-0.5 text-xs font-medium text-white">
            En vivo
          </span>
        </div>
        <ArrowRightLeft className="text-tsuma-primary h-5 w-5" />
      </div>

      {/* Rate Value */}
      <div className="mb-2 flex items-baseline gap-3">
        <h2 className="text-4xl font-bold text-gray-900">{rate.toFixed(2)}</h2>
        <span className="text-base font-medium text-gray-600">
          {toCurrency} / {fromCurrency}
        </span>
      </div>

      {/* Trend */}
      {trend && (
        <div
          className={cn(
            'mb-3 flex items-center gap-1 text-sm font-medium',
            trend.isPositive ? 'text-tsuma-primary' : 'text-red-500'
          )}
        >
          <span>{trend.isPositive ? '↑' : '↓'}</span>
          <span>{trend.value}</span>
          <span className="text-xs text-gray-500">vs ayer</span>
        </div>
      )}

      {/* Date */}
      <p className="mb-4 text-sm text-gray-500">Actualizada {formattedDate}</p>

      {/* Update Button */}
      {onUpdate && (
        <button
          onClick={onUpdate}
          className="text-tsuma-primary hover:text-tsuma-primary-dark flex items-center gap-2 text-sm font-medium transition-all hover:gap-3"
        >
          <RefreshCw className="h-4 w-4" />
          Actualizar tasa
        </button>
      )}

      {/* Decorative gradient */}
      <div className="bg-tsuma-primary pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full opacity-10 blur-3xl transition-opacity duration-300 group-hover:opacity-20" />
    </div>
  );
}
