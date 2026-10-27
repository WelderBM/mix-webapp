import type { Product } from "@/types";
import { normalizeText } from "@/lib/intake/search";
import { ribbonSectionOf } from "@/lib/ribbon-sections";

// Tabela de edição das fitas no admin (#366): filtro por status e linha,
// busca sem acento e ordenação pelas colunas.

export type RibbonStatusFilter = "todos" | "FECHADO" | "ABERTO";
export type RibbonSortKey = "name" | "status" | "rollPrice" | "meterPrice" | "remaining";
export interface RibbonSort {
  key: RibbonSortKey;
  dir: "asc" | "desc";
}

export interface RibbonTableFilter {
  query: string;
  status: RibbonStatusFilter;
  line: string; // chave de ribbonSectionOf; "" = todas
  sort: RibbonSort;
}

// Sem valor (preço não configurado) vai sempre para o fim.
const sortValue = (p: Product, key: RibbonSortKey): string | number | null => {
  switch (key) {
    case "name":
      return normalizeText(p.name);
    case "status":
      return p.ribbonInventory?.status ?? null;
    case "rollPrice":
      return p.rollPrice ?? null;
    case "meterPrice":
      return p.price ?? null;
    case "remaining":
      return p.ribbonInventory?.remainingMeters ?? null;
  }
};

export function filterSortRibbons(products: Product[], f: RibbonTableFilter): Product[] {
  const q = normalizeText(f.query);
  const dir = f.sort.dir === "asc" ? 1 : -1;
  return products
    .filter(
      (p) =>
        p.type === "RIBBON" &&
        (f.status === "todos" || p.ribbonInventory?.status === f.status) &&
        (!f.line || ribbonSectionOf(p).key === f.line) &&
        (!q || normalizeText(p.name).includes(q)),
    )
    .sort((a, b) => {
      const va = sortValue(a, f.sort.key);
      const vb = sortValue(b, f.sort.key);
      if (va == null || vb == null) return va == null ? (vb == null ? 0 : 1) : -1;
      const c =
        typeof va === "number" && typeof vb === "number"
          ? va - vb
          : String(va).localeCompare(String(vb), "pt-BR");
      return c * dir || normalizeText(a.name).localeCompare(normalizeText(b.name), "pt-BR");
    });
}

// Clique no cabeçalho: mesma coluna inverte, coluna nova começa crescente.
export function nextSort(cur: RibbonSort, key: RibbonSortKey): RibbonSort {
  return cur.key === key ? { key, dir: cur.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" };
}
