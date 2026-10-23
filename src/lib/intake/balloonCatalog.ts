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
// Formatos (coração, estrela, redondo), temáticos e gigantes não são do
// catálogo: seguem como produto comum, agrupados em "Balões
// personalizados" na página de balões.

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
  // Grafias diferentes da mesma cor no Noturno.
  EUCLIPTO: "EUCALIPTO", SORTIDOS: "SORTIDO",
};

// Palavras que não são cor (tipo, embalagem, medidas).
const NOISE = new Set([
  "BALAO", "LISO", "RED", "CANDY", "COLORS", "UNIQ", "METALLIC", "BALLOON",
  "CINTILANTE", "CANUDO", "METALIZADO", "METAL", "NEON", "GRANFESTA", "UND",
  "UND.", "UN", "UNID", "UNIDADE", "C", "POR", "CM", "M", "N",
  // Marca/linha, não cor: "AMARELO ART LATEX", "BASIC BRANCO".
  "ART", "LATEX", "BASIC",
]);

// Nome curto do Noturno → nome completo da cor (casos conferidos à mão).
const COLOR_ALIAS: Record<string, string> = {
  tuttifrutti: "rosatuttifrutti",
  rose: "rosegold",
};

export function balloonTypeOf(name: string): { typeId: string; size: string | null } | null {
  const n = name.toUpperCase();
  if (/\b(16 ?40 ?CM|1640 ?CM)\b.*\s[A-Z0-9&]$/.test(n)) return { typeId: "foil_numeros", size: "40cm" };
  if (/\b32 ?75 ?CM\b.*\s[A-Z0-9&]$/.test(n)) return { typeId: "foil_numeros", size: "75cm" };
  if (/\bCANUDO\b|\b260\b/.test(n)) return { typeId: "canudo", size: "260" };
  // Bobo/bubble: balão transparente especial, não é o látex do catálogo.
  if (/\bBOBO\b|\bBUBBLE\b/.test(n)) return null;
  // Foil de formato (coração, estrela…) e temáticos: produto, não catálogo.
  if (/\bMETAL\b|\bMETALIZADO\b/.test(n)) return null;
  // Temático (estampa), coração/estrela de látex e gigante: personalizados.
  // Estampados sem a palavra TEMA ("HEROIS C/25", "FELIZ ANIVERSARIO N 10")
  // também: senão "Herois Sortido" vira cor do Liso.
  if (/\b(TEMA|CORACAO|ESTRELA|GIGANTE|HEROIS|FLAMINGO|ANIVERSARIO|DECORACAO|LOVE|FELICIDADES|FANTASIA|KIT|UNICORNIO|BOLINHA|PATINHA)\b/.test(n)) return null;
  let typeId: string | null = null;
  if (/\bUNIQ\b/.test(n)) typeId = "uniq";
  else if (/\bCANDY\b/.test(n)) typeId = "candy";
  else if (/\bCINTILANTE\b/.test(n)) typeId = "cintilante";
  else if (/\bMETALLIC\b|\bPEROLADO\b/.test(n)) typeId = "metalico";
  // Neon: tipo próprio (antes caía no Liso como "Verde", "Rosa"…).
  else if (/\bNEON\b/.test(n)) typeId = "neon";
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
    .replace(/\bC\/ ?\d+(?:UND|UN)?\b|\b\d+X\d+\b|\b\d+(?:[.,]\d+)? ?CM\b|\bN\.\d\b|\b\d+(?:[.,]\d+)?\b/g, " ")
    .replace(/[,.;()]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !NOISE.has(w))
    .map((w) => ABBREV[w] ?? w)
    // Palavra quebrada no Noturno ("EBAN O", "POLA R", "QUEN TE"): pedaço
    // de 1–2 letras volta para a palavra anterior. Senão a cor nova entra
    // no catálogo com o nome quebrado.
    .reduce<string[]>((out, w) => {
      if (out.length > 0 && /^[A-Z]{1,2}$/.test(w)) out[out.length - 1] += w;
      else out.push(w);
      return out;
    }, [])
    .join(" ")
    .replace(/\bEUCA LIPTO\b/, "EUCALIPTO")
    .trim();
}

const key = (s: string) => normalizeText(s).replace(/[^a-z0-9]/g, "");
const titleCase = (s: string) =>
  s.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());

// ── Marca ────────────────────────────────────────────────────────────
// Cada tipo do montador é de UMA marca (o cliente escolhe a marca
// primeiro — decisão do dono, 23/10). A marca "da casa" de cada tipo é a
// que o catálogo já registra ou, sem registro, a que mais aparece no
// Noturno (São Roque no liso, Gate no foil). Balão de outra marca vira um
// tipo à parte, com preço próprio: "simples__riberball".
export const baseTypeId = (typeId: string) => typeId.split("__")[0];

const BRAND_TITLE: Record<string, string> = { "SAO ROQUE": "São Roque" };
export function brandTitle(brand: string): string {
  const b = brand.trim().toUpperCase();
  return BRAND_TITLE[b] ?? titleCase(b).replace(/ (E|De|Da|Do) /g, (w) => w.toLowerCase());
}

export type HomeBrands = Record<string, string>; // tipo base → marca

export function homeBrands(items: StockItem[], config: BalloonConfig): HomeBrands {
  const count: Record<string, Record<string, number>> = {};
  for (const i of items) {
    if (i.family !== "BALAO" || i.inLatestImport === false || !i.brand) continue;
    const t = balloonTypeOf(i.name);
    if (!t) continue;
    const c = (count[t.typeId] ??= {});
    c[i.brand] = (c[i.brand] ?? 0) + 1;
  }
  const home: HomeBrands = {};
  for (const [base, byBrand] of Object.entries(count)) {
    home[base] = Object.entries(byBrand).sort((a, b) => b[1] - a[1])[0][0];
  }
  // O registrado no catálogo manda: a casa não muda sozinha numa importação.
  for (const t of config.types) if (!t.id.includes("__") && t.brand) home[t.id] = t.brand;
  return home;
}

export function brandTypeId(base: string, brand: string | null | undefined, home: HomeBrands): string {
  if (!brand || !home[base] || key(brand) === key(home[base])) return base;
  return `${base}__${key(brand)}`;
}

export function matchCatalogColor(type: BalloonTypeConfig, words: string): string | null {
  if (!words) return null;
  const w = key(words);
  // Variações de nome por tipo: "ROSA" no candy é "Rosa Candy"; no
  // metálico/cintilante o perolado vem sem a palavra.
  // Só igualdade, ignorando espaços ("PRETO EBAN O" = "Preto Ébano"). Cor
  // que não casa vira cor NOVA no levantamento, nunca "a mais parecida":
  // "contém"/"começa com" juntava cores diferentes ("ROXO UVA" e
  // "ROXO AMETISTA" viravam "Roxo"; "NEW PINK" virava "Pink").
  const tries = [w, `${w}candy`, `${w}perolado`, `${w}uniq`, COLOR_ALIAS[w]].filter(Boolean);
  for (const t of tries) {
    const exact = type.colors.find((c) => key(c.split("|")[0]) === t);
    if (exact) return exact;
  }
  return null;
}

export function matchBalloon(
  name: string,
  config: BalloonConfig,
  // Marca do item no Noturno + marca da casa de cada tipo (ver acima).
  // Sem isso, tudo cai no tipo da casa.
  brand?: { brand?: string | null; home: HomeBrands },
): CatalogMatch | null {
  const t = balloonTypeOf(name);
  if (!t) return null;
  const typeId = brand ? brandTypeId(t.typeId, brand.brand, brand.home) : t.typeId;
  const type = config.types.find((x) => x.id === typeId);
  if (!type) return null;
  const size = t.size && type.sizes.some((s) => s.size === t.size) ? t.size : null;
  const words =
    t.typeId === "foil_numeros"
      ? colorWords(name.toUpperCase().replace(/\s+[A-Z0-9&]$/, ""))
      : colorWords(name);
  return {
    typeId,
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

type StockItem = {
  family: string | null;
  name: string;
  stock: number;
  inLatestImport?: boolean;
  brand?: string | null;
};

export function surveyCatalog(items: StockItem[], config: BalloonConfig): CatalogSurvey {
  const stock: BalloonStock = {};
  const newColors = new Map<string, CatalogSurvey["newColors"][number]>();
  const newSizes = new Map<string, CatalogSurvey["newSizes"][number]>();
  let matched = 0;
  let notCatalog = 0;
  const home = homeBrands(items, config);
  for (const i of items) {
    if (i.family !== "BALAO" || i.inLatestImport === false) continue;
    const m = matchBalloon(i.name, config, { brand: i.brand, home });
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
    // O estoque guarda também a cor que o catálogo ainda não tem: quando
    // ela entrar (Montar pelo Noturno), o montador já sabe se há unidade.
    const stockName = m.color ?? m.rawColor;
    if (stockName) {
      const byColor = ((stock[m.typeId] ??= {})[m.size!] ??= {});
      byColor[stockName] = (byColor[stockName] ?? 0) + qty;
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
  }
  return {
    stock,
    matched,
    newColors: [...newColors.values()].sort((a, b) => b.stock - a.stock),
    newSizes: [...newSizes.values()].sort((a, b) => b.stock - a.stock),
    notCatalog,
  };
}

// Montador da loja: o Noturno é o estoque. Se ele tem o tipo, a cor só
// aparece no tamanho em que há unidade — Roxo que só existe no 7" não
// aparece no 9" (pedido do dono, 23/10). Tipo que o Noturno não tem
// (cadastro manual) ou estoque ainda não importado: mostra tudo.
// Nome comparado sem acento/espaço ("Preto Eban O" = "Preto Ébano").
export function isSoldOut(
  stock: BalloonStock | null | undefined,
  typeId: string,
  size: string,
  color: string,
): boolean {
  const byType = stock?.[typeId];
  if (!byType) return false;
  const bySize = byType[size];
  if (!bySize) return true;
  const k = key(color.split("|")[0]);
  let q = 0;
  for (const [name, n] of Object.entries(bySize)) if (key(name.split("|")[0]) === k) q += n;
  return q <= 0;
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
      if (!colors.some((x) => key(x.split("|")[0]) === key(c))) colors.push(c);
    }
    return { ...t, colors };
  });
}

// ── Montar o catálogo a partir do Noturno ────────────────────────────
// Tipos, tamanhos (com pacote), cores com estoque — tudo do Noturno. Só o
// PREÇO de cada tamanho é digitado (etiqueta). Funciona com o catálogo
// vazio e MESCLA com o existente (nunca apaga tipo, tamanho ou cor).

export const DEFAULT_TYPE_NAMES: Record<string, string> = {
  simples: "Balão Simples (Liso)",
  metalico: "Metálico",
  candy: "Candy Colors",
  cintilante: "Cintilante",
  canudo: "Canudo / 260",
  uniq: "Linha Uniq",
  neon: "Neon",
  foil_numeros: "Números & Letras (Foil)",
};

// Tipo de outra marca leva a marca no nome ("Liso Riberball"): é o que
// aparece no cartão, no carrinho e no pedido (a atendente pega o pacote
// certo).
const SHORT_TYPE_NAMES: Record<string, string> = { simples: "Liso" };
export function defaultTypeName(typeId: string, brand: string | null): string {
  const base = baseTypeId(typeId);
  const name = DEFAULT_TYPE_NAMES[base] ?? base;
  if (base === typeId || !brand) return name;
  return `${SHORT_TYPE_NAMES[base] ?? name} ${brandTitle(brand)}`;
}

export interface ProposalSize {
  size: string;
  unitsPerPackage: number;
  // De onde veio o pacote: "catalogo" (já cadastrado), "lido" (todos os
  // nomes dizem C/N), "misto" (nomes discordam: vale o mais frequente) ou
  // "padrao" (nenhum nome diz — chute 1). Os dois últimos pedem conferência.
  packSource: "catalogo" | "lido" | "misto" | "padrao";
  stock: number;
  currentPrice: number | null; // preço já cadastrado (null = tamanho novo)
}

export interface ProposalType {
  typeId: string;
  name: string;
  brand: string | null; // "São Roque", "Riberball"…
  exists: boolean;
  sizes: ProposalSize[];
  colors: { name: string; stock: number; inCatalog: boolean }[];
  // Cor do catálogo sem NENHUM item no Noturno (nem zerado): sobra de
  // cadastro antigo ("Tema Unicornio…", "Basic Azul"). Sai ao aplicar,
  // a menos que a atendente desmarque.
  stale: string[];
  // Nome quebrado salvo antes ("Branco Pola R") → nome certo ("Branco Polar").
  renames: { from: string; to: string }[];
}

function packOf(name: string, typeId: string): number | null {
  if (typeId === "foil_numeros") return 1;
  const m = /\bC\/ ?(\d+)\b|\b(\d+)X1\b/.exec(name.toUpperCase());
  return m ? Number(m[1] ?? m[2]) : null;
}

const sizeOrder = (s: string) => parseFloat(s) || 0;

type Acc = {
  sizes: Map<string, { stock: number; packs: Map<number, number> }>;
  colors: Map<string, { name: string; stock: number; inCatalog: boolean }>;
  renames: Map<string, string>; // nome no catálogo → nome do Noturno
};

const wordCount = (s: string) => s.trim().split(/\s+/).length;

export function proposeCatalog(items: StockItem[], config: BalloonConfig): ProposalType[] {
  const home = homeBrands(items, config);
  // Tipos que o Noturno pede (um por tipo base × marca), na ordem: os da
  // casa primeiro, depois os de outras marcas.
  const brandOf = new Map<string, string | null>();
  for (const base of Object.keys(DEFAULT_TYPE_NAMES)) brandOf.set(base, home[base] ?? null);
  for (const i of items) {
    if (i.family !== "BALAO" || i.inLatestImport === false) continue;
    const t = balloonTypeOf(i.name);
    if (!t) continue;
    const id = brandTypeId(t.typeId, i.brand, home);
    if (!brandOf.has(id)) brandOf.set(id, i.brand ?? null);
  }
  const ids = [...brandOf.keys()];
  const full: BalloonConfig = {
    ...config,
    types: [
      ...config.types,
      ...ids
        .filter((id) => !config.types.some((t) => t.id === id))
        .map((id) => ({ id, name: defaultTypeName(id, brandOf.get(id) ?? null), sizes: [], colors: [] })),
    ],
  };
  const acc = new Map<string, Acc>();
  for (const i of items) {
    if (i.family !== "BALAO" || i.inLatestImport === false) continue;
    const m = matchBalloon(i.name, full, { brand: i.brand, home });
    if (!m || !m.size) continue;
    const qty = Math.max(0, i.stock);
    const t: Acc = acc.get(m.typeId) ?? { sizes: new Map(), colors: new Map(), renames: new Map() };
    acc.set(m.typeId, t);
    const s = t.sizes.get(m.size) ?? { stock: 0, packs: new Map<number, number>() };
    s.stock += qty;
    const pack = packOf(i.name, baseTypeId(m.typeId));
    if (pack) s.packs.set(pack, (s.packs.get(pack) ?? 0) + 1);
    t.sizes.set(m.size, s);
    const colorName = m.color ?? m.rawColor;
    if (colorName) {
      // Cor com tom ("Preto Ébano|#1B1B1B"): a chave é só o nome.
      const k = key(colorName.split("|")[0]);
      const c = t.colors.get(k) ?? { name: colorName, stock: 0, inCatalog: m.color != null };
      c.stock += qty;
      t.colors.set(k, c);
    }
    // Mesma cor, mas o catálogo guardou o nome quebrado como veio do
    // Noturno ("Branco Pola R" de "BR POLA R"): corrige. Só quando a
    // quebra está no próprio nome do Noturno — "Rosa Tutti Frutti" e
    // "Arco Iris" escritos à mão ficam como estão.
    if (m.color && m.rawColor && wordCount(m.color) > wordCount(m.rawColor)) {
      const tail = normalizeText(m.color.split("|")[0]).split(/\s+/).slice(1).join(" ");
      if (tail && ` ${normalizeText(i.name)} `.includes(` ${tail} `)) t.renames.set(m.color, m.rawColor);
    }
  }
  return ids
    .filter((id) => acc.has(id))
    .map((id) => {
      const existing = config.types.find((t) => t.id === id);
      const a = acc.get(id)!;
      const brand = brandOf.get(id);
      return {
        typeId: id,
        name: existing?.name ?? defaultTypeName(id, brand ?? null),
        brand: existing?.brand ?? (brand ? brandTitle(brand) : null),
        exists: !!existing,
        sizes: [...a.sizes.entries()]
          .map(([size, s]) => {
            const cur = existing?.sizes.find((z) => z.size === size);
            const packs = [...s.packs.entries()].sort((x, y) => y[1] - x[1]);
            const commonPack = packs[0]?.[0];
            const packSource: ProposalSize["packSource"] = cur
              ? "catalogo"
              : packs.length === 0
                ? "padrao"
                : packs.length > 1
                  ? "misto"
                  : "lido";
            return {
              size,
              unitsPerPackage: cur?.unitsPerPackage ?? commonPack ?? 1,
              packSource,
              stock: s.stock,
              currentPrice: cur?.price ?? null,
            };
          })
          .sort((x, y) => sizeOrder(x.size) - sizeOrder(y.size)),
        colors: [...a.colors.values()]
          .filter((c) => c.stock > 0)
          .sort((x, y) => y.stock - x.stock),
        stale: (existing?.colors ?? []).filter((c) => !a.colors.has(key(c.split("|")[0]))),
        renames: [...a.renames.entries()].map(([from, to]) => ({ from, to })),
      };
    });
}

// Aplica a proposta: cria tipos que faltam e acrescenta tamanhos (com o
// preço digitado) e cores com estoque. Tamanho novo sem preço fica de
// fora — não dá para vender sem preço. Preço digitado num tamanho que já
// existe atualiza o preço. Corrige nomes quebrados e tira as cores que o
// Noturno não tem (salvo se a atendente desmarcar a limpeza do tipo).
export function applyCatalogProposal(
  config: BalloonConfig,
  proposal: ProposalType[],
  choices: {
    include: Record<string, boolean>;
    prices: Record<string, number | null>;
    // Pacote corrigido pela atendente ("typeId|size" → unidades).
    packs?: Record<string, number | null>;
    // typeId → false mantém as cores que o Noturno não tem.
    removeStale?: Record<string, boolean>;
  },
): BalloonConfig {
  const types = config.types.map((t) => ({ ...t, sizes: t.sizes.map((s) => ({ ...s })), colors: [...t.colors] }));
  for (const p of proposal) {
    if (choices.include[p.typeId] === false) continue;
    let t = types.find((x) => x.id === p.typeId);
    const priced = p.sizes
      .map((s) => ({ s, price: choices.prices[`${p.typeId}|${s.size}`] ?? s.currentPrice }))
      .filter((x): x is { s: ProposalSize; price: number } => x.price != null && x.price > 0);
    if (!t) {
      if (priced.length === 0) continue; // tipo novo sem nenhum preço: não cria
      t = { id: p.typeId, name: p.name, sizes: [], colors: [] };
      types.push(t);
    }
    const target = t;
    if (!target.brand && p.brand) target.brand = p.brand;
    for (const { s, price } of priced) {
      const cur = target.sizes.find((z) => z.size === s.size);
      const pack = choices.packs?.[`${p.typeId}|${s.size}`];
      const units = pack != null && pack > 0 ? Math.round(pack) : s.unitsPerPackage;
      if (cur) {
        cur.price = price;
        if (pack != null && pack > 0) cur.unitsPerPackage = units;
      } else target.sizes.push({ size: s.size, price, unitsPerPackage: units });
    }
    target.sizes.sort((x, y) => sizeOrder(x.size) - sizeOrder(y.size));
    if (choices.removeStale?.[p.typeId] !== false) {
      const stale = new Set(p.stale);
      target.colors = target.colors.filter((c) => !stale.has(c));
    }
    const rename = new Map(p.renames.map((r) => [r.from, r.to]));
    target.colors = target.colors.map((c) => rename.get(c) ?? c);
    for (const c of p.colors) {
      const name = rename.get(c.name) ?? c.name;
      if (!target.colors.some((x) => key(x.split("|")[0]) === key(name.split("|")[0]))) target.colors.push(name);
    }
  }
  return { ...config, types };
}
