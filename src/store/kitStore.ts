// src/store/kitStore.ts

import { create } from "zustand";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { KitRecipe } from "@/lib/types";

interface KitState {
  recipes: KitRecipe[];
  fetchRecipes: () => Promise<void>;
  getRecipeById: (id: string) => KitRecipe | undefined;
}

const KIT_RECIPES_COLLECTION = collection(db, "kit_recipes");

export const useKitStore = create<KitState>((set, get) => ({
  recipes: [],

  // Função para buscar todas as receitas do Firebase
  fetchRecipes: async () => {
    try {
      const querySnapshot = await getDocs(KIT_RECIPES_COLLECTION);
      const recipesData: KitRecipe[] = querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as KitRecipe)
      );

      set({ recipes: recipesData });
    } catch (error) {
      console.error("Erro ao carregar receitas de kits:", error);
      // Opcional: Adicionar tratamento de erro na UI
    }
  },

  // Função de utilidade para buscar uma receita pelo ID
  getRecipeById: (id) => {
    return get().recipes.find((r) => r.id === id);
  },
}));
