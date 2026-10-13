'use client';

import { Banknote, FileText } from 'lucide-react';
import { DualCurrency } from '@/components/common/DualCurrency';
import { StatusPill } from '@/components/common/StatusPill';
import { formatCurrency } from '@/lib/currency';
import type { CreditNote } from '@/hooks/useCreditNotes';

interface CreditNotesTableProps {
  creditNotes: CreditNote[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  onPageChange: (page: number) => void;
  onRefund: (creditNote: CreditNote) => void;
}

const thClass =
  'border-b border-gray-200 px-4 py-2.5 text-left font-mono text-[0.65rem] font-semibold tracking-widest whitespace-nowrap text-gray-500 uppercase dark:border-slate-800 dark:text-slate-500';

const formatDate = (dateString: string) =>
  new Intl.DateTimeFormat('es-VE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));

export function CreditNotesTable({
  creditNotes,
  pagination,
  onPageChange,
  onRefund,
}: CreditNotesTableProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm dark:border-slate-800">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-slate-950">
            <tr>
              <th className={thClass}>Nº Nota</th>
              <th className={thClass}>Fecha</th>
              <th className={thClass}>Proveedor</th>
              <th className={thClass}>Devolución</th>
              <th className={thClass}>Monto</th>
              <th className={thClass}>Reembolsado</th>
              <th className={thClass}>Estado</th>
              <th className={`${thClass} text-right`}>Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
            {creditNotes.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-center">
                    <FileText className="mb-4 h-12 w-12 text-gray-300 dark:text-slate-700" />
                    <p className="text-lg font-medium text-gray-700 dark:text-slate-300">
                      No hay notas de crédito
                    </p>
                    <p className="mt-1 text-sm text-gray-400 dark:text-slate-500">
                      Se generan solas cuando una devolución deja saldo a favor
                      con el proveedor.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              creditNotes.map((note) => (
                <tr
                  key={note.id}
                  className="transition-colors hover:bg-gray-50 dark:hover:bg-slate-800"
                >
                  <td className="px-4 py-3 font-mono text-sm font-medium whitespace-nowrap text-gray-900 dark:text-slate-100">
                    {note.noteNumber}
                  </td>
                  <td className="px-4 py-3 font-mono text-sm whitespace-nowrap text-gray-600 dark:text-slate-400">
                    {formatDate(note.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-slate-100">
                    {note.supplier?.name ?? 'N/A'}
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-gray-600 dark:text-slate-400">
                    {note.purchaseReturn?.returnNumber ?? '—'}
                    {note.purchaseReturn?.purchase && (
                      <span className="block text-xs text-gray-500 dark:text-slate-500">
                        {note.purchaseReturn.purchase.purchaseNumber}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <DualCurrency
                      ves={note.amountVes}
                      usd={note.amountUsd}
                      size="sm"
                      align="left"
                    />
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-gray-700 tabular-nums dark:text-slate-300">
                    {formatCurrency(note.refundedUsd, 'USD')}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill
                      tone={note.status === 'refunded' ? 'ok' : 'warn'}
                    >
                      {note.status === 'refunded' ? 'Reembolsada' : 'Emitida'}
                    </StatusPill>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onRefund(note)}
                      disabled={note.maxRefund <= 0}
                      title={
                        note.status === 'refunded'
                          ? 'La nota ya fue reembolsada'
                          : note.maxRefund <= 0
                            ? 'El saldo a favor ya se descontó de otras compras'
                            : 'Registrar reembolso'
                      }
                      className="hover:border-tsuma-primary hover:text-tsuma-primary inline-flex items-center gap-1.5 rounded-md border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-colors disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
                    >
                      <Banknote size={13} />
                      Reembolsar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {creditNotes.length > 0 && pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-slate-400">
            Mostrando {(pagination.page - 1) * pagination.limit + 1} -{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
            {pagination.total} notas
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
