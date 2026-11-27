import type { Product } from "@/types/product";

// "Abrir Rolo" cria um produto "p/ metro" separado (#413, decisão do dono
// de 26/11): o rolo fechado (estoque do Noturno) fica intacto e só existe
// um "p/ metro" ativo por rolo até acabar ou ser encerrado.

export const perMeterName = (roll: Pick<Product, "name">) =>
  `${roll.name.trim()} p/ metro`;

// "p/ metro" ainda em venda daquele rolo: ativo e com metragem.
export function activePerMeterFor(
  rollId: string,
  products: Product[]
): Product | undefined {
  return products.find(
    (p) =>
      p.openedFromId === rollId &&
      p.disabled !== true &&
      (p.ribbonInventory?.remainingMeters ?? 0) > 0
  );
}

// Documento do "p/ metro". Copia só o que existe no rolo (o Firestore recusa
// campo `undefined`). O rolo começa cheio: abrir é tirar 1 rolo lacrado.
export function buildPerMeterProduct(
  roll: Product,
  name: string,
  pricePerMeter: number
): Omit<Product, "id"> {
  const total = roll.ribbonInventory?.totalRollMeters ?? 0;
  const copy: Partial<Product> = {};
  const keys = [
    "category",
    "subcategory",
    "images",
    "imageUrl",
    "width",
    "sourceCode",
    "isAvailableForCustomBow",
    "description",
  ] as const;
  for (const k of keys) {
    if (roll[k] != null) (copy as Record<string, unknown>)[k] = roll[k];
  }
  return {
    ...copy,
    name: name.trim(),
    type: "RIBBON",
    category: roll.category,
    unit: "m",
    price: pricePerMeter,
    inStock: true,
    disabled: false,
    openedFromId: roll.id,
    ribbonInventory: {
      status: "ABERTO",
      remainingMeters: total,
      totalRollMeters: total,
    },
  } as Omit<Product, "id">;
}

// "Encerrar rolo": vale com sobra também; a sobra fica registrada.
// "Devolver" (`returned`): desfaz a abertura; a sobra volta para a
// prateleira e o histórico mostra que não foi perda.
export function closePerMeterPatch(
  product: Product,
  now: Date,
  returned = false
): Pick<Product, "disabled" | "closedWithMeters" | "closedAt" | "returnedToRoll"> {
  return {
    disabled: true,
    closedWithMeters: Math.max(0, product.ribbonInventory?.remainingMeters ?? 0),
    closedAt: now.toISOString(),
    returnedToRoll: returned,
  };
}

// Já vendeu parte do rolo aberto? (aviso antes de "Devolver").
export const hasSoldFromRoll = (p: Product) =>
  (p.ribbonInventory?.remainingMeters ?? 0) <
  (p.ribbonInventory?.totalRollMeters ?? 0);
