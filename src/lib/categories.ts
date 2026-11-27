// src/lib/categories.ts
//
// Guarda-corpo de exibição do menu "Loja" (issue #70): uma categoria só
// entra no menu (ou na página /categoria/[slug]) se estiver `active` E tiver
// pelo menos 1 produto vendável (`inStock && !disabled`). Mesma regra vale
// pra subcategoria, evitando link morto dentro de uma categoria já visível.
//
// `product.category`/`product.subcategory` guardam o NOME da categoria/sub
// (não o id/slug) — ver migrateCategories.ts e CategoryManager.tsx, que
// sempre comparam com `category.name`/`sub.name`. Category.id (slug) só é
// usado na URL.
import { Category, CategorySubcategory, Product } from "@/types";

const isSellable = (p: Product): boolean => p.inStock && !p.disabled;

export const countCategoryProducts = (
  products: Product[],
  categoryName: string
): number =>
  products.filter((p) => p.category === categoryName && isSellable(p)).length;

export const countSubcategoryProducts = (
  products: Product[],
  categoryName: string,
  subcategoryName: string
): number =>
  products.filter(
    (p) =>
      p.category === categoryName &&
      p.subcategory === subcategoryName &&
      isSellable(p)
  ).length;

export interface VisibleSubcategory extends CategorySubcategory {
  productCount: number;
}

export interface VisibleCategory extends Category {
  productCount: number;
  visibleSubcategories: VisibleSubcategory[];
}

// Vendáveis por categoria e subcategoria (por nome). É o que o menu precisa
// saber — o servidor manda só isto (/catalogo/menu) em vez do catálogo
// inteiro (#399).
export type CategoryCounts = Record<
  string,
  { total: number; subs: Record<string, number> }
>;

export const countSellableByCategory = (products: Product[]): CategoryCounts => {
  const out: CategoryCounts = {};
  for (const p of products) {
    if (!p.category || !isSellable(p)) continue;
    const c = (out[p.category] ??= { total: 0, subs: {} });
    c.total += 1;
    if (p.subcategory) c.subs[p.subcategory] = (c.subs[p.subcategory] ?? 0) + 1;
  }
  return out;
};

// Categorias ativas, ordenadas por `order`, com pelo menos 1 produto
// vendável — pronto pro mega-menu "Loja" e pra página /categoria/[slug]
// decidir se a categoria existe.
export const getVisibleCategories = (
  categories: Category[],
  products: Product[] | CategoryCounts
): VisibleCategory[] => {
  const counts = Array.isArray(products)
    ? countSellableByCategory(products)
    : products;
  return categories
    .filter((c) => c.active)
    .map((c) => {
      const visibleSubcategories = [...c.subcategories]
        .sort((a, b) => a.order - b.order)
        .map((s) => ({
          ...s,
          productCount: counts[c.name]?.subs[s.name] ?? 0,
        }))
        .filter((s) => s.productCount > 0);

      return {
        ...c,
        productCount: counts[c.name]?.total ?? 0,
        visibleSubcategories,
      };
    })
    .filter((c) => c.productCount > 0)
    .sort((a, b) => a.order - b.order);
};

// Produtos de uma categoria (por nome), opcionalmente restritos a uma
// subcategoria (por nome) — usado pela página /categoria/[slug]. Não filtra
// por estoque: a listagem mostra "Indisponível" no ProductCard igual às
// outras páginas, só o MENU esconde categoria/subcategoria vazia.
export const filterProductsByCategory = (
  products: Product[],
  categoryName: string,
  subcategoryName?: string
): Product[] =>
  products.filter(
    (p) =>
      !p.disabled &&
      p.category === categoryName &&
      (subcategoryName == null || p.subcategory === subcategoryName)
  );
