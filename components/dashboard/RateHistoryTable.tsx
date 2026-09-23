'use client';

import { useState } from 'react';
import { History } from 'lucide-react';
import { StatusPill } from '@/components/common/StatusPill';

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
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-center text-gray-500 dark:text-slate-400">
          Cargando historial...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-200">
            Historial de tasas
          </h2>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Registro de todas las tasas configuradas, activas e inactivas.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`rounded-xl px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-brand-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`rounded-xl px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === 'active'
                ? 'bg-brand-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            Activas
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm dark:border-slate-800">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-slate-950">
            <tr>
              <th className="border-b border-gray-200 px-4 py-2.5 text-left font-mono text-[0.65rem] font-semibold tracking-widest whitespace-nowrap text-gray-500 uppercase dark:border-slate-800 dark:text-slate-500">
                Fecha
              </th>
              <th className="border-b border-gray-200 px-4 py-2.5 text-left font-mono text-[0.65rem] font-semibold tracking-widest whitespace-nowrap text-gray-500 uppercase dark:border-slate-800 dark:text-slate-500">
                Par
              </th>
              <th className="border-b border-gray-200 px-4 py-2.5 text-right font-mono text-[0.65rem] font-semibold tracking-widest whitespace-nowrap text-gray-500 uppercase dark:border-slate-800 dark:text-slate-500">
                Tasa
              </th>
              <th className="border-b border-gray-200 px-4 py-2.5 text-left font-mono text-[0.65rem] font-semibold tracking-widest whitespace-nowrap text-gray-500 uppercase dark:border-slate-800 dark:text-slate-500">
                Fuente
              </th>
              <th className="border-b border-gray-200 px-4 py-2.5 text-left font-mono text-[0.65rem] font-semibold tracking-widest whitespace-nowrap text-gray-500 uppercase dark:border-slate-800 dark:text-slate-500">
                Usuario
              </th>
              <th className="border-b border-gray-200 px-4 py-2.5 text-center font-mono text-[0.65rem] font-semibold tracking-widest whitespace-nowrap text-gray-500 uppercase dark:border-slate-800 dark:text-slate-500">
                Estado
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
            {filteredRates.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-center">
                    <History className="mb-4 h-12 w-12 text-gray-300 dark:text-slate-700" />
                    <p className="text-lg font-medium text-gray-700 dark:text-slate-300">
                      No hay tasas {filter === 'active' ? 'activas' : ''} para
                      mostrar
                    </p>
                    <p className="mt-1 text-sm text-gray-400 dark:text-slate-500">
                      Registra tu primera tasa de cambio.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredRates.map((rate) => (
                <tr
                  key={rate.id}
                  className={`transition-colors hover:bg-gray-50 dark:hover:bg-slate-800 ${!rate.isActive ? 'opacity-60' : ''}`}
                >
                  <td className="px-4 py-3 font-mono text-sm whitespace-nowrap text-gray-700 dark:text-slate-300">
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
                  <td className="text-tsuma-primary-dark px-4 py-3 text-right font-mono text-sm font-bold whitespace-nowrap tabular-nums">
                    {rate.rate.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm whitespace-nowrap text-gray-600 dark:text-slate-400">
                    {rate.source}
                  </td>
                  <td className="px-4 py-3 text-sm whitespace-nowrap text-gray-600 dark:text-slate-400">
                    {rate.creator?.name || 'Sistema'}
                  </td>
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <StatusPill tone={rate.isActive ? 'ok' : 'mute'}>
                      {rate.isActive ? 'Activa' : 'Inactiva'}
                    </StatusPill>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
