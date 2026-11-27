import { describe, it, expect } from "vitest";
import { resolveShelves } from "./shelves";
import type { Category, Product, StoreSection } from "@/types";

const p = (id: string, extra: Partial<Product> = {}) =>
  ({ id, name: id, price: 10, inStock: true, category: "Fitas", ...extra }) as Product;

const categories = [
  { id: "fitas", name: "Fitas", active: true, order: 1, subcategories: [] },
] as unknown as Category[];

describe("resolveShelves (#399)", () => {
  it("resolve prateleira por categoria com as categorias do servidor", () => {
    const sections = [
      { id: "s1", type: "product_shelf", isActive: true, source: { mode: "category", categoryId: "fitas" } },
    ] as unknown as StoreSection[];
    const out = resolveShelves(sections, [p("a"), p("b", { category: "Balões" })], categories);
    expect(out.s1.map((x) => x.id)).toEqual(["a"]);
  });

  it("ignora seção inativa e banner", () => {
    const sections = [
      { id: "off", type: "product_shelf", isActive: false, productIds: ["a"] },
      { id: "ban", type: "banner_ribbon", isActive: true },
    ] as unknown as StoreSection[];
    expect(resolveShelves(sections, [p("a")], categories)).toEqual({});
  });

  it("manual respeita a ordem escolhida e o limite", () => {
    const sections = [
      { id: "m", type: "product_shelf", isActive: true, productIds: ["c", "a", "b"], limit: 2 },
    ] as unknown as StoreSection[];
    const out = resolveShelves(sections, [p("a"), p("b"), p("c")], categories);
    expect(out.m.map((x) => x.id)).toEqual(["c", "a"]);
  });

  it("sem seções devolve vazio", () => {
    expect(resolveShelves(undefined, [p("a")], categories)).toEqual({});
  });
});
