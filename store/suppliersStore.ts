/**
 * Zustand Store para Proveedores
 */

import { create } from 'zustand';
import { Supplier } from '@/types/supplier';

interface SuppliersState {
  suppliers: Supplier[];
  loading: boolean;
  error: string | null;

  // Actions
  setSuppliers: (suppliers: Supplier[]) => void;
  addSupplier: (supplier: Supplier) => void;
  updateSupplier: (supplierId: string, data: Partial<Supplier>) => void;
  removeSupplier: (supplierId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useSuppliersStore = create<SuppliersState>((set) => ({
  suppliers: [],
  loading: false,
  error: null,

  setSuppliers: (suppliers) => set({ suppliers }),

  addSupplier: (supplier) =>
    set((state) => ({ suppliers: [...state.suppliers, supplier] })),

  updateSupplier: (supplierId, data) =>
    set((state) => ({
      suppliers: state.suppliers.map((s) =>
        s.id === supplierId ? { ...s, ...data } : s
      ),
    })),

  removeSupplier: (supplierId) =>
    set((state) => ({
      suppliers: state.suppliers.filter((s) => s.id !== supplierId),
    })),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  reset: () =>
    set({
      suppliers: [],
      loading: false,
      error: null,
    }),
}));
