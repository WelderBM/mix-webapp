import type { Category, Product, StoreSection } from "@/types";
import { resolveSectionProducts } from "@/lib/sections";

// Vitrines resolvidas NO SERVIDOR (#399). A página manda ao navegador só os
// produtos que cada prateleira mostra, não o catálogo inteiro, e o HTML que o
// Google lê já sai com os produtos (no servidor a store de categorias do
// navegador está vazia, então a prateleira por categoria saía em branco).
export type ShelfProducts = Record<string, Product[]>;

export function resolveShelves(
  sections: StoreSection[] | undefined,
  products: Product[],
  categories: Category[]
): ShelfProducts {
  const out: ShelfProducts = {};
  for (const s of sections ?? []) {
    if (!s.isActive || s.type !== "product_shelf") continue;
    out[s.id] = resolveSectionProducts(s, products, categories);
  }
  return out;
}
