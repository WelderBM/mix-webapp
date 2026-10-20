// Registro central de ids determinísticos do seed. Todo id usado por mais de
// uma collection (referência cruzada — recipeId, componentId, productIds de
// StoreSection) vive aqui, uma vez só, e as collections importam a constante
// em vez de retipar a string — evita o mesmo tipo de drift silencioso que o
// #52/#53 (dois lugares que deveriam concordar e não concordam) já causou.
//
// Todo id começa com "seed-": é o prefixo que permite `--wipe` limpar só o
// que este script criou, sem tocar em dado manual do staging.

export const CATEGORY_IDS = {
  BALOES: "seed-cat-baloes",
  FITAS: "seed-cat-fitas",
  KITS: "seed-cat-kits",
  DESCONTINUADA: "seed-cat-descontinuada",
} as const;

export const PRODUCT_IDS = {
  STD_COM_PRECO: "seed-std-com-preco",
  STD_COM_PROMO: "seed-std-com-promo",
  STD_COM_VARIANTES: "seed-std-com-variantes",
  STD_SEM_PRECO: "seed-std-sem-preco",
  RIBBON_FECHADO_COMPLETO: "seed-ribbon-fechado-completo",
  RIBBON_ABERTO_SOBRA: "seed-ribbon-aberto-sobra",
  RIBBON_FECHADO_PARCIAL: "seed-ribbon-fechado-parcial",
  RIBBON_SEM_ROLLPRICE: "seed-ribbon-sem-rollprice",
  RIBBON_NAO_VENDAVEL_ROLO: "seed-ribbon-nao-vendavel-rolo",
  BASE_CONTAINER: "seed-base-container",
  FILLER: "seed-filler",
  WRAPPER: "seed-wrapper",
  ACCESSORY: "seed-accessory",
  ASSEMBLED_KIT: "seed-assembled-kit",
} as const;

export const KIT_RECIPE_IDS = {
  PRESENTE_ANIVERSARIO: "seed-kit-recipe-presente-aniversario",
} as const;

export const ORDER_IDS = {
  PENDING_COM_PAYMENT_TIMING: "seed-order-pending",
  PREPARING_LEGACY_SEM_PAYMENT_TIMING: "seed-order-preparing-legado",
  DELIVERED_KIT: "seed-order-delivered-kit",
  CANCELLED: "seed-order-cancelled",
} as const;
