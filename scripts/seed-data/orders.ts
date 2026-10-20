import { Order } from "../../src/types/order";
import { CartItem } from "../../src/types/cart";
import { ORDER_IDS, KIT_RECIPE_IDS, PRODUCT_IDS } from "./ids";
import {
  stdComPreco,
  stdComPromo,
  ribbonAbertoComSobra,
  baseContainer,
  filler,
} from "./products";

// Datas fixas (não `new Date()`) — rodar o seed 2x deve gravar o MESMO
// documento, não um novo timestamp a cada execução (idempotência).
const FIXED_DATES = {
  pending: "2026-07-20T14:30:00.000Z",
  preparing: "2026-07-18T09:15:00.000Z",
  delivered: "2026-07-15T18:45:00.000Z",
  cancelled: "2026-07-10T11:00:00.000Z",
};

const simpleItem = (
  product: typeof stdComPreco,
  quantity: number
): CartItem => ({
  cartId: `seed-cart-${product.id}`,
  type: "SIMPLE",
  quantity,
  product,
});

const kitItem: CartItem = {
  cartId: "seed-cart-kit",
  type: "CUSTOM_KIT",
  quantity: 1,
  kitName: "Presente de Aniversário (seed)",
  kitComponents: [baseContainer, filler],
  kitTotalAmount: 53,
  kitComposition: {
    recipeId: KIT_RECIPE_IDS.PRESENTE_ANIVERSARIO,
    baseProductId: PRODUCT_IDS.BASE_CONTAINER,
    items: [
      { productId: PRODUCT_IDS.BASE_CONTAINER, quantity: 1 },
      { productId: PRODUCT_IDS.FILLER, quantity: 2 },
    ],
  },
};

// Pedido normal, com paymentTiming/pixPaymentDestination preenchidos (o
// caminho gravado desde a introdução do #54).
const orderPending: Order = {
  id: ORDER_IDS.PENDING_COM_PAYMENT_TIMING,
  customerName: "Cliente Seed Pendente",
  customerPhone: "5595988887777",
  total: 99.8,
  status: "pending",
  paymentMethod: "pix",
  paymentTiming: "prepaid",
  pixPaymentDestination: "store",
  deliveryMethod: "delivery",
  address: "Rua Seed, 123 — Boa Vista/RR",
  createdAt: FIXED_DATES.pending,
  items: [simpleItem(stdComPreco, 2)],
};

// Legado do #54: paymentTiming/pixPaymentDestination AUSENTES (campo não
// existe no doc, não é `undefined` setado) — pedidos gravados antes desses
// campos existirem. OrdersTab precisa continuar renderizando isso sem quebrar.
const orderPreparingLegado: Order = {
  id: ORDER_IDS.PREPARING_LEGACY_SEM_PAYMENT_TIMING,
  customerName: "Cliente Seed Legado",
  customerPhone: "5595977776666",
  total: 39.9,
  status: "preparing",
  paymentMethod: "cash",
  deliveryMethod: "pickup",
  createdAt: FIXED_DATES.preparing,
  items: [simpleItem(stdComPromo, 1)],
};

const orderDeliveredKit: Order = {
  id: ORDER_IDS.DELIVERED_KIT,
  customerName: "Cliente Seed Kit",
  customerPhone: "5595966665555",
  total: 53,
  status: "delivered",
  paymentMethod: "credit_card",
  paymentTiming: "on_delivery",
  deliveryMethod: "delivery",
  address: "Av. Seed, 456 — Boa Vista/RR",
  createdAt: FIXED_DATES.delivered,
  items: [kitItem],
};

const orderCancelled: Order = {
  id: ORDER_IDS.CANCELLED,
  customerName: "Cliente Seed Cancelado",
  customerPhone: "5595955554444",
  total: 87.5,
  status: "cancelled",
  paymentMethod: "pix",
  paymentTiming: "prepaid",
  pixPaymentDestination: "carrier",
  deliveryMethod: "delivery",
  address: "Travessa Seed, 789 — Boa Vista/RR",
  observation: "Pedido cancelado pelo cliente (seed)",
  createdAt: FIXED_DATES.cancelled,
  items: [simpleItem(ribbonAbertoComSobra, 5)],
};

export const orders: Order[] = [
  orderPending,
  orderPreparingLegado,
  orderDeliveredKit,
  orderCancelled,
];
