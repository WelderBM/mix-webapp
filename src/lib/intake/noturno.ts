import type { Cell } from "./xlsx";
import { normalizeText, searchTokensFor } from "./search";
import { detectPack, isPackHint } from "./pack";
import { classifySubcategory } from "./subcategories";
import type {
  IntakeFlag,
  IntakeSourceFields,
  IntakeSuggestedStatus,
} from "@/types/intake";
import type { ProductType, Unit } from "@/types/product";

// Análise do cadastro exportado do Noturno Softwares (issue #198).
// Formato-agnóstico: os leitores (Excel, PDF) só produzem `NoturnoRow`;
// limpeza, flags e prioridade moram aqui. Regras de flag portadas do
// flags.py que o dono da loja escreveu na triagem inicial (20/10/2026).

export interface NoturnoRow {
  code: string;
  ref: string | null;
  description: string;
  brand: string | null;
  stock: number;
  unitCost: number;
}

const HEADER = ["ID_PRODUTO", "REFORIGINAL", "DESCRICAO", "MARCA", "ESTOQUE", "CUSTOBASE"];

// O export tem linhas de endereço da loja antes do cabeçalho — acha a
// linha do cabeçalho em vez de assumir posição fixa.
export function rowsFromSheet(sheet: Cell[][]): NoturnoRow[] {
  const headerIdx = sheet.findIndex((r) =>
    HEADER.every((h) => r.some((c) => String(c ?? "").trim().toUpperCase() === h))
  );
  if (headerIdx === -1) {
    throw new Error(
      `Cabeçalho do Noturno não encontrado (esperado: ${HEADER.join(", ")}).`
    );
  }
  const header = sheet[headerIdx].map((c) => String(c ?? "").trim().toUpperCase());
  const col = (name: string) => header.indexOf(name);
  const [iCode, iRef, iDesc, iBrand, iStock, iCost] = HEADER.map(col);

  const out: NoturnoRow[] = [];
  for (const r of sheet.slice(headerIdx + 1)) {
    const code = r[iCode];
    if (code == null || String(code).trim() === "") continue;
    out.push({
      code: String(code).trim(),
      ref: blankToNull(r[iRef]),
      description: String(r[iDesc] ?? ""),
      brand: blankToNull(r[iBrand]),
      stock: toNumber(r[iStock]),
      unitCost: toNumber(r[iCost]),
    });
  }
  return out;
}

function blankToNull(c: Cell): string | null {
  const s = c == null ? "" : String(c).trim();
  return s === "" ? null : s;
}

function toNumber(c: Cell): number {
  if (typeof c === "number") return c;
  if (c == null) return 0;
  // "5.933,000" (pt-BR) ou "5933.0"
  const s = String(c).trim();
  const n = s.includes(",") ? Number(s.replace(/\./g, "").replace(",", ".")) : Number(s);
  return Number.isFinite(n) ? n : 0;
}

export { normalizeText };

const upper = (s: string) => normalizeText(s).toUpperCase();

// Só variantes óbvias de grafia; o resto fica como veio.
const BRAND_CANON: Record<string, string> = {
  "A GOLD": "AGOLD",
  "BELO CHARME": "BELLO CHARME",
  "COATS CORRENTES": "COETS CORRENTES",
  "INTER PONTE": "INTERPONTE",
  "MAX PRINT": "MAXPRINT",
  DIVIPLAST: "DIVPLAST",
  DIVERPLAS: "DIVPLAST",
};

const CURRENT_YEAR = 2026;
const RE_DATADO =
  /NATAL|NATALIN|PASCOA|CARNAVAL|\bCOPA\b|DIA DAS MAES|DIA DOS PAIS|DIA DOS NAMORADOS|HALLOWEEN|JUNIN|\b(?:KIT|REVEILLON|AGENDA|CALENDARIO|PLANNER|ANO) (20\d\d)\b/;
const RE_OBSOLETO =
  /^CELULAR (SAMSUNG|INFINITY|MOTOROLA|LG|NOKIA|XIAOMI)|DVD VIRGEM|EMBALAGEM PARA CD|PEN ?DRIVE \d|PEN DRIVE MULTILASER|\bCHIP (CLARO|TIM|VIVO|OI)\b|MEMORICARD|CABO DVD|\bMP[34]\b|FITA K7|DISQUETE/;
const RE_PERECIVEL =
  /\bBOMBO(M|NS)\b(?!.*PELUCIA)|CHICLETE|KIT KAT|PAO DE MEL|PIRULITO|CHOCOLATE|BISCOITO|FREEGELLS|\bBALA\b|BALAS |TRIDENT|HALLS|PACOCA|DOCE DE|SALGADINHO|REFRIGERANTE|SUCO /;
const RE_NAO_COMIDA =
  /^(FITA|ZIPER|GLOSS|PAPEL|PIRANHA|LINHA|LACO|BOLSA)|CHAVEIRO|BOLHA|CAIXINHA|CAIXA P|EMBALAGEM|FORMA |PELUCIA|BOMBONA/;

// Fita que NÃO é fita de laço (vendida por unidade, não por metro).
const RE_FITA_NAO_LACO =
  /^FITA (ADESIVA|CREPE|DUPLA FACE|ISOLANTE|CORRETIVA|METRICA|MEDIDA|K7|DUREX|VEDA|DEMARCA|ANTIDERRAPANTE|HELLERMANN|TEFLON|MAGNETICA|DE IMPRESSORA|PARA IMPRESSORA|MULTIUSO|SILVER TAPE|EMPACOTAMENTO|TRANSPARENTE|KRAFT|GOMADA|MICROPOROSA|DE VIDEO|LARGA (MARROM|TRANSPARENTE))|^FITA .*(\bDE EMP\b|\b4[58](MM)?X\d)/;

// Foco atual da loja online (decisão de 21/10): material para REVENDA —
// pacotes de sacos, caixas para kits, laços e fita para fazer laço. Pesa
// mais na prioridade da fila. Nível 2: resto de festa/presente.
const RESALE_FAMILIES = new Set([
  "SACO", "SAQUINHO", "CAIXA", "CAIXINHA", "CAIXETA", "CACHEPOT",
  "LACO", "LACINHO", "FITA", "FITILHO",
]);
const GIFT_FAMILIES = new Set([
  "BALAO", "SACOLA", "POLI", "PAPEL", "CESTA", "VELA", "CORTINA", "FAIXA",
  "CONFEITE", "CANECA", "XICARA", "FLOR", "PELUCIA", "URSO", "URSINHO",
  "TOPO", "FORMINHA", "EMBALAGEM", "CARTAO", "ETIQUETA", "FECHO",
]);

// Família → chave normalizada (sem acento, minúscula) da categoria do
// site. Só famílias INEQUÍVOCAS — PAPEL, KIT, BOLA, TINTA, GRAMPO, MINI…
// misturam coisas diferentes e ficam sem palpite (a atendente escolhe).
// Chave sem categoria correspondente no site simplesmente não preenche.
const CATEGORY_BY_FAMILY: Record<string, string> = {
  FITA: "fitas", FITILHO: "fitas",
  LACO: "lacos", LACINHO: "lacos",
  CAIXA: "caixas", CAIXINHA: "caixas", CAIXETA: "caixas", CACHEPOT: "caixas",
  CESTA: "cestas",
  SACO: "sacos", SAQUINHO: "sacos",
  SACOLA: "sacolas",
  BALAO: "baloes",
  POLI: "papel de presente",
  VELA: "artigos de festa", CORTINA: "artigos de festa",
  FAIXA: "artigos de festa", CONFEITE: "artigos de festa",
  CANECA: "canecas e xicaras", XICARA: "canecas e xicaras",
  FLOR: "flores",
  PELUCIA: "ursinhos", URSO: "ursinhos", URSINHO: "ursinhos",
};

const ERROR_FLAGS: IntakeFlag[] = ["placeholder", "ean_invalido", "estoque_suspeito"];
const INFO_FLAGS: IntakeFlag[] = ["estoque_unico", "cadastro_antigo", "sem_ean"];
const DISCARD_FLAGS: IntakeFlag[] = ["datado", "obsoleto", "perecivel"];

function eanValid(ref: string | null): boolean | null {
  if (!ref || !/^\d{13}$/.test(ref)) return null;
  const ds = ref.split("").map(Number).reverse();
  const sum = ds.slice(1).reduce((t, d, i) => t + d * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === ds[0];
}

export function cleanName(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

export function analyzeNoturnoRows(rows: NoturnoRow[]): IntakeSourceFields[] {
  const dupKey = (d: string) => upper(d).replace(/\W+/g, " ").trim();
  const dupCount = new Map<string, number>();
  for (const r of rows) {
    const k = dupKey(r.description);
    dupCount.set(k, (dupCount.get(k) ?? 0) + 1);
  }
  const dupIds = new Map<string, number>();
  [...dupCount.entries()]
    .filter(([, n]) => n > 1)
    .map(([k]) => k)
    .sort()
    .forEach((k, i) => dupIds.set(k, i + 1));

  return rows.map((r) => {
    const name = cleanName(r.description);
    const d = upper(name);
    const brandRaw = r.brand ? cleanName(r.brand) : null;
    const brandKey = brandRaw ? upper(brandRaw) : "";
    const family = d.split(" ")[0] || null;
    const ean = eanValid(r.ref);
    const fractional = r.stock !== Math.trunc(r.stock);

    const flags: IntakeFlag[] = [];
    if (r.code.length > 7 || d.includes("NAO CADASTRADO")) flags.push("placeholder");
    if (ean === false) flags.push("ean_invalido");
    if (r.stock >= 1000 && r.unitCost <= 0.05) flags.push("estoque_suspeito");
    if ((dupCount.get(dupKey(name)) ?? 0) > 1) flags.push("duplicado");
    const m = RE_DATADO.exec(d);
    if (m && !(m[1] && Number(m[1]) >= CURRENT_YEAR)) flags.push("datado");
    if (RE_OBSOLETO.test(d)) flags.push("obsoleto");
    if (RE_PERECIVEL.test(d) && !RE_NAO_COMIDA.test(d)) flags.push("perecivel");
    if (d.split(" ").length <= 2 || d.length <= 10) flags.push("descricao_generica");
    if (brandKey === "DIVERSOS") flags.push("marca_generica");
    if (brandKey in BRAND_CANON) flags.push("marca_variante");
    if (fractional) flags.push("estoque_fracionario");
    if (r.unitCost <= 0.05 || r.unitCost >= 300) flags.push("custo_extremo");
    if (r.stock === 1) flags.push("estoque_unico");
    if (r.code.length <= 7 && Number(r.code) < 10000) flags.push("cadastro_antigo");
    if (ean !== true) flags.push("sem_ean");

    const reviewCount = flags.filter(
      (f) => !ERROR_FLAGS.includes(f) && !INFO_FLAGS.includes(f)
    ).length;
    const hasError = flags.some((f) => ERROR_FLAGS.includes(f));
    const suggestedStatus: IntakeSuggestedStatus = hasError
      ? "bloqueado"
      : reviewCount >= 2
        ? "revisar"
        : reviewCount === 1
          ? "atencao"
          : "candidato";

    const isRibbon = family === "FITA" && !RE_FITA_NAO_LACO.test(d);
    // Fita de escritório (adesiva, durex…) não é revenda de laço.
    const officeTape = family === "FITA" && !isRibbon;
    const isCoreFamily = family != null && RESALE_FAMILIES.has(family) && !officeTape;
    const isGiftFamily = family != null && GIFT_FAMILIES.has(family);
    const suggestedType: ProductType = isRibbon ? "RIBBON" : "STANDARD_ITEM";
    const pack = isRibbon ? null : detectPack(name);
    const suggestedUnit: Unit =
      isRibbon || fractional ? "m" : isPackHint(pack) ? "pct" : "un";
    // Subcategoria semântica (#232) manda também na categoria quando existe
    // (ex.: cesta → Caixas, papel → Papéis, fita adesiva → Material Escolar).
    const taxonomy = classifySubcategory({ family, name, suggestedType });
    const suggestedCategoryKey = taxonomy
      ? normalizeText(taxonomy.category)
      : family === "FITA" && !isRibbon
        ? null
        : CATEGORY_BY_FAMILY[family ?? ""] ?? null;
    const suggestedSubcategory = taxonomy?.subcategory ?? null;

    const brand = brandRaw ? BRAND_CANON[brandKey] ?? brandRaw : null;
    const searchText = normalizeText([name, r.code, r.ref ?? "", brand ?? ""].join(" "));

    return {
      source: "noturno" as const,
      sourceCode: r.code,
      sourceRef: r.ref,
      ean: ean ? r.ref : null,
      rawName: r.description,
      name,
      family,
      brandRaw,
      brand,
      stock: r.stock,
      unitCost: r.unitCost,
      flags,
      suggestedStatus,
      priority: priorityScore({ isCoreFamily, isGiftFamily, flags, stock: r.stock, unitCost: r.unitCost }),
      isCoreFamily,
      suggestedCategoryKey,
      suggestedSubcategory,
      suggestedType,
      suggestedUnit,
      packQty: pack?.qty ?? null,
      packEvidence: pack?.evidence ?? null,
      duplicateGroup: dupIds.get(dupKey(name)) ?? null,
      searchText,
      searchTokens: searchTokensFor(searchText),
    };
  });
}

// Quanto maior, mais cedo o item aparece na fila. Núcleo da loja domina;
// dentro dele, mais dinheiro parado em estoque sobe; descartáveis afundam.
export function priorityScore(i: {
  isCoreFamily: boolean;
  isGiftFamily?: boolean;
  flags: IntakeFlag[];
  stock: number;
  unitCost: number;
}): number {
  let score = i.isCoreFamily ? 50 : i.isGiftFamily ? 25 : 0;
  const stockValue = Math.max(0, i.stock * i.unitCost);
  score += Math.min(30, Math.round(10 * Math.log10(1 + stockValue)));
  if (i.stock > 1) score += 10;
  for (const f of i.flags) {
    if (ERROR_FLAGS.includes(f)) score -= 100;
    else if (DISCARD_FLAGS.includes(f)) score -= 60;
    else if (!INFO_FLAGS.includes(f)) score -= 5;
  }
  return score;
}
