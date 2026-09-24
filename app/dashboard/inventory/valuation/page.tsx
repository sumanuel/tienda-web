'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { useRouter } from 'next/navigation';
import { calculateInventoryValuation } from '@/lib/inventory';
import { PageContainer } from '@/components/common/PageContainer';
import { IconChip } from '@/components/common/IconChip';
import { DualCurrency } from '@/components/common/DualCurrency';
import { formatCurrency } from '@/lib/currency';
import { DollarSign, Package, TrendingUp } from 'lucide-react';

export default function ValuationPage() {
  const { profile } = useAuth();
  const { activeRate } = useExchangeRates(profile?.storeId || '');
  const exchangeRate = activeRate?.usdToVes;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [valuation, setValuation] = useState<{
    totalValue: number;
    totalItems: number;
    byCategory: Record<string, number>;
  } | null>(null);

  useEffect(() => {
    loadValuation();
  }, [profile?.storeId]);

  const loadValuation = async () => {
    if (!profile?.storeId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await calculateInventoryValuation(profile.storeId);
      setValuation(data);
    } catch (err: any) {
      console.error('Error al calcular valorización:', err);
      setError(err.message || 'Error al calcular valorización');

      // Si es error de autenticación, redirigir a login
      if (err.message?.includes('401') || err.message?.includes('Token')) {
        setTimeout(() => router.push('/login'), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer
      loading={loading}
      error={error}
      onRetry={loadValuation}
      isEmpty={!valuation}
      emptyTitle="No hay datos de inventario"
      emptyDescription="No se pudo calcular la valorización del inventario"
      loadingMessage="Calculando valorización..."
    >
      {valuation && (
        <div className="min-h-screen space-y-6 bg-gray-50 p-6 dark:bg-slate-950">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                  Valorización de Inventario
                </h1>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  Valor total del inventario actual.
                </p>
              </div>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Valor Total */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <IconChip icon={DollarSign} tone="info" className="h-11 w-11" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-slate-400">
                    Valor Total
                  </p>
                  <DualCurrency
                    usd={valuation.totalValue}
                    exchangeRate={exchangeRate}
                    align="left"
                  />
                </div>
              </div>
            </div>

            {/* Total de Items */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <IconChip icon={Package} tone="accent" className="h-11 w-11" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-slate-400">
                    Total de Unidades
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                    {valuation.totalItems.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Valor Promedio */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <IconChip
                  icon={TrendingUp}
                  tone="warning"
                  className="h-11 w-11"
                />
                <div>
                  <p className="text-sm text-gray-600 dark:text-slate-400">
                    Valor Promedio/Unidad
                  </p>
                  <DualCurrency
                    usd={
                      valuation.totalItems > 0
                        ? valuation.totalValue / valuation.totalItems
                        : 0
                    }
                    exchangeRate={exchangeRate}
                    align="left"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Valorización por Categoría */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-slate-200">
              Valorización por Categoría
            </h2>

            {Object.keys(valuation.byCategory).length === 0 ? (
              <p className="py-8 text-center text-gray-500 dark:text-slate-400">
                No hay productos con inventario rastreado
              </p>
            ) : (
              <div className="space-y-4">
                {Object.entries(valuation.byCategory)
                  .sort(([, a], [, b]) => b - a)
                  .map(([category, value]) => {
                    const percentage = (value / valuation.totalValue) * 100;
                    return (
                      <div key={category}>
                        <div className="mb-1 flex items-center justify-between">
                          <span className="font-medium text-gray-900 dark:text-slate-100">
                            {category}
                          </span>
                          <span className="font-mono text-sm text-gray-600 dark:text-slate-400">
                            {formatCurrency(
                              exchangeRate ? value * exchangeRate : 0,
                              'VES'
                            )}{' '}
                            <span className="text-xs">
                              ≈ {formatCurrency(value, 'USD')}
                            </span>{' '}
                            ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-slate-800">
                          <div
                            className="bg-tsuma-primary h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      )}
    </PageContainer>
  );
}
