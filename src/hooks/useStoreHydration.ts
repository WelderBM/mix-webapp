import { useEffect, useRef } from "react";
import { useSettingsStore } from "@/store/settingsStore";
import { useProductStore } from "@/store/productStore";
import { useKitStore } from "@/store/kitStore";
import { Product, StoreSettings, KitRecipe } from "@/types";

export const useStoreHydration = (
  initialProducts: Product[],
  initialSettings: StoreSettings,
  initialRecipes: KitRecipe[]
) => {
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (hydratedRef.current) return;

    // 1. Injeta Configurações
    useSettingsStore.setState({ settings: initialSettings, isLoading: false });

    // 2. Injeta Receitas (CRÍTICO: Deve vir antes dos produtos para o cálculo de kits)
    if (initialRecipes && initialRecipes.length > 0) {
      useKitStore.setState({ recipes: initialRecipes, isLoading: false });
    } else {
      useKitStore.getState().fetchRecipes();
    }

    // 3. Injeta Produtos
    if (initialProducts && initialProducts.length > 0) {
      useProductStore.setState({
        allProducts: initialProducts,
        isLoading: false,
      });
      // Aplica filtros para disparar o cálculo de "assembledKits" com as receitas já carregadas
      useProductStore.getState().applyFilters();
    } else {
      useProductStore.getState().fetchProducts();
    }

    hydratedRef.current = true;
  }, [initialProducts, initialSettings, initialRecipes]);
};
