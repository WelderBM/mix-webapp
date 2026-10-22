import type { BalloonConfig, BalloonStock, BalloonTypeConfig } from "@/types/balloon";
import { normalizeText } from "./search";

// Balões do Noturno × catálogo de balões do site (`settings/balloons`:
// tipo → tamanhos → cores, usado pelo montador da loja). A cada
// importação, cada balão do Noturno é ligado a (tipo, tamanho, cor) do
// catálogo e o estoque é somado — vira `settings/balloonStock`, que o
// montador usa para esconder a cor ESGOTADA naquele tamanho. O que não
// casa (cor ou tamanho fora do catálogo) aparece no levantamento do
// admin, com botão para adicionar.
//
// Formatos (coração, estrela, redondo) e temáticos não são do catálogo:
// seguem como produto comum (#254).

export interface CatalogMatch {
  typeId: string;
  size: string | null; // como no catálogo ("9", "6.5", "40cm"); null = não achou
  color: string | null; // nome EXATO de uma cor do catálogo; null = não casou
  rawColor: string; // cor como veio do Noturno, legível ("Verde Folha")
}

// Abreviações e palavras quebradas do Noturno ("VD FOLHA", "PR EBAN O").
const ABBREV: Record<string, string> = {
  BR: "BRANCO", PR: "PRETO", VD: "VERDE", LR: "LARANJA", ROS: "ROSA",
  AZ: "AZUL", VM: "VERMELHO", AM: "AMARELO", RX: "ROXO", PRATEADO: "PRATA",
  PRATEADA: "PRATA", DOURADA: "DOURADO", OURO: "DOURADO", SHOCK: "CHOQUE",
  RS: "ROSA", HOTTELA: "HORTELA",
};

// Palavras que não são cor (tipo, embalagem, medidas).
const NOISE = new Set([
  "BALAO", "LISO", "RED", "CANDY", "COLORS", "UNIQ", "METALLIC", "BALLOON",
  "CINTILANTE", "CANUDO", "METALIZADO", "METAL", "NEON", "GRANFESTA", "UND",
  "UND.", "UN", "UNID", "C", "POR", "CM", "M", "N",
]);

export function balloonTypeOf(name: string): { typeId: string; size: string | null } | null {
  const n = name.toUpperCase();
  if (/\b(16 ?40 ?CM|1640 ?CM)\b.*\s[A-Z0-9&]$/.test(n)) return { typeId: "foil_numeros", size: "40cm" };
  if (/\b32 ?75 ?CM\b.*\s[A-Z0-9&]$/.test(n)) return { typeId: "foil_numeros", size: "75cm" };
  if (/\bCANUDO\b|\b260\b/.test(n)) return { typeId: "canudo", size: "260" };
  // Bobo/bubble: balão transparente especial, não é o látex do catálogo.
  if (/\bBOBO\b|\bBUBBLE\b/.test(n)) return null;
  // Foil de formato (coração, estrela…) e temáticos: produto, não catálogo.
  if (/\bMETAL\b|\bMETALIZADO\b/.test(n)) return null;
  let typeId: string | null = null;
  if (/\bUNIQ\b/.test(n)) typeId = "uniq";
  else if (/\bCANDY\b/.test(n)) typeId = "candy";
  else if (/\bCINTILANTE\b/.test(n)) typeId = "cintilante";
  else if (/\bMETALLIC\b|\bPEROLADO\b/.test(n)) typeId = "metalico";
  else if (/\bLISO\b|\bRED\b|\bGRANFESTA\b|\bN\.\d|\bC\/ ?\d+/.test(n)) typeId = "simples";
  if (!typeId) return null;
  const m = /^BALAO (?:[A-Z ]+? )?(\d{1,2}(?:[.,]\d)?)\b/.exec(n) ?? /\bN\.(\d)\b/.exec(n);
  // "7.0" = "7"; "6,5" = "6.5" (como está no catálogo).
  return { typeId, size: m ? String(Number(m[1].replace(",", "."))) : null };
}

// Texto da cor: o que sobra do nome tirando tipo, tamanho e embalagem.
export function colorWords(name: string): string {
  return name
    .toUpperCase()
    .replace(/\bC\/ ?\d+\b|\b\d+X\d+\b|\b\d+(?:[.,]\d+)? ?CM\b|\bN\.\d\b|\b\d+(?:[.,]\d+)?\b/g, " ")
    .replace(/[,.;()]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !NOISE.has(w))
    .map((w) => ABBREV[w] ?? w)
    .join(" ")
    .trim();
}

const key = (s: string) => normalizeText(s).replace(/[^a-z0-9]/g, "");
const titleCase = (s: string) =>
  s.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());

export function matchCatalogColor(type: BalloonTypeConfig, words: string): string | null {
  if (!words) return null;
  const w = key(words);
  // Variações de nome por tipo: "ROSA" no candy é "Rosa Candy"; no
  // metálico/cintilante o perolado vem sem a palavra.
  const tries = [w, `${w}candy`, `${w}perolado`, `${w}uniq`];
  const colors = [...type.colors].sort((a, b) => b.length - a.length);
  for (const t of tries) {
    const exact = colors.find((c) => key(c) === t);
    if (exact) return exact;
  }
  // Palavra quebrada/abreviada: catálogo contido no texto (ou o contrário).
  return (
    colors.find((c) => w.includes(key(c))) ??
    // "TUTTI FRUTTI" → "Rosa Tutti Frutti" (o nome do catálogo contém o texto).
    colors.find((c) => w.length >= 6 && key(c).includes(w)) ??
    // "ROSE" → "Rose Gold".
    colors.find((c) => w.length >= 4 && key(c).startsWith(w)) ??
    null
  );
}

export function matchBalloon(name: string, config: BalloonConfig): CatalogMatch | null {
  const t = balloonTypeOf(name);
  if (!t) return null;
  const type = config.types.find((x) => x.id === t.typeId);
  if (!type) return null;
  const size = t.size && type.sizes.some((s) => s.size === t.size) ? t.size : null;
  const words =
    t.typeId === "foil_numeros"
      ? colorWords(name.toUpperCase().replace(/\s+[A-Z0-9&]$/, ""))
      : colorWords(name);
  return {
    typeId: t.typeId,
    size: size ?? t.size,
    color: matchCatalogColor(type, words),
    rawColor: titleCase(words),
  };
}


export interface CatalogSurvey {
  stock: BalloonStock;
  matched: number;
  // Cor do Noturno que o catálogo não tem (sugestão de cor nova).
  newColors: { typeId: string; size: string | null; color: string; stock: number; items: number }[];
  // Tamanho do Noturno que o tipo não tem cadastrado.
  newSizes: { typeId: string; size: string; stock: number; items: number }[];
  notCatalog: number; // formatos/temáticos: seguem como produto
}

type StockItem = { family: string | null; name: string; stock: number; inLatestImport?: boolean };

export function surveyCatalog(items: StockItem[], config: BalloonConfig): CatalogSurvey {
  const stock: BalloonStock = {};
  const newColors = new Map<string, CatalogSurvey["newColors"][number]>();
  const newSizes = new Map<string, CatalogSurvey["newSizes"][number]>();
  let matched = 0;
  let notCatalog = 0;
  for (const i of items) {
    if (i.family !== "BALAO" || i.inLatestImport === false) continue;
    const m = matchBalloon(i.name, config);
    if (!m) {
      notCatalog++;
      continue;
    }
    const qty = Math.max(0, i.stock);
    const type = config.types.find((t) => t.id === m.typeId)!;
    const sizeKnown = m.size != null && type.sizes.some((s) => s.size === m.size);
    if (!sizeKnown) {
      if (m.size) {
        const k = `${m.typeId}|${m.size}`;
        const e = newSizes.get(k) ?? { typeId: m.typeId, size: m.size, stock: 0, items: 0 };
        e.stock += qty;
        e.items++;
        newSizes.set(k, e);
      }
      continue;
    }
    if (!m.color) {
      if (m.rawColor) {
        const k = `${m.typeId}|${m.size}|${key(m.rawColor)}`;
        const e = newColors.get(k) ?? { typeId: m.typeId, size: m.size, color: m.rawColor, stock: 0, items: 0 };
        e.stock += qty;
        e.items++;
        newColors.set(k, e);
      }
      continue;
    }
    matched++;
    const bySize = (stock[m.typeId] ??= {});
    const byColor = (bySize[m.size!] ??= {});
    byColor[m.color] = (byColor[m.color] ?? 0) + qty;
  }
  return {
    stock,
    matched,
    newColors: [...newColors.values()].sort((a, b) => b.stock - a.stock),
    newSizes: [...newSizes.values()].sort((a, b) => b.stock - a.stock),
    notCatalog,
  };
}

// Montador da loja: cor ESGOTADA = o Noturno confirmou estoque zero
// naquele tamanho. Cor sem informação (não casou no cruzamento) continua
// aparecendo — erro de leitura nunca esconde balão que existe.
export function isSoldOut(
  stock: BalloonStock | null | undefined,
  typeId: string,
  size: string,
  color: string,
): boolean {
  const q = stock?.[typeId]?.[size]?.[color];
  return q !== undefined && q <= 0;
}

// "Adicionar ao catálogo": devolve os tipos com as cores novas incluídas
// (sem repetir; nome normalizado decide se já existe). Puro.
export function withAddedColors(
  types: BalloonTypeConfig[],
  adds: { typeId: string; color: string }[],
): BalloonTypeConfig[] {
  return types.map((t) => {
    const mine = adds.filter((a) => a.typeId === t.id).map((a) => a.color.trim()).filter(Boolean);
    if (mine.length === 0) return t;
    const colors = [...t.colors];
    for (const c of mine) {
      if (!colors.some((x) => key(x) === key(c))) colors.push(c);
    }
    return { ...t, colors };
  });
}
