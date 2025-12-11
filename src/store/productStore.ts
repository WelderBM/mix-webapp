import { create } from "zustand";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product } from "@/lib/types";

interface ProductState {
  products: Product[];
  isLoading: boolean;
  error: string | null;

  fetchProducts: () => Promise<void>;

  getProductsByCategory: (category: string) => Product[];
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  isLoading: false,
  error: null,

  fetchProducts: async () => {
    if (get().products.length > 0) return;

    set({ isLoading: true });
    try {
      const querySnapshot = await getDocs(collection(db, "products"));
      const products: Product[] = [];

      querySnapshot.forEach((doc) => {
        products.push(doc.data() as Product);
      });

      set({ products, isLoading: false });
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
      set({ error: "Falha ao carregar produtos.", isLoading: false });
    }
  },

  getProductsByCategory: (category) => {
    return get().products.filter((p) => p.category === category);
  },
}));
