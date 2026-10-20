// src/lib/sections.ts
//
// Resolução de StoreSection.source (issue #71) — vitrines que se preenchem
// por regra (categoria/tag/estoque baixo) além da curadoria manual.
// Mesmo padrão de src/lib/categories.ts (funções puras contra
// allProducts/categories já carregados, nenhuma leitura de Firestore
// aqui).
import { Category, Product, StoreSection, SectionSource } from "@/types";
import { getAllProductTags, toEpochMillis } from "@/lib/productTags";
import { getEffectiveUnitPrice } from "@/lib/ribbon-pricing";

// Seção legada (dado real de produção, confirmado em
// scripts/seed-data/from-production/settings.ts) grava só `productIds`,
// sem `source` — normaliza pra `{ mode: "manual", productIds }` sem exigir
// migração de banco. Chame esta função em todo lugar que lê StoreSection;
// nunca leia `section.source`/`section.productIds` direto.
export const normalizeSectionSource = (
  section: Partial<Pick<StoreSection, "source" | "productIds">>
): SectionSource => {
  if (section.source) return section.source;
  return { mode: "manual", productIds: section.productIds ?? [] };
};

// Limiar de "estoque baixo" pra fita (RIBBON) com rolo aberto — único tipo
// de produto com quantidade real modelada hoje (`ribbonInventory`). Os
// demais tipos só têm `inStock` booleano (sem quantidade numérica), então
// nunca entram nesta regra — guard explícito (não silenciosamente `false`
// por acaso), documentado aqui em vez de virar mágica espalhada.
export const LOW_STOCK_RIBBON_RATIO = 0.2;

export const isLowStock = (product: Product): boolean => {
  const inv = product.ribbonInventory;
  if (inv == null) return false;
  if (inv.status !== "ABERTO") return false;
  if (inv.totalRollMeters <= 0) return false;
  return inv.remainingMeters / inv.totalRollMeters <= LOW_STOCK_RIBBON_RATIO;
};

// `product.category`/`product.subcategory` guardam o NOME (não o id/slug),
// mesma convenção de src/lib/categories.ts — resolve o nome a partir do id
// vindo da seção antes de filtrar.
const resolveCategoryName = (
  categories: Category[],
  categoryId: string
): string | null => categories.find((c) => c.id === categoryId)?.name ?? null;

const resolveSubcategoryName = (
  categories: Category[],
  categoryId: string,
  subcategoryId: string
): string | null =>
  categories
    .find((c) => c.id === categoryId)
    ?.subcategories.find((s) => s.id === subcategoryId)?.name ?? null;

const resolveBySource = (
  source: SectionSource,
  allProducts: Product[],
  categories: Category[]
): Product[] => {
  switch (source.mode) {
    case "manual":
      // Preserva a ordem de curadoria (ordem de `productIds`), igual ao
      // comportamento anterior de SectionProductShelf.
      return source.productIds
        .map((id) => allProducts.find((p) => p.id === id))
        .filter((p): p is Product => p !== undefined);

    case "category": {
      const categoryName = resolveCategoryName(categories, source.categoryId);
      if (categoryName == null) return [];
      const subcategoryName =
        source.subcategoryId != null
          ? resolveSubcategoryName(
              categories,
              source.categoryId,
              source.subcategoryId
            )
          : null;
      // subcategoryId presente mas não resolvido (subcategoria apagada) ->
      // nenhum produto, nunca cai pra "categoria inteira" por engano.
      if (source.subcategoryId != null && subcategoryName == null) return [];
      return allProducts.filter(
        (p) =>
          p.category === categoryName &&
          (subcategoryName == null || p.subcategory === subcategoryName)
      );
    }

    case "tag":
      return allProducts.filter((p) => getAllProductTags(p).includes(source.tag));

    case "auto":
      // Único `rule` implementado hoje é "low_stock" (ver comentário do
      // union em src/types/store.ts). `switch` exaustivo por `rule` fica
      // pronto pra crescer sem esconder um `default` silencioso.
      switch (source.rule) {
        case "low_stock":
          return allProducts.filter(isLowStock);
        default:
          return [];
      }

    default:
      return [];
  }
};

const applySort = (
  products: Product[],
  sort: StoreSection["sort"]
): Product[] => {
  if (sort == null) return products;
  const withOrder = products.map((p, index) => ({ p, index }));

  switch (sort) {
    case "newest":
      withOrder.sort((a, b) => {
        const aMs = toEpochMillis(a.p.createdAt);
        const bMs = toEpochMillis(b.p.createdAt);
        // Sem `createdAt` reconhecível vai pro fim, nunca tratado como
        // "mais antigo que zero" por coerção implícita.
        if (aMs == null && bMs == null) return a.index - b.index;
        if (aMs == null) return 1;
        if (bMs == null) return -1;
        return bMs - aMs;
      });
      break;
    case "price_asc":
    case "price_desc": {
      const direction = sort === "price_asc" ? 1 : -1;
      withOrder.sort((a, b) => {
        const aPrice = getEffectiveUnitPrice(a.p);
        const bPrice = getEffectiveUnitPrice(b.p);
        // Produto sem preço efetivo (guard explícito, ver
        // ribbon-pricing.ts) vai pro fim independente da direção.
        if (aPrice == null && bPrice == null) return a.index - b.index;
        if (aPrice == null) return 1;
        if (bPrice == null) return -1;
        return (aPrice - bPrice) * direction;
      });
      break;
    }
  }

  return withOrder.map(({ p }) => p);
};

// Ponto único de resolução de "quais produtos esta vitrine mostra" —
// normaliza dado legado, resolve o `source` contra os produtos/categorias
// já carregados, aplica `sort` e por fim `limit`. Sem produto nenhum
// resolvido -> lista vazia (quem renderiza decide não mostrar a seção,
// mesmo padrão já existente).
export const resolveSectionProducts = (
  section: StoreSection,
  allProducts: Product[],
  categories: Category[]
): Product[] => {
  const source = normalizeSectionSource(section);
  const resolved = applySort(
    resolveBySource(source, allProducts, categories),
    section.sort
  );
  return section.limit != null ? resolved.slice(0, section.limit) : resolved;
};
