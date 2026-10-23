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
  // Cintilante: cores bem realçadas e brilho forte (não é o perolado claro).
  cintilante: { shape: "latex", colors: ["#db2777", "#2563eb", "#16a34a"], metallic: true },
  uniq: { shape: "latex", colors: ["#b08497"], metallic: false },
  canudo: { shape: "latex", colors: ["#f97316", "#22c55e", "#a855f7"], metallic: false },
  neon: { shape: "latex", colors: ["#39ff14", "#ff2bd6", "#fff01f"], metallic: false },
  // Letras E números: o cartão mostra os dois.
  foil_numeros: { shape: "letra", colors: ["#d4a017"], metallic: true, glyph: "A1" },
};
const FALLBACK: Look = { shape: "latex", colors: ["#a855f7"], metallic: false };

// Tipo de outra marca ("simples__riberball") usa a arte do tipo base.
const baseOf = (typeId: string) => typeId.split("__")[0];

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

// Pontos de brilho do cintilante (estrelinhas de 4 pontas).
function sparkles(): string {
  const at = (x: number, y: number, r: number) =>
    `<path d="M ${x} ${y - r} Q ${x} ${y} ${x + r} ${y} Q ${x} ${y} ${x} ${y + r} Q ${x} ${y} ${x - r} ${y} Q ${x} ${y} ${x} ${y - r} Z" fill="#ffffff" opacity="0.95"/>`;
  return at(140, 190, 20) + at(318, 200, 16) + at(240, 120, 22) + at(372, 250, 11) + at(196, 262, 11);
}
const withSparkles = (svg: string) => svg.replace("</svg>", `${sparkles()}</svg>`);

// Canudo (balão de modelar 260): tubo fino e comprido, curvo, com nó numa
// ponta. Contorno escuro + cor + reflexo, tudo com traço arredondado.
function tube(d: string, color: string, knot: [number, number]): string {
  return `<path d="${d}" fill="none" stroke="#475569" stroke-width="50" stroke-linecap="round"/>
    <path d="${d}" fill="none" stroke="${color}" stroke-width="42" stroke-linecap="round"/>
    <path d="${d}" fill="none" stroke="#ffffff" stroke-width="8" stroke-linecap="round" opacity="0.45" transform="translate(-8 -9)"/>
    <circle cx="${knot[0]}" cy="${knot[1]}" r="9" fill="#475569"/>`;
}
function canudoSvg(colors: string[], background: boolean): string {
  const [a, b, c] = colors;
  const body = colors.length > 1
    ? tube("M 90 400 C 160 250, 260 300, 300 150 S 390 60, 430 90", a, [72, 414]) +
      tube("M 80 300 C 200 330, 300 230, 430 260", b, [60, 300]) +
      tube("M 140 460 C 250 420, 330 400, 420 330", c, [120, 470])
    : tube("M 110 420 C 180 260, 300 330, 340 190 S 400 90, 420 80", a, [92, 436]);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  ${background ? '<rect width="512" height="512" fill="#ffffff"/>' : ""}
  ${body}
</svg>`;
}

const cache = new Map<string, string>();

// Cartão do tipo (buquê, com fundo) ou tamanho (um só, sem fundo).
function draw(typeId: string, look: Look, card: boolean): string {
  if (typeId === "canudo") return canudoSvg(look.colors, card);
  const svg = balloonSvg(info(look, card), look.glyph, { caption: false, background: card });
  return typeId === "cintilante" ? withSparkles(svg) : svg;
}

// Cartão do tipo: buquê (ou a letra, no foil) no material do tipo.
export function balloonTypeImage(typeId: string): string {
  typeId = baseOf(typeId);
  const k = `t:${typeId}`;
  if (!cache.has(k)) {
    const look = LOOKS[typeId] ?? FALLBACK;
    cache.set(k, toDataUrl(draw(typeId, look, true)));
  }
  return cache.get(k)!;
}

// Etapa do tamanho: um balão só, sem fundo (vai dentro do botão).
export function balloonSizeImage(typeId: string): string {
  typeId = baseOf(typeId);
  const k = `s:${typeId}`;
  if (!cache.has(k)) {
    const look = LOOKS[typeId] ?? FALLBACK;
    cache.set(k, toDataUrl(draw(typeId, { ...look, colors: [look.colors[0]] }, false)));
  }
  return cache.get(k)!;
}

// "9" → 9 pol; "40cm" → 16 pol; "75cm" → 30; canudo "260" não é polegada.
export function sizeInInches(typeId: string, size: string): number | null {
  typeId = baseOf(typeId);
  if (typeId === "canudo") return null;
  const cm = /^(\d+(?:[.,]\d+)?)\s*cm$/i.exec(size.trim());
  if (cm) return Math.round(Number(cm[1].replace(",", ".")) / 2.54);
  const n = Number(size.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
}

// Lado do desenho em px: proporcional às polegadas, entre 44 e 96 (cabe
// no botão de 2 colunas num celular de 360 px, mesmo no hover).
export function balloonVisualPx(typeId: string, size: string): number {
  const inches = sizeInInches(typeId, size);
  if (inches == null) return 76; // canudo: tamanho único
  return Math.round(Math.min(96, Math.max(44, 28 + inches * 4.25)));
}

// Rótulo do tamanho: 9" · 40 cm · 260 (canudo).
export function balloonSizeLabel(typeId: string, size: string): string {
  typeId = baseOf(typeId);
  if (/cm$/i.test(size.trim())) return size.replace(/\s*cm$/i, " cm");
  if (typeId === "canudo") return size;
  return `${size}"`;
}

// Explicação curta abaixo do tamanho quando o número sozinho não diz nada
// ao cliente: 260 é o código do balão de modelar (fino e comprido).
export function balloonSizeHint(typeId: string): string | null {
  typeId = baseOf(typeId);
  return typeId === "canudo" ? "de modelar, fino e comprido" : null;
}
