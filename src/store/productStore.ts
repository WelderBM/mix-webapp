// src/store/productStore.ts (VERSÃO CORRIGIDA/ATUALIZADA)

import { create } from "zustand";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product, AssembledKitProduct } from "@/types";
import { useKitStore } from "./kitStore";

interface ProductState {
  allProducts: Product[];
  ribbonProducts: Product[];
  assembledKits: AssembledKitProduct[];
  displayProducts: Product[];
  isLoading: boolean; // Corrigido
  error: string | null;
  filterCategory: string;
  sortOption: "name_asc" | "price_asc" | "price_desc";
  visibleCount: number;

  fetchProducts: () => Promise<void>;
  setCategory: (category: string) => void;
  setSort: (option: "name_asc" | "price_asc" | "price_desc") => void;
  loadMore: () => void;
  applyFilters: () => void;
  getProductById: (id: string) => Product | undefined;
}

// Lógica de Validação da Regra da Venda Garantida
const isKitAvailable = (
  kit: AssembledKitProduct,
  recipe: any,
  allProducts: Product[]
): boolean => {
  if (kit.disabled || recipe.disabled) return false;

  const availableProductIds = new Set(
    allProducts.filter((p) => !p.disabled).map((p) => p.id)
  );

  // Verifica se todos os componentes obrigatórios (BASE ou FILLER) estão em estoque
  const allRequiredItemsInStock = recipe.components
    .filter(
      (c: any) => c.required && (c.type === "BASE" || c.type === "FILLER")
    )
    .every((comp: any) => availableProductIds.has(comp.componentId));

  if (!allRequiredItemsInStock) return false;

  // Simplificação da lógica do laço: Se tiver opção de serviço ou pronto, está ok
  const hasLacoOption = recipe.components.some(
    (c: any) =>
      c.type === "RIBBON_SERVICE" ||
      (c.type === "LAÇO_PRONTO" && availableProductIds.has(c.componentId))
  );

  return hasLacoOption;
};

export const useProductStore = create<ProductState>((set, get) => ({
  allProducts: [],
  ribbonProducts: [],
  assembledKits: [],
  displayProducts: [],
  isLoading: true,
  error: null,
  filterCategory: "ALL",
  sortOption: "name_asc",
  visibleCount: 12,

  fetchProducts: async () => {
    // Carrega as receitas (assumindo que useKitStore está implementado)
    await useKitStore.getState().fetchRecipes();
    const recipes = useKitStore.getState().recipes;

    set({ isLoading: true });
    try {
      const querySnapshot = await getDocs(collection(db, "products"));
      const productsData: Product[] = querySnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Product)
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
        if (!recipe) return false;

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
        isLoading: false,
      });

      get().applyFilters();
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
      set({ error: "Falha ao carregar produtos.", isLoading: false });
    }
  },

  setCategory: (category) => {
    set({ filterCategory: category, visibleCount: 12 });
    get().applyFilters();
  },

  setSort: (option) => {
    set({ sortOption: option });
    get().applyFilters();
  },

  loadMore: () => {
    const { visibleCount, allProducts } = get();
    if (visibleCount < allProducts.length) {
      set({ visibleCount: visibleCount + 12 });
      get().applyFilters();
    }
  },

  applyFilters: () => {
    const { allProducts, filterCategory, sortOption, visibleCount } = get();
    let filtered =
      filterCategory === "ALL"
        ? allProducts
        : allProducts.filter((p) => p.category === filterCategory);

    filtered.sort((a, b) => {
      if (sortOption === "name_asc") return a.name.localeCompare(b.name);
      if (sortOption === "price_asc") return a.price - b.price;
      if (sortOption === "price_desc") return b.price - a.price;
      return 0;
    });

    const paginated = filtered.slice(0, visibleCount);
    set({ displayProducts: paginated });
  },

  getProductById: (id) => {
    return get().allProducts.find((p) => p.id === id);
  },
}));
