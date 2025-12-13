// src/store/productStore.ts

import { create } from "zustand";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Product,
  ProductType,
  AssembledKitProduct,
  KitRecipe,
} from "@/lib/types";
import { useKitStore } from "./kitStore"; // Importamos a KitStore

interface ProductState {
  allProducts: Product[];
  ribbonProducts: Product[];
  assembledKits: AssembledKitProduct[]; // Novo estado para kits filtrados
  fetchProducts: () => Promise<void>;
  getProductById: (id: string) => Product | undefined;
}

const PRODUCTS_COLLECTION = collection(db, "products");

// Função de validação da Regra da Venda Garantida
const isKitAvailable = (
  kit: AssembledKitProduct,
  recipe: KitRecipe,
  allProducts: Product[]
): boolean => {
  if (kit.disabled || recipe.disabled) {
    return false; // Kit ou Receita desativada
  }

  const availableProductIds = new Set(
    allProducts.filter((p) => !p.disabled).map((p) => p.id)
  );

  // 1. Verificar Bases e Fillers Obrigatórios
  const requiredComponents = recipe.components.filter(
    (c) => c.required && (c.type === "BASE" || c.type === "FILLER")
  );

  const allRequiredItemsInStock = requiredComponents.every((comp) =>
    availableProductIds.has(comp.componentId)
  );

  if (!allRequiredItemsInStock) {
    // console.log(`Kit ${kit.id} indisponível: Item obrigatório fora de estoque.`);
    return false;
  }

  // 2. Verificar Opções de Laço/Fita
  // Um Kit precisa de pelo menos UMA opção de laço viável:
  // a) Pelo menos um Laço Pronto (ACCESSORY) listado na receita e em estoque OU
  // b) Pelo menos uma Fita RIBBON ativa para o Serviço

  const hasRibbonService = recipe.components.some(
    (c) => c.type === "RIBBON_SERVICE"
  );
  const hasReadyLacoOption = recipe.components
    .filter((c) => c.type === "LAÇO_PRONTO")
    .some((laco) => availableProductIds.has(laco.componentId));

  if (!hasRibbonService && !hasReadyLacoOption) {
    // console.log(`Kit ${kit.id} indisponível: Sem opções de laço.`);
    return false;
  }

  // Se o serviço de laço estiver presente, sempre assumimos que as fitas mexidas estão disponíveis,
  // mas o cliente será forçado a escolher uma fita ativa no Builder.
  // Simplificação: Se tiver a opção de serviço, o kit está ativo.

  return true;
};

export const useProductStore = create<ProductState>((set, get) => ({
  allProducts: [],
  ribbonProducts: [],
  assembledKits: [],

  fetchProducts: async () => {
    // Garante que as receitas sejam carregadas primeiro para a validação
    await useKitStore.getState().fetchRecipes();
    const recipes = useKitStore.getState().recipes;

    try {
      const querySnapshot = await getDocs(PRODUCTS_COLLECTION);
      const productsData: Product[] = querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as Product)
      );

      // 1. Separar os tipos de produtos
      const kits: AssembledKitProduct[] = productsData.filter(
        (p) => p.type === "ASSEMBLED_KIT"
      ) as AssembledKitProduct[];
      const nonKitProducts = productsData.filter(
        (p) => p.type !== "ASSEMBLED_KIT"
      );

      // 2. Aplicar a Regra da Venda Garantida nos Kits
      const availableKits: AssembledKitProduct[] = kits.filter((kit) => {
        const recipe = recipes.find((r) => r.id === kit.recipeId);
        if (!recipe) return false; // Sem receita, kit indisponível

        return isKitAvailable(kit, recipe, productsData);
      });

      // 3. Organizar os estados
      const allProductsFiltered = [...nonKitProducts, ...availableKits];
      const ribbonProductsFiltered = allProductsFiltered.filter(
        (p) => p.type === "RIBBON"
      );

      set({
        allProducts: allProductsFiltered,
        ribbonProducts: ribbonProductsFiltered,
        assembledKits: availableKits,
      });
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
    }
  },

  getProductById: (id) => {
    return get().allProducts.find((p) => p.id === id);
  },
}));
