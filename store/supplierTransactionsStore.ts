import { create } from 'zustand';
import type { SupplierTransaction } from '@/types/transaction';

interface SupplierTransactionsState {
  transactions: SupplierTransaction[];
  loading: boolean;
  error: string | null;

  // Actions
  setTransactions: (transactions: SupplierTransaction[]) => void;
  addTransaction: (transaction: SupplierTransaction) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useSupplierTransactionsStore = create<SupplierTransactionsState>(
  (set) => ({
    transactions: [],
    loading: false,
    error: null,

    setTransactions: (transactions) => set({ transactions }),

    addTransaction: (transaction) =>
      set((state) => ({
        transactions: [transaction, ...state.transactions],
      })),

    setLoading: (loading) => set({ loading }),

    setError: (error) => set({ error }),

    reset: () =>
      set({
        transactions: [],
        loading: false,
        error: null,
      }),
  })
);
