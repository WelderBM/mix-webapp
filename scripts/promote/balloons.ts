// Parte pura do "levar o catálogo de balões do staging para produção"
// (#319): achar as fotos que o catálogo usa, trocar os links para o
// bucket de produção e descrever o que vai mudar. Sem Firebase aqui, para
// testar sem rede; quem lê/grava é scripts/promote-balloons.ts.

import type { BalloonConfig } from "../../src/types/balloon";

export interface StorageRef {
  bucket: string;
  path: string;
}

// Link de download do Firebase Storage:
// https://firebasestorage.googleapis.com/v0/b/<bucket>/o/<caminho codificado>?alt=media&token=…
export function parseStorageUrl(url: string): StorageRef | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (u.hostname !== "firebasestorage.googleapis.com") return null;
  const m = /^\/v0\/b\/([^/]+)\/o\/(.+)$/.exec(u.pathname);
  if (!m) return null;
  return { bucket: m[1], path: decodeURIComponent(m[2]) };
}

export function downloadUrl(bucket: string, path: string, token: string): string {
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
}

// Links de foto que o catálogo usa (tipo e imagem padrão), sem repetir.
export function catalogImageUrls(config: BalloonConfig): string[] {
  const urls = [config.placeholderUrl, ...config.types.map((t) => t.imageUrl)];
  return [...new Set(urls.filter((u): u is string => !!u))];
}

// Troca cada link pelo novo (os que não estão no mapa ficam como estão).
export function rewriteImageUrls(config: BalloonConfig, map: Map<string, string>): BalloonConfig {
  const swap = (u?: string) => (u && map.has(u) ? map.get(u) : u);
  const out: BalloonConfig = {
    ...config,
    types: config.types.map((t) => {
      const next = { ...t };
      if (t.imageUrl) next.imageUrl = swap(t.imageUrl);
      return next;
    }),
  };
  if (config.placeholderUrl) out.placeholderUrl = swap(config.placeholderUrl);
  return out;
}

const brl = (n: number) => `R$ ${n.toFixed(2).replace(".", ",")}`;

// Resumo legível do que muda em produção, tipo a tipo.
export function describeCatalogChange(prod: BalloonConfig | null, next: BalloonConfig): string[] {
  const lines: string[] = [];
  const before = new Map((prod?.types ?? []).map((t) => [t.id, t]));
  const after = new Map(next.types.map((t) => [t.id, t]));
  for (const t of next.types) {
    const old = before.get(t.id);
    const label = `${t.name}${t.brand ? ` (${t.brand})` : ""}`;
    if (!old) {
      const sizes = t.sizes.map((s) => `${s.size} ${brl(s.price)}`).join(", ");
      lines.push(`+ ${label}: tipo novo · ${sizes || "sem tamanhos"} · ${t.colors.length} cores`);
      continue;
    }
    const diffs: string[] = [];
    const oldSizes = new Map(old.sizes.map((s) => [s.size, s]));
    const newSizes = new Map(t.sizes.map((s) => [s.size, s]));
    for (const s of t.sizes) {
      const o = oldSizes.get(s.size);
      if (!o) diffs.push(`+${s.size} ${brl(s.price)}`);
      else if (o.price !== s.price) diffs.push(`${s.size} ${brl(o.price)}→${brl(s.price)}`);
      else if (o.unitsPerPackage !== s.unitsPerPackage)
        diffs.push(`${s.size} pacote ${o.unitsPerPackage}→${s.unitsPerPackage}`);
    }
    for (const s of old.sizes) if (!newSizes.has(s.size)) diffs.push(`−${s.size}`);
    const oldColors = new Set(old.colors);
    const newColors = new Set(t.colors);
    const added = t.colors.filter((c) => !oldColors.has(c)).length;
    const removed = old.colors.filter((c) => !newColors.has(c)).length;
    if (added) diffs.push(`+${added} cores`);
    if (removed) diffs.push(`−${removed} cores`);
    if ((old.active !== false) !== (t.active !== false)) diffs.push(t.active === false ? "desativado" : "ativado");
    if (old.imageUrl !== t.imageUrl) diffs.push("foto");
    if (diffs.length) lines.push(`~ ${label}: ${diffs.join(", ")}`);
  }
  for (const [id, t] of before) if (!after.has(id)) lines.push(`− ${t.name}: sai do catálogo`);
  return lines;
}
