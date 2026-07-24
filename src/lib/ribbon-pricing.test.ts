import { describe, it, expect } from "vitest";
import {
  getEffectiveUnitPrice,
  getEffectiveUnitLabel,
  isSealedRibbonRoll,
  hasMeterPrice,
  hasRollPrice,
  suggestMeterPrice,
  toOptionalPositiveNumber,
} from "./ribbon-pricing";
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

describe("getEffectiveUnitPrice", () => {
  it("uses rollPrice for a sealed (FECHADO) ribbon roll", () => {
    const product = makeRibbon({
      ribbonInventory: { status: "FECHADO", remainingMeters: 100, totalRollMeters: 100 },
    });
    expect(getEffectiveUnitPrice(product)).toBe(40);
  });

  it("uses price (per meter) for an open (ABERTO) ribbon", () => {
    const product = makeRibbon({
      ribbonInventory: { status: "ABERTO", remainingMeters: 50, totalRollMeters: 100 },
    });
    expect(getEffectiveUnitPrice(product)).toBe(0.5);
  });

  // Regressão simétrica do #52: um rolo FECHADO sem rollPrice configurado
  // é tão inválido quanto uma fita ABERTA sem price por metro — nenhum dos
  // dois pode cair pro outro campo. `rollPrice || price` (o bug original)
  // faria isso retornar `product.price` (0.5) em vez de `null`.
  it("does NOT fall back to price when a sealed roll has no rollPrice", () => {
    const product = makeRibbon({
      rollPrice: undefined,
      price: 0.5,
      ribbonInventory: { status: "FECHADO", remainingMeters: 100, totalRollMeters: 100 },
    });
    const result = getEffectiveUnitPrice(product);
    expect(result).toBe(null);
    expect(result).not.toBe(product.price);
  });

  it("treats rollPrice of exactly 0 the same as absent on a sealed roll", () => {
    const product = makeRibbon({
      rollPrice: 0,
      ribbonInventory: { status: "FECHADO", remainingMeters: 100, totalRollMeters: 100 },
    });
    expect(getEffectiveUnitPrice(product)).toBe(null);
  });

  // Item 5 do #52 invertido: uma fita ABERTA sem price por metro é estado
  // inválido — a asserção que importa de verdade é que o retorno NÃO seja
  // igual a rollPrice (isso seria o incidente original, só que ao contrário).
  it("does NOT fall back to rollPrice when an open ribbon has no price", () => {
    const product = makeRibbon({
      price: undefined,
      rollPrice: 40,
      ribbonInventory: { status: "ABERTO", remainingMeters: 50, totalRollMeters: 100 },
    });
    const result = getEffectiveUnitPrice(product);
    expect(result).toBe(null);
    expect(result).not.toBe(product.rollPrice);
  });

  it("treats price of exactly 0 the same as absent on an open ribbon", () => {
    const product = makeRibbon({
      price: 0,
      ribbonInventory: { status: "ABERTO", remainingMeters: 50, totalRollMeters: 100 },
    });
    expect(getEffectiveUnitPrice(product)).toBe(null);
  });

  it("returns null for a RIBBON with no ribbonInventory/status at all", () => {
    const product = makeRibbon({ ribbonInventory: undefined });
    expect(getEffectiveUnitPrice(product)).toBe(null);
  });

  it("ignores ribbonInventory for non-RIBBON products", () => {
    const product: Product = {
      id: "p1",
      name: "Produto Normal",
      price: 20,
      rollPrice: 999,
      type: "STANDARD_ITEM",
      category: "Geral",
      unit: "un",
      inStock: true,
      disabled: false,
    };
    expect(getEffectiveUnitPrice(product)).toBe(20);
  });

  it("returns null for a non-RIBBON product with no price", () => {
    const product: Product = {
      id: "p1",
      name: "Produto Sem Preço",
      type: "STANDARD_ITEM",
      category: "Geral",
      unit: "un",
      inStock: true,
      disabled: false,
    };
    expect(getEffectiveUnitPrice(product)).toBe(null);
  });

  // Fita só-fechada: cadastrada com rollPrice mas nunca aberta, sem preço
  // por metro configurado — deve funcionar normalmente (item 3 do #52).
  it("prices a roll-only ribbon (no meter price ever set) correctly while FECHADO", () => {
    const product = makeRibbon({
      rollPrice: 40,
      price: undefined,
      ribbonInventory: { status: "FECHADO", remainingMeters: 100, totalRollMeters: 100 },
    });
    expect(getEffectiveUnitPrice(product)).toBe(40);
  });
});

describe("hasMeterPrice / hasRollPrice", () => {
  it("hasMeterPrice is false for undefined, null-like, 0, and negative", () => {
    expect(hasMeterPrice(makeRibbon({ price: undefined }))).toBe(false);
    expect(hasMeterPrice(makeRibbon({ price: 0 }))).toBe(false);
    expect(hasMeterPrice(makeRibbon({ price: -1 }))).toBe(false);
  });

  it("hasMeterPrice is true only for a positive number", () => {
    expect(hasMeterPrice(makeRibbon({ price: 0.5 }))).toBe(true);
  });

  it("hasRollPrice is false for undefined and 0, true for a positive number", () => {
    expect(hasRollPrice(makeRibbon({ rollPrice: undefined }))).toBe(false);
    expect(hasRollPrice(makeRibbon({ rollPrice: 0 }))).toBe(false);
    expect(hasRollPrice(makeRibbon({ rollPrice: 40 }))).toBe(true);
  });
});

describe("getEffectiveUnitLabel", () => {
  it("returns 'rolo' for a sealed ribbon roll", () => {
    const product = makeRibbon({
      ribbonInventory: { status: "FECHADO", remainingMeters: 100, totalRollMeters: 100 },
    });
    expect(getEffectiveUnitLabel(product)).toBe("rolo");
  });

  it("returns product.unit for an open ribbon", () => {
    const product = makeRibbon({
      ribbonInventory: { status: "ABERTO", remainingMeters: 50, totalRollMeters: 100 },
    });
    expect(getEffectiveUnitLabel(product)).toBe("m");
  });
});

describe("isSealedRibbonRoll", () => {
  it("is true only for RIBBON + FECHADO", () => {
    expect(
      isSealedRibbonRoll(
        makeRibbon({ ribbonInventory: { status: "FECHADO", remainingMeters: 100, totalRollMeters: 100 } })
      )
    ).toBe(true);
    expect(
      isSealedRibbonRoll(
        makeRibbon({ ribbonInventory: { status: "ABERTO", remainingMeters: 50, totalRollMeters: 100 } })
      )
    ).toBe(false);
  });

  it("is false for undefined product", () => {
    expect(isSealedRibbonRoll(undefined)).toBe(false);
  });
});

describe("suggestMeterPrice", () => {
  it("derives price per meter from rollPrice / totalRollMeters, rounded to cents", () => {
    const product = makeRibbon({ rollPrice: 40, ribbonInventory: { status: "FECHADO", remainingMeters: 100, totalRollMeters: 100 } });
    expect(suggestMeterPrice(product)).toBe(0.4);
  });

  it("returns null when there is no rollPrice", () => {
    const product = makeRibbon({ rollPrice: undefined });
    expect(suggestMeterPrice(product)).toBe(null);
  });

  it("returns null when totalRollMeters is 0 (avoids division by zero)", () => {
    const product = makeRibbon({
      rollPrice: 40,
      ribbonInventory: { status: "FECHADO", remainingMeters: 0, totalRollMeters: 0 },
    });
    expect(suggestMeterPrice(product)).toBe(null);
  });
});

describe("toOptionalPositiveNumber", () => {
  it("returns undefined for '', undefined, null, 0, and negative values", () => {
    expect(toOptionalPositiveNumber("")).toBeUndefined();
    expect(toOptionalPositiveNumber(undefined)).toBeUndefined();
    expect(toOptionalPositiveNumber(null)).toBeUndefined();
    expect(toOptionalPositiveNumber(0)).toBeUndefined();
    expect(toOptionalPositiveNumber("0")).toBeUndefined();
    expect(toOptionalPositiveNumber(-5)).toBeUndefined();
  });

  it("returns the parsed number for valid positive values, including numeric strings", () => {
    expect(toOptionalPositiveNumber(40)).toBe(40);
    expect(toOptionalPositiveNumber("40.5")).toBe(40.5);
  });
});
