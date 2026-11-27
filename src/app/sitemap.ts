import { MetadataRoute } from "next";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { STATIC_PAGES, productEntries } from "@/lib/sitemapEntries";

// Sem isto a rota é gerada no build e fica congelada até o próximo deploy
// (docs/claude-lessons.md, "Rota sem revalidate"). Um dia basta para o
// Google, e cada regeneração lê a coleção products inteira.
export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  let productsUrls: MetadataRoute.Sitemap = [];
  try {
    const productsSnap = await getDocs(collection(db, "products"));
    productsUrls = productEntries(
      productsSnap.docs.map((d) => ({ id: d.id, disabled: d.data().disabled })),
      now
    );
  } catch (error) {
    console.error("Erro ao gerar sitemap de produtos:", error);
  }

  return [...STATIC_PAGES.map((p) => ({ ...p, lastModified: now })), ...productsUrls];
}
