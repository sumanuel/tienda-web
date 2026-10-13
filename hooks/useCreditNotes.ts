import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api';

export interface CreditNote {
  id: string;
  noteNumber: string;
  storeId: string;
  supplierId: string;
  purchaseReturnId: string;
  // El libro del proveedor está en USD; amountVes es el equivalente a la tasa
  // del momento de la devolución
  amountUsd: number;
  amountVes: number;
  exchangeRate: number;
  refundedUsd: number;
  remainingUsd: number;
  status: 'issued' | 'refunded';
  // Saldo a favor vigente con el proveedor y lo máximo reembolsable hoy
  availableCredit: number;
  maxRefund: number;
  notes?: string | null;
  createdAt: string;
  supplier?: { id: string; name: string; taxId?: string | null };
  purchaseReturn?: {
    id: string;
    returnNumber: string;
    purchase?: { id: string; purchaseNumber: string } | null;
  };
}

export interface CreditNotesFilters {
  storeId: string;
  supplierId?: string;
  status?: 'issued' | 'refunded';
  page?: number;
  limit?: number;
}

export interface CreditNotesResponse {
  creditNotes: CreditNote[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export function useCreditNotes() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCreditNotes = useCallback(
    async (
      filters: CreditNotesFilters
    ): Promise<CreditNotesResponse | null> => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, value.toString());
          }
        });

        return await apiClient.get<CreditNotesResponse>(
          `/api/credit-notes?${params.toString()}`
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Error al obtener notas de crédito'
        );
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const refundCreditNote = useCallback(
    async (id: string, amount: number, notes?: string): Promise<CreditNote> => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiClient.post<{
          message: string;
          creditNote: CreditNote;
        }>(`/api/credit-notes/${id}/refund`, { amount, notes });
        return response.creditNote;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Error al registrar el reembolso';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { loading, error, getCreditNotes, refundCreditNote };
}
