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
