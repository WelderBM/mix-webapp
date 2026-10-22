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
  // Produto lançado em grupo (#201): disponibilidade de CADA variação,
  // pelo código do Noturno (= id da variação). O produto fica em estoque
  // enquanto houver alguma cor disponível.
  variants?: Record<string, boolean>;
}

const available = (i: Pick<IntakeItem, "stock" | "inLatestImport">) =>
  i.inLatestImport && i.stock > 0;

export function computeStockSync(
  before: Map<string, IntakeItem>,
  after: Map<string, IntakeItem>,
): ProductStockUpdate[] {
  // Itens publicados agrupados pelo produto: 1 item = produto simples;
  // 2+ = produto com variações (grupo).
  const byProduct = new Map<string, IntakeItem[]>();
  for (const next of after.values()) {
    if (next.status !== "publicado" || !next.productId) continue;
    byProduct.set(next.productId, [...(byProduct.get(next.productId) ?? []), next]);
  }
  const updates: ProductStockUpdate[] = [];
  for (const [productId, members] of byProduct) {
    const crossed = members.some((m) => {
      const prev = before.get(m.id);
      return prev != null && available(prev) !== available(m);
    });
    if (!crossed) continue;
    if (members.length === 1) {
      updates.push({ productId, inStock: available(members[0]) });
      continue;
    }
    updates.push({
      productId,
      inStock: members.some(available),
      variants: Object.fromEntries(members.map((m) => [m.sourceCode, available(m)])),
    });
  }
  return updates;
}

// Aplica a disponibilidade por variação sobre as variações gravadas no
// produto (as que não vieram do Noturno ficam como estão).
export function applyVariantStock<V extends { id: string; inStock: boolean }>(
  variants: V[] | undefined,
  stock: Record<string, boolean>,
): V[] {
  return (variants ?? []).map((v) =>
    v.id in stock ? { ...v, inStock: stock[v.id] } : v,
  );
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
