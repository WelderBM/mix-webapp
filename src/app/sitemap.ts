import { MetadataRoute } from "next";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

const BASE_URL = "https://sua-loja-mix.vercel.app"; // URL do seu site

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Buscar todos os produtos para gerar URLs dinâmicas
  const productsSnap = await getDocs(collection(db, "products"));

  const productsUrls = productsSnap.docs.map((doc) => ({
    url: `${BASE_URL}/produto/${doc.id}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/laco-builder`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    ...productsUrls,
  ];
}
