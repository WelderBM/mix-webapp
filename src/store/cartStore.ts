import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItem } from "@/lib/types";

interface CartState {
  items: CartItem[];
  isCartOpen: boolean;

  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;

  addItem: (item: CartItem) => void;
  removeItem: (cartId: string) => void;
  clearCart: () => void;

  getCartTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isCartOpen: false,

      openCart: () => set({ isCartOpen: true }),
      closeCart: () => set({ isCartOpen: false }),
      toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),

      addItem: (newItem) =>
        set((state) => {
          if (newItem.type === "SIMPLE" && newItem.product) {
            const existingItem = state.items.find(
              (i) =>
                i.type === "SIMPLE" && i.product?.id === newItem.product?.id
            );

            if (existingItem) {
              return {
                items: state.items.map((i) =>
                  i.cartId === existingItem.cartId
                    ? { ...i, quantity: i.quantity + newItem.quantity }
                    : i
                ),
              };
            }
          }
          return { items: [...state.items, newItem] };
        }),

      removeItem: (cartId) =>
        set((state) => ({
          items: state.items.filter((i) => i.cartId !== cartId),
        })),

      clearCart: () => set({ items: [] }),

      getCartTotal: () => {
        const { items } = get();
        return items.reduce((total, item) => {
          if (item.type === "SIMPLE" && item.product) {
            return total + item.product.price * item.quantity;
          }
          if (item.type === "CUSTOM_KIT") {
            return total + (item.kitTotalAmount || 0);
          }
          return total;
        }, 0);
      },
    }),
    {
      name: "mix-webapp-cart",
    }
  )
);
