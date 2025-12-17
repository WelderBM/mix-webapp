import { create } from "zustand";
import { Product, CapacityRef, LacoModelType } from "@/types";

// Tipos auxiliares para o estado interno do Builder
interface RibbonSelectionState {
  type: "NENHUM" | "PUXAR" | "PRONTO" | "CUSTOM";
  accessoryId?: string; // Para PUXAR ou PRONTO
  ribbonDetails?: {
    // Para CUSTOM
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
  selectedKitId: string | null; // NOVO: ID do kit selecionado (para edição ou visualização)

  // Estado da Composição (O Kit sendo montado)
  composition: KitCompositionState;

  // Getters (Computados)
  itemsCount: number;
  totalPrice: number;

  // Ações
  openKitBuilder: () => void;
  closeKitBuilder: () => void;
  setStep: (step: 1 | 2 | 3) => void;

  // Ações de Seleção de Kit Pronto
  selectKit: (kitId: string) => void; // AÇÃO QUE FALTAVA

  // Ações de Montagem
  setBaseContainer: (product: Product) => void;
  addItem: (product: Product, quantity: number) => void;
  updateItemQuantity: (productId: string, quantity: number) => void;
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

export const useKitBuilderStore = create<KitBuilderState>((set, get) => ({
  isOpen: false,
  currentStep: 1,
  selectedKitId: null,
  composition: INITIAL_COMPOSITION,
  itemsCount: 0,
  totalPrice: 0,

  openKitBuilder: () => set({ isOpen: true }),

  closeKitBuilder: () => set({ isOpen: false }), // Ao fechar, mantemos o estado por um momento para animações, o reset deve ser chamado manualmente ou no unmount se desejar

  setStep: (step) => set({ currentStep: step }),

  // IMPLEMENTAÇÃO DA AÇÃO QUE FALTAVA
  selectKit: (kitId) => {
    set({
      selectedKitId: kitId,
      // Aqui você poderia carregar a composição inicial do kit se quisesse editar um existente
      // Por enquanto, apenas marcamos qual kit está sendo "visualizado"
    });
  },

  setBaseContainer: (product) => {
    set((state) => ({
      composition: {
        ...state.composition,
        baseContainer: product,
        capacityRef: product.capacityRef || null,
        // Ao mudar a base, recalculamos se os itens ainda cabem? Por simplicidade, mantemos, a validação visual avisará.
      },
    }));
  },

  addItem: (product, quantity) => {
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

      // Recalcula slots ocupados
      const newSlotCount = currentItems.reduce(
        (acc, item) => acc + (item.product.itemSize || 1) * item.quantity,
        0
      );

      return {
        composition: {
          ...state.composition,
          internalItems: currentItems,
          currentSlotCount: newSlotCount,
        },
        itemsCount: state.itemsCount + quantity,
      };
    });
  },

  updateItemQuantity: (productId, quantity) => {
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
        // Se for laço pronto, precisamos pegar o preço do produto acessório.
        // Como não temos o objeto produto aqui fácil, assumimos que o assemblyCost ou lógica externa cuida disso.
        // Para simplificar: O preço do acessório deveria ser somado se ele for um produto.
        // AQUI É UMA SIMPLIFICAÇÃO: Normalmente buscaríamos o preço do acessório na lista de produtos pelo ID
      } else if (ribbon.type === "CUSTOM" && ribbon.ribbonDetails) {
        total += ribbon.ribbonDetails.assemblyCost;
        // Somar custo da fita por metro? Já está no assemblyCost ou calculado separado?
        // Vamos assumir que assemblyCost já inclui tudo
      }
    }

    // Atualiza o estado com o total calculado (opcional, mas bom para performance de leitura)
    // set({ totalPrice: total });
    return total;
  },
}));
