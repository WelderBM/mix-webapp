// Busca da fila de lançamento (issue #199). O Firestore não tem busca de
// texto, e ler a fila inteira (~7 mil docs) a cada busca estoura a cota
// diária gratuita. Então cada item guarda `searchTokens` = prefixos das
// palavras do nome/código/marca; a busca consulta o banco por UM token
// (`array-contains`, o mais específico que a atendente digitou) e o resto
// dos termos é filtrado no aparelho.

export function normalizeText(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

const MIN_TOKEN = 2;
const MAX_PREFIX = 15;

export function tokenize(text: string): string[] {
  return normalizeText(text)
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

export function searchTokensFor(searchText: string): string[] {
  const out = new Set<string>();
  for (const word of tokenize(searchText)) {
    const max = Math.min(word.length, MAX_PREFIX);
    for (let len = MIN_TOKEN; len <= max; len++) out.add(word.slice(0, len));
  }
  return [...out].sort();
}

export interface ParsedQuery {
  // Token usado na consulta ao Firestore; null = termo curto demais.
  indexToken: string | null;
  terms: string[];
}

// Palavras que aparecem em centenas de itens — consultar por elas lê
// muito e pode cortar resultados no limite da consulta.
const GENERIC = new Set([
  "para", "com", "sem", "de", "da", "do", "das", "dos", "un", "und", "unid",
  "pct", "pc", "cx", "env", "kit", "tam", "cor", "mm", "cm", "ml",
]);
// Cores também aparecem em centenas de itens (inclusive digitadas pela
// metade, "vermelh"); só viram chave se for o único termo.
const COLOR_PREFIXES = [
  "verm", "azu", "pret", "bran", "ros", "verd", "amar", "dour", "prat",
  "our", "lil", "rox", "lar", "marr", "cinz", "bege", "pink", "nude",
];
const isGeneric = (t: string) =>
  GENERIC.has(t) || COLOR_PREFIXES.some((c) => t.startsWith(c) || c.startsWith(t));

// `avoid` = nomes de família (normalizados): também são comuns demais.
export function parseQuery(q: string, avoid: Set<string> = new Set()): ParsedQuery {
  const terms = tokenize(q);
  const candidates = terms.filter((t) => t.length >= MIN_TOKEN);
  if (candidates.length === 0) return { indexToken: null, terms };
  // Do mais específico pro mais comum: termo raro → cor/genérico → família.
  const tiers = [
    candidates.filter((t) => !isGeneric(t) && !avoid.has(t)),
    candidates.filter((t) => !avoid.has(t)),
    candidates,
  ];
  const pool = tiers.find((t) => t.length > 0)!;
  // Entre os específicos, o mais longo tende a ser o mais raro.
  const best = pool.reduce((a, b) => (b.length > a.length ? b : a));
  return { indexToken: best.slice(0, MAX_PREFIX), terms };
}

// Todo termo digitado precisa ser começo de alguma palavra do item:
// "balao roxo 7" casa com "BALAO ROXO N.7 C/50 UND.".
export function matchesQuery(searchText: string, terms: string[]): boolean {
  if (terms.length === 0) return true;
  const words = tokenize(searchText);
  return terms.every((t) => words.some((w) => w.startsWith(t)));
}
