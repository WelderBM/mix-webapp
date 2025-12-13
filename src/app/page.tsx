// src/app/page.tsx
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product, StoreSettings } from "@/lib/types"; // Tipagem correta
import HomeClient from "@/components/views/HomeClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getInitialData() {
  try {
    const productsRef = collection(db, "products");
    const q = query(productsRef, orderBy("name"));
    const productsSnap = await getDocs(q);

    const products = productsSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
      } as Product;
    });

    const settingsRef = doc(db, "settings", "general");
    const settingsSnap = await getDoc(settingsRef);
    const settings = settingsSnap.exists()
      ? (settingsSnap.data() as StoreSettings)
      : ({} as StoreSettings);

    return { products, settings };
  } catch (error) {
    console.error("Erro ao buscar dados iniciais no servidor:", error);
    return { products: [], settings: {} as StoreSettings };
  }
}

export default async function Page() {
  const { products, settings } = await getInitialData();

  return <HomeClient initialProducts={products} initialSettings={settings} />;
}
