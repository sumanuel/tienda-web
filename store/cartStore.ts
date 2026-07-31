import { create } from 'zustand';
import { CartItem } from '@/types/sale';

interface CartState {
  items: CartItem[];
  currency: string;

  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateDiscount: (productId: string, discount: number) => void;
  clearCart: () => void;
  setCurrency: (currency: string) => void;

  // Computed values
  getSubtotal: () => number;
  getDiscount: () => number;
  getTax: (taxRate: number) => number;
  getTotal: (taxRate: number) => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  currency: 'USD',

  addItem: (item) =>
    set((state) => {
      // Verificar si el producto ya está en el carrito
      const existingIndex = state.items.findIndex(
        (i) => i.productId === item.productId
      );

      if (existingIndex >= 0) {
        // Si existe, incrementar cantidad
        const newItems = [...state.items];
        const existingItem = newItems[existingIndex];

        newItems[existingIndex] = {
          ...existingItem,
          quantity: existingItem.quantity + item.quantity,
          subtotal:
            (existingItem.quantity + item.quantity) *
            existingItem.price *
            (1 - existingItem.discount / 100),
        };

        return { items: newItems };
      } else {
        // Si no existe, agregar
        return { items: [...state.items, item] };
      }
    }),

  removeItem: (productId) =>
    set((state) => ({
      items: state.items.filter((item) => item.productId !== productId),
    })),

  updateQuantity: (productId, quantity) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.productId === productId
          ? {
              ...item,
              quantity,
              subtotal: quantity * item.price * (1 - item.discount / 100),
            }
          : item
      ),
    })),

  updateDiscount: (productId, discount) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.productId === productId
          ? {
              ...item,
              discount,
              subtotal: item.quantity * item.price * (1 - discount / 100),
            }
          : item
      ),
    })),

  clearCart: () => set({ items: [] }),

  setCurrency: (currency) => set({ currency }),

  getSubtotal: () => {
    const state = get();
    return state.items.reduce((sum, item) => sum + item.subtotal, 0);
  },

  getDiscount: () => {
    const state = get();
    return state.items.reduce((sum, item) => {
      const discountAmount = item.quantity * item.price * (item.discount / 100);
      return sum + discountAmount;
    }, 0);
  },

  getTax: (taxRate) => {
    const subtotal = get().getSubtotal();
    return subtotal * (taxRate / 100);
  },

  getTotal: (taxRate) => {
    const subtotal = get().getSubtotal();
    const tax = get().getTax(taxRate);
    return subtotal + tax;
  },
}));
