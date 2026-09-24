'use client';

import { useState } from 'react';
import {
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ShoppingBag,
} from 'lucide-react';
import { PurchaseDetailModal } from './PurchaseDetailModal';
import { CancelPurchaseButton } from './CancelPurchaseButton';
import { DualCurrency } from '@/components/common/DualCurrency';
import { StatusPill, StatusPillTone } from '@/components/common/StatusPill';
import type { Purchase } from '@/hooks/usePurchases';

interface PurchasesTableProps {
  purchases: Purchase[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  onPageChange: (page: number) => void;
  onRefresh: () => void;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  credito: 'Crédito',
};

const statusMeta: Record<string, { label: string; tone: StatusPillTone }> = {
  completed: { label: 'Completada', tone: 'ok' },
  cancelled: { label: 'Cancelada', tone: 'crit' },
};

export function PurchasesTable({
  purchases,
  pagination,
  onPageChange,
  onRefresh,
}: PurchasesTableProps) {
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(
    null
  );
  const [showDetailModal, setShowDetailModal] = useState(false);

  const handleViewDetail = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setShowDetailModal(true);
  };

  const handleCancelSuccess = () => {
    setShowDetailModal(false);
    setSelectedPurchase(null);
    onRefresh();
  };

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

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-VE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'UTC',
    }).format(date);
  };

  return (
    <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm dark:border-slate-800">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-slate-950">
            <tr>
              <th className="border-b border-gray-200 px-4 py-2.5 text-left font-mono text-[0.65rem] font-semibold tracking-widest whitespace-nowrap text-gray-500 uppercase dark:border-slate-800 dark:text-slate-500">
                Nº Compra
              </th>
              <th className="border-b border-gray-200 px-4 py-2.5 text-left font-mono text-[0.65rem] font-semibold tracking-widest whitespace-nowrap text-gray-500 uppercase dark:border-slate-800 dark:text-slate-500">
                Fecha
              </th>
              <th className="border-b border-gray-200 px-4 py-2.5 text-left font-mono text-[0.65rem] font-semibold tracking-widest whitespace-nowrap text-gray-500 uppercase dark:border-slate-800 dark:text-slate-500">
                Proveedor
              </th>
              <th className="border-b border-gray-200 px-4 py-2.5 text-left font-mono text-[0.65rem] font-semibold tracking-widest whitespace-nowrap text-gray-500 uppercase dark:border-slate-800 dark:text-slate-500">
                Método de Pago
              </th>
              <th className="border-b border-gray-200 px-4 py-2.5 text-left font-mono text-[0.65rem] font-semibold tracking-widest whitespace-nowrap text-gray-500 uppercase dark:border-slate-800 dark:text-slate-500">
                Total
              </th>
              <th className="border-b border-gray-200 px-4 py-2.5 text-left font-mono text-[0.65rem] font-semibold tracking-widest whitespace-nowrap text-gray-500 uppercase dark:border-slate-800 dark:text-slate-500">
                Estado
              </th>
              <th className="border-b border-gray-200 px-4 py-2.5 text-right font-mono text-[0.65rem] font-semibold tracking-widest whitespace-nowrap text-gray-500 uppercase dark:border-slate-800 dark:text-slate-500">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
            {purchases.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-center">
                    <ShoppingBag className="mb-4 h-12 w-12 text-gray-300 dark:text-slate-700" />
                    <p className="text-lg font-medium text-gray-700 dark:text-slate-300">
                      No se encontraron compras
                    </p>
                    <p className="mt-1 text-sm text-gray-400 dark:text-slate-500">
                      Intenta ajustar los filtros de búsqueda.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              purchases.map((purchase) => {
                const meta = statusMeta[purchase.status] ?? {
                  label: purchase.status,
                  tone: 'mute' as StatusPillTone,
                };
                return (
                  <tr
                    key={purchase.id}
                    className="transition-colors hover:bg-gray-50 dark:hover:bg-slate-800"
                  >
                    <td className="px-4 py-3 font-mono text-sm font-medium whitespace-nowrap text-gray-900 dark:text-slate-100">
                      {purchase.purchaseNumber}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm whitespace-nowrap text-gray-600 dark:text-slate-400">
                      {formatDate(purchase.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <p className="font-medium text-gray-900 dark:text-slate-100">
                        {purchase.supplier?.name || 'N/A'}
                      </p>
                      {purchase.invoiceNumber && (
                        <p className="font-mono text-xs text-gray-500 dark:text-slate-500">
                          Factura: {purchase.invoiceNumber}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="text-gray-700 dark:text-slate-300">
                        {PAYMENT_METHOD_LABELS[purchase.paymentMethod] ||
                          purchase.paymentMethod}
                      </span>
                      {purchase.dueDate && (
                        <p className="font-mono text-xs text-gray-500 dark:text-slate-500">
                          Vence: {formatDueDate(purchase.dueDate)}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <DualCurrency
                        ves={purchase.total}
                        usd={purchase.totalReference}
                        exchangeRate={purchase.exchangeRate}
                        size="sm"
                        align="left"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => handleViewDetail(purchase)}
                          className="hover:border-tsuma-primary hover:text-tsuma-primary flex items-center gap-1.5 rounded-md border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-colors dark:border-slate-700 dark:text-slate-300"
                          title="Ver detalle"
                        >
                          <Eye size={13} />
                        </button>
                        {purchase.status === 'completed' && (
                          <CancelPurchaseButton
                            purchaseId={purchase.id}
                            purchaseNumber={purchase.purchaseNumber}
                            onSuccess={handleCancelSuccess}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {purchases.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-gray-600 dark:text-slate-400">
            Mostrando {(pagination.page - 1) * pagination.limit + 1} -{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)}{' '}
            de {pagination.total} compras
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(1)}
              disabled={pagination.page === 1}
              className="rounded-lg border border-gray-200 p-1.5 text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="rounded-lg border border-gray-200 p-1.5 text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="px-2 font-mono text-xs text-gray-600 dark:text-slate-400">
              Página {pagination.page} de {pagination.pages}
            </span>

            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="rounded-lg border border-gray-200 p-1.5 text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => onPageChange(pagination.pages)}
              disabled={pagination.page >= pagination.pages}
              className="rounded-lg border border-gray-200 p-1.5 text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal de detalle */}
      {selectedPurchase && (
        <PurchaseDetailModal
          purchase={selectedPurchase}
          open={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedPurchase(null);
          }}
          onCancelSuccess={handleCancelSuccess}
        />
      )}
    </div>
  );
}
