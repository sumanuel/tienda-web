'use client';

import { ArrowRightLeft } from 'lucide-react';

interface TasaActivaCardProps {
  rate: number;
  fromCurrency?: string;
  toCurrency?: string;
  updatedAt?: string | null;
  onUpdate?: () => void;
}

export function TasaActivaCard({
  rate,
  fromCurrency = 'USD',
  toCurrency = 'VES',
  updatedAt,
  onUpdate,
}: TasaActivaCardProps) {
  const formattedDate = updatedAt
    ? new Date(updatedAt).toLocaleDateString('es-VE', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Sin actualizar';

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold tracking-wide text-gray-600 uppercase">
          TASA ACTIVA
        </p>
        <ArrowRightLeft className="text-info h-5 w-5" />
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <h2 className="text-4xl font-bold text-gray-900">{rate.toFixed(2)}</h2>
        <span className="text-sm font-medium text-gray-500">
          {toCurrency} / {fromCurrency}
        </span>
      </div>

      <p className="mt-2 text-sm text-gray-500">Actualizada {formattedDate}</p>

      {onUpdate && (
        <button
          onClick={onUpdate}
          className="text-brand-primary hover:text-brand-primary-dark mt-4 text-sm font-medium transition-colors"
        >
          Actualizar tasa →
        </button>
      )}
    </div>
  );
}
