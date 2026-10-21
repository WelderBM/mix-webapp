import type { IntakeItem, IntakeSourceFields } from "@/types/intake";

// Reimportação do Noturno sobre a fila existente (issue #198).
//  - Campos do Noturno são recalculados; campos da atendente (status,
//    productId) nunca são tocados.
//  - Relatório em PDF corta a descrição em 44 caracteres: se o nome novo
//    é só o começo do nome completo já salvo (vindo de um Excel), mantém
//    o completo. Assim o PDF serve pra reimportação rápida de estoque sem
//    estragar nomes.
//  - Só devolve escrita pro que mudou, pra não gastar cota do Firestore
//    regravando milhares de docs iguais.

export interface IntakeWrite {
  id: string;
  isNew: boolean;
  data: Partial<IntakeItem>;
}

export interface IntakeMergeResult {
  writes: IntakeWrite[];
  created: number;
  updated: number;
  unchanged: number;
  missing: number;
}

const SOURCE_KEYS: (keyof IntakeSourceFields)[] = [
  "sourceRef", "ean", "rawName", "name", "family", "brandRaw", "brand",
  "stock", "unitCost", "flags", "suggestedStatus", "priority", "isCoreFamily",
  "suggestedCategoryKey", "suggestedType", "suggestedUnit", "packQty",
  "packEvidence", "duplicateGroup",
  "searchText", "searchTokens",
];

export function isTruncationOf(short: string, full: string): boolean {
  return short.length < full.length && full.startsWith(short);
}

function sameValue(a: unknown, b: unknown): boolean {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

export function mergeIntake(
  existing: Map<string, IntakeItem>,
  incoming: IntakeSourceFields[]
): IntakeMergeResult {
  const result: IntakeMergeResult = {
    writes: [], created: 0, updated: 0, unchanged: 0, missing: 0,
  };
  const seen = new Set<string>();

  for (const src of incoming) {
    const id = src.sourceCode;
    if (seen.has(id)) continue;
    seen.add(id);
    const prev = existing.get(id);

    if (!prev) {
      result.created++;
      result.writes.push({
        id,
        isNew: true,
        data: { ...src, id, status: "pendente", inLatestImport: true },
      });
      continue;
    }

    const next: IntakeSourceFields = { ...src };
    if (isTruncationOf(src.name, prev.name)) {
      next.name = prev.name;
      next.rawName = prev.rawName;
      next.searchText = prev.searchText;
      next.searchTokens = prev.searchTokens;
      next.packQty = prev.packQty;
      next.packEvidence = prev.packEvidence;
    }

    const changed: Partial<IntakeItem> = {};
    for (const k of SOURCE_KEYS) {
      if (!sameValue(next[k], prev[k])) {
        (changed as Record<string, unknown>)[k] = next[k];
      }
    }
    if (!prev.inLatestImport) changed.inLatestImport = true;

    if (Object.keys(changed).length === 0) {
      result.unchanged++;
    } else {
      result.updated++;
      result.writes.push({ id, isNew: false, data: changed });
    }
  }

  for (const [id, prev] of existing) {
    if (!seen.has(id) && prev.inLatestImport) {
      result.missing++;
      result.writes.push({ id, isNew: false, data: { inLatestImport: false } });
    }
  }

  return result;
}
