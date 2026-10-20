import { describe, it, expect } from "vitest";
import {
  countCategoryProducts,
  countSubcategoryProducts,
  filterProductsByCategory,
  getVisibleCategories,
} from "./categories";
import { Category, Product } from "@/types";

const makeProduct = (overrides: Partial<Product> = {}): Product => ({
  id: `prod-${Math.random()}`,
  name: "Produto Teste",
  price: 10,
  type: "STANDARD_ITEM",
  category: "Fitas & Laços",
  unit: "un",
  inStock: true,
  disabled: false,
  ...overrides,
});

const makeCategory = (overrides: Partial<Category> = {}): Category => ({
  id: "fitas-lacos",
  name: "Fitas & Laços",
  order: 0,
  active: true,
  subcategories: [],
  ...overrides,
});

describe("countCategoryProducts", () => {
  it("counts only products of the given category that are in stock and not disabled", () => {
    const products = [
      makeProduct({ id: "1", category: "Fitas & Laços", inStock: true, disabled: false }),
      makeProduct({ id: "2", category: "Fitas & Laços", inStock: false, disabled: false }),
      makeProduct({ id: "3", category: "Fitas & Laços", inStock: true, disabled: true }),
      makeProduct({ id: "4", category: "Balões", inStock: true, disabled: false }),
    ];
    expect(countCategoryProducts(products, "Fitas & Laços")).toBe(1);
  });

  it("returns 0 for an empty product list", () => {
    expect(countCategoryProducts([], "Fitas & Laços")).toBe(0);
  });

  it("returns 0 when no product matches the category name", () => {
    const products = [makeProduct({ category: "Balões" })];
    expect(countCategoryProducts(products, "Fitas & Laços")).toBe(0);
  });
});

describe("countSubcategoryProducts", () => {
  it("counts only in-stock, non-disabled products matching category AND subcategory", () => {
    const products = [
      makeProduct({
        id: "1",
        category: "Fitas & Laços",
        subcategory: "Cetim",
        inStock: true,
        disabled: false,
      }),
      makeProduct({
        id: "2",
        category: "Fitas & Laços",
        subcategory: "Cetim",
        inStock: false,
        disabled: false,
      }),
      makeProduct({
        id: "3",
        category: "Fitas & Laços",
        subcategory: "Organza",
        inStock: true,
        disabled: false,
      }),
    ];
    expect(countSubcategoryProducts(products, "Fitas & Laços", "Cetim")).toBe(1);
  });

  it("returns 0 when subcategory has no matching products", () => {
    const products = [
      makeProduct({ category: "Fitas & Laços", subcategory: "Cetim" }),
    ];
    expect(countSubcategoryProducts(products, "Fitas & Laços", "Organza")).toBe(0);
  });
});

describe("filterProductsByCategory", () => {
  it("returns non-disabled products matching the category name, including out-of-stock ones", () => {
    const products = [
      makeProduct({ id: "1", category: "Fitas & Laços", inStock: true, disabled: false }),
      makeProduct({ id: "2", category: "Fitas & Laços", inStock: false, disabled: false }),
      makeProduct({ id: "3", category: "Fitas & Laços", inStock: true, disabled: true }),
      makeProduct({ id: "4", category: "Balões", inStock: true, disabled: false }),
    ];
    const result = filterProductsByCategory(products, "Fitas & Laços");
    expect(result.map((p) => p.id).sort()).toEqual(["1", "2"]);
  });

  it("further filters by subcategory name when provided", () => {
    const products = [
      makeProduct({ id: "1", category: "Fitas & Laços", subcategory: "Cetim" }),
      makeProduct({ id: "2", category: "Fitas & Laços", subcategory: "Organza" }),
    ];
    const result = filterProductsByCategory(products, "Fitas & Laços", "Cetim");
    expect(result.map((p) => p.id)).toEqual(["1"]);
  });

  it("returns an empty array when the category has no products", () => {
    expect(filterProductsByCategory([], "Fitas & Laços")).toEqual([]);
  });
});

describe("getVisibleCategories", () => {
  it("excludes inactive categories even if they have in-stock products", () => {
    const categories = [makeCategory({ id: "fitas", name: "Fitas", active: false })];
    const products = [makeProduct({ category: "Fitas", inStock: true, disabled: false })];
    expect(getVisibleCategories(categories, products)).toEqual([]);
  });

  it("excludes active categories with zero in-stock products (guarda-corpo)", () => {
    const categories = [makeCategory({ id: "fitas", name: "Fitas", active: true })];
    const products = [makeProduct({ category: "Fitas", inStock: false, disabled: false })];
    expect(getVisibleCategories(categories, products)).toEqual([]);
  });

  it("includes an active category with at least one in-stock product, with correct productCount", () => {
    const categories = [makeCategory({ id: "fitas", name: "Fitas", active: true })];
    const products = [
      makeProduct({ id: "1", category: "Fitas", inStock: true, disabled: false }),
      makeProduct({ id: "2", category: "Fitas", inStock: true, disabled: false }),
    ];
    const result = getVisibleCategories(categories, products);
    expect(result).toHaveLength(1);
    expect(result[0].productCount).toBe(2);
  });

  it("orders visible categories by `order` ascending", () => {
    const categories = [
      makeCategory({ id: "baloes", name: "Balões", order: 2, active: true }),
      makeCategory({ id: "fitas", name: "Fitas", order: 0, active: true }),
      makeCategory({ id: "cestas", name: "Cestas", order: 1, active: true }),
    ];
    const products = [
      makeProduct({ category: "Balões", inStock: true, disabled: false }),
      makeProduct({ category: "Fitas", inStock: true, disabled: false }),
      makeProduct({ category: "Cestas", inStock: true, disabled: false }),
    ];
    const result = getVisibleCategories(categories, products);
    expect(result.map((c) => c.id)).toEqual(["fitas", "cestas", "baloes"]);
  });

  it("includes subcategories as children, sorted by their own `order`", () => {
    const categories = [
      makeCategory({
        id: "fitas",
        name: "Fitas",
        active: true,
        subcategories: [
          { id: "organza", name: "Organza", order: 1 },
          { id: "cetim", name: "Cetim", order: 0 },
        ],
      }),
    ];
    const products = [
      makeProduct({ category: "Fitas", subcategory: "Organza", inStock: true, disabled: false }),
      makeProduct({ category: "Fitas", subcategory: "Cetim", inStock: true, disabled: false }),
    ];
    const result = getVisibleCategories(categories, products);
    expect(result[0].visibleSubcategories.map((s) => s.id)).toEqual(["cetim", "organza"]);
  });

  it("excludes a subcategory with zero in-stock products, but keeps the parent category visible", () => {
    const categories = [
      makeCategory({
        id: "fitas",
        name: "Fitas",
        active: true,
        subcategories: [
          { id: "organza", name: "Organza", order: 0 },
          { id: "cetim", name: "Cetim", order: 1 },
        ],
      }),
    ];
    const products = [
      // Only "Cetim" has an in-stock product; category itself stays visible
      // because there's still 1+ sellable product overall.
      makeProduct({ category: "Fitas", subcategory: "Cetim", inStock: true, disabled: false }),
      makeProduct({ category: "Fitas", subcategory: "Organza", inStock: false, disabled: false }),
    ];
    const result = getVisibleCategories(categories, products);
    expect(result).toHaveLength(1);
    expect(result[0].visibleSubcategories.map((s) => s.id)).toEqual(["cetim"]);
  });

  it("returns an empty array when there are no categories", () => {
    expect(getVisibleCategories([], [])).toEqual([]);
  });
});
