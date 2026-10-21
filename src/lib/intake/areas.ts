import type { IntakeItem } from "@/types/intake";
import { extractRollMeters } from "./publish";

// Áreas da loja física (issue #231, levantamento de 21/10): a atendente
// lança uma área inteira antes de passar para a próxima, sem ficar
// atravessando a loja. A área NÃO é gravada no item: sai da família do
// Noturno (+ nome, no caso da fita). Só o que a atendente decide à mão
// (família → área) e quem está em cada área ficam em `intake_meta/areas`.

export interface StoreArea {
  id: number;
  name: string;
  hint: string;
}

export const STORE_AREAS: StoreArea[] = [
  { id: 1, name: "Brinquedos e panos", hint: "brinquedos, jogos, TNT" },
  { id: 2, name: "Escolar e cuidados pessoais", hint: "zíperes, cadernos, pastas, mochilas, lixas" },
  { id: 3, name: "Beleza", hint: "pentes, espelhos, esmaltes, tintas de cabelo" },
  { id: 4, name: "Caixas e cestas", hint: "caixas, cestas, cachepôs" },
  { id: 5, name: "Papelaria", hint: "canetas, lápis, cola, papéis, fita adesiva" },
  { id: 6, name: "Joias e fitas abertas", hint: "joias, óculos, rolos de fita em uso" },
  { id: 7, name: "Bolsas e quadros", hint: "bolsas, carteiras, quadros" },
  { id: 8, name: "Balões e festas", hint: "balões, velas, topos, painéis" },
  { id: 9, name: "Sacos e laços prontos", hint: "sacos, sacolas, poli, laços" },
  { id: 10, name: "Fitas fechadas", hint: "rolos de fita fechados" },
  { id: 11, name: "Natura e semelhantes", hint: "perfumes, cremes, sabonetes" },
  { id: 12, name: "Porcelanas", hint: "canecas, xícaras, copos, taças" },
  { id: 13, name: "Cabelo", hint: "piranhas, xuxas, tiaras, presilhas" },
  { id: 14, name: "Barbantes", hint: "barbantes, linhas, lã, agulhas" },
  { id: 15, name: "Maquiagens", hint: "batons, gloss, cílios, paletas" },
  { id: 16, name: "Eletrônicos", hint: "cabos, fones, carregadores, pilhas" },
];

// 0 = ainda sem área: a atendente escolhe uma vez para a família inteira.
export const NO_AREA = 0;

export function areaById(id: number): StoreArea | null {
  return STORE_AREAS.find((a) => a.id === id) ?? null;
}

// Só famílias INEQUÍVOCAS. Ambíguas (KIT, MINI, BOLA, GRAMPO, TESOURA,
// CORRETIVO, FIO, OLEO…) ficam sem área — a atendente decide.
const AREA_FAMILIES: Record<number, string[]> = {
  1: ["BRINQUEDO", "BONECA", "CARRINHO", "JOGO", "TNT", "LANCA", "BARALHO", "QUEBRA"],
  2: ["ZIPER", "CADERNO", "CADERNETA", "PASTA", "MOCHILA", "ESTOJO", "LIXA", "UNHA", "ALICATE"],
  3: ["ESMALTE", "ESPELHO", "DESCOLORANTE", "ALGODAO", "ACETONA", "REMOVEDOR", "PENTE", "GEL"],
  4: ["CAIXA", "CAIXINHA", "CAIXETA", "CAIXOTE", "CESTA", "CACHEPOT", "CACHEPO"],
  5: [
    "CANETA", "LAPIS", "LAPISEIRA", "COLA", "PAPEL", "CARTOLINA", "EVA", "MARCADOR",
    "BORRACHA", "APONTADOR", "GRAFITE", "REGUA", "PINCEL", "GIZ", "BLOCO", "HIDROCOR",
    "CALCULADORA", "GRAMPEADOR",
  ],
  6: ["BRINCO", "BRINCOS", "ANEL", "PULSEIRA", "PIERCING", "COLAR", "OCULOS"],
  7: ["BOLSA", "CARTEIRA", "QUADRO"],
  8: ["BALAO", "VELA", "TOPO", "CONFEITE", "PAINEL", "FAIXA", "CORTINA", "FORMINHA"],
  9: ["SACO", "SAQUINHO", "POLI", "SACOLA", "LACO", "LACINHO", "FITILHO", "EMBALAGEM"],
  11: ["PERFUME", "DESODORANTE", "HIDRATANTE", "SABONETE", "CREME"],
  12: ["CANECA", "XICARA", "COPO", "TACA", "PRATO", "POTE", "GARRAFA", "COLHER", "GARFO", "JARRA", "TIGELA"],
  13: ["PIRANHA", "XUXA", "TIARA", "PRESILHA", "ELASTICO", "TOUCA", "FIVELA"],
  14: ["BARBANTE", "LINHA", "LA", "AGULHA"],
  15: ["BATOM", "LIP", "GLOSS", "CILIOS", "PO", "SOMBRA", "RIMEL", "DELINEADOR", "BLUSH", "PALETA"],
  16: [
    "CABO", "FONE", "HEADSET", "CARREGADOR", "FONTE", "ADAPTADOR", "CONTROLE", "PILHA",
    "BATERIA", "LANTERNA", "MOUSE", "TECLADO", "PEN", "EXTENSAO", "PLUG", "ANTENA",
    "MICROFONE", "PELICULA",
  ],
};

const AREA_BY_FAMILY: Record<string, number> = Object.fromEntries(
  Object.entries(AREA_FAMILIES).flatMap(([area, fams]) =>
    fams.map((f) => [f, Number(area)]),
  ),
);

// FITA se divide em três áreas, decidido pelo item (não pela família).
export const RIBBON_FAMILY = "FITA";
export const RIBBON_AREAS = [5, 6, 10];

// Rolo de fita: metragem "redonda" (100 m, 50 m, 25 m…) = rolo FECHADO;
// metragem quebrada (37 m) = rolo EM USO, vendido por metro. Regra da
// dona (21/10). Sem metragem no nome, assume fechado.
export function isClosedRoll(name: string): boolean {
  const m = extractRollMeters(name);
  return m == null || (Number.isInteger(m) && m % 5 === 0);
}

export type AreaOverrides = Record<string, number>;

type AreaInput = Pick<IntakeItem, "family" | "name" | "suggestedType">;

export function areaForItem(item: AreaInput, overrides: AreaOverrides = {}): number {
  const fam = item.family ?? "";
  if (fam === RIBBON_FAMILY) {
    if (item.suggestedType !== "RIBBON") return 5; // adesiva, durex…
    return isClosedRoll(item.name) ? 10 : 6;
  }
  return overrides[fam] ?? AREA_BY_FAMILY[fam] ?? NO_AREA;
}

// Áreas em que a família aparece no menu (FITA aparece em três).
export function areasForFamily(family: string, overrides: AreaOverrides = {}): number[] {
  if (family === RIBBON_FAMILY) return RIBBON_AREAS;
  return [overrides[family] ?? AREA_BY_FAMILY[family] ?? NO_AREA];
}

// Família pode ser movida à mão só se o mapa não tem palpite para ela.
export function isAssignableFamily(family: string): boolean {
  return family !== RIBBON_FAMILY && !(family in AREA_BY_FAMILY);
}

export interface AreaProgress {
  total: number;
  pending: number;
  families: string[];
}

// Progresso por área a partir do resumo por família (uma leitura só).
// FITA conta inteira em "Fitas fechadas" (a grande maioria); nas outras
// duas áreas ela só aparece no menu.
export function areaProgress(
  families: Record<string, { total: number; pending: number }>,
  overrides: AreaOverrides = {},
): Record<number, AreaProgress> {
  const out: Record<number, AreaProgress> = {};
  const slot = (id: number) => (out[id] ??= { total: 0, pending: 0, families: [] });
  for (const [fam, c] of Object.entries(families)) {
    const areas = areasForFamily(fam, overrides);
    const counted = fam === RIBBON_FAMILY ? 10 : areas[0];
    slot(counted).total += c.total;
    slot(counted).pending += c.pending;
    for (const a of areas) slot(a).families.push(fam);
  }
  for (const p of Object.values(out)) {
    p.families.sort((a, b) => (families[b]?.pending ?? 0) - (families[a]?.pending ?? 0));
  }
  return out;
}

// Quem está lançando cada área. Vale por algumas horas: quem esquece de
// sair não tranca a área para sempre.
export interface AreaClaim {
  email: string;
  name: string;
  at: number; // ms
}

export const CLAIM_TTL_MS = 3 * 60 * 60 * 1000;

export function activeClaim(
  claim: AreaClaim | undefined | null,
  now: number,
): AreaClaim | null {
  return claim && now - claim.at < CLAIM_TTL_MS ? claim : null;
}

// Próxima área com trabalho, livre (ou minha), depois da atual.
export function nextArea(
  current: number,
  progress: Record<number, AreaProgress>,
  claims: Record<string, AreaClaim | undefined>,
  me: string,
  now: number,
): number | null {
  const ids = STORE_AREAS.map((a) => a.id);
  const start = ids.indexOf(current);
  for (let k = 1; k <= ids.length; k++) {
    const id = ids[(start + k) % ids.length];
    if (id === current) continue;
    if ((progress[id]?.pending ?? 0) === 0) continue;
    const c = activeClaim(claims[String(id)], now);
    if (c && c.email !== me) continue;
    return id;
  }
  return null;
}

export function firstName(emailOrName: string): string {
  const base = emailOrName.split("@")[0].split(/[\s._-]+/)[0] ?? emailOrName;
  return base.charAt(0).toUpperCase() + base.slice(1);
}
