// src/store/kitBuilderStore.ts (VERSÃO FINAL CONSOLIDADA E CORRIGIDA)

import { create } from "zustand";
import { Product, CapacityRef, CartItem } from "@/lib/types";

// Lógica para cálculo de slots (peso do item)
const getProductSlotSize = (product: Product): number => product.itemSize || 1;

// Capacidade máxima de slots por gabarito (Placeholder)
const MAX_SLOTS: Record<CapacityRef, number> = {
  P: 5,
  M: 10,
  G: 15,
};

// Definição da Composição Atual do Kit (o "açaí" sendo montado)
interface KitBuilderComposition {
  baseContainer?: Product;
  capacityRef: CapacityRef | null;
  currentSlotCount: number;
  internalItems: { product: Product; quantity: number }[];
  wrapperAccessory?: Product;
  ribbonSelection:
    | { type: "PRONTO"; accessoryId: string }
    | { type: "CUSTOM"; ribbonDetails: CartItem["ribbonDetails"] }
    | { type: "PUXAR"; accessoryId: string }
    | { type: "NENHUM" }
    | null;
}

type KitBuilderStep = 1 | 2 | 3;

interface KitBuilderState {
  // Controle do Modal
  isOpen: boolean;
  selectedKitId: string | null;

  // Estado do Builder
  currentStep: KitBuilderStep;
  composition: KitBuilderComposition;

  // Ações
  // CORRIGIDO: Aceita string, null ou undefined
  openKitBuilder: (kitId?: string | null) => void;
  closeKitBuilder: () => void;
  setStep: (step: KitBuilderStep) => void;
  setBaseContainer: (base: Product) => void;
  addItem: (product: Product, quantity: number) => boolean;
  updateItemQuantity: (productId: string, quantity: number) => boolean;
  removeItem: (productId: string) => void;
  setRibbonSelection: (
    selection: KitBuilderComposition["ribbonSelection"]
  ) => void;
  calculateKitTotal: () => number;
}

export const useKitBuilderStore = create<KitBuilderState>((set, get) => ({
  isOpen: false,
  selectedKitId: null,

  currentStep: 1,
  composition: {
    capacityRef: null,
    currentSlotCount: 0,
    internalItems: [],
    ribbonSelection: null,
  },

  // CORRIGIDO: Recebe kitId (string | null | undefined) e garante que selectedKitId seja string | null
  openKitBuilder: (kitId) =>
    set({
      isOpen: true,
      selectedKitId: kitId ?? null, // Usa ?? para garantir que undefined se torne null
      currentStep: 1,
      composition: {
        capacityRef: null,
        currentSlotCount: 0,
        internalItems: [],
        ribbonSelection: null,
      },
    }),

  closeKitBuilder: () => set({ isOpen: false, selectedKitId: null }),

  setStep: (step) => set({ currentStep: step }),

  setBaseContainer: (base) =>
    set((state) => {
      if (base.type !== "BASE_CONTAINER" || !base.capacityRef) {
        return state;
      }

      const baseCapacityRef = base.capacityRef;
      const maxSlots = MAX_SLOTS[baseCapacityRef];

      let newSlotCount = 0;
      const newItems = state.composition.internalItems.filter((item) => {
        const itemSlots = getProductSlotSize(item.product) * item.quantity;
        if (newSlotCount + itemSlots <= maxSlots) {
          newSlotCount += itemSlots;
          return true;
        }
        return false;
      });

      return {
        composition: {
          ...state.composition,
          baseContainer: base,
          capacityRef: baseCapacityRef,
          internalItems: newItems,
          currentSlotCount: newSlotCount,
        },
        currentStep: 2,
      };
    }),

  addItem: (product, quantity) => {
    const state = get();
    const capacityRef = state.composition.capacityRef;
    const maxSlots = capacityRef ? MAX_SLOTS[capacityRef] : 0;
    const itemSlots = getProductSlotSize(product) * quantity;
    const newSlotCount = state.composition.currentSlotCount + itemSlots;

    if (!capacityRef || newSlotCount > maxSlots) {
      console.warn("Capacidade máxima excedida ou base não selecionada.");
      return false;
    }

    set((state) => {
      const existingIndex = state.composition.internalItems.findIndex(
        (item) => item.product.id === product.id
      );

      const newItems = [...state.composition.internalItems];
      if (existingIndex !== -1) {
        newItems[existingIndex].quantity += quantity;
      } else {
        newItems.push({ product, quantity });
      }

      return {
        composition: {
          ...state.composition,
          internalItems: newItems,
          currentSlotCount: newSlotCount,
        },
      };
    });
    return true;
  },

  updateItemQuantity: (productId, newQuantity) => {
    const state = get();
    const capacityRef = state.composition.capacityRef;
    const maxSlots = capacityRef ? MAX_SLOTS[capacityRef] : 0;

    const existingItem = state.composition.internalItems.find(
      (item) => item.product.id === productId
    );
    if (!existingItem) return false;

    const oldItemSlots =
      getProductSlotSize(existingItem.product) * existingItem.quantity;
    const newItemSlots = getProductSlotSize(existingItem.product) * newQuantity;
    const tentativeSlotCount =
      state.composition.currentSlotCount - oldItemSlots + newItemSlots;

    if (!capacityRef || tentativeSlotCount > maxSlots) {
      console.warn("Nova quantidade excede a capacidade máxima.");
      return false;
    }

    set((state) => {
      const newItems = state.composition.internalItems.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      );

      return {
        composition: {
          ...state.composition,
          internalItems: newItems.filter((item) => item.quantity > 0),
          currentSlotCount: tentativeSlotCount,
        },
      };
    });
    return true;
  },

  removeItem: (productId) =>
    set((state) => {
      const itemToRemove = state.composition.internalItems.find(
        (item) => item.product.id === productId
      );
      if (!itemToRemove) return state;

      const slotsToRemove =
        getProductSlotSize(itemToRemove.product) * itemToRemove.quantity;

      return {
        composition: {
          ...state.composition,
          internalItems: state.composition.internalItems.filter(
            (item) => item.product.id !== productId
          ),
          currentSlotCount: state.composition.currentSlotCount - slotsToRemove,
        },
      };
    }),

  setRibbonSelection: (selection) =>
    set((state) => ({
      composition: {
        ...state.composition,
        ribbonSelection: selection,
      },
    })),

  calculateKitTotal: () => {
    const state = get().composition;
    let total = 0;

    if (state.baseContainer) {
      total += state.baseContainer.price;
    }

    total += state.internalItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );

    if (state.wrapperAccessory) {
      total += state.wrapperAccessory.price;
    }

    if (state.ribbonSelection) {
      if (
        state.ribbonSelection.type === "CUSTOM" &&
        state.ribbonSelection.ribbonDetails
      ) {
        total += state.ribbonSelection.ribbonDetails.assemblyCost;
      }
    }

    return total;
  },
}));
