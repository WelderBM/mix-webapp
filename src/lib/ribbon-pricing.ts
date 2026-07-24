import { Product } from "@/types/product";

// Fita é o único tipo de produto com dois preços simultâneos no mesmo doc:
// `price` (por metro, usado quando `ribbonInventory.status === "ABERTO"`) e
// `rollPrice` (rolo fechado inteiro, usado quando `status === "FECHADO"`).
// Todo consumidor de preço de produto deve passar por aqui em vez de ler
// `product.price` direto — ver docs/diagnostico-fitas.md pro histórico do
// bug que isso corrige (rolo fechado cobrando preço de metro e vice-versa).
export function getEffectiveUnitPrice(product: Product): number {
  if (product.type === "RIBBON" && product.ribbonInventory?.status === "FECHADO") {
    return product.rollPrice || product.price;
  }
  return product.price;
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
