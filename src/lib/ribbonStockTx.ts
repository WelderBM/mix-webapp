import { deleteField, doc, runTransaction, type Firestore } from "firebase/firestore";
import type { Order, OrderStatus } from "@/types/order";
import {
  nextRemaining,
  ribbonMetersByProduct,
  statusConsumesRibbon,
  type MetersByProduct,
} from "@/lib/ribbonStock";

// A troca de status mexe na metragem? Decide com o pedido em memória; a
// transação confere de novo antes de gravar (#415).
export function ribbonStockChange(
  order: Pick<Order, "items" | "stockApplied">,
  newStatus: OrderStatus
): "apply" | "revert" | null {
  const consumes = statusConsumesRibbon(newStatus);
  if (consumes && !order.stockApplied) {
    return Object.keys(ribbonMetersByProduct(order.items)).length > 0 ? "apply" : null;
  }
  if (!consumes && order.stockApplied) return "revert";
  return null;
}

// Status + metragem numa transação só. `stockApplied` no pedido guarda o que
// foi descontado (idempotência e estorno exato, mesmo que a metragem do laço
// mude depois).
export async function updateStatusWithRibbonStock(
  db: Firestore,
  orderId: string,
  newStatus: OrderStatus,
  now: Date
): Promise<void> {
  await runTransaction(db, async (tx) => {
    const orderRef = doc(db, "orders", orderId);
    const snap = await tx.get(orderRef);
    if (!snap.exists()) throw new Error("Pedido não encontrado");
    const order = snap.data() as Order;
    const change = ribbonStockChange(order, newStatus);

    let deltas: MetersByProduct = {};
    const patch: Record<string, unknown> = { status: newStatus };
    if (change === "apply") {
      const used = ribbonMetersByProduct(order.items);
      deltas = Object.fromEntries(Object.entries(used).map(([id, m]) => [id, -m]));
      patch.stockApplied = used;
      patch.stockAppliedAt = now.toISOString();
    } else if (change === "revert") {
      deltas = { ...order.stockApplied };
      patch.stockApplied = deleteField();
      patch.stockAppliedAt = deleteField();
    }

    // Transação: todas as leituras antes das gravações.
    const ids = Object.keys(deltas);
    const products = await Promise.all(ids.map((id) => tx.get(doc(db, "products", id))));
    products.forEach((p, i) => {
      const inv = p.exists() ? p.data().ribbonInventory : null;
      if (!inv) return; // produto apagado: nada a descontar
      tx.update(p.ref, {
        "ribbonInventory.remainingMeters": nextRemaining(
          inv.remainingMeters ?? 0,
          inv.totalRollMeters ?? 0,
          deltas[ids[i]]
        ),
      });
    });
    tx.update(orderRef, patch);
  });
}
