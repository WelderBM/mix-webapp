import { Product } from "@/types/product";

// Fita é o único tipo de produto com dois preços simultâneos no mesmo doc:
// `price` (por metro, usado quando `ribbonInventory.status === "ABERTO"`) e
// `rollPrice` (rolo fechado inteiro, usado quando `status === "FECHADO"`).
// Todo consumidor de preço de produto deve passar por aqui em vez de ler
// `product.price`/`product.rollPrice` direto — ver docs/diagnostico-fitas.md
// pro histórico do bug que isso corrige (rolo fechado cobrando preço de
// metro e vice-versa).

// Type guards em vez de `!= null && > 0` espalhado: `0` não é "sem preço",
// é um preço grátis legítimo se alguém digitar — a única forma honesta de
// dizer "esse valor não pode ser usado" é o predicado decidir isso uma vez
// só, aqui, e todo mundo (inclusive TypeScript) enxergar o campo já
// estreitado do lado de dentro.
export function hasMeterPrice(
  product: Product
): product is Product & { price: number } {
  return product.price != null && product.price > 0;
}

export function hasRollPrice(
  product: Product
): product is Product & { rollPrice: number } {
  return product.rollPrice != null && product.rollPrice > 0;
}

// `null` = "não dá pra vender isso agora" (estado incompleto/inconsistente),
// nunca um número de fallback. Os dois lados de RIBBON (FECHADO e ABERTO)
// são tratados de forma simétrica de propósito: um rolo fechado sem
// `rollPrice` configurado é tão inválido quanto uma fita aberta sem `price`
// por metro — nenhum dos dois cai pro outro campo (essa queda-pro-campo-
// errado foi exatamente o incidente original, #52).
export function getEffectiveUnitPrice(product: Product): number | null {
  if (product.type === "RIBBON") {
    if (product.ribbonInventory?.status === "FECHADO") {
      return hasRollPrice(product) ? product.rollPrice : null;
    }
    if (product.ribbonInventory?.status === "ABERTO") {
      return hasMeterPrice(product) ? product.price : null;
    }
    return null;
  }
  return product.price ?? null;
}

// Rótulo de unidade coerente com o preço efetivo acima — um rolo fechado
// cobrado por `rollPrice` não é "por metro", é "por rolo".
export function getEffectiveUnitLabel(product: Product): string {
  if (product.type === "RIBBON" && product.ribbonInventory?.status === "FECHADO") {
    return "rolo";
  }
  return product.unit || "un";
}

export function isSealedRibbonRoll(product: Product | undefined): boolean {
  return (
    !!product &&
    product.type === "RIBBON" &&
    product.ribbonInventory?.status === "FECHADO"
  );
}

// Campo vazio/0 vira `undefined`, nunca `0` — `0` é um preço legítimo (grátis
// de propósito), não um jeito de dizer "ainda não preenchido". Único parser
// compartilhado entre ProductFormDialog (input manual) e batch-import (CSV):
// a mesma regra de "o que conta como preço preenchido" não pode divergir
// entre os dois caminhos que gravam `Product.price`/`rollPrice`.
export function toOptionalPositiveNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || String(value).trim() === "") {
    return undefined;
  }
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : undefined;
}

// Sugestão pro modal "Abrir Rolo": deriva um preço por metro plausível a
// partir do preço do rolo fechado, pro lojista confirmar/ajustar em vez de
// digitar do zero. `totalRollMeters <= 0` não tem razão válida — sem
// sugestão, o lojista digita.
export function suggestMeterPrice(product: Product): number | null {
  if (!hasRollPrice(product)) return null;
  const totalMeters = product.ribbonInventory?.totalRollMeters || 0;
  if (totalMeters <= 0) return null;
  return Math.round((product.rollPrice / totalMeters) * 100) / 100;
}
