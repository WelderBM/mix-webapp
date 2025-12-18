// src/store/kitBuilderStore.ts (VERSÃO FINAL CORRIGIDA)

import { create } from "zustand";
import { Product, CapacityRef, LacoModelType } from "@/types"; // Importação correta de @/lib/types

// Tipos auxiliares para o estado interno do Builder
interface RibbonSelectionState {
  type: "NENHUM" | "PUXAR" | "PRONTO" | "CUSTOM";
  accessoryId?: string;
  ribbonDetails?: {
    modelo: LacoModelType;
    fitaPrincipalId: string;
    fitaSecundariaId?: string;
    cor?: string;
    tamanho: CapacityRef;
    metragemGasta: number;
    assemblyCost: number;
  };
}

interface KitCompositionState {
  baseContainer: Product | null;
  capacityRef: CapacityRef | null;
  currentSlotCount: number;
  internalItems: { product: Product; quantity: number }[];
  ribbonSelection: RibbonSelectionState | null;
}

interface KitBuilderState {
  // Estado de Controle
  isOpen: boolean;
  currentStep: 1 | 2 | 3;
  selectedKitId: string | null;

  // Estado da Composição
  composition: KitCompositionState;

  // Getters
  itemsCount: number;
  totalPrice: number;

  // Ações
  // CORREÇÃO AQUI: Aceita kitId opcional (string | null)
  openKitBuilder: (kitId?: string | null) => void;

  closeKitBuilder: () => void;
  setStep: (step: 1 | 2 | 3) => void;
  selectKit: (kitId: string) => void;

  setBaseContainer: (product: Product) => void;

  // Retorna boolean para indicar se conseguiu adicionar (validação de capacidade)
  addItem: (product: Product, quantity: number) => boolean;
  updateItemQuantity: (productId: string, quantity: number) => boolean;
  removeItem: (productId: string) => void;

  setRibbonSelection: (selection: RibbonSelectionState) => void;
  resetBuilder: () => void;
  calculateKitTotal: () => number;
}

const INITIAL_COMPOSITION: KitCompositionState = {
  baseContainer: null,
  capacityRef: null,
  currentSlotCount: 0,
  internalItems: [],
  ribbonSelection: null,
};

// Capacidade máxima de slots por gabarito
const MAX_SLOTS: Record<CapacityRef, number> = {
  P: 5,
  M: 10,
  G: 15,
};

export const useKitBuilderStore = create<KitBuilderState>((set, get) => ({
  isOpen: false,
  currentStep: 1,
  selectedKitId: null,
  composition: INITIAL_COMPOSITION,
  itemsCount: 0,
  totalPrice: 0,

  // IMPLEMENTAÇÃO CORRIGIDA: Recebe o ID e abre o modal
  openKitBuilder: (kitId) =>
    set({
      isOpen: true,
      selectedKitId: kitId ?? null, // Se vier undefined, vira null
      // Reset opcional ao abrir, dependendo da regra de negócio:
      // composition: INITIAL_COMPOSITION,
      // currentStep: 1
    }),

  closeKitBuilder: () => set({ isOpen: false }),

  setStep: (step) => set({ currentStep: step }),

  selectKit: (kitId) => {
    set({ selectedKitId: kitId });
  },

  setBaseContainer: (product) => {
    set((state) => ({
      composition: {
        ...state.composition,
        baseContainer: product,
        capacityRef: product.capacityRef || null,
      },
    }));
  },

  // Adiciona com verificação de capacidade
  addItem: (product, quantity) => {
    const state = get();
    const { composition } = state;

    // Se não tiver base selecionada, permite adicionar (fallback) ou bloqueia
    // Aqui assumimos que se tem capacityRef, validamos.
    if (composition.capacityRef) {
      const maxSlots = MAX_SLOTS[composition.capacityRef];
      const itemSize = product.itemSize || 1;
      const requiredSlots = itemSize * quantity;

      if (composition.currentSlotCount + requiredSlots > maxSlots) {
        // Retorna false para a UI saber que falhou (opcional: disparar toast aqui)
        return false;
      }
    }

    set((state) => {
      const currentItems = [...state.composition.internalItems];
      const itemIndex = currentItems.findIndex(
        (i) => i.product.id === product.id
      );

      if (itemIndex >= 0) {
        currentItems[itemIndex].quantity += quantity;
      } else {
        currentItems.push({ product, quantity });
      }

      // Recalcula slots
      const newSlotCount = currentItems.reduce(
        (acc, item) => acc + (item.product.itemSize || 1) * item.quantity,
        0
      );

      // Recalcula contagem de itens
      const newCount = currentItems.reduce(
        (acc, item) => acc + item.quantity,
        0
      );

      return {
        composition: {
          ...state.composition,
          internalItems: currentItems,
          currentSlotCount: newSlotCount,
        },
        itemsCount: newCount,
      };
    });

    return true; // Sucesso
  },

  updateItemQuantity: (productId, quantity) => {
    const state = get();
    const { composition } = state;

    // Validação de Capacidade na atualização
    if (composition.capacityRef && quantity > 0) {
      const item = composition.internalItems.find(
        (i) => i.product.id === productId
      );
      if (item) {
        const diff = quantity - item.quantity;
        if (diff > 0) {
          // Se está aumentando
          const itemSize = item.product.itemSize || 1;
          const requiredSlots = itemSize * diff;
          const maxSlots = MAX_SLOTS[composition.capacityRef];

          if (composition.currentSlotCount + requiredSlots > maxSlots) {
            return false;
          }
        }
      }
    }

    set((state) => {
      let currentItems = [...state.composition.internalItems];

      if (quantity <= 0) {
        currentItems = currentItems.filter((i) => i.product.id !== productId);
      } else {
        const itemIndex = currentItems.findIndex(
          (i) => i.product.id === productId
        );
        if (itemIndex >= 0) {
          currentItems[itemIndex].quantity = quantity;
        }
      }

      const newSlotCount = currentItems.reduce(
        (acc, item) => acc + (item.product.itemSize || 1) * item.quantity,
        0
      );
      const newCount = currentItems.reduce(
        (acc, item) => acc + item.quantity,
        0
      );

      return {
        composition: {
          ...state.composition,
          internalItems: currentItems,
          currentSlotCount: newSlotCount,
        },
        itemsCount: newCount,
      };
    });

    return true;
  },

  removeItem: (productId) => {
    get().updateItemQuantity(productId, 0);
  },

  setRibbonSelection: (selection) => {
    set((state) => ({
      composition: {
        ...state.composition,
        ribbonSelection: selection,
      },
    }));
  },

  resetBuilder: () => {
    set({
      currentStep: 1,
      selectedKitId: null,
      composition: INITIAL_COMPOSITION,
      itemsCount: 0,
      totalPrice: 0,
    });
  },

  calculateKitTotal: () => {
    const state = get();
    let total = 0;

    // 1. Base
    if (state.composition.baseContainer) {
      total += state.composition.baseContainer.price;
    }

    // 2. Itens
    state.composition.internalItems.forEach((item) => {
      total += item.product.price * item.quantity;
    });

    // 3. Laço/Fita
    const ribbon = state.composition.ribbonSelection;
    if (ribbon) {
      if (ribbon.type === "PUXAR" || ribbon.type === "PRONTO") {
        // Custo do acessório seria somado se tivéssemos o preço aqui.
        // Em um cenário real, você buscaria o preço do acessório pelo ID no productStore
      } else if (ribbon.type === "CUSTOM" && ribbon.ribbonDetails) {
        total += ribbon.ribbonDetails.assemblyCost;
      }
    }

    return total;
  },
}));
