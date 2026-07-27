import { Product } from "../../src/types/product";
import { categoryFitas, categoryKits } from "./categories";
import { PRODUCT_IDS, KIT_RECIPE_IDS } from "./ids";

const placeholder = (text: string) =>
  `https://placehold.co/400x400/f1f5f9/334155.png?text=${encodeURIComponent(
    text
  )}`;

function makeProduct(overrides: Partial<Product> & Pick<Product, "id" | "name" | "type">): Product {
  return {
    unit: "un",
    inStock: true,
    disabled: false,
    category: categoryFitas.name,
    ...overrides,
  };
}

// ── STANDARD_ITEM ───────────────────────────────────────────────────────────

const stdComPreco = makeProduct({
  id: PRODUCT_IDS.STD_COM_PRECO,
  name: "Item padrão com preço (seed)",
  type: "STANDARD_ITEM",
  price: 49.9,
  // images[] + cover — o outro fixture (BASE_CONTAINER) cobre o legado imageUrl.
  images: [
    { id: "seed-img-1", url: placeholder("Capa"), isCover: true },
    { id: "seed-img-2", url: placeholder("Lateral"), isCover: false },
  ],
});

const stdComPromo = makeProduct({
  id: PRODUCT_IDS.STD_COM_PROMO,
  name: "Item padrão em promoção (seed)",
  type: "STANDARD_ITEM",
  price: 39.9,
  originalPrice: 59.9,
  imageUrl: placeholder("Promo"),
});

const stdComVariantes = makeProduct({
  id: PRODUCT_IDS.STD_COM_VARIANTES,
  name: "Item padrão com variações (seed)",
  type: "STANDARD_ITEM",
  price: 45,
  imageUrl: placeholder("Variantes"),
  variants: [
    // Variação gerada por combinação de dimensões (Tamanho × Cor).
    {
      id: "seed-variant-combinada",
      type: "Tamanho",
      name: "GG",
      attributes: { Tamanho: "GG", Cor: "Azul" },
      price: 55,
      inStock: true,
    },
    // Variação legada (flat) — sem `attributes`, sem `price` próprio (cai
    // pro Product.price, ver ProductVariant.price em src/types/product.ts).
    {
      id: "seed-variant-flat",
      type: "Cor",
      name: "Vermelho",
      inStock: true,
    },
  ],
});

// SEM `price` de propósito — precisa ser recusado pelo gate do carrinho
// (cartStore/productStore não deixam adicionar item sem preço resolvido).
// Ver docs/claude-lessons.md #52 (fallback silencioso `a || b` escondendo
// campo não preenchido) e #53 (comparação por igualdade sem guard) — a
// mesma classe de bug nasce de tratar "ausente" como "tem um valor válido".
const stdSemPreco = makeProduct({
  id: PRODUCT_IDS.STD_SEM_PRECO,
  name: "Item padrão sem preço configurado (seed)",
  type: "STANDARD_ITEM",
  imageUrl: placeholder("Sem Preco"),
});

// ── RIBBON ───────────────────────────────────────────────────────────────
// Ver src/lib/ribbon-pricing.ts: FECHADO usa `rollPrice`, ABERTO usa `price`
// — os dois lados tratados de forma simétrica, nenhum cai pro outro campo.

// Rolo fechado "normal": nunca aberto, remainingMeters == totalRollMeters.
const ribbonFechadoCompleto = makeProduct({
  id: PRODUCT_IDS.RIBBON_FECHADO_COMPLETO,
  name: "Fita rolo fechado completo (seed)",
  type: "RIBBON",
  unit: "m",
  rollPrice: 180,
  canBeSoldAsRoll: true,
  imageUrl: placeholder("Rolo Fechado"),
  ribbonInventory: {
    status: "FECHADO",
    remainingMeters: 100,
    totalRollMeters: 100,
  },
});

// Aberto, vendido parcialmente — cenário núcleo do #52 (precificação por
// metro) e o estado de partida do #66 (se fechado manual daqui em diante,
// o rollPrice cheio não reflete os 35m restantes).
const ribbonAbertoComSobra = makeProduct({
  id: PRODUCT_IDS.RIBBON_ABERTO_SOBRA,
  name: "Fita aberta com sobra (seed)",
  type: "RIBBON",
  unit: "m",
  price: 2.5,
  rollPrice: 180,
  canBeSoldAsRoll: true,
  imageUrl: placeholder("Aberta Sobra"),
  ribbonInventory: {
    status: "ABERTO",
    remainingMeters: 35,
    totalRollMeters: 100,
  },
});

// Repro exata do #66: fechado manualmente com sobra (remainingMeters <
// totalRollMeters, mas status FECHADO) — hoje ainda cobra o rollPrice
// cheio dos 100m originais por um rolo que só tem 30m físicos. Fixture de
// regressão: quando #66 for corrigido, este é o caso que precisa passar a
// cobrar proporcional (ou o que a decisão de produto do #66 definir).
const ribbonFechadoParcial = makeProduct({
  id: PRODUCT_IDS.RIBBON_FECHADO_PARCIAL,
  name: "Fita fechada manualmente com sobra (seed) — repro #66",
  type: "RIBBON",
  unit: "m",
  rollPrice: 180,
  canBeSoldAsRoll: true,
  imageUrl: placeholder("Fechado Parcial"),
  ribbonInventory: {
    status: "FECHADO",
    remainingMeters: 30,
    totalRollMeters: 100,
  },
});

// Repro exata do bug original #52: rolo fechado SEM rollPrice configurado.
// `hasRollPrice`/`getEffectiveUnitPrice` devem retornar null (preço
// indisponível) — nunca cair pro `price` (metro), que é o bug que já
// cobrou R$0,40 no lugar de R$40 em produção.
const ribbonSemRollPrice = makeProduct({
  id: PRODUCT_IDS.RIBBON_SEM_ROLLPRICE,
  name: "Fita rolo fechado sem rollPrice (seed) — repro #52",
  type: "RIBBON",
  unit: "m",
  price: 3.0, // presente de propósito: garante que NÃO vira fallback do rollPrice
  canBeSoldAsRoll: true,
  imageUrl: placeholder("Sem RollPrice"),
  ribbonInventory: {
    status: "FECHADO",
    remainingMeters: 40,
    totalRollMeters: 40,
  },
});

// canBeSoldAsRoll: false — fita avulsa, nunca vendida como rolo inteiro.
const ribbonNaoVendavelComoRolo = makeProduct({
  id: PRODUCT_IDS.RIBBON_NAO_VENDAVEL_ROLO,
  name: "Fita avulsa, não vendável como rolo (seed)",
  type: "RIBBON",
  unit: "m",
  price: 2.0,
  canBeSoldAsRoll: false,
  imageUrl: placeholder("Nao Vendavel Rolo"),
  ribbonInventory: {
    status: "ABERTO",
    remainingMeters: 50,
    totalRollMeters: 50,
  },
});

// ── BASE_CONTAINER / FILLER / WRAPPER / ACCESSORY ──────────────────────────
// Componentes do kit_recipe seedado em kitRecipes.ts.

const baseContainer = makeProduct({
  id: PRODUCT_IDS.BASE_CONTAINER,
  name: "Base cesta (seed)",
  type: "BASE_CONTAINER",
  price: 35,
  capacity: 20,
  capacityRef: "M",
  isKitBase: true,
  // Legado: só imageUrl, sem images[] — o outro fixture (stdComPreco) cobre
  // o caminho novo (images[] + cover).
  imageUrl: placeholder("Base Cesta"),
});

const filler = makeProduct({
  id: PRODUCT_IDS.FILLER,
  name: "Recheio (seed)",
  type: "FILLER",
  price: 8,
  imageUrl: placeholder("Recheio"),
});

const wrapper = makeProduct({
  id: PRODUCT_IDS.WRAPPER,
  name: "Embalagem celofane (seed)",
  type: "WRAPPER",
  price: 6,
  wrapperSize: "M",
  imageUrl: placeholder("Embalagem"),
});

const accessory = makeProduct({
  id: PRODUCT_IDS.ACCESSORY,
  name: "Acessório decorativo (seed)",
  type: "ACCESSORY",
  price: 4.5,
  imageUrl: placeholder("Acessorio"),
});

// ── ASSEMBLED_KIT ───────────────────────────────────────────────────────────
// recipeId aponta pro KitRecipe seedado em kitRecipes.ts — mesma constante de
// ids.ts dos dois lados, checado pelo runner (invariante: recipeId existe em
// kit_recipes).

const assembledKit = makeProduct({
  id: PRODUCT_IDS.ASSEMBLED_KIT,
  name: "Kit Presente Aniversário montado (seed)",
  type: "ASSEMBLED_KIT",
  category: categoryKits.name,
  subcategory: categoryKits.subcategories[0].name,
  kitBasePrice: 89.9,
  recipeId: KIT_RECIPE_IDS.PRESENTE_ANIVERSARIO,
  imageUrl: placeholder("Kit Aniversario"),
});

export const products: Product[] = [
  stdComPreco,
  stdComPromo,
  stdComVariantes,
  stdSemPreco,
  ribbonFechadoCompleto,
  ribbonAbertoComSobra,
  ribbonFechadoParcial,
  ribbonSemRollPrice,
  ribbonNaoVendavelComoRolo,
  baseContainer,
  filler,
  wrapper,
  accessory,
  assembledKit,
];

export {
  stdComPreco,
  stdComPromo,
  stdComVariantes,
  stdSemPreco,
  ribbonAbertoComSobra,
  baseContainer,
  filler,
  wrapper,
  assembledKit,
};
