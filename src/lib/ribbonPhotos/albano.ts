import type { CatalogProduct } from "./match";

// Catálogo de fitas da Albano pela loja pública deles (WooCommerce Store
// API, aberta, sem chave e sem custo). ~1.800 produtos em ~19 páginas de
// 100; baixa em paralelo e guarda por 6 h na instância do servidor.

const PAGES = 25;
const TTL_MS = 6 * 60 * 60 * 1000;
const UA = { "User-Agent": "Mozilla/5.0 (MixNovidades admin)", Accept: "application/json" };

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

interface StoreProduct {
  name?: string;
  sku?: string;
  images?: { src?: string }[];
}

let cache: { at: number; data: CatalogProduct[] } | null = null;

const decode = (s: string) =>
  s.replace(/&#(\d+);/g, (_, n: string) => String.fromCharCode(Number(n))).replace(/&amp;/g, "&");

async function page(n: number, fetchImpl: FetchLike): Promise<CatalogProduct[]> {
  try {
    const res = await fetchImpl(
      `https://albano.com.br/wp-json/wc/store/v1/products?search=fita&per_page=100&page=${n}`,
      { headers: UA, signal: AbortSignal.timeout(15_000) },
    );
    if (!res.ok) return [];
    const list = (await res.json()) as StoreProduct[];
    if (!Array.isArray(list)) return [];
    return list.map((p) => ({
      name: decode(p.name ?? ""),
      sku: p.sku ?? "",
      images: (p.images ?? [])
        .map((i) => i.src ?? "")
        .filter((u) => u.startsWith("https://")),
    }));
  } catch {
    return []; // página que falhou: o resto ainda serve (o que faltar vai para a busca)
  }
}

export async function albanoCatalog(fetchImpl: FetchLike = fetch): Promise<CatalogProduct[]> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.data;
  const pages = await Promise.all(Array.from({ length: PAGES }, (_, i) => page(i + 1, fetchImpl)));
  const data = pages.flat();
  if (data.length > 0) cache = { at: Date.now(), data };
  return data;
}

export function resetAlbanoCache() {
  cache = null;
}
