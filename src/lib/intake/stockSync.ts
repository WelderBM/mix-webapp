import type { IntakeItem } from "@/types/intake";

// Sincronização de estoque na reimportação (#202). O Noturno é a fonte de
// verdade do estoque físico; o produto publicado só tem `inStock`. A cada
// reimportação (notas novas a cada ~2 dias), produto publicado cujo item
// zerou — ou saiu do Noturno — vira "esgotado", e o que voltou a ter
// estoque volta a "em estoque".
//
// Só emite atualização quando o item CRUZA o zero (ou sai/volta do
// Noturno): um ajuste manual de `inStock` feito no admin não é desfeito
// a cada importação sem motivo.

export interface ProductStockUpdate {
  productId: string;
  inStock: boolean;
}

const available = (i: Pick<IntakeItem, "stock" | "inLatestImport">) =>
  i.inLatestImport && i.stock > 0;

export function computeStockSync(
  before: Map<string, IntakeItem>,
  after: Map<string, IntakeItem>,
): ProductStockUpdate[] {
  const updates: ProductStockUpdate[] = [];
  for (const [id, next] of after) {
    if (next.status !== "publicado" || !next.productId) continue;
    const prev = before.get(id);
    if (!prev) continue;
    const was = available(prev);
    const now = available(next);
    if (was !== now) updates.push({ productId: next.productId, inStock: now });
  }
  return updates;
}

// Única falha que a sincronização pode ignorar: o produto não existe mais
// (apagado à mão no admin). Rede, cota ou permissão precisam interromper a
// importação ANTES de gravar a fila — senão a fila fica igual ao arquivo e
// a próxima importação nunca refaz a sincronização.
export function isIgnorableSyncError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { code?: string }).code === "not-found"
  );
}
