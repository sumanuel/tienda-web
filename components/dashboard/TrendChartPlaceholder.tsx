'use client';

import { TrendingUp, Settings } from 'lucide-react';

export function TrendChartPlaceholder() {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-tsuma-primary-light rounded-lg p-2">
            <TrendingUp className="text-tsuma-primary h-5 w-5" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Tendencia de Ventas
          </h3>
        </div>
        <button className="border-tsuma-primary text-tsuma-primary hover:bg-tsuma-primary-light flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors">
          <Settings className="h-4 w-4" />
          Configurar
        </button>
      </div>

      {/* Skeleton Loader */}
      <div className="flex h-64 items-end justify-between gap-2 px-4">
        {/* Animated bars */}
        {[40, 65, 45, 80, 55, 70, 50].map((height, i) => (
          <div
            key={i}
            className="bg-tsuma-primary-light animate-pulse-soft flex-1 rounded-t-md"
            style={{
              height: `${height}%`,
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>

      {/* Message */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          Los datos se mostrarán aquí pronto
        </p>
        <p className="mt-1 text-xs text-gray-400">
          Conecta tu punto de venta para ver estadísticas en tiempo real
        </p>
      </div>
    </div>
  );
}
