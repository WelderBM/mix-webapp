import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product, StoreSettings, KitRecipe } from "@/types"; // Import atualizado
import HomeClient from "@/components/views/HomeClient";

// ISR: home servida do cache (rápida em celular fraco), mas refeita no
// máximo a cada 60s. Sem isto a rota vira estática PARA SEMPRE após o
// #155 remover o `force-dynamic` — nome da loja, vitrine, produtos e
// preços editados no admin só apareciam no próximo deploy. Mesmo valor
// de /natura.
export const revalidate = 60;

async function getInitialData() {
  try {
    // Executa as 3 buscas em paralelo para performance máxima
    const [productsSnap, settingsSnap, recipesSnap] = await Promise.all([
      getDocs(query(collection(db, "products"), orderBy("name"))),
      getDoc(doc(db, "settings", "general")),
      getDocs(collection(db, "kit_recipes")),
    ]);

    const products = productsSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
      } as Product;
    });

    const settings = settingsSnap.exists()
      ? (settingsSnap.data() as StoreSettings)
      : ({} as StoreSettings);

    const recipes = recipesSnap.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as KitRecipe)
    );

    return { products, settings, recipes };
  } catch (error) {
    console.error(
      `Erro ao buscar dados iniciais: ${
        (error as any)?.message || "Erro desconhecido"
      }`
    );
    return {
      products: [],
      settings: {} as StoreSettings,
      recipes: [],
    };
  }
}

export default async function Page() {
  const { products, settings, recipes } = await getInitialData();

  return (
    <HomeClient
      initialProducts={products}
      initialSettings={settings}
      initialRecipes={recipes}
    />
  );
}
