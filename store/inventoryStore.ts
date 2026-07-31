import { create } from 'zustand';
import { InventoryMovement, StockAlert } from '@/types/inventory';

interface InventoryState {
  movements: InventoryMovement[];
  alerts: StockAlert[];
  loading: boolean;
  error: string | null;

  // Actions
  setMovements: (movements: InventoryMovement[]) => void;
  addMovement: (movement: InventoryMovement) => void;
  setAlerts: (alerts: StockAlert[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useInventoryStore = create<InventoryState>((set) => ({
  movements: [],
  alerts: [],
  loading: false,
  error: null,

  setMovements: (movements) => set({ movements }),
  addMovement: (movement) =>
    set((state) => ({ movements: [movement, ...state.movements] })),
  setAlerts: (alerts) => set({ alerts }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  reset: () =>
    set({
      movements: [],
      alerts: [],
      loading: false,
      error: null,
    }),
}));
