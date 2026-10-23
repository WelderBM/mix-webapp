import { assertPublicHttpsUrl, UnsafeUrlError } from "./safeUrl";

// O servidor baixa a foto escolhida (#267): o navegador esbarraria em CORS
// para desenhar a imagem de outro site no canvas. Cada salto de
// redirecionamento passa pela mesma checagem de endereço público.

export const MAX_BYTES = 5 * 1024 * 1024;
const MAX_REDIRECTS = 3;
const IMAGE_TYPES = /^image\/(jpeg|png|webp|gif|avif)$/;

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;
type Resolve = (host: string) => Promise<string[]>;

export class DownloadError extends Error {}

export async function downloadImage(
  raw: string,
  fetchImpl: FetchLike = fetch,
  resolve?: Resolve,
): Promise<{ bytes: Uint8Array; contentType: string }> {
  let current = raw;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const url = await assertPublicHttpsUrl(current, resolve);
    const res = await fetchImpl(url.toString(), {
      redirect: "manual",
      headers: { Accept: "image/*", "User-Agent": "Mozilla/5.0 (MixNovidades admin)" },
      signal: AbortSignal.timeout(8_000),
    });
    if (res.status >= 300 && res.status < 400) {
      const next = res.headers.get("location");
      if (!next) throw new DownloadError("Redirecionamento sem destino.");
      current = new URL(next, url).toString();
      continue;
    }
    if (!res.ok) throw new DownloadError(`O site da foto respondeu ${res.status}.`);
    const contentType = (res.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
    if (!IMAGE_TYPES.test(contentType)) throw new DownloadError("O link não é uma imagem.");
    const declared = Number(res.headers.get("content-length") ?? 0);
    if (declared > MAX_BYTES) throw new DownloadError("Imagem grande demais.");
    // Lê em pedaços e corta no limite (content-length pode mentir ou faltar).
    const reader = res.body?.getReader();
    if (!reader) throw new DownloadError("Imagem vazia.");
    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BYTES) {
        await reader.cancel();
        throw new DownloadError("Imagem grande demais.");
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(total);
    let off = 0;
    for (const c of chunks) {
      bytes.set(c, off);
      off += c.byteLength;
    }
    return { bytes, contentType };
  }
  throw new DownloadError("Redirecionamentos demais.");
}

export { UnsafeUrlError };
