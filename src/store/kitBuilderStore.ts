import { create } from "zustand";
import { Product, CapacityRef, LacoModelType, KitStyle } from "@/lib/types";
import { KitValidator } from "@/lib/kitValidator";

// --- Tipos de Estado ---

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
  selectedWrapper: Product | null; // Novo: Para validar Saco/Base
  selectedFiller: Product | null;
}

interface KitBuilderState {
  // Controle de UI
  isOpen: boolean;
  currentStep: 1 | 2 | 3 | 4; // Expandido para comportar o novo fluxo
  selectedKitId: string | null;
  selectedStyle: KitStyle | null;

  // Composição
  composition: KitCompositionState;

  // Ações
  openKitBuilder: (kitId?: string | null) => void;
  closeKitBuilder: () => void;
  setStep: (step: number) => void;
  setStyle: (style: KitStyle) => void;

  // Gestão de Base e Embalagem (Com Blindagem)
  setBaseContainer: (product: Product) => void;
  setWrapper: (product: Product | null) => void;
  getValidWrappers: (allWrappers: Product[]) => Product[];

  // Gestão de Itens (Com Validação de Volume e Altura)
  addItem: (
    product: Product,
    quantity: number
  ) => { success: boolean; reason?: string };
  updateItemQuantity: (
    productId: string,
    quantity: number
  ) => { success: boolean; reason?: string };
  removeItem: (productId: string) => void;

  // Finalização
  setRibbonSelection: (selection: RibbonSelectionState) => void;
  resetBuilder: () => void;
  calculateKitTotal: () => number;
}

// --- Configurações e Constantes ---

const INITIAL_COMPOSITION: KitCompositionState = {
  baseContainer: null,
  capacityRef: null,
  currentSlotCount: 0,
  internalItems: [],
  ribbonSelection: null,
  selectedWrapper: null,
  selectedFiller: null,
};

const MAX_SLOTS: Record<CapacityRef, number> = { P: 5, M: 10, G: 15 };

// --- Store ---

export const useKitBuilderStore = create<KitBuilderState>((set, get) => ({
  isOpen: false,
  currentStep: 1,
  selectedKitId: null,
  selectedStyle: null,
  composition: INITIAL_COMPOSITION,

  openKitBuilder: (kitId) =>
    set({
      isOpen: true,
      selectedKitId: kitId ?? null,
    }),

  closeKitBuilder: () => set({ isOpen: false }),

  setStep: (step: any) => set({ currentStep: step }),

  setStyle: (style) =>
    set({
      selectedStyle: style,
      currentStep: 2,
      composition: {
        ...get().composition,
        baseContainer: null,
        selectedWrapper: null,
      },
    }),

  setBaseContainer: (product) => {
    set((state) => ({
      composition: {
        ...state.composition,
        baseContainer: product,
        capacityRef: product.capacityRef || null,
        selectedWrapper: null, // Resetar saco ao mudar base (força re-validação)
      },
    }));
  },

  setWrapper: (product) =>
    set((state) => ({
      composition: { ...state.composition, selectedWrapper: product },
    })),

  /**
   * BLINDAGEM: Retorna apenas sacos que cabem no perímetro da base atual
   */
  getValidWrappers: (allWrappers) => {
    const { baseContainer } = get().composition;
    if (!baseContainer) return allWrappers;
    return allWrappers.filter((w) =>
      KitValidator.canWrapperFitBase(w, baseContainer)
    );
  },

  /**
   * ADICIONAR ITEM: Valida Volume (Slots) e Altura (Geometria)
   */
  addItem: (product, quantity) => {
    const { composition } = get();

    // 1. Validação de Volume (Slots)
    if (composition.capacityRef) {
      const maxSlots = MAX_SLOTS[composition.capacityRef];
      const itemSize = product.itemSize || 1;
      if (composition.currentSlotCount + itemSize * quantity > maxSlots) {
        return {
          success: false,
          reason: "A base escolhida não tem espaço suficiente.",
        };
      }
    }

    // 2. Validação de Altura (Se for caixa fechada)
    if (
      composition.baseContainer &&
      !KitValidator.canBoxClose(
        [{ product, quantity }],
        composition.baseContainer
      )
    ) {
      return {
        success: false,
        reason: "Este item é alto demais para esta embalagem.",
      };
    }

    set((state) => {
      const currentItems = [...state.composition.internalItems];
      const idx = currentItems.findIndex((i) => i.product.id === product.id);

      if (idx >= 0) currentItems[idx].quantity += quantity;
      else currentItems.push({ product, quantity });

      const newSlotCount = currentItems.reduce(
        (acc, i) => acc + (i.product.itemSize || 1) * i.quantity,
        0
      );

      return {
        composition: {
          ...state.composition,
          internalItems: currentItems,
          currentSlotCount: newSlotCount,
        },
      };
    });

    return { success: true };
  },

  updateItemQuantity: (productId, quantity) => {
    const { composition } = get();
    const item = composition.internalItems.find(
      (i) => i.product.id === productId
    );

    if (item && quantity > item.quantity) {
      const result = get().addItem(item.product, quantity - item.quantity);
      return result;
    }

    set((state) => {
      let newItems = [...state.composition.internalItems];
      if (quantity <= 0)
        newItems = newItems.filter((i) => i.product.id !== productId);
      else {
        const idx = newItems.findIndex((i) => i.product.id === productId);
        if (idx >= 0) newItems[idx].quantity = quantity;
      }

      const newSlotCount = newItems.reduce(
        (acc, i) => acc + (i.product.itemSize || 1) * i.quantity,
        0
      );
      return {
        composition: {
          ...state.composition,
          internalItems: newItems,
          currentSlotCount: newSlotCount,
        },
      };
    });

    return { success: true };
  },

  removeItem: (productId) => get().updateItemQuantity(productId, 0),

  setRibbonSelection: (selection) =>
    set((state) => ({
      composition: { ...state.composition, ribbonSelection: selection },
    })),

  resetBuilder: () =>
    set({
      currentStep: 1,
      selectedKitId: null,
      selectedStyle: null,
      composition: INITIAL_COMPOSITION,
    }),

  calculateKitTotal: () => {
    const { composition } = get();
    let total = 0;

    // 1. Base, Saco e Enchimento
    total += composition.baseContainer?.price || 0;
    total += composition.selectedWrapper?.price || 0;
    total += composition.selectedFiller?.price || 0;

    // 2. Itens Internos
    composition.internalItems.forEach((i) => {
      total += i.product.price * i.quantity;
    });

    // 3. Taxa de Serviço Dinâmica (Blindagem de lucro)
    const totalItems = composition.internalItems.reduce(
      (acc, i) => acc + i.quantity,
      0
    );
    total += KitValidator.calculateServiceFee(totalItems);

    // 4. Customização de Laço
    if (composition.ribbonSelection?.type === "CUSTOM") {
      total += composition.ribbonSelection.ribbonDetails?.assemblyCost || 0;
    }

    return total;
  },
}));
