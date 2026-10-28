import type { Product } from "@/types";
import type { IntakeItem } from "@/types/intake";
import { classifySubcategory } from "./subcategories";
import { extractRollMeters } from "./publish";
import { normalizeText } from "./search";

// Fitas de plástico para laço por LINHA (#259, decisão de 22/10: o preço
// é o mesmo para todas as cores de uma linha × largura × metragem). A
// atendente digita o preço do rolo e do metro UMA vez por linha e cada cor
// vira uma fita personalizada (RIBBON): vende o rolo inteiro e, aberto, por
// metro; entra no montador de laço.
//
// No inventário real (20/10): 177 fitas de plástico em 14 linhas; só a
// Maxi 32mm × 100m tem 101 cores.

// Mesmas palavras da regra "Fita para laço" (subcategories.ts, #317).
const LINE_WORDS = ["MAXI", "MASTER", "PLASTICA", "LINE"];
const RE_LINE = new RegExp(`\\b(${LINE_WORDS.join("|")})\\b`);
const LINE_LABEL: Record<string, string> = {
  MAXI: "Maxi",
  MASTER: "Master",
  PLASTICA: "Plástica",
  LINE: "Line",
};

type Item = Pick<IntakeItem, "id" | "sourceCode" | "family" | "name" | "suggestedType" | "status" | "stock"> &
  Partial<Pick<IntakeItem, "brand">>;

export interface RibbonLineMember<T> {
  item: T;
  label: string; // cor/estampa, para o nome na loja
}

export interface RibbonLine<T> {
  key: string;
  label: string; // "Maxi 32mm × 100m"
  line: string;
  widthMm: number | null;
  meters: number;
  stock: number;
  members: RibbonLineMember<T>[];
}

const titleCase = (s: string) =>
  s.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());

export function isPlasticRibbon(item: Pick<IntakeItem, "family" | "name" | "suggestedType">): boolean {
  return (
    item.family === "FITA" &&
    item.suggestedType === "RIBBON" &&
    classifySubcategory(item)?.subcategory === "Fita para laço"
  );
}

export function widthMm(name: string): number | null {
  // "32MMX100M": o MM vem colado no X.
  const m = /(\d{1,3}) ?MM(?=X|\b)/.exec(name.toUpperCase());
  return m ? Number(m[1]) : null;
}

// Modelo do fabricante a partir do nome do Noturno (#324, relatório 27/10).
// - MAXI (Albano): tudo entre "MAXI" e as medidas ("MODERN LOVE", "FM 03D",
//   "PAPERLOOK DUPLA FACE"); a cor vem depois das medidas.
// - MASTER e PLASTICA (Xingo, Cromus, Rapid): a primeira palavra, se for
//   um acabamento conhecido; senão a fita é lisa e a palavra é a cor.
const RE_DIM = /^\d+(?:[.,]\d+)?(?:MM)?X\d/;
const FINISH: Record<string, string> = {
  LISA: "Lisa", LISO: "Lisa", GLITTER: "Glitter", LISTRADA: "Listrada", LISTRADO: "Listrada",
  NACARADA: "Nacarada", NACARADO: "Nacarada", TEXTURA: "Textura", FLORAL: "Floral",
  DECORADA: "Decorada", METAL: "Metal", RAPID: "Rapid",
};

export function ribbonModel(name: string, brand?: string | null): string | null {
  const up = name
    .toUpperCase()
    .replace(/\bPAPER LOOK\b/g, "PAPERLOOK")
    .replace(/\bFM ?(\d+[A-Z])\b/g, "FM $1")
    // "32MM X 100M" → "32MMX100M": a medida vira uma palavra só.
    .replace(/(\d)\s*(MM)?\s*X\s*(?=\d)/g, "$1$2X");
  const tokens = up.split(/\s+/);
  const at = tokens.findIndex((t) => LINE_WORDS.includes(t));
  if (at < 0) return null;
  const line = tokens[at];
  let rest = tokens.slice(at + 1);
  if (line === "MAXI") {
    const end = rest.findIndex((t) => RE_DIM.test(t));
    const words = (end < 0 ? [] : rest.slice(0, end)).map((w) => (w === "LISO" ? "LISA" : w));
    if (!words.length) return null;
    return titleCase(words.join(" "))
      .replace(/\bFm\b/, "FM") // sigla e código em maiúsculas: "FM 03D"
      .replace(/\b(\d+)([a-z])\b/g, (_, d: string, l: string) => d + l.toUpperCase());
  }
  // "PLASTICA 32MMX100M XINGO FLORAL": medidas antes; pula a marca.
  if (rest[0] && RE_DIM.test(rest[0])) rest = rest.slice(1);
  const b = (brand ?? "").toUpperCase();
  if (rest[0] && (rest[0] === b || rest[0] === "XINGO" || rest[0] === "RIZZO")) rest = rest.slice(1);
  return FINISH[rest[0]] ?? "Lisa";
}

// Rótulo da cor sem as palavras do modelo e da marca (já estão no título).
function colorLabel(label: string, model: string | null, brand: string | null): string {
  const drop = new Set(
    [model, brand, "Xingo", "Rizzo"]
      .filter(Boolean)
      .flatMap((x) => normalizeText(x!).split(" ")),
  );
  if (model === "Lisa") ["liso", "lisa"].forEach((w) => drop.add(w));
  if (model?.startsWith("Paperlook")) ["paper", "look"].forEach((w) => drop.add(w));
  if (model === "Listrada") drop.add("listrado");
  if (model === "Nacarada") drop.add("nacarado");
  const kept = label.split(" ").filter((w) => !drop.has(normalizeText(w)));
  // Sem cor no nome ("FITA MAXI URSO NATAL 32MMX100M"): o modelo já diz
  // tudo. Não chama de "Lisa" uma estampada (revisão do #380).
  return kept.join(" ");
}

// Nome da cor na loja: marca (fora da Albano, que é a própria linha Maxi),
// modelo (fora "Lisa") e cor. "Xingo Listrada Laranja", "FM 03D Vermelho".
function memberLabel(name: string, model: string | null, brand: string | null, line: string): string {
  const showBrand = brand && line !== "MAXI" && !/^(Albano|Diversos)$/i.test(brand);
  const color = colorLabel(ribbonLabel(name), model, brand);
  return [showBrand ? brand : null, model && model !== "Lisa" ? model : null, color]
    .filter(Boolean)
    .join(" ")
    .trim();
}

// O que sobra do nome tirando "FITA", a linha e as medidas: cor/estampa.
export function ribbonLabel(name: string): string {
  const rest = name
    .toUpperCase()
    .replace(/\b\d+(?:[.,]\d+)? ?MM ?X ?\d+(?:[.,]\d+)? ?M?(?:TS?|ETROS?)?\b/g, " ")
    .replace(/\b\d+(?:[.,]\d+)? ?(MM|M|MTS?|METROS?|CM)\b/g, " ")
    .replace(/\b\d+(?:[.,]\d+)? ?(CM|MT|MTS)\b/g, " ")
    .replace(/\bC\/ ?\d* ?(UN|UND)?\b|\bC\/(?=\s|$)/g, " ")
    // Código de modelo do fabricante ("FM 100L", "FM03D"): não é cor.
    .replace(/\bFM ?\d*[A-Z]?\d*[A-Z]?\b/g, " ")
    .replace(/^FITA\b/, " ")
    .replace(RE_LINE, " ")
    .replace(/(^|\s)[.,/X](?=\s|$)/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^[\s.,/-]+|[\s.,/-]+$/g, "")
    .trim();
  return rest ? titleCase(rest) : "Lisa";
}

// Fita que a tela por linha consegue agrupar: pendente, de laço, com linha
// e metragem no nome. A MESMA regra decide o que sai da fila comum
// (splitBowRibbons): sem isso, "FITA PLASTICA GLITTER AZUL CLARO C/" (sem
// metragem) saía da fila e não entrava em linha nenhuma (revisão do #332).
export function isLineRibbon(i: Pick<IntakeItem, "family" | "name" | "suggestedType" | "status">): boolean {
  return (
    i.status === "pendente" &&
    isPlasticRibbon(i) &&
    RE_LINE.test(i.name.toUpperCase()) &&
    !!extractRollMeters(i.name)
  );
}

// Só pendentes: o que já foi lançado (ou pulado) não volta.
export function groupRibbonLines<T extends Item>(items: T[]): RibbonLine<T>[] {
  const map = new Map<string, RibbonLine<T>>();
  for (const i of items) {
    if (!isLineRibbon(i)) continue; // sem metragem não dá para vender por metro
    const line = RE_LINE.exec(i.name.toUpperCase())![1];
    const meters = extractRollMeters(i.name)!;
    const w = widthMm(i.name);
    // Um preço por medida (dono, 27/10: "todos que têm a mesma medida são o
    // mesmo valor"): agrupa por linha × largura × metragem. Modelo e marca
    // vão para o nome de cada cor, para a estampa continuar identificável.
    const model = ribbonModel(i.name, i.brand);
    const brand = i.brand ? titleCase(i.brand) : null;
    const key = `${line}|${w ?? "?"}|${meters}`;
    const g =
      map.get(key) ??
      ({
        key,
        label: `${LINE_LABEL[line]}${w ? ` ${w}mm` : ""} × ${meters}m`,
        line,
        widthMm: w,
        meters,
        stock: 0,
        members: [],
      } as RibbonLine<T>);
    g.stock += Math.max(0, i.stock);
    g.members.push({ item: i, label: memberLabel(i.name, model, brand, line) });
    map.set(key, g);
  }
  for (const g of map.values()) {
    // Nome repetido na mesma linha (só o código do fabricante diferia, ou
    // não sobrou cor no nome): acrescenta o código do Noturno para a loja
    // não ter duas fitas iguais.
    const count = new Map<string, number>();
    for (const m of g.members) count.set(m.label, (count.get(m.label) ?? 0) + 1);
    for (const m of g.members) {
      if (count.get(m.label)! > 1) m.label = `${m.label} (cód. ${m.item.sourceCode})`;
    }
    g.members.sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
  }
  return [...map.values()].sort((a, b) => b.members.length - a.members.length);
}

export interface RibbonLinePrices {
  rollPrice: number; // rolo fechado inteiro
  meterPrice: number; // por metro, depois de aberto
}

// Produto RIBBON de uma cor da linha. Rolo FECHADO, cheio.
export function buildRibbonProduct(
  item: Pick<IntakeItem, "sourceCode" | "stock">,
  line: Pick<RibbonLine<unknown>, "line" | "widthMm" | "meters">,
  label: string,
  prices: RibbonLinePrices,
  // Uma foto ou várias (foto real do fabricante/busca, relatório 27/10);
  // a primeira é a capa.
  imageUrl: string | string[] | null,
): Omit<Product, "id" | "createdAt"> {
  const urls = (Array.isArray(imageUrl) ? imageUrl : imageUrl ? [imageUrl] : []).filter(Boolean);
  const name = `Fita ${LINE_LABEL[line.line]}${line.widthMm ? ` ${line.widthMm}mm` : ""} ${label}`.trim();
  return {
    name,
    type: "RIBBON",
    category: "Fitas",
    subcategory: "Fita para laço",
    unit: "m",
    price: prices.meterPrice,
    rollPrice: prices.rollPrice,
    canBeSoldAsRoll: true,
    isAvailableForCustomBow: true,
    ribbonInventory: { status: "FECHADO", remainingMeters: line.meters, totalRollMeters: line.meters },
    width: line.widthMm ?? undefined,
    images: urls.map((url, i) => ({ id: i === 0 ? "cover" : `foto-${i + 1}`, url, isCover: i === 0 })),
    imageUrl: urls[0] ?? "",
    inStock: item.stock > 0,
    disabled: false,
    sourceCode: item.sourceCode,
  };
}

export function validateLinePrices(p: { rollPrice: number | null; meterPrice: number | null }): string | null {
  if (!p.rollPrice || p.rollPrice <= 0) return "Digite o preço do rolo.";
  if (!p.meterPrice || p.meterPrice <= 0) return "Digite o preço do metro.";
  return null;
}

export const lineSearchKey = (s: string) => normalizeText(s);

// Fila de lançamento (#259): fita plástica de laço PENDENTE não aparece
// como produto comum; é cadastrada por linha em Fitas › "Cadastrar pelo
// Noturno". Publicada/pulada continua visível nos outros filtros.
export function splitBowRibbons<T extends Pick<IntakeItem, "family" | "name" | "suggestedType" | "status">>(
  items: T[],
): { queue: T[]; bow: T[] } {
  const queue: T[] = [];
  const bow: T[] = [];
  for (const i of items) (isLineRibbon(i) ? bow : queue).push(i);
  return { queue, bow };
}
