import { create } from 'zustand';
import type { CartItem, Product } from '../types';

interface CartState {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  updateNote: (productId: number, note: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()((set, get) => ({
  items: [],

  addItem: (product: Product) => {
    set((state: CartState) => {
      const existing = state.items.find((i: CartItem) => i.product.id === product.id);
      if (existing) {
        return {
          items: state.items.map((i: CartItem) =>
            i.product.id === product.id
              ? { ...i, quantity: i.quantity + 1 }
              : i
          ),
        };
      }
      return { items: [...state.items, { product, quantity: 1, note: '' }] };
    });
  },

  removeItem: (productId: number) => {
    set((state: CartState) => ({
      items: state.items.filter((i: CartItem) => i.product.id !== productId),
    }));
  },

  updateQuantity: (productId: number, quantity: number) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    set((state: CartState) => ({
      items: state.items.map((i: CartItem) =>
        i.product.id === productId ? { ...i, quantity } : i
      ),
    }));
  },

  updateNote: (productId: number, note: string) => {
    set((state: CartState) => ({
      items: state.items.map((i: CartItem) =>
        i.product.id === productId ? { ...i, note } : i
      ),
    }));
  },

  clearCart: () => set({ items: [] }),

  getTotal: () => {
    return get().items.reduce(
      (total: number, item: CartItem) => total + item.product.price * item.quantity,
      0
    );
  },

  getItemCount: () => {
    return get().items.reduce((count: number, item: CartItem) => count + item.quantity, 0);
  },
}));
