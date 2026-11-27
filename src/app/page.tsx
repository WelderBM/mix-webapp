import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toPlain } from "@/lib/firestorePlain";
import { Category, Product, StoreSettings, KitRecipe } from "@/types";
import { customerCatalog } from "@/lib/customerCatalog";
import { resolveShelves, type ShelfProducts } from "@/lib/shelves";
import HomeClient from "@/components/views/HomeClient";

// ISR: home servida do cache (rápida em celular fraco), mas refeita no
// máximo a cada 60s. Sem isto a rota vira estática PARA SEMPRE após o
// #155 remover o `force-dynamic` — nome da loja, vitrine, produtos e
// preços editados no admin só apareciam no próximo deploy. Mesmo valor
// de /natura.
export const revalidate = 60;

async function getInitialData(): Promise<{
  settings: StoreSettings;
  shelves: ShelfProducts;
}> {
  try {
    const [productsSnap, settingsSnap, recipesSnap, categoriesSnap] =
      await Promise.all([
        getDocs(query(collection(db, "products"), orderBy("name"))),
        getDoc(doc(db, "settings", "general")),
        getDocs(collection(db, "kit_recipes")),
        getDocs(query(collection(db, "categories"), orderBy("order"))),
      ]);

    // toPlain: Timestamp do Firestore não pode ir para o HomeClient.
    const products = productsSnap.docs.map(
      (d) => toPlain({ id: d.id, ...d.data() }) as Product
    );
    const recipes = recipesSnap.docs.map(
      (d) => toPlain({ id: d.id, ...d.data() }) as KitRecipe
    );
    const categories = categoriesSnap.docs.map(
      (d) => toPlain({ id: d.id, ...d.data() }) as Category
    );
    const settings = settingsSnap.exists()
      ? (toPlain(settingsSnap.data()) as StoreSettings)
      : ({} as StoreSettings);

    // Só o que o cliente pode ver (sem desativado, kit só se vendável) e só
    // o que cada vitrine mostra: o HTML não cresce com o catálogo (#399).
    const catalog = customerCatalog(products, recipes).products;
    const shelves = resolveShelves(settings.homeSections, catalog, categories);

    return { settings, shelves };
  } catch (error) {
    console.error(
      `Erro ao buscar dados iniciais: ${
        (error as any)?.message || "Erro desconhecido"
      }`
    );
    return { settings: {} as StoreSettings, shelves: {} };
  }
}

export default async function Page() {
  const { settings, shelves } = await getInitialData();

  return <HomeClient initialSettings={settings} initialShelves={shelves} />;
}
