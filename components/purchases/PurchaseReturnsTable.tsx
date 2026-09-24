'use client';

import { Undo2 } from 'lucide-react';
import { DualCurrency } from '@/components/common/DualCurrency';
import type { PurchaseReturn } from '@/hooks/usePurchaseReturns';

interface PurchaseReturnsTableProps {
  purchaseReturns: PurchaseReturn[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  onPageChange: (page: number) => void;
}

export function PurchaseReturnsTable({
  purchaseReturns,
  pagination,
  onPageChange,
}: PurchaseReturnsTableProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-VE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm dark:border-slate-800">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-slate-950">
            <tr>
              <th className="border-b border-gray-200 px-4 py-2.5 text-left font-mono text-[0.65rem] font-semibold tracking-widest whitespace-nowrap text-gray-500 uppercase dark:border-slate-800 dark:text-slate-500">
                Nº Devolución
              </th>
              <th className="border-b border-gray-200 px-4 py-2.5 text-left font-mono text-[0.65rem] font-semibold tracking-widest whitespace-nowrap text-gray-500 uppercase dark:border-slate-800 dark:text-slate-500">
                Fecha
              </th>
              <th className="border-b border-gray-200 px-4 py-2.5 text-left font-mono text-[0.65rem] font-semibold tracking-widest whitespace-nowrap text-gray-500 uppercase dark:border-slate-800 dark:text-slate-500">
                Proveedor
              </th>
              <th className="border-b border-gray-200 px-4 py-2.5 text-left font-mono text-[0.65rem] font-semibold tracking-widest whitespace-nowrap text-gray-500 uppercase dark:border-slate-800 dark:text-slate-500">
                Compra
              </th>
              <th className="border-b border-gray-200 px-4 py-2.5 text-left font-mono text-[0.65rem] font-semibold tracking-widest whitespace-nowrap text-gray-500 uppercase dark:border-slate-800 dark:text-slate-500">
                Motivo
              </th>
              <th className="border-b border-gray-200 px-4 py-2.5 text-left font-mono text-[0.65rem] font-semibold tracking-widest whitespace-nowrap text-gray-500 uppercase dark:border-slate-800 dark:text-slate-500">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
            {purchaseReturns.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-center">
                    <Undo2 className="mb-4 h-12 w-12 text-gray-300 dark:text-slate-700" />
                    <p className="text-lg font-medium text-gray-700 dark:text-slate-300">
                      No se encontraron devoluciones
                    </p>
                    <p className="mt-1 text-sm text-gray-400 dark:text-slate-500">
                      Aún no se han registrado devoluciones de compra.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              purchaseReturns.map((purchaseReturn) => (
                <tr
                  key={purchaseReturn.id}
                  className="transition-colors hover:bg-gray-50 dark:hover:bg-slate-800"
                >
                  <td className="px-4 py-3 font-mono text-sm font-medium whitespace-nowrap text-gray-900 dark:text-slate-100">
                    {purchaseReturn.returnNumber}
                  </td>
                  <td className="px-4 py-3 font-mono text-sm whitespace-nowrap text-gray-600 dark:text-slate-400">
                    {formatDate(purchaseReturn.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-slate-100">
                    {purchaseReturn.supplier?.name || 'N/A'}
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-gray-600 dark:text-slate-400">
                    {purchaseReturn.purchase?.purchaseNumber || '—'}
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-sm text-gray-600 dark:text-slate-400">
                    {purchaseReturn.reason}
                  </td>
                  <td className="px-4 py-3">
                    <DualCurrency
                      ves={purchaseReturn.total}
                      usd={purchaseReturn.totalReference}
                      exchangeRate={purchaseReturn.exchangeRate}
                      size="sm"
                      align="left"
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {purchaseReturns.length > 0 && pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-slate-400">
            Mostrando {(pagination.page - 1) * pagination.limit + 1} -{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)}{' '}
            de {pagination.total} devoluciones
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Anterior
            </button>
            <span className="px-2 font-mono text-xs text-gray-600 dark:text-slate-400">
              Página {pagination.page} de {pagination.pages}
            </span>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
