'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { TasaActivaCard } from '@/components/dashboard/TasaActivaCard';
import { RateHistoryTable } from '@/components/dashboard/RateHistoryTable';
import { SidePanel } from '@/components/common/SidePanel';
import { ArrowRightLeft, AlertTriangle, Plus } from 'lucide-react';

export default function ExchangeRatesPage() {
  const { profile } = useAuth();
  const { rates, activeRate, loading, error, updateRate, refetch } =
    useExchangeRates(profile?.storeId || '');

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    fromCurrency: 'USD',
    toCurrency: 'VES',
    rate: '',
    source: 'MANUAL',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const rateValue = parseFloat(formData.rate);
    if (isNaN(rateValue) || rateValue <= 0) {
      alert('Por favor ingresa una tasa válida');
      return;
    }

    const confirmMessage = `¿Estás seguro de actualizar la tasa ${formData.fromCurrency} → ${formData.toCurrency} a ${rateValue.toFixed(2)}?\n\nEsto recalculará automáticamente los precios de TODOS los productos.`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setSubmitting(true);
      await updateRate({
        fromCurrency: formData.fromCurrency,
        toCurrency: formData.toCurrency,
        rate: rateValue,
        source: formData.source,
      });

      alert(
        'Tasa actualizada exitosamente. Los precios de productos han sido recalculados.'
      );
      setShowForm(false);
      setFormData({
        fromCurrency: 'USD',
        toCurrency: 'VES',
        rate: '',
        source: 'MANUAL',
      });
      await refetch();
    } catch (err) {
      console.error('Error al actualizar tasa:', err);
      alert('Error al actualizar la tasa. Intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen space-y-6 bg-gray-50 p-6 dark:bg-slate-950">
        <div className="animate-pulse rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="h-7 w-48 rounded bg-gray-200 dark:bg-slate-700" />
          <div className="mt-3 h-4 w-72 rounded bg-gray-100 dark:bg-slate-800" />
        </div>
      </div>
    );
  }

  // No mostrar error si simplemente no hay token o es un error de autenticación
  // Esos casos se manejan en el routing
  if (error && !error.includes('autenticado') && !error.includes('acceso')) {
    return (
      <div className="min-h-screen space-y-6 bg-gray-50 p-6 dark:bg-slate-950">
        <div className="border-error bg-error/10 rounded-2xl border p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-error h-5 w-5" />
            <div>
              <p className="text-error font-semibold">Error al cargar tasas</p>
              <p className="mt-1 text-sm text-gray-700 dark:text-slate-300">
                {error}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-error hover:bg-error/90 mt-3 rounded-xl px-4 py-2 text-sm font-medium text-white"
              >
                Recargar Página
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6 bg-gray-50 p-6 dark:bg-slate-950">
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
            <ArrowRightLeft className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
              Tasas de Cambio
            </h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Administra las tasas para el cálculo automático de precios.
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-brand-primary hover:bg-brand-primary-dark inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-colors"
        >
          <Plus size={20} />
          {(activeRate?.usdToVes ?? 0) > 0
            ? 'Actualizar Tasa'
            : 'Configurar Tasa'}
        </button>
      </div>

      {/* Tasa Activa */}
      {activeRate && activeRate.usdToVes > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          <TasaActivaCard
            rate={activeRate.usdToVes}
            fromCurrency="USD"
            toCurrency="VES"
            updatedAt={activeRate.updatedAt}
            onUpdate={() => setShowForm(true)}
          />
          {activeRate.eurToVes > 0 && (
            <TasaActivaCard
              rate={activeRate.eurToVes}
              fromCurrency="EUR"
              toCurrency="VES"
              updatedAt={activeRate.updatedAt}
            />
          )}
        </div>
      )}

      {/* Sin tasa activa */}
      {(!activeRate || activeRate.usdToVes === 0) && (
        <div className="border-warning bg-warning/10 rounded-2xl border p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-warning h-5 w-5" />
            <div>
              <p className="text-warning font-semibold">
                No hay tasas de cambio configuradas
              </p>
              <p className="mt-1 text-sm text-gray-700 dark:text-slate-300">
                Debes configurar al menos la tasa USD → VES para poder crear
                productos con cálculo automático de precios.
              </p>
            </div>
          </div>
        </div>
      )}

      <SidePanel
        open={showForm}
        onClose={() => setShowForm(false)}
        title={
          (activeRate?.usdToVes ?? 0) > 0
            ? 'Actualizar Tasa'
            : 'Configurar Tasa Inicial'
        }
        subtitle="Al actualizar la tasa, se recalcularán automáticamente los precios de todos los productos con margen definido."
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="border-info bg-info/10 rounded-xl border p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-info h-5 w-5" />
              <div className="text-sm text-gray-700 dark:text-slate-300">
                <p className="font-semibold">Impacto en Productos</p>
                <p className="mt-1">
                  Al actualizar la tasa, se recalcularán automáticamente los
                  precios de TODOS los productos que tengan margen definido.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
                Desde
              </label>
              <select
                value={formData.fromCurrency}
                onChange={(e) =>
                  setFormData({ ...formData, fromCurrency: e.target.value })
                }
                className="focus:border-brand-primary focus:ring-brand-primary w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:bg-white focus:ring-1 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:bg-slate-900"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
                Hacia
              </label>
              <select
                value={formData.toCurrency}
                onChange={(e) =>
                  setFormData({ ...formData, toCurrency: e.target.value })
                }
                className="focus:border-brand-primary focus:ring-brand-primary w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:bg-white focus:ring-1 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:bg-slate-900"
              >
                <option value="VES">VES</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
              Tasa de Cambio *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={formData.rate}
              onChange={(e) =>
                setFormData({ ...formData, rate: e.target.value })
              }
              placeholder="Ej: 76.43"
              required
              className="focus:border-brand-primary focus:ring-brand-primary w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:bg-white focus:ring-1 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:bg-slate-900"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
              1 {formData.fromCurrency} = ??? {formData.toCurrency}
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
              Fuente
            </label>
            <select
              value={formData.source}
              onChange={(e) =>
                setFormData({ ...formData, source: e.target.value })
              }
              className="focus:border-brand-primary focus:ring-brand-primary w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:bg-white focus:ring-1 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:bg-slate-900"
            >
              <option value="MANUAL">Manual</option>
              <option value="BCV">BCV</option>
              <option value="PARALELO">Paralelo</option>
            </select>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="bg-brand-primary hover:bg-brand-primary-dark rounded-xl px-6 py-2.5 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:bg-gray-300 dark:disabled:bg-slate-700"
            >
              {submitting ? 'Actualizando...' : 'Actualizar Tasa'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-xl border border-gray-200 px-6 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
          </div>
        </form>
      </SidePanel>

      {/* Historial */}
      <RateHistoryTable rates={rates} loading={loading} />
    </div>
  );
}
