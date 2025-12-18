import { create } from "zustand";
import { Product } from "@/types";

export interface KitItem {
  product: Product;
  quantity: number;
}

interface KitComposition {
  baseContainer: Product | null;
  selectedWrapper: Product | null;
  internalItems: KitItem[];
  currentSlotCount: number;
}

interface KitBuilderState {
  isOpen: boolean;
  currentStep: number;
  selectedStyle: "SACO_EXPRESS" | "CAIXA_FECHADA" | "CESTA_VITRINE" | null;
  composition: KitComposition;

  openKitBuilder: () => void;
  closeKitBuilder: () => void;
  setStep: (step: number) => void;
  setStyle: (style: "SACO_EXPRESS" | "CAIXA_FECHADA" | "CESTA_VITRINE") => void;
  resetBuilder: () => void;

  addItem: (
    product: Product,
    quantity?: number
  ) => { success: boolean; reason?: string };
  removeItem: (productId: string) => void;
  updateItemQuantity: (productId: string, quantity: number) => void;

  setBaseContainer: (base: Product) => void;
  setWrapper: (wrapper: Product) => void;

  getValidWrappers: (allWrappers: Product[]) => Product[];
}

export const useKitBuilderStore = create<KitBuilderState>((set, get) => ({
  isOpen: false,
  currentStep: 1,
  selectedStyle: null,
  composition: {
    baseContainer: null,
    selectedWrapper: null,
    internalItems: [],
    currentSlotCount: 0,
  },

  openKitBuilder: () => set({ isOpen: true }),
  closeKitBuilder: () => set({ isOpen: false }),

  resetBuilder: () =>
    set({
      currentStep: 1,
      selectedStyle: null,
      composition: {
        baseContainer: null,
        selectedWrapper: null,
        internalItems: [],
        currentSlotCount: 0,
      },
    }),

  setStep: (step) => set({ currentStep: step }),

  setStyle: (style) => {
    set((state) => ({
      selectedStyle: style,
      composition: {
        ...state.composition,
        baseContainer: null,
        selectedWrapper: null,
      },
    }));
  },

  addItem: (product, quantity = 1) => {
    const { composition } = get();

    if (!product.inStock) return { success: false, reason: "Fora de estoque." };

    const itemSize = product.itemSize || 1;
    const sizeToAdd = itemSize * quantity;

    if (composition.baseContainer) {
      const capacity = composition.baseContainer.capacity || 10;
      if (composition.currentSlotCount + sizeToAdd > capacity) {
        return {
          success: false,
          reason: "A embalagem não comporta mais itens.",
        };
      }
    }

    // IMUTABILIDADE ESTRITA AQUI
    const newItems = [...composition.internalItems];
    const existingIndex = newItems.findIndex(
      (i) => i.product.id === product.id
    );

    if (existingIndex >= 0) {
      // Cria um NOVO objeto para o item atualizado
      newItems[existingIndex] = {
        ...newItems[existingIndex],
        quantity: newItems[existingIndex].quantity + quantity,
      };
    } else {
      newItems.push({ product, quantity });
    }

    set((state) => ({
      composition: {
        ...state.composition,
        internalItems: newItems,
        currentSlotCount: state.composition.currentSlotCount + sizeToAdd,
      },
    }));

    return { success: true };
  },

  removeItem: (productId) => {
    const { composition } = get();
    const targetItem = composition.internalItems.find(
      (i) => i.product.id === productId
    );
    if (!targetItem) return;

    const sizeToRemove =
      (targetItem.product.itemSize || 1) * targetItem.quantity;
    const newItems = composition.internalItems.filter(
      (i) => i.product.id !== productId
    );

    set((state) => ({
      composition: {
        ...state.composition,
        internalItems: newItems,
        currentSlotCount: Math.max(
          0,
          state.composition.currentSlotCount - sizeToRemove
        ),
      },
    }));
  },

  updateItemQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }

    const { composition } = get();
    const itemIndex = composition.internalItems.findIndex(
      (i) => i.product.id === productId
    );
    if (itemIndex === -1) return;

    const item = composition.internalItems[itemIndex];
    const sizePerUnit = item.product.itemSize || 1;
    const diff = quantity - item.quantity;
    const sizeDiff = diff * sizePerUnit;

    if (diff > 0 && composition.baseContainer) {
      const capacity = composition.baseContainer.capacity || 10;
      if (composition.currentSlotCount + sizeDiff > capacity) return;
    }

    // IMUTABILIDADE ESTRITA
    const newItems = [...composition.internalItems];
    newItems[itemIndex] = { ...item, quantity: quantity };

    set((state) => ({
      composition: {
        ...state.composition,
        internalItems: newItems,
        currentSlotCount: state.composition.currentSlotCount + sizeDiff,
      },
    }));
  },

  setBaseContainer: (base) => {
    set((state) => ({
      composition: {
        ...state.composition,
        baseContainer: base,
        selectedWrapper: null, // Reseta o saco ao mudar a base
      },
    }));
  },

  setWrapper: (wrapper) => {
    set((state) => ({
      composition: {
        ...state.composition,
        selectedWrapper: wrapper,
      },
    }));
  },

  getValidWrappers: (allWrappers) => {
    const { composition } = get();
    const { baseContainer } = composition;

    if (!baseContainer)
      return allWrappers.filter((w) => w.kitStyle === "SACO_EXPRESS");

    const reqSize = baseContainer.requiredWrapperSize;
    if (!reqSize || reqSize === "N/A") {
      return allWrappers.filter(
        (w) => w.category === "Decorados" || w.wrapperSize === "N/A"
      );
    }

    return allWrappers.filter(
      (w) => w.wrapperSize === reqSize || w.wrapperSize === "60x80"
    );
  },
}));
