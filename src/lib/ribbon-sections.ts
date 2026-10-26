import type { Product } from "@/types/product";
import { normalizeText } from "@/lib/intake/search";

// Seções da loja de fitas (#345): 79 rolos numa lista só é difícil de
// achar. Cada fita cai na seção da sua linha e largura ("Master 16mm",
// "Maxi 32mm"); o que não tem linha no nome vai para "Outras fitas".
export interface RibbonSection {
  key: string;
  label: string;
  count: number;
}

export const OTHER_SECTION = "outras";
const LINES = ["Maxi", "Master", "Plástica", "Line"];

export function ribbonSectionOf(p: Pick<Product, "name" | "width">): { key: string; label: string } {
  const name = normalizeText(p.name);
  const line = LINES.find((l) => new RegExp(`\\b${normalizeText(l)}\\b`).test(name));
  if (!line) return { key: OTHER_SECTION, label: "Outras fitas" };
  const mm = /(\d{1,3}) ?mm\b/.exec(name)?.[1] ?? (p.width ? String(p.width) : null);
  const label = mm ? `${line} ${mm}mm` : line;
  return { key: normalizeText(label), label };
}

// Seções com quantas fitas cada uma tem: maiores primeiro, "Outras" no fim.
export function ribbonSections(products: Pick<Product, "name" | "width">[]): RibbonSection[] {
  const map = new Map<string, RibbonSection>();
  for (const p of products) {
    const s = ribbonSectionOf(p);
    const cur = map.get(s.key) ?? { ...s, count: 0 };
    cur.count++;
    map.set(s.key, cur);
  }
  return [...map.values()].sort((a, b) => {
    if (a.key === OTHER_SECTION) return 1;
    if (b.key === OTHER_SECTION) return -1;
    return b.count - a.count || a.label.localeCompare(b.label, "pt-BR");
  });
}

// Filtro da tela: seção escolhida ("" = todas) e busca pelo nome, sem acento.
export function filterRibbons<T extends Pick<Product, "name" | "width">>(
  products: T[],
  section: string,
  query: string,
): T[] {
  const q = normalizeText(query);
  return products.filter(
    (p) =>
      (!section || ribbonSectionOf(p).key === section) &&
      (!q || normalizeText(p.name).includes(q)),
  );
}
