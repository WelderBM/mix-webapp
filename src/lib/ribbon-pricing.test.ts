import { describe, it, expect } from "vitest";
import { getEffectiveUnitPrice, getEffectiveUnitLabel, isSealedRibbonRoll } from "./ribbon-pricing";
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
    // Regression: production incident charged 99m x rollPrice (R$40) = R$3.960
    // instead of 99m x price-per-meter — this asserts the FECHADO side reads
    // rollPrice, not the per-meter `price` field.
    expect(getEffectiveUnitPrice(product)).toBe(40);
  });

  it("uses price (per meter) for an open (ABERTO) ribbon", () => {
    const product = makeRibbon({
      ribbonInventory: { status: "ABERTO", remainingMeters: 50, totalRollMeters: 100 },
    });
    expect(getEffectiveUnitPrice(product)).toBe(0.5);
  });

  it("falls back to price when rollPrice is unset on a sealed roll", () => {
    const product = makeRibbon({
      rollPrice: undefined,
      ribbonInventory: { status: "FECHADO", remainingMeters: 100, totalRollMeters: 100 },
    });
    expect(getEffectiveUnitPrice(product)).toBe(0.5);
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
