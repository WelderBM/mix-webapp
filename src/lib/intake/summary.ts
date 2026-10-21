import type { IntakeItem, IntakeWorkflowStatus } from "@/types/intake";
import type { IntakeWrite } from "./merge";

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
}

type SummaryInput = Pick<IntakeItem, "family" | "status" | "isCoreFamily" | "inLatestImport">;

export const NO_FAMILY = "(sem família)";

export function buildIntakeSummary(items: Iterable<SummaryInput>): IntakeSummary {
  const summary: IntakeSummary = {
    totalItems: 0,
    byStatus: { pendente: 0, publicado: 0, pulado: 0, fora_da_loja: 0 },
    families: {},
  };
  for (const i of items) {
    // Item que saiu do Noturno não entra mais na fila de trabalho.
    if (!i.inLatestImport) continue;
    summary.totalItems++;
    summary.byStatus[i.status]++;
    const key = i.family ?? NO_FAMILY;
    const f = (summary.families[key] ??= { total: 0, pending: 0, isCore: false });
    f.total++;
    if (i.status === "pendente") f.pending++;
    f.isCore ||= i.isCoreFamily;
  }
  return summary;
}

// Estado final da fila depois das escritas do merge — sem reler o banco.
export function applyWrites(
  existing: Map<string, IntakeItem>,
  writes: IntakeWrite[]
): Map<string, IntakeItem> {
  const next = new Map(existing);
  for (const w of writes) {
    next.set(w.id, { ...(next.get(w.id) as IntakeItem), ...w.data } as IntakeItem);
  }
  return next;
}

// Ordem do menu de corredores: núcleo da loja primeiro, depois quem tem
// mais trabalho pendente.
export function sortedFamilies(summary: IntakeSummary): [string, FamilyCount][] {
  return Object.entries(summary.families).sort(
    ([an, a], [bn, b]) =>
      Number(b.isCore) - Number(a.isCore) || b.pending - a.pending || an.localeCompare(bn)
  );
}
