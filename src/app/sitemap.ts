import { MetadataRoute } from "next";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "https://mixnovidades.com.br";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Buscar todos os produtos para gerar URLs dinâmicas
  let productsUrls: MetadataRoute.Sitemap = [];
  try {
    const productsSnap = await getDocs(collection(db, "products"));
    productsUrls = productsSnap.docs.map((doc) => ({
      url: `${BASE_URL}/produto/${doc.id}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch (error) {
    console.error("Erro ao gerar sitemap de produtos:", error);
  }

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/fitas`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/baloes`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...productsUrls,
  ];
}
