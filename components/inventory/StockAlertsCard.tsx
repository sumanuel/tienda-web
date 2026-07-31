'use client';

import { StockAlert } from '@/types/inventory';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface StockAlertsCardProps {
  alerts: StockAlert[];
}

export default function StockAlertsCard({ alerts }: StockAlertsCardProps) {
  if (alerts.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <AlertTriangle size={20} className="text-green-600" />
          <h3 className="font-semibold text-gray-900">Alertas de Stock</h3>
        </div>
        <p className="text-sm text-gray-500">
          No hay alertas de stock bajo. ¡Todo en orden!
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6">
      <div className="mb-4 flex items-center gap-2">
        <AlertTriangle size={20} className="text-red-600" />
        <h3 className="font-semibold text-red-900">
          Alertas de Stock Bajo ({alerts.length})
        </h3>
      </div>

      <div className="space-y-2">
        {alerts.slice(0, 5).map((alert) => (
          <div
            key={alert.id}
            className="flex items-center justify-between rounded-lg bg-white p-3"
          >
            <div>
              <p className="font-medium text-gray-900">
                {alert.productCode} - {alert.productName}
              </p>
              <p className="text-sm text-gray-600">
                Stock actual:{' '}
                <span className="font-semibold text-red-600">
                  {alert.currentStock}
                </span>{' '}
                / Mínimo: {alert.minStock}
              </p>
            </div>
            <Link
              href={`/dashboard/inventory/kardex?productId=${alert.productId}`}
              className="text-sm text-blue-600 hover:underline"
            >
              Ver Kardex
            </Link>
          </div>
        ))}

        {alerts.length > 5 && (
          <Link
            href="/dashboard/inventory/movements"
            className="mt-2 block text-center text-sm text-blue-600 hover:underline"
          >
            Ver todas las alertas ({alerts.length})
          </Link>
        )}
      </div>
    </div>
  );
}
