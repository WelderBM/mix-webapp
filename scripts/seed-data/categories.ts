import { Category } from "../../src/types/category";
import { CATEGORY_IDS } from "./ids";

// Product.category/subcategory gravam o NOME da categoria, não o id (ver
// CategoryManager.tsx: `where("category", "==", category.name)`) — os
// factories de produtos abaixo importam os objetos daqui e leem `.name`,
// nunca retipam a string, pra não divergir se o nome mudar aqui.

export const categoryBaloes: Category = {
  id: CATEGORY_IDS.BALOES,
  name: "Balões (seed)",
  order: 1,
  active: true,
  subcategories: [
    { id: "seed-sub-baloes-latex", name: "Látex", order: 1 },
    { id: "seed-sub-baloes-numero", name: "Número", order: 2 },
  ],
};

export const categoryFitas: Category = {
  id: CATEGORY_IDS.FITAS,
  name: "Fitas (seed)",
  order: 2,
  active: true,
  subcategories: [{ id: "seed-sub-fitas-cetim", name: "Cetim", order: 1 }],
};

export const categoryKits: Category = {
  id: CATEGORY_IDS.KITS,
  name: "Kits Montados (seed)",
  order: 3,
  active: true,
  subcategories: [
    { id: "seed-sub-kits-aniversario", name: "Aniversário", order: 1 },
  ],
};

// Categoria inativa de propósito — cobre o caso de borda "categoria
// desativada não deve aparecer em filtro/navegação pública".
export const categoryDescontinuada: Category = {
  id: CATEGORY_IDS.DESCONTINUADA,
  name: "Linha Descontinuada (seed)",
  order: 4,
  active: false,
  subcategories: [],
};

export const categories: Category[] = [
  categoryBaloes,
  categoryFitas,
  categoryKits,
  categoryDescontinuada,
];
