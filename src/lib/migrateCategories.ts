import { collection, doc, getDocs, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product } from "@/types";
import { Category } from "@/types/category";

// Remove marcas diacríticas (á->a, ã->a, ç->c...) comparando o código Unicode
// de cada caractere após NFD, em vez de um literal de regex com caracteres
// combinantes no código-fonte (frágil entre encodings/editores).
const COMBINING_MARKS_START = 0x0300;
const COMBINING_MARKS_END = 0x036f;

const stripDiacritics = (name: string) =>
  name
    .normalize("NFD")
    .split("")
    .filter((ch) => {
      const code = ch.charCodeAt(0);
      return code < COMBINING_MARKS_START || code > COMBINING_MARKS_END;
    })
    .join("");

export const slugify = (name: string) =>
  stripDiacritics(name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "categoria";

// Slug único comparando contra os ids já existentes (evita colisão se duas
// categorias/subcategorias tiverem nomes parecidos, ex: "Fita" e "Fitas").
export const uniqueSlug = (name: string, existingIds: string[]): string => {
  const base = slugify(name);
  if (!existingIds.includes(base)) return base;
  let i = 2;
  while (existingIds.includes(`${base}-${i}`)) i++;
  return `${base}-${i}`;
};

// Lê os produtos existentes, deduplica os valores de `category` (mesma
// lógica usada em admin/page.tsx pra montar o filtro) e cria um doc
// categories/{slug} pra cada string ainda não representada. Não inventa
// subcategorias — produtos existentes continuam sem `subcategory` até
// alguém atribuir uma pelo wizard.
export const migrateCategories = async (): Promise<{
  created: string[];
  skipped: string[];
}> => {
  const [productsSnap, categoriesSnap] = await Promise.all([
    getDocs(collection(db, "products")),
    getDocs(collection(db, "categories")),
  ]);

  const products = productsSnap.docs.map((d) => d.data() as Product);
  const existingNames = new Set(
    categoriesSnap.docs.map((d) => (d.data() as Category).name)
  );

  const uniqueCategoryNames = Array.from(
    new Set(products.map((p) => p.category).filter(Boolean))
  ).sort();

  const created: string[] = [];
  const skipped: string[] = [];
  const batch = writeBatch(db);

  uniqueCategoryNames.forEach((name, index) => {
    if (existingNames.has(name)) {
      skipped.push(name);
      return;
    }
    const category: Category = {
      id: slugify(name),
      name,
      order: index,
      active: true,
      subcategories: [],
    };
    batch.set(doc(db, "categories", category.id), category);
    created.push(name);
  });

  if (created.length > 0) {
    await batch.commit();
  }

  return { created, skipped };
};
