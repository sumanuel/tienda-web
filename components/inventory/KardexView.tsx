'use client';

import { KardexEntry } from '@/types/inventory';
import { format } from 'date-fns';
import { FileText } from 'lucide-react';
import { StatusPill, StatusPillTone } from '@/components/common/StatusPill';

interface KardexViewProps {
  kardex: KardexEntry[];
  productName: string;
  productCode: string;
}

const typeMeta: Record<string, { label: string; tone: StatusPillTone }> = {
  entry: { label: 'Entrada', tone: 'ok' },
  exit: { label: 'Salida', tone: 'crit' },
  sale: { label: 'Venta', tone: 'info' },
  adjustment: { label: 'Ajuste', tone: 'mute' },
};

export default function KardexView({
  kardex,
  productName,
  productCode,
}: KardexViewProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-200">
          Kardex de producto
        </h2>
        <p className="font-mono text-sm text-gray-500 dark:text-slate-400">
          {productCode || '—'} · {productName}
        </p>
      </div>

      {kardex.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="mb-4 h-12 w-12 text-gray-300 dark:text-slate-700" />
          <p className="text-lg font-medium text-gray-700 dark:text-slate-300">
            No hay movimientos registrados
          </p>
          <p className="mt-1 text-sm text-gray-400 dark:text-slate-500">
            Este producto aún no tiene movimientos de inventario.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm dark:border-slate-800">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-950">
              <tr>
                <th className="border-b border-gray-200 px-4 py-2.5 text-left font-mono text-[0.65rem] font-semibold tracking-widest whitespace-nowrap text-gray-500 uppercase dark:border-slate-800 dark:text-slate-500">
                  Fecha
                </th>
                <th className="border-b border-gray-200 px-4 py-2.5 text-left font-mono text-[0.65rem] font-semibold tracking-widest whitespace-nowrap text-gray-500 uppercase dark:border-slate-800 dark:text-slate-500">
                  Referencia
                </th>
                <th className="border-b border-gray-200 px-4 py-2.5 text-left font-mono text-[0.65rem] font-semibold tracking-widest whitespace-nowrap text-gray-500 uppercase dark:border-slate-800 dark:text-slate-500">
                  Tipo
                </th>
                <th className="border-b border-gray-200 px-4 py-2.5 text-right font-mono text-[0.65rem] font-semibold tracking-widest whitespace-nowrap text-gray-500 uppercase dark:border-slate-800 dark:text-slate-500">
                  Entrada
                </th>
                <th className="border-b border-gray-200 px-4 py-2.5 text-right font-mono text-[0.65rem] font-semibold tracking-widest whitespace-nowrap text-gray-500 uppercase dark:border-slate-800 dark:text-slate-500">
                  Salida
                </th>
                <th className="border-b border-gray-200 px-4 py-2.5 text-right font-mono text-[0.65rem] font-semibold tracking-widest whitespace-nowrap text-gray-500 uppercase dark:border-slate-800 dark:text-slate-500">
                  Saldo
                </th>
                <th className="border-b border-gray-200 px-4 py-2.5 text-right font-mono text-[0.65rem] font-semibold tracking-widest whitespace-nowrap text-gray-500 uppercase dark:border-slate-800 dark:text-slate-500">
                  Costo Unit.
                </th>
                <th className="border-b border-gray-200 px-4 py-2.5 text-right font-mono text-[0.65rem] font-semibold tracking-widest whitespace-nowrap text-gray-500 uppercase dark:border-slate-800 dark:text-slate-500">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
              {kardex.map((entry, index) => {
                const meta = typeMeta[entry.type] ?? typeMeta.adjustment;
                return (
                  <tr
                    key={index}
                    className="transition-colors hover:bg-gray-50 dark:hover:bg-slate-800"
                  >
                    <td className="px-4 py-3 font-mono text-sm whitespace-nowrap text-gray-700 dark:text-slate-300">
                      {format(entry.date, 'dd/MM/yyyy HH:mm')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-slate-400">
                      {entry.reference}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
                    </td>
                    <td className="text-tsuma-primary-dark px-4 py-3 text-right font-mono text-sm font-semibold tabular-nums">
                      {entry.quantityIn > 0 ? entry.quantityIn : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm font-semibold text-red-600 tabular-nums dark:text-red-400">
                      {entry.quantityOut > 0 ? entry.quantityOut : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm font-semibold text-gray-900 tabular-nums dark:text-slate-100">
                      {entry.balance}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm text-gray-600 tabular-nums dark:text-slate-400">
                      {entry.unitCost
                        ? `USD ${entry.unitCost.toFixed(2)}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm text-gray-900 tabular-nums dark:text-slate-100">
                      {entry.totalCost
                        ? `USD ${entry.totalCost.toFixed(2)}`
                        : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
