import { describe, it, expect } from "vitest";
import { resolveRecentlyViewedProducts } from "./recentlyViewed";
import { Product } from "@/types";

const makeProduct = (overrides: Partial<Product> = {}): Product => ({
  id: "prod-1",
  name: "Produto",
  description: "",
  price: 10,
  type: "BASE_CONTAINER",
  category: "Cestas",
  unit: "un",
  inStock: true,
  disabled: false,
  ...overrides,
});

describe("resolveRecentlyViewedProducts", () => {
  const allProducts = [
    makeProduct({ id: "prod-1", name: "Produto 1" }),
    makeProduct({ id: "prod-2", name: "Produto 2" }),
    makeProduct({ id: "prod-3", name: "Produto 3" }),
  ];

  it("resolves ids to products preserving recentIds order (most recent first)", () => {
    const result = resolveRecentlyViewedProducts(
      ["prod-3", "prod-1"],
      allProducts
    );
    expect(result.map((p) => p.id)).toEqual(["prod-3", "prod-1"]);
  });

  it("excludes the current product even if it is present in recentIds", () => {
    const result = resolveRecentlyViewedProducts(
      ["prod-2", "prod-1", "prod-3"],
      allProducts,
      "prod-1"
    );
    expect(result.map((p) => p.id)).toEqual(["prod-2", "prod-3"]);
  });

  it("silently skips ids that no longer exist in allProducts (deleted product)", () => {
    const result = resolveRecentlyViewedProducts(
      ["prod-1", "prod-deleted", "prod-2"],
      allProducts
    );
    expect(result.map((p) => p.id)).toEqual(["prod-1", "prod-2"]);
  });

  it("returns an empty array when recentIds is empty", () => {
    const result = resolveRecentlyViewedProducts([], allProducts);
    expect(result).toEqual([]);
  });

  it("returns an empty array when allProducts is empty, without throwing", () => {
    const result = resolveRecentlyViewedProducts(["prod-1"], []);
    expect(result).toEqual([]);
  });
});
