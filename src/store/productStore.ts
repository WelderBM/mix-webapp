// src/store/productStore.ts (VERSÃO CORRIGIDA/ATUALIZADA)

import { create } from "zustand";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product, AssembledKitProduct } from "@/types";
import { customerCatalog } from "@/lib/customerCatalog";
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
  // Baixa o catálogo só se ainda não está carregado nem a caminho (#399).
  ensureProducts: () => Promise<void>;
  setCategory: (category: string) => void;
  setSort: (option: "name_asc" | "price_asc" | "price_desc") => void;
  loadMore: () => void;
  applyFilters: () => void;
  getProductById: (id: string) => Product | undefined;
}

// Leitura em andamento: duas telas pedindo o catálogo juntas fazem UMA só.
let inflight: Promise<void> | null = null;

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

  fetchProducts: () => {
    if (inflight) return inflight;
    inflight = (async () => {
      // Receitas antes: a regra dos kits depende delas.
      await useKitStore.getState().fetchRecipes();
      const recipes = useKitStore.getState().recipes;

      set({ isLoading: true });
      try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const productsData: Product[] = querySnapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Product)
        );

        // Só o catálogo do cliente (o admin usa seu próprio onSnapshot em
        // admin/page.tsx): sem desativados, só kits vendáveis.
        const { products, kits } = customerCatalog(productsData, recipes);

        set({
          allProducts: products,
          ribbonProducts: products.filter((p) => p.type === "RIBBON"),
          assembledKits: kits,
          isLoading: false,
        });

        get().applyFilters();
      } catch (error) {
        console.error("Erro ao buscar produtos:", error);
        set({ error: "Falha ao carregar produtos.", isLoading: false });
      }
    })().finally(() => {
      inflight = null;
    });
    return inflight;
  },

  ensureProducts: () => {
    if (get().allProducts.length > 0) return Promise.resolve();
    return get().fetchProducts();
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
      if (sortOption === "price_asc") return (a.price ?? 0) - (b.price ?? 0);
      if (sortOption === "price_desc") return (b.price ?? 0) - (a.price ?? 0);
      return 0;
    });

    const paginated = filtered.slice(0, visibleCount);
    set({ displayProducts: paginated });
  },

  getProductById: (id) => {
    return get().allProducts.find((p) => p.id === id);
  },
}));
