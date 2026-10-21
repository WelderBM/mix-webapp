import type { Category } from "@/types";
import type { IntakeItem } from "@/types/intake";
import { normalizeText } from "./search";

// Subcategorias semânticas (issue #232, levantamento da loja de 21/10):
// "FITA" e "PAPEL" no Noturno juntam coisas bem diferentes. Aqui a família
// + o nome viram categoria + subcategoria do site, com NOMES DE EXIBIÇÃO
// (casados com as categorias reais por texto normalizado). Regras só para
// o que é inequívoco; o resto fica sem subcategoria e aparece na varredura
// do importador, pra afinar com o tempo.

export interface TaxonomyGuess {
  category: string;
  subcategory: string;
}

type Item = Pick<IntakeItem, "family" | "name" | "suggestedType">;

interface Rule {
  test: RegExp;
  subcategory: string;
}

// Fita de laço (o Noturno já separa a de escritório: suggestedType).
const RIBBON_RULES: Rule[] = [
  { test: /\b(MAXI|MASTER|PLASTICA|POLIPROP|LINE|ECOPACK|FIDEPLA|LISA)\b/, subcategory: "Fita para laço" },
  { test: /\b(CETIM|ORGANZA|LUREX|TNT|GORGURAO|JUTA|VELUDO|XADREZ|RENDA|SINIMBU)\b/, subcategory: "Cetim e tecido" },
];

// Papéis (ordem importa: "PAPEL CARTAO" antes de genéricos).
const PAPER_RULES: Rule[] = [
  { test: /\bSEDA\b/, subcategory: "Seda" },
  // "EVAC/ GLITER" (sem espaço) também é EVA.
  { test: /\bEVA/, subcategory: "EVA" },
  { test: /\bGUACHE\b/, subcategory: "Guache" },
  { test: /\bMICRO ?ONDULADO\b/, subcategory: "Microondulado" },
  { test: /\bCREPOM\b/, subcategory: "Crepom" },
  { test: /\bCARTAO\b/, subcategory: "Cartão" },
  { test: /\bCONTACT(O)?\b/, subcategory: "Contact" },
  { test: /\bFOTO(GRAFICO)?\b/, subcategory: "Fotográfico" },
  { test: /\bKRAFT\b/, subcategory: "Kraft" },
  { test: /\bCAMURCA\b/, subcategory: "Camurça" },
  { test: /\bPARANA\b/, subcategory: "Paraná" },
  { test: /\bLAMINADO\b/, subcategory: "Laminado" },
  { test: /\bCARTOLINA\b/, subcategory: "Cartolina" },
  { test: /\b(A4|SULFITE|OFICIO)\b/, subcategory: "Sulfite e A4" },
  { test: /\bCARBONO\b/, subcategory: "Carbono" },
  { test: /\bCELOFANE\b/, subcategory: "Celofane" },
  { test: /^PAPEL 40\b|\b40 ?KG\b/, subcategory: "Papel 40" },
  { test: /\bPRESENTE\b/, subcategory: "Papel de presente" },
];

const BOX_FAMILIES: Record<string, string> = {
  CAIXA: "Caixas",
  CAIXINHA: "Caixas",
  CAIXETA: "Caixas",
  CAIXOTE: "Caixas",
  CESTA: "Cestas",
  CACHEPOT: "Cachepôs",
  CACHEPO: "Cachepôs",
};

const PAPER_FAMILIES: Record<string, string> = { EVA: "EVA", CARTOLINA: "Cartolina" };

export function classifySubcategory(item: Item): TaxonomyGuess | null {
  const fam = item.family ?? "";
  const name = (item.name ?? "").toUpperCase();
  if (fam === "FITA") {
    if (item.suggestedType !== "RIBBON") {
      return { category: "Material Escolar", subcategory: "Fitas adesivas" };
    }
    const r = RIBBON_RULES.find((x) => x.test.test(name));
    return r ? { category: "Fitas", subcategory: r.subcategory } : null;
  }
  if (fam === "PAPEL") {
    const r = PAPER_RULES.find((x) => x.test.test(name));
    return r ? { category: "Papéis", subcategory: r.subcategory } : null;
  }
  if (fam in PAPER_FAMILIES) return { category: "Papéis", subcategory: PAPER_FAMILIES[fam] };
  if (fam in BOX_FAMILIES) return { category: "Caixas", subcategory: BOX_FAMILIES[fam] };
  return null;
}

// Famílias que TÊM regras: item delas sem subcategoria vai pra varredura.
export function hasSubcategoryRules(family: string | null): boolean {
  return (
    family === "FITA" ||
    family === "PAPEL" ||
    (family ?? "") in PAPER_FAMILIES ||
    (family ?? "") in BOX_FAMILIES
  );
}

const same = (a: string, b: string) => normalizeText(a) === normalizeText(b);

// Subcategoria sugerida → nome da subcategoria REAL da categoria escolhida
// (nome exibido é livre no admin). null = não existe nessa categoria.
export function matchSubcategory(
  suggested: string | null | undefined,
  categoryName: string,
  categories: Pick<Category, "name" | "subcategories">[],
): string | null {
  if (!suggested || !categoryName) return null;
  const cat = categories.find((c) => same(c.name, categoryName));
  const sub = cat?.subcategories?.find((s) => same(s.name, suggested));
  return sub ? sub.name : null;
}

export interface TaxonomyPlan {
  // Quantos itens caem em cada categoria/subcategoria.
  classified: { category: string; subcategory: string; count: number }[];
  // Famílias com regra, mas itens sem subcategoria (pra afinar as regras).
  unclassified: { family: string; count: number; examples: string[] }[];
  // O que falta criar no site pra a sugestão funcionar.
  missingCategories: string[];
  missingSubcategories: { category: string; subcategory: string }[];
}

// Varredura pós-importação: só itens pendentes (o resto já foi decidido).
export function planTaxonomy(
  items: (Item & { status?: string })[],
  categories: Pick<Category, "name" | "subcategories">[],
): TaxonomyPlan {
  const counts = new Map<string, { category: string; subcategory: string; count: number }>();
  const missing = new Map<string, { count: number; examples: string[] }>();
  for (const i of items) {
    const g = classifySubcategory(i);
    if (g) {
      const k = `${g.category}|${g.subcategory}`;
      const c = counts.get(k) ?? { ...g, count: 0 };
      c.count++;
      counts.set(k, c);
    } else if (hasSubcategoryRules(i.family)) {
      const m = missing.get(i.family!) ?? { count: 0, examples: [] };
      m.count++;
      if (m.examples.length < 3) m.examples.push(i.name);
      missing.set(i.family!, m);
    }
  }
  const classified = [...counts.values()].sort(
    (a, b) => a.category.localeCompare(b.category) || b.count - a.count,
  );
  const missingCategories = [...new Set(classified.map((c) => c.category))].filter(
    (name) => !categories.some((c) => same(c.name, name)),
  );
  const missingSubcategories = classified
    .filter((c) => !matchSubcategory(c.subcategory, c.category, categories))
    .map(({ category, subcategory }) => ({ category, subcategory }));
  return {
    classified,
    unclassified: [...missing.entries()]
      .map(([family, m]) => ({ family, ...m }))
      .sort((a, b) => b.count - a.count),
    missingCategories,
    missingSubcategories,
  };
}

export interface CategoryWrite {
  id: string;
  isNew: boolean;
  // setDoc com merge: categoria nova leva tudo; existente só subcategories.
  data: Partial<Category>;
}

// "Criar o que falta" da varredura: monta as gravações em `categories`.
// `slug` vem de fora (uniqueSlug do admin) pra este módulo seguir puro.
export function buildTaxonomyWrites(
  plan: Pick<TaxonomyPlan, "missingCategories" | "missingSubcategories">,
  categories: Category[],
  slug: (name: string, existingIds: string[]) => string,
): CategoryWrite[] {
  const byName = new Map<string, Category>();
  for (const c of categories) byName.set(normalizeText(c.name), structuredClone(c));
  const touched = new Set<string>();
  const created = new Set<string>();
  let order = categories.length;

  for (const name of plan.missingCategories) {
    const key = normalizeText(name);
    if (byName.has(key)) continue;
    const id = slug(name, [...byName.values()].map((c) => c.id));
    byName.set(key, { id, name, order: order++, active: true, subcategories: [] });
    touched.add(key);
    created.add(key);
  }
  for (const { category, subcategory } of plan.missingSubcategories) {
    const key = normalizeText(category);
    const cat = byName.get(key);
    if (!cat) continue;
    cat.subcategories ??= [];
    if (cat.subcategories.some((s) => same(s.name, subcategory))) continue;
    cat.subcategories.push({
      id: slug(subcategory, cat.subcategories.map((s) => s.id)),
      name: subcategory,
      order: cat.subcategories.length,
    });
    touched.add(key);
  }
  return [...touched].map((key) => {
    const c = byName.get(key)!;
    return created.has(key)
      ? { id: c.id, isNew: true, data: c }
      : { id: c.id, isNew: false, data: { subcategories: c.subcategories } };
  });
}
