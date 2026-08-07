import { create } from 'zustand';
import type { CustomerTransaction } from '@/types/transaction';

interface CustomerTransactionsState {
  transactions: CustomerTransaction[];
  loading: boolean;
  error: string | null;

  // Actions
  setTransactions: (transactions: CustomerTransaction[]) => void;
  addTransaction: (transaction: CustomerTransaction) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useCustomerTransactionsStore = create<CustomerTransactionsState>(
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
