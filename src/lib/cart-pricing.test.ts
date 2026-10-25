import { describe, it, expect } from "vitest";
import {
  dropUnpricedCartItems,
  getCartItemTotalOrNull,
  getCartItemTotal,
  getCartItemUnitPrice,
  getCartItemUnavailableReason,
  sumCartItemTotals,
  countCartItems,
  describeCartAddition,
  getCartItemCount,
  isPerMeterCartItem,
} from "./cart-pricing";
import { CartItem } from "@/types/cart";
import { Product } from "@/types/product";

function makeRibbon(overrides: Partial<Product> = {}): Product {
  return {
    id: "ribbon-1",
    name: "Fita Laminada",
    price: 0.5,
    rollPrice: 40,
    type: "RIBBON",
    category: "Fitas",
    unit: "m",
    inStock: true,
    disabled: false,
    ribbonInventory: {
      status: "ABERTO",
      remainingMeters: 50,
      totalRollMeters: 100,
    },
    ...overrides,
  };
}

describe("getCartItemTotal", () => {
  it("charges an open ribbon by meter, not by roll price (production incident regression)", () => {
    const item: CartItem = {
      cartId: "c1",
      type: "SIMPLE",
      quantity: 99,
      product: makeRibbon({
        price: 0.4,
        ribbonInventory: { status: "ABERTO", remainingMeters: 100, totalRollMeters: 100 },
      }),
    };
    expect(getCartItemTotal(item)).toBeCloseTo(39.6);
  });

  it("charges a sealed ribbon roll at rollPrice regardless of quantity semantics", () => {
    const item: CartItem = {
      cartId: "c1",
      type: "SIMPLE",
      quantity: 1,
      product: makeRibbon({
        ribbonInventory: { status: "FECHADO", remainingMeters: 100, totalRollMeters: 100 },
      }),
    };
    expect(getCartItemTotal(item)).toBe(40);
  });

  it("SIMPLE item uses selectedVariant price over product price", () => {
    const item: CartItem = {
      cartId: "c1",
      type: "SIMPLE",
      quantity: 2,
      product: {
        id: "p1",
        name: "Prod",
        price: 50,
        type: "STANDARD_ITEM",
        category: "Test",
        unit: "un",
        inStock: true,
        disabled: false,
      },
      selectedVariant: { id: "v1", name: "Blue", price: 60, inStock: true } as any,
    };
    expect(getCartItemTotal(item)).toBe(120);
  });

  it("honors a selectedVariant price of exactly 0 instead of falling back to product price", () => {
    const item: CartItem = {
      cartId: "c1",
      type: "SIMPLE",
      quantity: 3,
      product: {
        id: "p1",
        name: "Prod",
        price: 50,
        type: "STANDARD_ITEM",
        category: "Test",
        unit: "un",
        inStock: true,
        disabled: false,
      },
      selectedVariant: { id: "v1", name: "Free sample", price: 0, inStock: true } as any,
    };
    expect(getCartItemUnitPrice(item)).toBe(0);
    expect(getCartItemTotal(item)).toBe(0);
  });

  it("CUSTOM_KIT/CUSTOM_RIBBON/CUSTOM_BALLOON use kitTotalAmount x quantity, not unit price x quantity", () => {
    const item: CartItem = {
      cartId: "c1",
      type: "CUSTOM_RIBBON",
      quantity: 2,
      product: makeRibbon(),
      kitTotalAmount: 40,
    };
    expect(getCartItemTotal(item)).toBe(80);
  });

  it("returns 0 for a SIMPLE item with no product and no variant (nothing to charge)", () => {
    const item: CartItem = { cartId: "c1", type: "SIMPLE", quantity: 1 };
    expect(getCartItemUnitPrice(item)).toBe(null);
    expect(() => getCartItemTotal(item)).toThrow();
  });

  // Rede de segurança: por construção, cartStore.addItem já recusa um item
  // SIMPLE sem preço efetivo (ver cartStore.test.ts), então este caminho só
  // seria atingido por um carrinho legado (localStorage anterior a esse
  // portão). Lançar em vez de "?? 0" é intencional — 0 aqui venderia o
  // pedido de graça, exatamente o incidente que este arquivo existe pra
  // evitar, só que na ponta do total em vez da ponta do preço unitário.
  it("throws instead of silently charging 0 for a SIMPLE item with an unpriced ribbon", () => {
    const item: CartItem = {
      cartId: "c1",
      type: "SIMPLE",
      quantity: 99,
      product: makeRibbon({
        price: undefined,
        ribbonInventory: { status: "ABERTO", remainingMeters: 100, totalRollMeters: 100 },
      }),
    };
    expect(() => getCartItemTotal(item)).toThrow();
  });
});

function makeSimpleProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "p1",
    name: "Prod",
    price: 50,
    type: "STANDARD_ITEM",
    category: "Test",
    unit: "un",
    inStock: true,
    disabled: false,
    ...overrides,
  };
}

describe("getCartItemUnavailableReason", () => {
  it("flags a stale cart item whose product is no longer in the live catalog (deleted or disabled)", () => {
    const item: CartItem = {
      cartId: "c1",
      type: "SIMPLE",
      quantity: 1,
      product: makeSimpleProduct(),
    };
    expect(getCartItemUnavailableReason(item, [])).toMatch(/não está mais disponível/);
  });

  it("flags a stale cart item whose live product lost its price", () => {
    const item: CartItem = {
      cartId: "c1",
      type: "SIMPLE",
      quantity: 1,
      product: makeSimpleProduct(),
    };
    const liveProducts = [makeSimpleProduct({ price: undefined })];
    expect(getCartItemUnavailableReason(item, liveProducts)).toMatch(
      /sem preço configurado/
    );
  });

  it("returns null when the product is still live with a valid price", () => {
    const item: CartItem = {
      cartId: "c1",
      type: "SIMPLE",
      quantity: 1,
      product: makeSimpleProduct(),
    };
    const liveProducts = [makeSimpleProduct()];
    expect(getCartItemUnavailableReason(item, liveProducts)).toBeNull();
  });

  it("ignores CUSTOM_KIT/CUSTOM_RIBBON/CUSTOM_BALLOON items (priced via kitTotalAmount, not catalog lookup)", () => {
    const item: CartItem = {
      cartId: "c1",
      type: "CUSTOM_RIBBON",
      quantity: 1,
      product: makeSimpleProduct(),
      kitTotalAmount: 40,
    };
    expect(getCartItemUnavailableReason(item, [])).toBeNull();
  });
});

describe("sumCartItemTotals", () => {
  it("sums valid items and silently skips an item that would otherwise throw", () => {
    const validItem: CartItem = {
      cartId: "c1",
      type: "SIMPLE",
      quantity: 2,
      product: makeSimpleProduct({ price: 50 }),
    };
    const staleItem: CartItem = {
      cartId: "c2",
      type: "SIMPLE",
      quantity: 1,
      product: makeSimpleProduct({ id: "p2", price: undefined }),
    };
    expect(sumCartItemTotals([validItem, staleItem])).toBe(100);
  });

  it("returns 0 for an empty cart", () => {
    expect(sumCartItemTotals([])).toBe(0);
  });
});

describe("dropUnpricedCartItems", () => {
  const priced = {
    cartId: "ok",
    type: "SIMPLE",
    quantity: 1,
    product: { id: "p1", name: "Com preço", price: 10, type: "STANDARD_ITEM", category: "x", unit: "un", inStock: true },
  } as CartItem;
  // Fita RIBBON de rolo fechado sem rollPrice — formato salvo antes do #65.
  const legacyUnpriced = {
    cartId: "legacy",
    type: "SIMPLE",
    quantity: 1,
    product: { id: "p2", name: "Fita", type: "RIBBON", category: "Fitas", unit: "rolo", inStock: true },
  } as unknown as CartItem;
  const kit = { cartId: "kit", type: "CUSTOM_KIT", quantity: 1, kitTotalAmount: 50 } as CartItem;

  it("remove item SIMPLE sem preço efetivo e mantém o resto", () => {
    const result = dropUnpricedCartItems([priced, legacyUnpriced, kit]);
    expect(result.map((i) => i.cartId)).toEqual(["ok", "kit"]);
  });

  it("o que sobra nunca faz getCartItemTotal lançar", () => {
    for (const item of dropUnpricedCartItems([priced, legacyUnpriced, kit])) {
      expect(() => getCartItemTotal(item)).not.toThrow();
    }
  });

  it("tolera storage corrompido (não-array ou entradas nulas)", () => {
    expect(dropUnpricedCartItems(undefined)).toEqual([]);
    expect(dropUnpricedCartItems("lixo")).toEqual([]);
    expect(dropUnpricedCartItems([null, priced])).toEqual([priced]);
  });
});

describe("getCartItemTotalOrNull", () => {
  it("devolve null em vez de lançar para item gravado sem preço", () => {
    const legacy = {
      cartId: "legacy",
      type: "SIMPLE",
      quantity: 1,
      product: { id: "p2", name: "Fita", type: "RIBBON", category: "Fitas", unit: "rolo", inStock: true },
    } as unknown as CartItem;
    expect(getCartItemTotalOrNull(legacy)).toBeNull();
  });

  it("devolve o total normal quando há preço", () => {
    const kit = { cartId: "kit", type: "CUSTOM_KIT", quantity: 2, kitTotalAmount: 50 } as CartItem;
    expect(getCartItemTotalOrNull(kit)).toBe(100);
  });
});

describe("contagem do ícone do carrinho (#340)", () => {
  const meter = (q: number): CartItem => ({
    cartId: "m",
    type: "SIMPLE",
    product: makeRibbon(),
    quantity: q,
  });

  it("fita por metro conta 1 item, não a metragem", () => {
    expect(isPerMeterCartItem(meter(2.5))).toBe(true);
    expect(getCartItemCount(meter(2.5))).toBe(1);
  });

  it("rolo fechado e laço contam unidades", () => {
    const roll: CartItem = {
      cartId: "r",
      type: "SIMPLE",
      product: makeRibbon({
        ribbonInventory: { status: "FECHADO", remainingMeters: 100, totalRollMeters: 100 },
      }),
      quantity: 2,
    };
    const bow: CartItem = {
      cartId: "b",
      type: "CUSTOM_RIBBON",
      product: makeRibbon(),
      quantity: 1,
      kitTotalAmount: 7,
    };
    expect(isPerMeterCartItem(roll)).toBe(false);
    expect(isPerMeterCartItem(bow)).toBe(false);
    expect(countCartItems([meter(2.5), roll, bow])).toBe(4);
  });

  it("aviso de fita por metro mostra a metragem com vírgula", () => {
    expect(describeCartAddition(meter(2.5))).toBe("2,5 m de Fita Laminada");
  });
});
