import type { BalloonInfo } from "@/lib/intake/balloons";
import { balloonSvg } from "@/lib/intake/balloonArt";

// Arte do montador de balões da loja (#259): cada TIPO tem a aparência do
// material (liso fosco, metálico brilhante, cintilante perolado, candy
// pastel…) e cada TAMANHO aparece em proporção (5" pequeno, 9" maior).
// Desenhado no navegador (SVG em data URL): sem upload, sem custo. Imagem
// enviada pelo admin para o tipo continua tendo prioridade.

type Look = Pick<BalloonInfo, "shape" | "colors" | "metallic"> & { glyph?: string };

const LOOKS: Record<string, Look> = {
  simples: { shape: "latex", colors: ["#ef4444", "#3b82f6", "#facc15"], metallic: false },
  metalico: { shape: "latex", colors: ["#d4a017"], metallic: true },
  candy: { shape: "latex", colors: ["#f9a8d4", "#93c5fd", "#fde68a"], metallic: false },
  cintilante: { shape: "latex", colors: ["#f5d0fe"], metallic: true },
  uniq: { shape: "latex", colors: ["#b08497"], metallic: false },
  canudo: { shape: "latex", colors: ["#f97316", "#22c55e", "#a855f7"], metallic: false },
  foil_numeros: { shape: "letra", colors: ["#d4a017"], metallic: true, glyph: "A" },
};
const FALLBACK: Look = { shape: "latex", colors: ["#a855f7"], metallic: false };

const toDataUrl = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

function info(look: Look, bouquet: boolean): BalloonInfo {
  return {
    shape: look.shape,
    colors: look.colors,
    metallic: look.metallic,
    glyph: look.glyph ?? null,
    colorName: null,
    sizeLabel: null,
    packQty: bouquet ? 3 : null, // 3 = buquê no desenho de látex
  };
}

const cache = new Map<string, string>();

// Cartão do tipo: buquê (ou a letra, no foil) no material do tipo.
export function balloonTypeImage(typeId: string): string {
  const k = `t:${typeId}`;
  if (!cache.has(k)) {
    const look = LOOKS[typeId] ?? FALLBACK;
    cache.set(k, toDataUrl(balloonSvg(info(look, true), look.glyph, { caption: false })));
  }
  return cache.get(k)!;
}

// Etapa do tamanho: um balão só, sem fundo (vai dentro do botão).
export function balloonSizeImage(typeId: string): string {
  const k = `s:${typeId}`;
  if (!cache.has(k)) {
    const look = LOOKS[typeId] ?? FALLBACK;
    const single: Look = { ...look, colors: [look.colors[0]] };
    cache.set(k, toDataUrl(balloonSvg(info(single, false), look.glyph, { caption: false, background: false })));
  }
  return cache.get(k)!;
}

// "9" → 9 pol; "40cm" → 16 pol; "75cm" → 30; canudo "260" não é polegada.
export function sizeInInches(typeId: string, size: string): number | null {
  if (typeId === "canudo") return null;
  const cm = /^(\d+(?:[.,]\d+)?)\s*cm$/i.exec(size.trim());
  if (cm) return Math.round(Number(cm[1].replace(",", ".")) / 2.54);
  const n = Number(size.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
}

// Lado do desenho em px: proporcional às polegadas, entre 44 e 112.
export function balloonVisualPx(typeId: string, size: string): number {
  const inches = sizeInInches(typeId, size);
  if (inches == null) return 84; // canudo: tamanho único
  return Math.round(Math.min(112, Math.max(44, 30 + inches * 5)));
}

// Rótulo do tamanho: 9" · 40 cm · 260 (canudo).
export function balloonSizeLabel(typeId: string, size: string): string {
  if (/cm$/i.test(size.trim())) return size.replace(/\s*cm$/i, " cm");
  if (typeId === "canudo") return size;
  return `${size}"`;
}
