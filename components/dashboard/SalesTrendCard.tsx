'use client';

import { TrendingUp } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '@/lib/currency';

interface SalesTrendCardProps {
  data: { date: string; totalUsd: number; count: number }[];
  loading?: boolean;
}

// "2026-10-18" -> "18/10"
const shortDate = (value: string) => {
  const [, month, day] = value.split('-');
  return `${day}/${month}`;
};

export function SalesTrendCard({ data, loading = false }: SalesTrendCardProps) {
  const hasSales = data.some((day) => day.count > 0);

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-6 flex items-center gap-3">
        <div className="bg-tsuma-primary-light rounded-lg p-2">
          <TrendingUp className="text-tsuma-primary h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
            Tendencia de Ventas
          </h3>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Últimos 30 días, en USD
          </p>
        </div>
      </div>

      {loading ? (
        <div className="h-64 animate-pulse rounded-xl bg-gray-100 dark:bg-slate-800" />
      ) : !hasSales ? (
        <div className="flex h-64 flex-col items-center justify-center text-center">
          <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
            Aún no hay ventas en los últimos 30 días
          </p>
          <p className="mt-1 text-xs text-gray-400 dark:text-slate-500">
            Las ventas completadas aparecerán aquí.
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={256}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={shortDate} interval={4} />
            <YAxis />
            <Tooltip
              labelFormatter={(label) => shortDate(String(label))}
              formatter={(value, name) =>
                name === 'Ventas (USD)'
                  ? formatCurrency(Number(value), 'USD')
                  : value
              }
            />
            <Line
              type="monotone"
              dataKey="totalUsd"
              name="Ventas (USD)"
              stroke="#1f7a59"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
