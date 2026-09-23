'use client';

import { useState } from 'react';

interface ExchangeRate {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  source: string;
  isActive: boolean;
  createdAt: string;
  creator?: {
    name: string;
  } | null;
}

interface RateHistoryTableProps {
  rates: ExchangeRate[];
  loading?: boolean;
}

export function RateHistoryTable({ rates, loading }: RateHistoryTableProps) {
  const [filter, setFilter] = useState<'all' | 'active'>('all');

  const filteredRates = rates.filter((rate) => {
    if (filter === 'active') return rate.isActive;
    return true;
  });

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
        <p className="text-center text-gray-500 dark:text-slate-400">
          Cargando historial...
        </p>
      </div>
    );
  }

  if (rates.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
        <p className="text-center text-gray-500 dark:text-slate-400">
          No hay tasas registradas todavía
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      {/* Header con filtro */}
      <div className="border-b border-gray-200 p-4 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
            Historial de Tasas
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`rounded-lg px-3 py-1 text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-brand-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`rounded-lg px-3 py-1 text-sm font-medium transition-colors ${
                filter === 'active'
                  ? 'bg-brand-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              Activas
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-slate-950">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-600 uppercase dark:text-slate-400">
                Fecha
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-600 uppercase dark:text-slate-400">
                Par
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold tracking-wide text-gray-600 uppercase dark:text-slate-400">
                Tasa
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-600 uppercase dark:text-slate-400">
                Fuente
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-600 uppercase dark:text-slate-400">
                Usuario
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold tracking-wide text-gray-600 uppercase dark:text-slate-400">
                Estado
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredRates.map((rate) => (
              <tr
                key={rate.id}
                className={`hover:bg-gray-50 dark:bg-slate-950 dark:hover:bg-slate-800 ${!rate.isActive ? 'opacity-60' : ''}`}
              >
                <td className="px-4 py-3 text-sm whitespace-nowrap text-gray-900 dark:text-slate-100">
                  {new Date(rate.createdAt).toLocaleDateString('es-VE', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
                <td className="px-4 py-3 text-sm font-medium whitespace-nowrap text-gray-900 dark:text-slate-100">
                  {rate.fromCurrency} → {rate.toCurrency}
                </td>
                <td className="text-brand-primary px-4 py-3 text-right text-sm font-bold whitespace-nowrap">
                  {rate.rate.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-sm whitespace-nowrap text-gray-600 dark:text-slate-400">
                  {rate.source}
                </td>
                <td className="px-4 py-3 text-sm whitespace-nowrap text-gray-600 dark:text-slate-400">
                  {rate.creator?.name || 'Sistema'}
                </td>
                <td className="px-4 py-3 text-center whitespace-nowrap">
                  {rate.isActive ? (
                    <span className="bg-success/10 text-success inline-flex rounded-full px-2 py-1 text-xs font-semibold">
                      Activa
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600 dark:bg-slate-800 dark:text-slate-400">
                      Inactiva
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredRates.length === 0 && (
        <div className="p-8 text-center">
          <p className="text-gray-500 dark:text-slate-400">
            No hay tasas {filter === 'active' ? 'activas' : ''} para mostrar
          </p>
        </div>
      )}
    </div>
  );
}
