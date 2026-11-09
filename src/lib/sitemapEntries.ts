import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/siteUrl";

type Entry = MetadataRoute.Sitemap[number];

// Páginas fixas da loja. As landing pages /natura e /baloes-boa-vista
// existem para o Google e estavam fora do sitemap (#400).
export const STATIC_PAGES: Omit<Entry, "lastModified">[] = [
  { url: SITE_URL, changeFrequency: "daily", priority: 1 },
  { url: `${SITE_URL}/fitas`, changeFrequency: "daily", priority: 0.9 },
  { url: `${SITE_URL}/baloes`, changeFrequency: "weekly", priority: 0.9 },
  { url: `${SITE_URL}/natura`, changeFrequency: "weekly", priority: 0.8 },
  { url: `${SITE_URL}/baloes-boa-vista`, changeFrequency: "weekly", priority: 0.8 },
];

// Produto desativado não aparece na loja, então não vai para o sitemap.
export function productEntries(
  products: { id: string; disabled?: boolean }[],
  now: Date
): MetadataRoute.Sitemap {
  return products
    .filter((p) => p.disabled !== true)
    .map((p) => ({
      url: `${SITE_URL}/produto/${p.id}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
}
