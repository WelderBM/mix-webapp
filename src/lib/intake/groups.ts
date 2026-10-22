import type { IntakeItem } from "@/types/intake";
import { normalizeText } from "./search";

// Lançamento em grupo (#201, parte 2): o Noturno cadastra cada COR como um
// produto separado ("ZIPER NYLON 15CM COR 540 VERDE", "... COR 501 BRANCO").
// Aqui o nome se divide em BASE (o que é igual entre as cores) e RÓTULO da
// variação (a cor). Itens da mesma família com a mesma base viram UM
// produto da loja com `variants` — a atendente confere o preço uma vez.
//
// No inventário real (20/10): 299 grupos, 1.234 itens.
// Fora: fita de laço (preço e estoque por rolo, cada cor tem o seu).

const COMPOUND_COLORS = [
  "ROSA BEBE", "ROSA PINK", "AZUL MARINHO", "AZUL BEBE", "AZUL CLARO",
  "AZUL ESCURO", "AZUL ROYAL", "AZUL TIFFANY", "VERDE LIMA", "VERDE BANDEIRA",
  "VERDE MUSGO", "VERDE AGUA", "VERDE ESCURO", "VERDE CLARO", "ROXO UVA",
  "ROSE GOLD", "OFF WHITE", "OFF-WHITE", "CANDY COLORS", "VERMELHO QUENTE",
  "AMARELO CANARIO", "CINZA CHUMBO",
];
const SIMPLE_COLORS = new Set(
  (
    "AMARELO AZUL BRANCO PRETO VERMELHO VERDE ROSA ROXO LARANJA MARROM CINZA " +
    "DOURADO DOURADA PRATA PRATEADO PRATEADA OURO PINK LILAS BEGE NUDE VINHO " +
    "BORDO SALMAO CORAL TIFFANY TURQUESA FUCSIA CREME MARFIM CHUMBO GRAFITE " +
    "COBRE BRONZE CHAMPAGNE PEROLA TRANSPARENTE COLORIDO SORTIDO SORTIDAS SORTIDOS"
  ).split(" "),
);
const RE_COMPOUND = new RegExp(
  `(?<![A-Z])(${COMPOUND_COLORS.map((c) => c.replace("-", "\\-")).join("|")})(?![A-Z])`,
  "g",
);
const RE_COLOR_CODE = /\bCOR\s*\d+\b/g;

export interface NameSplit {
  base: string; // nome sem a cor, como veio (maiúsculas)
  label: string | null; // "Vinho cor 121"; null = sem cor no nome
}

const titleCase = (s: string) =>
  s.toLowerCase().replace(/(^|\s)\S/, (c) => c.toUpperCase());

export function splitVariantName(name: string): NameSplit {
  let n = (name ?? "").toUpperCase();
  const labels: string[] = [];
  n = n.replace(RE_COMPOUND, (m) => {
    labels.push(m);
    return " ";
  });
  const base: string[] = [];
  for (const t of n.split(/\s+/).filter(Boolean)) {
    (SIMPLE_COLORS.has(t) ? labels : base).push(t);
  }
  let joined = base.join(" ");
  const codes = joined.match(RE_COLOR_CODE) ?? [];
  joined = joined.replace(RE_COLOR_CODE, " ").replace(/\s+/g, " ").trim();
  // Sobra de separador no fim ("MEIA ABS COL 6MM -").
  joined = joined.replace(/[\s\-–/,]+$/, "").trim();
  const label = [...labels, ...codes].join(" ").trim();
  return { base: joined, label: label ? titleCase(label) : null };
}

type GroupInput = Pick<IntakeItem, "family" | "name" | "suggestedType">;

// Chave do grupo: família + base normalizada. null = item não agrupa.
export function groupKeyFor(item: GroupInput): string | null {
  if (item.suggestedType === "RIBBON") return null;
  const { base, label } = splitVariantName(item.name);
  if (!label || !base) return null;
  return `${item.family ?? ""}|${normalizeText(base)}`;
}

export interface VariantGroup<T> {
  key: string;
  base: string; // nome base para exibir ("Zíper nylon 15cm")
  members: { item: T; label: string }[];
}

// Agrupa os itens CARREGADOS (a fila lê por família ou busca): só vira
// grupo com 2+ itens. Rótulo repetido (cadastro duplicado no Noturno)
// ganha o código para não confundir.
export function buildGroups<T extends GroupInput & { sourceCode: string }>(
  items: T[],
): { groups: VariantGroup<T>[]; singles: T[] } {
  const byKey = new Map<string, T[]>();
  const singles: T[] = [];
  for (const i of items) {
    const k = groupKeyFor(i);
    if (!k) {
      singles.push(i);
      continue;
    }
    byKey.set(k, [...(byKey.get(k) ?? []), i]);
  }
  const groups: VariantGroup<T>[] = [];
  for (const [key, list] of byKey) {
    if (list.length < 2) {
      singles.push(...list);
      continue;
    }
    const split = list.map((i) => ({ item: i, ...splitVariantName(i.name) }));
    const seen = new Map<string, number>();
    for (const s of split) seen.set(s.label!, (seen.get(s.label!) ?? 0) + 1);
    groups.push({
      key,
      base: titleCase(split[0].base),
      members: split
        .map((s) => ({
          item: s.item,
          label: seen.get(s.label!)! > 1 ? `${s.label} (cód. ${s.item.sourceCode})` : s.label!,
        }))
        .sort((a, b) => a.label.localeCompare(b.label, "pt-BR")),
    });
  }
  groups.sort((a, b) => a.base.localeCompare(b.base, "pt-BR"));
  return { groups, singles };
}
