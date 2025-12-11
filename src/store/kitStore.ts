import { create } from "zustand";
import { Product } from "@/lib/types";

interface KitBuilderState {
  isOpen: boolean;
  currentStep: number;
  selectedBase: Product | null;
  selectedItems: Product[];
  selectedFiller: Product | null;
  selectedRibbon: Product | null;
  narrative: string;
  currentCapacityUsage: number;

  openBuilder: () => void;
  closeBuilder: () => void;
  setStep: (step: number) => void;
  selectBase: (product: Product) => void;
  addItem: (product: Product) => void;
  removeItem: (index: number) => void;
  selectFiller: (product: Product | null) => void;
  selectRibbon: (product: Product | null) => void;
  resetKit: () => void;
}

const generateNarrative = (state: KitBuilderState): string => {
  const { selectedBase, selectedItems, selectedFiller, selectedRibbon } = state;

  if (!selectedBase) return "Escolha uma base para começar...";

  let text = `Uma ${selectedBase.description_adjective || "linda"} ${
    selectedBase.name
  }`;

  if (selectedItems.length > 0) {
    // AGRUPAMENTO: Conta itens repetidos
    const counts = selectedItems.reduce((acc, item) => {
      acc[item.name] = (acc[item.name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const itemsText = Object.entries(counts)
      .map(([name, count]) => `${count}x ${name.split(" ")[0]}`) // Ex: "2x Sabonete"
      .join(", ");

    text += `, recheada com ${itemsText}`;
  }

  if (selectedFiller) text += `, fundo de ${selectedFiller.name}`;
  if (selectedRibbon) text += ` e ${selectedRibbon.name}.`;
  else text += ".";

  return text;
};

const calculateUsage = (items: Product[]) => {
  return items.reduce((total, item) => total + (item.itemSize || 1), 0);
};

export const useKitStore = create<KitBuilderState>((set, get) => ({
  isOpen: false,
  currentStep: 1,
  selectedBase: null,
  selectedItems: [],
  selectedFiller: null,
  selectedRibbon: null,
  narrative: "Comece escolhendo a base...",
  currentCapacityUsage: 0,

  openBuilder: () => set({ isOpen: true, currentStep: 1 }),
  closeBuilder: () => set({ isOpen: false }),
  setStep: (step) => set({ currentStep: step }),

  selectBase: (product) => {
    set((state) => {
      const newState = { ...state, selectedBase: product };
      return {
        ...newState,
        narrative: generateNarrative(newState as KitBuilderState),
      };
    });
  },

  addItem: (product) => {
    const state = get();
    const itemSize = product.itemSize || 1;
    const maxCapacity = state.selectedBase?.capacity || 100;

    if (state.currentCapacityUsage + itemSize > maxCapacity) {
      return;
    }

    set((state) => {
      const newItems = [...state.selectedItems, product];
      const newState = {
        ...state,
        selectedItems: newItems,
        currentCapacityUsage: calculateUsage(newItems),
      };
      return {
        ...newState,
        narrative: generateNarrative(newState as KitBuilderState),
      };
    });
  },

  removeItem: (indexToRemove) => {
    set((state) => {
      // Remove pelo INDEX (evita apagar todos os sabonetes se tiver 3 iguais)
      const newItems = state.selectedItems.filter(
        (_, index) => index !== indexToRemove
      );
      const newState = {
        ...state,
        selectedItems: newItems,
        currentCapacityUsage: calculateUsage(newItems),
      };
      return {
        ...newState,
        narrative: generateNarrative(newState as KitBuilderState),
      };
    });
  },

  selectFiller: (product) => {
    set((state) => {
      const newState = { ...state, selectedFiller: product };
      return {
        ...newState,
        narrative: generateNarrative(newState as KitBuilderState),
      };
    });
  },

  selectRibbon: (product) => {
    set((state) => {
      const newState = { ...state, selectedRibbon: product };
      return {
        ...newState,
        narrative: generateNarrative(newState as KitBuilderState),
      };
    });
  },

  resetKit: () =>
    set({
      currentStep: 1,
      selectedBase: null,
      selectedItems: [],
      selectedFiller: null,
      selectedRibbon: null,
      narrative: "",
      currentCapacityUsage: 0,
    }),
}));
