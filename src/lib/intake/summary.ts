import type { IntakeItem, IntakeWorkflowStatus } from "@/types/intake";
import type { IntakeWrite } from "./merge";
import { areaForItem, RIBBON_FAMILY } from "./areas";
import { statusTransitionDeltas } from "./publish";

// Resumo da fila (`intake_meta/summary`, issue #199): famílias com
// contagem por status, pra tela de lançamento abrir com UMA leitura em
// vez de ler milhares de itens só pra montar o menu de corredores. O
// importador regrava o resumo inteiro; publicar/pular (#200) ajusta com
// increment().

export interface FamilyCount {
  total: number;
  pending: number;
  isCore: boolean;
}

export interface IntakeSummary {
  totalItems: number;
  byStatus: Record<IntakeWorkflowStatus, number>;
  families: Record<string, FamilyCount>;
  // Placar (#202): custo do estoque já publicado na loja (R$, estoque ×
  // custo do Noturno) e quantos itens cada atendente publicou.
  publishedStockValue: number;
  publishedBy: Record<string, number>;
  // FITA dividida pelas áreas da loja (#231): "5" adesiva, "6" rolo em
  // uso, "10" rolo fechado. Ausente em resumos gravados antes disso.
  ribbonAreas?: Record<string, { total: number; pending: number }>;
}

type SummaryInput = Pick<
  IntakeItem,
  | "family"
  | "status"
  | "isCoreFamily"
  | "inLatestImport"
  | "stock"
  | "unitCost"
  | "publishedBy"
  | "name"
  | "suggestedType"
>;

export function stockValue(i: Pick<IntakeItem, "stock" | "unitCost">): number {
  return Math.max(0, (i.stock ?? 0) * (i.unitCost ?? 0));
}

export const NO_FAMILY = "(sem família)";

// Ajustes do resumo para uma leva de itens mudando de status, SOMADOS por
// campo. Cada increment() é uma "field transform" e o Firestore aceita no
// máximo 500 por documento num mesmo batch: gravando item por item, uma
// linha de 84 fitas passava disso (~6 por item). Somado, são no máximo
// algumas dezenas, qualquer que seja o tamanho da leva.
export function summaryDeltas(
  items: (Pick<IntakeItem, "status" | "family" | "name" | "suggestedType" | "stock" | "unitCost"> &
    Partial<Pick<IntakeItem, "publishedBy" | "inLatestImport">>)[],
  to: IntakeWorkflowStatus,
  userEmail: string | null = null,
): { path: string[]; delta: number }[] {
  const acc = new Map<string, { path: string[]; delta: number }>();
  const add = (path: string[], delta: number) => {
    const k = JSON.stringify(path);
    const cur = acc.get(k);
    if (cur) cur.delta += delta;
    else acc.set(k, { path, delta });
  };
  for (const item of items) {
    if (item.status === to) continue;
    // Item que saiu do Noturno não está no resumo (buildIntakeSummary):
    // ajustar por ele descontaria o que nunca foi contado (#368).
    if (item.inLatestImport === false) continue;
    // Mesma regra de transição usada no resto do lançamento (uma fonte só).
    const { byStatus, familyPending } = statusTransitionDeltas(item.status, to);
    for (const [status, delta] of Object.entries(byStatus)) add(["byStatus", status], delta ?? 0);
    if (familyPending !== 0) {
      add(["families", item.family ?? NO_FAMILY, "pending"], familyPending);
      if (item.family === RIBBON_FAMILY) {
        add(["ribbonAreas", String(areaForItem(item)), "pending"], familyPending);
      }
    }
    // Placar (#202): valor em estoque publicado e contagem por atendente.
    if (to === "publicado") {
      add(["publishedStockValue"], stockValue(item));
      add(["publishedBy", userEmail || "(desconhecido)"], 1);
    }
    // Produto excluído (#363): o item sai de "publicado" e desconta o placar
    // de quem publicou.
    if (item.status === "publicado") {
      add(["publishedStockValue"], -stockValue(item));
      add(["publishedBy", item.publishedBy || "(desconhecido)"], -1);
    }
  }
  return [...acc.values()].filter((d) => d.delta !== 0);
}

export function buildIntakeSummary(
  items: Iterable<SummaryInput>,
): IntakeSummary {
  const summary: IntakeSummary = {
    totalItems: 0,
    byStatus: { pendente: 0, publicado: 0, pulado: 0, fora_da_loja: 0, catalogo: 0 },
    families: {},
    publishedStockValue: 0,
    publishedBy: {},
    ribbonAreas: {},
  };
  for (const i of items) {
    // Item que saiu do Noturno não entra mais na fila de trabalho.
    if (!i.inLatestImport) continue;
    summary.totalItems++;
    summary.byStatus[i.status]++;
    const key = i.family ?? NO_FAMILY;
    const f = (summary.families[key] ??= {
      total: 0,
      pending: 0,
      isCore: false,
    });
    f.total++;
    if (i.status === "pendente") f.pending++;
    if (i.status === "publicado") {
      summary.publishedStockValue += stockValue(i);
      const who = i.publishedBy || "(desconhecido)";
      summary.publishedBy[who] = (summary.publishedBy[who] ?? 0) + 1;
    }
    f.isCore ||= i.isCoreFamily;
    if (i.family === RIBBON_FAMILY) {
      const a = String(areaForItem(i));
      const r = (summary.ribbonAreas![a] ??= { total: 0, pending: 0 });
      r.total++;
      if (i.status === "pendente") r.pending++;
    }
  }
  return summary;
}

// Estado final da fila depois das escritas do merge — sem reler o banco.
export function applyWrites(
  existing: Map<string, IntakeItem>,
  writes: IntakeWrite[],
): Map<string, IntakeItem> {
  const next = new Map(existing);
  for (const w of writes) {
    next.set(w.id, {
      ...(next.get(w.id) as IntakeItem),
      ...w.data,
    } as IntakeItem);
  }
  return next;
}

// Progresso da revenda (foco atual): itens já triados (publicados, pulados
// ou fora da loja) sobre o total das famílias de revenda.
export function coreProgress(summary: IntakeSummary): {
  done: number;
  total: number;
} {
  let done = 0;
  let total = 0;
  for (const f of Object.values(summary.families)) {
    if (!f.isCore) continue;
    total += f.total;
    done += f.total - f.pending;
  }
  return { done, total };
}

// Ordem do menu de corredores: núcleo da loja primeiro, depois quem tem
// mais trabalho pendente.
export function sortedFamilies(
  summary: IntakeSummary,
): [string, FamilyCount][] {
  return Object.entries(summary.families).sort(
    ([an, a], [bn, b]) =>
      Number(b.isCore) - Number(a.isCore) ||
      b.pending - a.pending ||
      an.localeCompare(bn),
  );
}
