import { create } from "zustand";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product } from "@/lib/types";

interface ProductState {
  allProducts: Product[];
  displayProducts: Product[];
  isLoading: boolean;
  error: string | null;
  filterCategory: string;
  sortOption: "name_asc" | "price_asc" | "price_desc";
  visibleCount: number;

  fetchProducts: () => Promise<void>;
  setCategory: (category: string) => void;
  setSort: (option: "name_asc" | "price_asc" | "price_desc") => void;
  loadMore: () => void;
  applyFilters: () => void;
}

export const useProductStore = create<ProductState>((set, get) => ({
  allProducts: [],
  displayProducts: [],
  isLoading: false,
  error: null,
  filterCategory: "ALL",
  sortOption: "name_asc",
  visibleCount: 12,

  fetchProducts: async () => {
    if (get().allProducts.length > 0) return;

    set({ isLoading: true });
    try {
      const querySnapshot = await getDocs(collection(db, "products"));
      const products: Product[] = [];
      querySnapshot.forEach((doc) => {
        products.push({ id: doc.id, ...doc.data() } as Product);
      });
      set({ allProducts: products });
      get().applyFilters();
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
      set({ error: "Falha ao carregar produtos.", isLoading: false });
    } finally {
      set({ isLoading: false });
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
}));
