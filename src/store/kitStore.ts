import { create } from "zustand";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { KitRecipe } from "@/types"; // Importação corrigida para usar o novo padrão

interface KitState {
  recipes: KitRecipe[];
  isLoading: boolean; // ADICIONADO: Propriedade que faltava
  fetchRecipes: () => Promise<void>;
  getRecipeById: (id: string) => KitRecipe | undefined;
}

const KIT_RECIPES_COLLECTION = collection(db, "kit_recipes");

export const useKitStore = create<KitState>((set, get) => ({
  recipes: [],
  isLoading: true, // ADICIONADO: Estado inicial

  fetchRecipes: async () => {
    set({ isLoading: true }); // ADICIONADO: Início do carregamento
    try {
      const querySnapshot = await getDocs(KIT_RECIPES_COLLECTION);
      const recipesData: KitRecipe[] = querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as KitRecipe)
      );

      set({ recipes: recipesData, isLoading: false }); // ADICIONADO: Fim do carregamento
    } catch (error) {
      console.error("Erro ao carregar receitas de kits:", error);
      set({ isLoading: false }); // ADICIONADO: Garante que pare de carregar mesmo com erro
    }
  },

  getRecipeById: (id) => {
    return get().recipes.find((r) => r.id === id);
  },
}));
