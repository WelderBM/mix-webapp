// Busca de foto de produto (#267). Um adaptador por serviço: hoje Serper
// (2.500 buscas grátis, Google Imagens). Para trocar (SerpApi, Brave),
// basta outro adaptador com a mesma saída e outra chave.

export interface ImageResult {
  title: string;
  imageUrl: string;
  thumbnailUrl: string;
  width: number | null;
  height: number | null;
  domain: string;
}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

interface SerperImage {
  title?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  imageWidth?: number;
  imageHeight?: number;
  domain?: string;
  source?: string;
}

const https = (u: unknown): u is string => typeof u === "string" && u.startsWith("https://");

export function mapSerperImages(images: SerperImage[] | undefined): ImageResult[] {
  return (images ?? [])
    .filter((i) => https(i.imageUrl) && https(i.thumbnailUrl))
    .map((i) => ({
      title: i.title ?? "",
      imageUrl: i.imageUrl!,
      thumbnailUrl: i.thumbnailUrl!,
      width: i.imageWidth ?? null,
      height: i.imageHeight ?? null,
      domain: i.domain ?? i.source ?? "",
    }));
}

export class ProviderError extends Error {}

export async function searchSerperImages(
  q: string,
  apiKey: string,
  fetchImpl: FetchLike = fetch,
): Promise<ImageResult[]> {
  const res = await fetchImpl("https://google.serper.dev/images", {
    method: "POST",
    headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ q, gl: "br", hl: "pt-br", num: 20 }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    // 401/403: chave errada; 429/402: cota acabou.
    throw new ProviderError(
      res.status === 429 || res.status === 402
        ? "A cota de buscas de foto acabou."
        : `Serviço de busca respondeu ${res.status}.`,
    );
  }
  const data = (await res.json()) as { images?: SerperImage[] };
  return mapSerperImages(data.images);
}
