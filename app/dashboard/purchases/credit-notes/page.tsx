'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCreditNotes, type CreditNote } from '@/hooks/useCreditNotes';
import { CreditNotesTable } from '@/components/purchases/CreditNotesTable';
import { RefundDialog } from '@/components/purchases/RefundDialog';
import { Loader2, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';

type StatusFilter = '' | 'issued' | 'refunded';

export default function CreditNotesPage() {
  const { profile } = useAuth();
  const { getCreditNotes, loading } = useCreditNotes();
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [status, setStatus] = useState<StatusFilter>('');
  const [page, setPage] = useState(1);
  const [refunding, setRefunding] = useState<CreditNote | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1,
  });

  const storeId = profile?.storeId;

  const loadNotes = useCallback(async () => {
    if (!storeId) return;

    const response = await getCreditNotes({
      storeId,
      status: status || undefined,
      page,
      limit: 20,
    });

    if (response) {
      setCreditNotes(response.creditNotes);
      setPagination(response.pagination);
    } else {
      toast.error('Error al cargar las notas de crédito');
    }
  }, [storeId, status, page, getCreditNotes]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  if (!profile) {
    return (
      <div className="text-brand-primary flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6 bg-gray-50 p-6 dark:bg-slate-950">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
              Notas de Crédito
            </h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Saldo a favor con proveedores por devoluciones de compras ya
              pagadas.
            </p>
          </div>
        </div>

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as StatusFilter);
            setPage(1);
          }}
          className="focus:border-brand-primary focus:ring-brand-primary rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:ring-1 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
        >
          <option value="">Todas</option>
          <option value="issued">Emitidas</option>
          <option value="refunded">Reembolsadas</option>
        </select>
      </div>

      {loading && creditNotes.length === 0 ? (
        <div className="text-brand-primary flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-12 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Loader2 className="mb-4 h-8 w-8 animate-spin" />
          <p className="text-gray-500 dark:text-slate-400">
            Cargando notas de crédito...
          </p>
        </div>
      ) : (
        <CreditNotesTable
          creditNotes={creditNotes}
          pagination={pagination}
          onPageChange={setPage}
          onRefund={setRefunding}
        />
      )}

      <RefundDialog
        creditNote={refunding}
        onClose={() => setRefunding(null)}
        onRefunded={loadNotes}
      />
    </div>
  );
}
