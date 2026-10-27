import type { Product } from "@/types";
import { normalizeText } from "@/lib/intake/search";

// Quantos produtos a aba desenha de cada vez (#147). Depois do lançamento
// do Noturno são centenas; desenhar todos de uma vez trava celular fraco.
export const PRODUCTS_PAGE_SIZE = 50;

// Nome normalizado (sem acento, minúsculo) calculado uma vez por lista,
// não a cada tecla: "balao" acha "Balão".
export function buildNameIndex(products: Pick<Product, "id" | "name">[]) {
  return new Map(products.map((p) => [p.id, normalizeText(p.name ?? "")]));
}

export function filterAdminProducts<
  T extends Pick<Product, "id" | "name" | "type" | "category">,
>(
  products: T[],
  index: Map<string, string>,
  search: string,
  type: string,
  category = "ALL",
): T[] {
  const term = normalizeText(search);
  return products.filter((p) => {
    if (type !== "ALL" && p.type !== type) return false;
    if (category !== "ALL" && p.category !== category) return false;
    if (!term) return true;
    const name = index.get(p.id) ?? normalizeText(p.name ?? "");
    return name.includes(term);
  });
}
