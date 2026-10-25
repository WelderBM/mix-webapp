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

// Balão de UMA cor no material do tipo (#321): látex fosco/metálico/
// cintilante, canudo ou, no foil, a letra/número em forma de balão. Usado
// no passo da cor e no resumo do montador, no lugar do quadrado de cor.
export function balloonColorImage(typeId: string, hex: string | string[], glyph?: string): string {
  const base = baseOf(typeId);
  const all = Array.isArray(hex) ? hex : [hex];
  // Degradê de 2 tons (Ouro, Prata, Rose Gold…) é UMA cor: a primeira mantém
  // o reflexo metálico. Faixas só para o arco-íris (3+). Canudo: um tubo só.
  const colors = all.length >= 3 && base !== "canudo" ? all : all.slice(0, 1);
  const k = `c:${base}:${colors.join(",")}:${glyph ?? ""}`;
  if (!cache.has(k)) {
    const look = LOOKS[base] ?? FALLBACK;
    const g = look.shape === "letra" ? (glyph || "A") : undefined;
    cache.set(k, toDataUrl(draw(base, { ...look, colors, glyph: g }, false)));
  }
  return cache.get(k)!;
}

// "9" → 9 pol; "40cm" → 16 pol; "75cm" → 30; canudo "260" não é polegada.
export function sizeInInches(typeId: string, size: string): number | null {
  typeId = baseOf(typeId);
  if (typeId === "canudo") return null;
  const cm = /^(\d+(?:[.,]\d+)?)\s*cm$/i.exec(size.trim());
  if (cm) return Math.round(Number(cm[1].replace(",", ".")) / 2.54);
  // Faixa "70-75cm": o maior lado decide o desenho.
  const range = /^\d+\s*[-–]\s*(\d+)\s*cm$/i.exec(size.trim());
  if (range) return Math.round(Number(range[1]) / 2.54);
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

// Rótulo do tamanho com as DUAS medidas (#320): 9" · 23 cm,
// 40 cm · 16", 70–75 cm · 28–30". Canudo "260" é o modelo, não medida.
const fmt = (n: number) => String(n).replace(".", ",");
export function balloonSizeLabel(typeId: string, size: string): string {
  typeId = baseOf(typeId);
  const s = size.trim();
  const range = /^(\d+)\s*[-–]\s*(\d+)\s*cm$/i.exec(s);
  if (range) {
    const [a, b] = [Number(range[1]), Number(range[2])];
    return `${a}–${b} cm · ${Math.round(a / 2.54)}–${Math.round(b / 2.54)}"`;
  }
  const cm = /^(\d+(?:[.,]\d+)?)\s*cm$/i.exec(s);
  if (cm) {
    const n = Number(cm[1].replace(",", "."));
    return `${fmt(n)} cm · ${Math.round(n / 2.54)}"`;
  }
  if (typeId === "canudo") return size;
  const inches = Number(s.replace(",", "."));
  if (!Number.isFinite(inches) || inches <= 0) return size;
  return `${fmt(inches)}" · ${Math.round(inches * 2.54)} cm`;
}

// Explicação curta abaixo do tamanho quando o número sozinho não diz nada
// ao cliente: 260 é o código do balão de modelar (fino e comprido).
export function balloonSizeHint(typeId: string): string | null {
  typeId = baseOf(typeId);
  return typeId === "canudo" ? "de modelar, fino e comprido" : null;
}
