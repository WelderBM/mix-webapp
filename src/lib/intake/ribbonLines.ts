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

const LINE_WORDS = ["MAXI", "MASTER", "PLASTICA", "POLIPROP", "LINE", "FIDEPLA", "LISA"];
const RE_LINE = new RegExp(`\\b(${LINE_WORDS.join("|")})\\b`);
const LINE_LABEL: Record<string, string> = {
  MAXI: "Maxi",
  MASTER: "Master",
  PLASTICA: "Plástica",
  POLIPROP: "Polipropileno",
  LINE: "Line",
  FIDEPLA: "Fidepla",
  LISA: "Lisa",
};

type Item = Pick<IntakeItem, "id" | "sourceCode" | "family" | "name" | "suggestedType" | "status" | "stock">;

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

// Só pendentes: o que já foi lançado (ou pulado) não volta.
export function groupRibbonLines<T extends Item>(items: T[]): RibbonLine<T>[] {
  const map = new Map<string, RibbonLine<T>>();
  for (const i of items) {
    if (i.status !== "pendente" || !isPlasticRibbon(i)) continue;
    const n = i.name.toUpperCase();
    const line = RE_LINE.exec(n)?.[1];
    const meters = extractRollMeters(i.name);
    if (!line || !meters) continue; // sem metragem não dá para vender por metro
    const w = widthMm(i.name);
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
    g.members.push({ item: i, label: ribbonLabel(i.name) });
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
  imageUrl: string | null,
): Omit<Product, "id" | "createdAt"> {
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
    images: imageUrl ? [{ id: "cover", url: imageUrl, isCover: true }] : [],
    imageUrl: imageUrl ?? "",
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
