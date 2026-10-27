import { auth } from "@/lib/firebase";
import { compressImage } from "@/lib/intake/compressImage";
import type { ImageResult } from "./provider";

// Lado do navegador da busca de foto (#267): chama as rotas com o token
// da atendente e devolve a foto já comprimida, pronta para o upload.

async function authHeaders(): Promise<HeadersInit> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Entre de novo no admin.");
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

async function errorOf(res: Response): Promise<Error> {
  const body = (await res.json().catch(() => ({}))) as { error?: string };
  return new Error(body.error ?? "Não foi possível completar agora.");
}

let enabledCache: Promise<boolean> | null = null;

// O botão "Buscar foto" só aparece com a chave configurada no servidor.
export function imageSearchEnabled(): Promise<boolean> {
  enabledCache ??= authHeaders()
    .then((headers) => fetch("/api/admin/image-search", { headers }))
    .then((r) => (r.ok ? r.json() : { enabled: false }))
    .then((d: { enabled?: boolean }) => !!d.enabled)
    .catch(() => {
      enabledCache = null; // tenta de novo na próxima abertura
      return false;
    });
  return enabledCache;
}

export async function searchImages(q: string): Promise<ImageResult[]> {
  const res = await fetch("/api/admin/image-search", {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ q }),
  });
  if (!res.ok) throw await errorOf(res);
  return ((await res.json()) as { results: ImageResult[] }).results;
}

export async function fetchChosenImage(url: string): Promise<Blob> {
  const res = await fetch("/api/admin/image-fetch", {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ url }),
  });
  if (!res.ok) throw await errorOf(res);
  const blob = await res.blob();
  return compressImage(new File([blob], "foto", { type: blob.type }));
}

// Fotos reais das fitas no cadastro pelo Noturno (relatório 27/10): o
// servidor acha as fotos (fabricante ou busca) em levas de 20.
export async function findRibbonPhotos(
  items: { id: string; name: string; ean?: string | null; brand?: string | null }[],
  onProgress?: (done: number, total: number) => void,
): Promise<Record<string, { urls: string[]; source: string | null }>> {
  const out: Record<string, { urls: string[]; source: string | null }> = {};
  let failure: unknown = null;
  onProgress?.(0, items.length);
  for (let i = 0; i < items.length; i += 20) {
    // Leva que falha não joga fora as anteriores (já pagas na busca).
    try {
      const res = await fetch("/api/admin/ribbon-photos", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ items: items.slice(i, i + 20) }),
      });
      if (!res.ok) throw await errorOf(res);
      Object.assign(out, ((await res.json()) as { photos: typeof out }).photos);
    } catch (e) {
      failure = e;
    }
    onProgress?.(Math.min(i + 20, items.length), items.length);
  }
  if (failure && Object.keys(out).length === 0) throw failure;
  return out;
}
