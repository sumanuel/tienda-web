/**
 * Zustand Store para Clientes
 */

import { create } from 'zustand';
import { Customer } from '@/types/customer';

interface CustomersState {
  customers: Customer[];
  loading: boolean;
  error: string | null;

  // Actions
  setCustomers: (customers: Customer[]) => void;
  addCustomer: (customer: Customer) => void;
  updateCustomer: (customerId: string, data: Partial<Customer>) => void;
  removeCustomer: (customerId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useCustomersStore = create<CustomersState>((set) => ({
  customers: [],
  loading: false,
  error: null,

  setCustomers: (customers) => set({ customers }),

  addCustomer: (customer) =>
    set((state) => ({ customers: [...state.customers, customer] })),

  updateCustomer: (customerId, data) =>
    set((state) => ({
      customers: state.customers.map((c) =>
        c.id === customerId ? { ...c, ...data } : c
      ),
    })),

  removeCustomer: (customerId) =>
    set((state) => ({
      customers: state.customers.filter((c) => c.id !== customerId),
    })),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  reset: () =>
    set({
      customers: [],
      loading: false,
      error: null,
    }),
}));
