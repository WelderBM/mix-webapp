import { create } from "zustand";
import { CartItem } from "@/types/cart";
import { toast } from "sonner";

interface CartStore {
  items: CartItem[];
  isCartOpen: boolean;

  addItem: (item: CartItem) => void;
  removeItem: (cartId: string) => void;
  updateQuantity: (cartId: string, quantity: number) => void;

  openCart: () => void;
  closeCart: () => void;
  clearCart: () => void;

  getCartTotal: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  isCartOpen: false,

  addItem: (item) => {
    set((state) => {
      let existingItem = null;

      if (item.type === "SIMPLE" && item.product) {
        existingItem = state.items.find(
          (i) =>
            i.type === "SIMPLE" &&
            i.product?.id === item.product?.id &&
            i.selectedVariant?.id === item.selectedVariant?.id
        );
      } else if (item.type === "CUSTOM_BALLOON" && item.balloonDetails) {
        existingItem = state.items.find(
          (i) =>
            i.type === "CUSTOM_BALLOON" &&
            i.balloonDetails?.typeId === item.balloonDetails?.typeId &&
            i.balloonDetails?.size === item.balloonDetails?.size &&
            i.balloonDetails?.color === item.balloonDetails?.color
        );
      } else if (item.type === "CUSTOM_RIBBON") {
        // Para laços, comparamos o nome/detalhes que definem o laço
        existingItem = state.items.find(
          (i) =>
            i.type === "CUSTOM_RIBBON" &&
            i.product?.id === item.product?.id &&
            i.kitName === item.kitName
        );
      } else if (item.type === "CUSTOM_KIT") {
        // Kits são mais complexos, mas se tiverem o mesmo kitName e kitTotalAmount, tratamos como igual
        // (Isso assume que o nome do kit é gerado de forma única para sua composição)
        existingItem = state.items.find(
          (i) =>
            i.type === "CUSTOM_KIT" &&
            i.kitName === item.kitName &&
            i.kitTotalAmount === item.kitTotalAmount
        );
      }

      if (existingItem) {
        const updatedItems = state.items.map((i) =>
          i.cartId === existingItem.cartId
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
        toast.success(
          `Mais ${item.quantity}x ${
            item.product?.name || item.kitName || "item"
          } adicionado!`
        );
        return { items: updatedItems };
      }

      toast.success(
        `${
          item.product?.name || item.kitName || "Item Personalizado"
        } adicionado!`
      );
      return { items: [...state.items, item] };
    });
  },

  removeItem: (cartId) => {
    set((state) => {
      const updatedItems = state.items.filter((item) => item.cartId !== cartId);
      toast.info("Item removido do carrinho.");
      return { items: updatedItems };
    });
  },

  updateQuantity: (cartId, quantity) => {
    if (quantity < 1) return get().removeItem(cartId);

    set((state) => ({
      items: state.items.map((item) =>
        item.cartId === cartId ? { ...item, quantity: quantity } : item
      ),
    }));
  },

  openCart: () => set({ isCartOpen: true }),
  closeCart: () => set({ isCartOpen: false }),
  clearCart: () => {
    set({ items: [] });
    toast.info("Carrinho limpo.");
  },

  getCartTotal: () => {
    const state = get();
    return state.items.reduce((total, item) => {
      let itemPrice = 0;

      if (item.type === "SIMPLE" && item.product) {
        const unitPrice = item.selectedVariant?.price || item.product.price;
        itemPrice = unitPrice * item.quantity;
      } else if (
        item.type === "CUSTOM_KIT" ||
        item.type === "CUSTOM_RIBBON" ||
        item.type === "CUSTOM_BALLOON"
      ) {
        itemPrice = (item.kitTotalAmount || 0) * item.quantity;
      }

      return total + itemPrice;
    }, 0);
  },
}));
