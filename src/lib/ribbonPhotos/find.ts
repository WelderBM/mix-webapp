import type { ImageResult } from "@/lib/imageSearch/provider";
import { matchCatalog, pickSearchPhotos, searchQuery, type CatalogProduct } from "./match";

// Fotos de uma leva de fitas (servidor): primeiro a foto oficial da Albano;
// o que não estiver lá vai para a busca (Serper, 1 crédito por fita) e
// leva até 3 fotos de produto. Sem chave da busca, fica sem foto (o
// cadastro usa o desenho do rolo, como antes).

export interface RibbonPhotoItem {
  id: string;
  name: string;
  ean?: string | null;
  brand?: string | null;
}

export interface RibbonPhotos {
  urls: string[];
  source: "fabricante" | "busca" | null;
}

export const MAX_PHOTOS = 3;

export async function findRibbonPhotos(
  items: RibbonPhotoItem[],
  catalog: CatalogProduct[],
  search: ((q: string) => Promise<ImageResult[]>) | null,
  concurrency = 4,
): Promise<Record<string, RibbonPhotos>> {
  const out: Record<string, RibbonPhotos> = {};
  const toSearch: RibbonPhotoItem[] = [];
  for (const it of items) {
    const hit = matchCatalog(it, catalog);
    if (hit) out[it.id] = { urls: hit.images.slice(0, MAX_PHOTOS), source: "fabricante" };
    else toSearch.push(it);
  }
  // Busca em paralelo, poucas por vez (cota e tempo do servidor).
  let next = 0;
  async function worker() {
    while (next < toSearch.length) {
      const it = toSearch[next++];
      if (!search) {
        out[it.id] = { urls: [], source: null };
        continue;
      }
      try {
        const urls = pickSearchPhotos(await search(searchQuery(it.name, it.brand)), MAX_PHOTOS);
        out[it.id] = { urls, source: urls.length ? "busca" : null };
      } catch {
        out[it.id] = { urls: [], source: null };
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, toSearch.length) }, worker));
  return out;
}
