'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { TasaActivaCard } from '@/components/dashboard/TasaActivaCard';
import { RateHistoryTable } from '@/components/dashboard/RateHistoryTable';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ExchangeRatesPage() {
  const router = useRouter();
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
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Cargando tasas de cambio...</p>
      </div>
    );
  }

  // No mostrar error si simplemente no hay token o es un error de autenticación
  // Esos casos se manejan en el routing
  if (error && !error.includes('autenticado') && !error.includes('acceso')) {
    return (
      <div className="p-6">
        <div className="border-error bg-error/10 rounded-lg border p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-error h-5 w-5" />
            <div>
              <p className="text-error font-semibold">Error al cargar tasas</p>
              <p className="mt-1 text-sm text-gray-700">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-error hover:bg-error/90 mt-3 rounded-lg px-4 py-2 text-sm font-medium text-white"
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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => router.push('/dashboard')}
            className="hover:text-brand-primary mb-2 flex items-center gap-2 text-sm text-gray-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            Gestión de Tasas de Cambio
          </h1>
          <p className="text-gray-600">
            Administra las tasas de cambio para cálculo automático de precios
          </p>
        </div>
      </div>

      {/* Tasa Activa */}
      {activeRate && activeRate.usdToVes > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          <TasaActivaCard
            rate={activeRate.usdToVes}
            fromCurrency="USD"
            toCurrency="VES"
            updatedAt={activeRate.updatedAt}
            onUpdate={() => setShowForm(!showForm)}
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
        <div className="border-warning bg-warning/10 rounded-lg border p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-warning h-5 w-5" />
            <div>
              <p className="text-warning font-semibold">
                No hay tasas de cambio configuradas
              </p>
              <p className="mt-1 text-sm text-gray-700">
                Debes configurar al menos la tasa USD → VES para poder crear
                productos con cálculo automático de precios.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="bg-warning hover:bg-warning/90 mt-3 rounded-lg px-4 py-2 text-sm font-medium text-white"
              >
                Configurar Tasa Ahora
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Formulario de Actualización */}
      {showForm && (
        <div className="border-brand-primary rounded-lg border-2 bg-white p-6 shadow-sm">
          <h2 className="text-brand-primary mb-4 text-xl font-semibold">
            {activeRate?.usdToVes > 0
              ? 'Actualizar Tasa'
              : 'Configurar Tasa Inicial'}
          </h2>

          {/* Alerta de Impacto */}
          <div className="border-info bg-info/10 mb-4 rounded-lg border p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-info h-5 w-5" />
              <div className="text-sm text-gray-700">
                <p className="font-semibold">Impacto en Productos</p>
                <p className="mt-1">
                  Al actualizar la tasa, se recalcularán automáticamente los
                  precios de TODOS los productos que tengan margen definido.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Desde
                </label>
                <select
                  value={formData.fromCurrency}
                  onChange={(e) =>
                    setFormData({ ...formData, fromCurrency: e.target.value })
                  }
                  className="focus:border-brand-primary focus:ring-brand-primary w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-1 focus:outline-none"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Hacia
                </label>
                <select
                  value={formData.toCurrency}
                  onChange={(e) =>
                    setFormData({ ...formData, toCurrency: e.target.value })
                  }
                  className="focus:border-brand-primary focus:ring-brand-primary w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-1 focus:outline-none"
                >
                  <option value="VES">VES</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
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
                className="focus:border-brand-primary focus:ring-brand-primary w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-1 focus:outline-none"
              />
              <p className="mt-1 text-xs text-gray-500">
                1 {formData.fromCurrency} = ??? {formData.toCurrency}
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Fuente
              </label>
              <select
                value={formData.source}
                onChange={(e) =>
                  setFormData({ ...formData, source: e.target.value })
                }
                className="focus:border-brand-primary focus:ring-brand-primary w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-1 focus:outline-none"
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
                className="bg-brand-primary hover:bg-brand-primary-dark rounded-lg px-6 py-2 font-medium text-white transition-colors disabled:bg-gray-400"
              >
                {submitting ? 'Actualizando...' : 'Actualizar Tasa'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-gray-300 px-6 py-2 font-medium transition-colors hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Historial */}
      <RateHistoryTable rates={rates} loading={loading} />
    </div>
  );
}
