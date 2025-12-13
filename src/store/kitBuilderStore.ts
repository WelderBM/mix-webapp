// src/store/kitBuilderStore.ts

import { create } from "zustand";

interface KitBuilderState {
  isOpen: boolean;
  selectedKitId: string | null;
  openKitBuilder: (kitId: string) => void;
  closeKitBuilder: () => void;
}

export const useKitBuilderStore = create<KitBuilderState>((set) => ({
  isOpen: false,
  selectedKitId: null,

  // Função que estava faltando: Abre o modal e define o Kit ID
  openKitBuilder: (kitId) => set({ isOpen: true, selectedKitId: kitId }),

  // Função para fechar o modal
  closeKitBuilder: () => set({ isOpen: false, selectedKitId: null }),
}));
