// src/store/categoryStore.ts
//
// Fonte única de `categories` pro cliente (mega-menu "Loja" da Navbar +
// página /categoria/[slug]). Usa onSnapshot (não getDocs) pra que criar,
// renomear ou reordenar categoria no admin reflita no menu sem deploy nem
// reload — mesma ideia do listener já usado em admin/page.tsx, só que lido
// aqui do lado do cliente da loja.
import { create } from "zustand";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Category } from "@/types";

interface CategoryState {
  categories: Category[];
  isLoading: boolean;
  hasSubscribed: boolean;
  subscribe: () => void;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  isLoading: true,
  hasSubscribed: false,

  // Idempotente: várias telas (Navbar, /categoria/[slug]) podem chamar
  // subscribe() ao montar sem abrir múltiplos listeners simultâneos.
  subscribe: () => {
    if (get().hasSubscribed) return;
    set({ hasSubscribed: true });

    onSnapshot(
      query(collection(db, "categories"), orderBy("order")),
      (snapshot) => {
        const categories = snapshot.docs.map(
          (d) => ({ id: d.id, ...d.data() } as Category)
        );
        set({ categories, isLoading: false });
      },
      (error) => {
        console.error("Erro ao buscar categorias:", error);
        set({ isLoading: false });
      }
    );
  },
}));
