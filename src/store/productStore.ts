import { create } from "zustand";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product } from "@/lib/types";

interface ProductState {
  allProducts: Product[]; // Banco de dados completo na memória
  displayProducts: Product[]; // O que está visível na tela (filtrado + paginado)

  isLoading: boolean;
  error: string | null;

  // Estados de Filtro
  filterCategory: string; // 'ALL' ou nome da categoria
  sortOption: "name_asc" | "price_asc" | "price_desc";
  visibleCount: number; // Para o scroll infinito (começa com 12, aumenta de 12 em 12)

  // Actions
  fetchProducts: () => Promise<void>;
  setCategory: (category: string) => void;
  setSort: (option: "name_asc" | "price_asc" | "price_desc") => void;
  loadMore: () => void; // Chama ao scrollar
  applyFilters: () => void; // Função interna
}

export const useProductStore = create<ProductState>((set, get) => ({
  allProducts: [],
  displayProducts: [],
  isLoading: false,
  error: null,

  filterCategory: "ALL",
  sortOption: "name_asc",
  visibleCount: 12, // Paginação inicial

  fetchProducts: async () => {
    // Cache simples: se já tem dados, não busca de novo
    if (get().allProducts.length > 0) return;

    set({ isLoading: true });
    try {
      const querySnapshot = await getDocs(collection(db, "products"));
      const products: Product[] = [];

      querySnapshot.forEach((doc) => {
        products.push(doc.data() as Product);
      });

      set({ allProducts: products });
      get().applyFilters(); // Aplica filtros iniciais
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
      set({ error: "Falha ao carregar produtos.", isLoading: false });
    } finally {
      set({ isLoading: false });
    }
  },

  setCategory: (category) => {
    set({ filterCategory: category, visibleCount: 12 }); // Reseta scroll ao filtrar
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

    // 1. Filtrar por Categoria
    let filtered =
      filterCategory === "ALL"
        ? allProducts
        : allProducts.filter((p) => p.category === filterCategory);

    // 2. Ordenar
    filtered.sort((a, b) => {
      if (sortOption === "name_asc") return a.name.localeCompare(b.name);
      if (sortOption === "price_asc") return a.price - b.price;
      if (sortOption === "price_desc") return b.price - a.price;
      return 0;
    });

    // 3. Paginar (Scroll Infinito)
    // Cortamos o array para mostrar apenas a quantidade permitida pelo scroll
    const paginated = filtered.slice(0, visibleCount);

    set({ displayProducts: paginated });
  },
}));
