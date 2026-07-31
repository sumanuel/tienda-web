'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { calculateInventoryValuation } from '@/lib/inventory';
import { DollarSign, Package, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ValuationPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [valuation, setValuation] = useState<{
    totalValue: number;
    totalItems: number;
    byCategory: Record<string, number>;
  } | null>(null);

  useEffect(() => {
    loadValuation();
  }, []);

  const loadValuation = async () => {
    try {
      if (!profile?.storeId) return;
      setLoading(true);
      const data = await calculateInventoryValuation(profile.storeId);
      setValuation(data);
    } catch (error) {
      toast.error('Error al calcular valorización');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Calculando valorización...</div>;
  }

  if (!valuation) {
    return <div className="p-6">No se pudo calcular la valorización</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Valorización de Inventario</h1>
        <p className="text-gray-600">Valor total del inventario actual</p>
      </div>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        {/* Valor Total */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="mb-2 flex items-center gap-3">
            <div className="rounded-full bg-blue-100 p-2">
              <DollarSign size={24} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Valor Total</p>
              <p className="text-2xl font-bold text-gray-900">
                ${valuation.totalValue.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Total de Items */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="mb-2 flex items-center gap-3">
            <div className="rounded-full bg-green-100 p-2">
              <Package size={24} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total de Unidades</p>
              <p className="text-2xl font-bold text-gray-900">
                {valuation.totalItems.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Valor Promedio */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="mb-2 flex items-center gap-3">
            <div className="rounded-full bg-purple-100 p-2">
              <TrendingUp size={24} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Valor Promedio/Unidad</p>
              <p className="text-2xl font-bold text-gray-900">
                $
                {valuation.totalItems > 0
                  ? (valuation.totalValue / valuation.totalItems).toFixed(2)
                  : '0.00'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Valorización por Categoría */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">
          Valorización por Categoría
        </h2>

        {Object.keys(valuation.byCategory).length === 0 ? (
          <p className="py-8 text-center text-gray-500">
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
                      <span className="font-medium text-gray-900">
                        {category}
                      </span>
                      <span className="text-sm text-gray-600">
                        ${value.toFixed(2)} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-200">
                      <div
                        className="h-2 rounded-full bg-blue-600"
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
  );
}
