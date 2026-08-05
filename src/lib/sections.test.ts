import { describe, it, expect } from "vitest";
import {
  normalizeSectionSource,
  resolveSectionProducts,
  isLowStock,
  LOW_STOCK_RIBBON_RATIO,
} from "./sections";
import { Category, Product, StoreSection } from "@/types";
import { SYSTEM_TAG_NOVIDADES, SYSTEM_TAG_PROMOCAO } from "./productTags";

const NOW = new Date("2026-08-05T12:00:00.000Z");
const DAY_MS = 24 * 60 * 60 * 1000;

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

const makeSection = (overrides: Partial<StoreSection> = {}): StoreSection => ({
  id: `sec-${Math.random()}`,
  title: "Seção Teste",
  type: "product_shelf",
  width: "full",
  source: { mode: "manual", productIds: [] },
  isActive: true,
  ...overrides,
});

describe("normalizeSectionSource", () => {
  it("retorna `source` direto quando já presente", () => {
    const section = { source: { mode: "tag" as const, tag: "promocao" } };
    expect(normalizeSectionSource(section)).toEqual({
      mode: "tag",
      tag: "promocao",
    });
  });

  it("converte seção legada (só `productIds`, sem `source`) em manual", () => {
    const section = { productIds: ["p1", "p2"] };
    expect(normalizeSectionSource(section)).toEqual({
      mode: "manual",
      productIds: ["p1", "p2"],
    });
  });

  it("seção legada sem `productIds` nem `source` vira manual com lista vazia", () => {
    expect(normalizeSectionSource({})).toEqual({
      mode: "manual",
      productIds: [],
    });
  });
});

describe("isLowStock", () => {
  it("retorna true pra fita ABERTA com sobra <= 20% do rolo", () => {
    const product = makeProduct({
      type: "RIBBON",
      ribbonInventory: {
        status: "ABERTO",
        remainingMeters: 20,
        totalRollMeters: 100,
      },
    });
    expect(isLowStock(product)).toBe(true);
  });

  it("retorna false pra fita ABERTA com sobra acima do limiar", () => {
    const product = makeProduct({
      type: "RIBBON",
      ribbonInventory: {
        status: "ABERTO",
        remainingMeters: 50,
        totalRollMeters: 100,
      },
    });
    expect(isLowStock(product)).toBe(false);
  });

  it("retorna false pra fita FECHADA (rolo intacto, não é 'estoque baixo')", () => {
    const product = makeProduct({
      type: "RIBBON",
      ribbonInventory: {
        status: "FECHADO",
        remainingMeters: 100,
        totalRollMeters: 100,
      },
    });
    expect(isLowStock(product)).toBe(false);
  });

  it("retorna false pra produto sem ribbonInventory (tipo sem quantidade modelada)", () => {
    const product = makeProduct({ type: "STANDARD_ITEM" });
    expect(isLowStock(product)).toBe(false);
  });

  it("limiar exato (ratio) conta como baixo estoque", () => {
    const product = makeProduct({
      type: "RIBBON",
      ribbonInventory: {
        status: "ABERTO",
        remainingMeters: 100 * LOW_STOCK_RIBBON_RATIO,
        totalRollMeters: 100,
      },
    });
    expect(isLowStock(product)).toBe(true);
  });
});

describe("resolveSectionProducts", () => {
  it("modo manual preserva a ordem de curadoria de `productIds`", () => {
    const p1 = makeProduct({ id: "1" });
    const p2 = makeProduct({ id: "2" });
    const section = makeSection({
      source: { mode: "manual", productIds: ["2", "1"] },
    });
    const result = resolveSectionProducts(section, [p1, p2], []);
    expect(result.map((p) => p.id)).toEqual(["2", "1"]);
  });

  it("modo manual ignora productId que não resolve pra produto real", () => {
    const p1 = makeProduct({ id: "1" });
    const section = makeSection({
      source: { mode: "manual", productIds: ["1", "inexistente"] },
    });
    const result = resolveSectionProducts(section, [p1], []);
    expect(result.map((p) => p.id)).toEqual(["1"]);
  });

  it("seção legada (só `productIds`, sem `source`) continua funcionando como manual", () => {
    const p1 = makeProduct({ id: "1" });
    const legacySection = {
      id: "sec-legado",
      title: "Vitrine Antiga",
      type: "product_shelf" as const,
      width: "full" as const,
      productIds: ["1"],
      isActive: true,
    } as unknown as StoreSection;
    const result = resolveSectionProducts(legacySection, [p1], []);
    expect(result.map((p) => p.id)).toEqual(["1"]);
  });

  it("modo category resolve categoryId -> nome e filtra produtos daquela categoria", () => {
    const category = makeCategory({ id: "fitas", name: "Fitas & Laços" });
    const p1 = makeProduct({ id: "1", category: "Fitas & Laços" });
    const p2 = makeProduct({ id: "2", category: "Balões" });
    const section = makeSection({
      source: { mode: "category", categoryId: "fitas" },
    });
    const result = resolveSectionProducts(section, [p1, p2], [category]);
    expect(result.map((p) => p.id)).toEqual(["1"]);
  });

  it("modo category com subcategoryId filtra também por subcategoria", () => {
    const category = makeCategory({
      id: "fitas",
      name: "Fitas & Laços",
      subcategories: [{ id: "cetim", name: "Cetim", order: 0 }],
    });
    const p1 = makeProduct({
      id: "1",
      category: "Fitas & Laços",
      subcategory: "Cetim",
    });
    const p2 = makeProduct({
      id: "2",
      category: "Fitas & Laços",
      subcategory: "Organza",
    });
    const section = makeSection({
      source: {
        mode: "category",
        categoryId: "fitas",
        subcategoryId: "cetim",
      },
    });
    const result = resolveSectionProducts(section, [p1, p2], [category]);
    expect(result.map((p) => p.id)).toEqual(["1"]);
  });

  it("modo category com categoryId que não resolve (categoria apagada) retorna vazio, sem quebrar", () => {
    const p1 = makeProduct({ id: "1", category: "Fitas & Laços" });
    const section = makeSection({
      source: { mode: "category", categoryId: "inexistente" },
    });
    const result = resolveSectionProducts(section, [p1], []);
    expect(result).toEqual([]);
  });

  it("modo tag com tag manual filtra produtos que têm essa tag em `product.tags`", () => {
    const p1 = makeProduct({ id: "1", tags: ["dia-das-maes"] });
    const p2 = makeProduct({ id: "2", tags: ["outra-tag"] });
    const section = makeSection({
      source: { mode: "tag", tag: "dia-das-maes" },
    });
    const result = resolveSectionProducts(section, [p1, p2], []);
    expect(result.map((p) => p.id)).toEqual(["1"]);
  });

  it("modo tag com tag de sistema 'novidades' filtra produto criado recentemente sem curadoria manual", () => {
    const p1 = makeProduct({
      id: "1",
      createdAt: new Date(NOW.getTime() - 2 * DAY_MS),
    });
    const p2 = makeProduct({
      id: "2",
      createdAt: new Date(NOW.getTime() - 365 * DAY_MS),
    });
    const section = makeSection({
      source: { mode: "tag", tag: SYSTEM_TAG_NOVIDADES },
    });
    const result = resolveSectionProducts(section, [p1, p2], []);
    expect(result.map((p) => p.id)).toEqual(["1"]);
  });

  it("modo tag com tag de sistema 'promocao' filtra produto com originalPrice > price", () => {
    const p1 = makeProduct({ id: "1", originalPrice: 100, price: 60 });
    const p2 = makeProduct({ id: "2", originalPrice: undefined, price: 60 });
    const section = makeSection({
      source: { mode: "tag", tag: SYSTEM_TAG_PROMOCAO },
    });
    const result = resolveSectionProducts(section, [p1, p2], []);
    expect(result.map((p) => p.id)).toEqual(["1"]);
  });

  it("modo auto/low_stock filtra fitas com pouca sobra no rolo aberto", () => {
    const lowStock = makeProduct({
      id: "1",
      type: "RIBBON",
      ribbonInventory: {
        status: "ABERTO",
        remainingMeters: 5,
        totalRollMeters: 100,
      },
    });
    const okStock = makeProduct({
      id: "2",
      type: "RIBBON",
      ribbonInventory: {
        status: "ABERTO",
        remainingMeters: 90,
        totalRollMeters: 100,
      },
    });
    const section = makeSection({
      source: { mode: "auto", rule: "low_stock" },
    });
    const result = resolveSectionProducts(section, [lowStock, okStock], []);
    expect(result.map((p) => p.id)).toEqual(["1"]);
  });

  it("`limit` corta o resultado no tamanho pedido", () => {
    const products = [
      makeProduct({ id: "1" }),
      makeProduct({ id: "2" }),
      makeProduct({ id: "3" }),
    ];
    const section = makeSection({
      source: { mode: "manual", productIds: ["1", "2", "3"] },
      limit: 2,
    });
    const result = resolveSectionProducts(section, products, []);
    expect(result.map((p) => p.id)).toEqual(["1", "2"]);
  });

  it("`sort: newest` ordena por createdAt decrescente, produto sem createdAt vai pro fim", () => {
    const oldest = makeProduct({
      id: "old",
      createdAt: new Date(NOW.getTime() - 10 * DAY_MS),
    });
    const newest = makeProduct({
      id: "new",
      createdAt: new Date(NOW.getTime() - 1 * DAY_MS),
    });
    const noCreatedAt = makeProduct({ id: "legacy", createdAt: undefined });
    const section = makeSection({
      source: {
        mode: "manual",
        productIds: ["old", "new", "legacy"],
      },
      sort: "newest",
    });
    const result = resolveSectionProducts(
      section,
      [oldest, newest, noCreatedAt],
      []
    );
    expect(result.map((p) => p.id)).toEqual(["new", "old", "legacy"]);
  });

  it("`sort: price_asc` ordena por preço efetivo crescente, produto sem preço vai pro fim", () => {
    const cheap = makeProduct({ id: "cheap", price: 10 });
    const expensive = makeProduct({ id: "expensive", price: 50 });
    const noPrice = makeProduct({ id: "no-price", price: undefined });
    const section = makeSection({
      source: {
        mode: "manual",
        productIds: ["expensive", "no-price", "cheap"],
      },
      sort: "price_asc",
    });
    const result = resolveSectionProducts(
      section,
      [cheap, expensive, noPrice],
      []
    );
    expect(result.map((p) => p.id)).toEqual(["cheap", "expensive", "no-price"]);
  });

  it("`sort: price_desc` ordena por preço efetivo decrescente", () => {
    const cheap = makeProduct({ id: "cheap", price: 10 });
    const expensive = makeProduct({ id: "expensive", price: 50 });
    const section = makeSection({
      source: { mode: "manual", productIds: ["cheap", "expensive"] },
      sort: "price_desc",
    });
    const result = resolveSectionProducts(section, [cheap, expensive], []);
    expect(result.map((p) => p.id)).toEqual(["expensive", "cheap"]);
  });

  it("seção sem produto nenhum resolvido retorna lista vazia, sem quebrar", () => {
    const section = makeSection({
      source: { mode: "manual", productIds: ["fantasma"] },
    });
    const result = resolveSectionProducts(section, [], []);
    expect(result).toEqual([]);
  });
});
