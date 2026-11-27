import type { CartItem } from "@/types/cart";
import type { OrderStatus } from "@/types/order";

// Baixa da metragem do rolo aberto pelos pedidos do site (#415). O site só
// desconta o que ele mesmo controla, a metragem dos produtos por metro
// (ribbonInventory ABERTO). Rolo fechado e o resto continuam com o Noturno.

export type MetersByProduct = Record<string, number>;

// Decisão (27/11, pelo agente na madrugada, a confirmar pelo dono): a fita é
// cortada quando o pedido fica "Pronto"; dali em diante a metragem já saiu.
// Voltar para antes disso, ou cancelar, devolve.
const APPLIED: OrderStatus[] = ["ready", "out_for_delivery", "delivered"];
export const statusConsumesRibbon = (s: OrderStatus) => APPLIED.includes(s);

// Metros por produto aberto num pedido:
// - fita por metro: `quantity` é a metragem;
// - laço do montador: `customizations.metersUsed` (gravado na hora da venda,
//   a partir de BowSize.meters) × quantidade. Tamanho sem metragem não baixa.
export function ribbonMetersByProduct(items: CartItem[]): MetersByProduct {
  const out: MetersByProduct = {};
  for (const it of items ?? []) {
    const p = it.product;
    if (!p?.id) continue;
    let meters = 0;
    if (it.type === "SIMPLE" && p.ribbonInventory?.status === "ABERTO" && p.unit === "m") {
      meters = it.quantity;
    } else if (it.type === "CUSTOM_RIBBON") {
      const per = Number(it.customizations?.metersUsed);
      if (Number.isFinite(per) && per > 0) meters = per * (it.quantity || 1);
    }
    if (meters > 0) out[p.id] = round2((out[p.id] ?? 0) + meters);
  }
  return out;
}

// Metragem nova do rolo: nunca negativa; estorno não passa do total.
export function nextRemaining(
  remaining: number,
  total: number,
  delta: number
): number {
  const next = round2(remaining + delta);
  return Math.min(total > 0 ? total : next, Math.max(0, next));
}

const round2 = (n: number) => Math.round(n * 100) / 100;
