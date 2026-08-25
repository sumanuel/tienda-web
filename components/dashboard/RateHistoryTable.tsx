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
      <div className="rounded-lg border border-gray-200 bg-white p-8">
        <p className="text-center text-gray-500">Cargando historial...</p>
      </div>
    );
  }

  if (rates.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8">
        <p className="text-center text-gray-500">
          No hay tasas registradas todavía
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      {/* Header con filtro */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Historial de Tasas
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`rounded-lg px-3 py-1 text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-brand-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`rounded-lg px-3 py-1 text-sm font-medium transition-colors ${
                filter === 'active'
                  ? 'bg-brand-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-600 uppercase">
                Fecha
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-600 uppercase">
                Par
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold tracking-wide text-gray-600 uppercase">
                Tasa
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-600 uppercase">
                Fuente
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-600 uppercase">
                Usuario
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold tracking-wide text-gray-600 uppercase">
                Estado
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredRates.map((rate) => (
              <tr
                key={rate.id}
                className={`hover:bg-gray-50 ${!rate.isActive ? 'opacity-60' : ''}`}
              >
                <td className="px-4 py-3 text-sm whitespace-nowrap text-gray-900">
                  {new Date(rate.createdAt).toLocaleDateString('es-VE', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
                <td className="px-4 py-3 text-sm font-medium whitespace-nowrap text-gray-900">
                  {rate.fromCurrency} → {rate.toCurrency}
                </td>
                <td className="text-brand-primary px-4 py-3 text-right text-sm font-bold whitespace-nowrap">
                  {rate.rate.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-sm whitespace-nowrap text-gray-600">
                  {rate.source}
                </td>
                <td className="px-4 py-3 text-sm whitespace-nowrap text-gray-600">
                  {rate.creator?.name || 'Sistema'}
                </td>
                <td className="px-4 py-3 text-center whitespace-nowrap">
                  {rate.isActive ? (
                    <span className="bg-success/10 text-success inline-flex rounded-full px-2 py-1 text-xs font-semibold">
                      Activa
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600">
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
          <p className="text-gray-500">
            No hay tasas {filter === 'active' ? 'activas' : ''} para mostrar
          </p>
        </div>
      )}
    </div>
  );
}
