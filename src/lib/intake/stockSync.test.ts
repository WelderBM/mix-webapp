import { describe, it, expect } from "vitest";
import {
  applyVariantStock,
  computeStockSync,
  groupStock,
  isIgnorableSyncError,
} from "./stockSync";
import type { IntakeItem } from "@/types/intake";

const item = (o: Partial<IntakeItem>): IntakeItem =>
  ({
    id: "1",
    status: "publicado",
    productId: "p1",
    stock: 5,
    inLatestImport: true,
    ...o,
  }) as IntakeItem;

const sync = (before: Partial<IntakeItem>, after: Partial<IntakeItem>) =>
  computeStockSync(new Map([["1", item(before)]]), new Map([["1", item(after)]]));

describe("computeStockSync", () => {
  it("publicado que zerou vira esgotado", () => {
    expect(sync({ stock: 5 }, { stock: 0 })).toEqual([{ productId: "p1", inStock: false }]);
  });

  it("publicado que voltou a ter estoque volta à venda", () => {
    expect(sync({ stock: 0 }, { stock: 12 })).toEqual([{ productId: "p1", inStock: true }]);
  });

  it("publicado que saiu do Noturno vira esgotado", () => {
    expect(sync({}, { inLatestImport: false })).toEqual([{ productId: "p1", inStock: false }]);
  });

  it("estoque que só mudou de quantidade não mexe no produto", () => {
    expect(sync({ stock: 5 }, { stock: 3 })).toEqual([]);
  });

  it("item não publicado nunca mexe em produto", () => {
    expect(sync({ status: "pendente", stock: 5 }, { status: "pendente", stock: 0 })).toEqual([]);
  });

  it("item novo (sem estado anterior) não gera atualização", () => {
    expect(computeStockSync(new Map(), new Map([["1", item({ stock: 0 })]]))).toEqual([]);
  });
});

describe("isIgnorableSyncError", () => {
  it("só produto inexistente é ignorado", () => {
    expect(isIgnorableSyncError({ code: "not-found" })).toBe(true);
  });

  it("rede, cota e permissão interrompem a importação", () => {
    for (const code of ["unavailable", "deadline-exceeded", "resource-exhausted", "permission-denied"]) {
      expect(isIgnorableSyncError({ code })).toBe(false);
    }
    expect(isIgnorableSyncError(new Error("offline"))).toBe(false);
    expect(isIgnorableSyncError(null)).toBe(false);
  });
});

describe("produto lançado em grupo (#201)", () => {
  const it2 = (id: string, stock: number, extra: Partial<IntakeItem> = {}) =>
    ({
      id,
      sourceCode: id,
      stock,
      inLatestImport: true,
      status: "publicado",
      productId: "P1",
      ...extra,
    }) as IntakeItem;

  it("acabar uma cor esgota só a variação; produto segue à venda", () => {
    const before = new Map([["a", it2("a", 2)], ["b", it2("b", 5)]]);
    const after = new Map([["a", it2("a", 0)], ["b", it2("b", 5)]]);
    expect(computeStockSync(before, after)).toEqual([
      { productId: "P1", inStock: true, variants: { a: false, b: true } },
    ]);
  });

  it("todas as cores zeradas: produto esgotado", () => {
    const before = new Map([["a", it2("a", 1)], ["b", it2("b", 0)]]);
    const after = new Map([["a", it2("a", 0)], ["b", it2("b", 0)]]);
    expect(computeStockSync(before, after)[0]).toMatchObject({ inStock: false });
  });

  it("nenhuma cor cruzou o zero: nada a fazer", () => {
    const m = new Map([["a", it2("a", 2)], ["b", it2("b", 3)]]);
    expect(computeStockSync(m, new Map(m))).toEqual([]);
  });

  it("applyVariantStock só mexe nas variações do Noturno", () => {
    const vs = [
      { id: "a", name: "Azul", inStock: true },
      { id: "manual", name: "Extra", inStock: true },
    ];
    expect(applyVariantStock(vs, { a: false })).toEqual([
      { id: "a", name: "Azul", inStock: false },
      { id: "manual", name: "Extra", inStock: true },
    ]);
  });

  it("groupStock ignora cor apagada do produto que ainda está na fila", () => {
    // "b" foi apagada à mão no admin, mas o item dela segue publicado e com
    // estoque: não pode manter o produto à venda (#253).
    const vs = [{ id: "a", name: "Azul", inStock: true }];
    expect(groupStock(vs, { inStock: true, variants: { a: false, b: true } })).toEqual({
      inStock: false,
      variants: [{ id: "a", name: "Azul", inStock: false }],
    });
  });

  it("groupStock conta variação manual e trata inStock ausente como disponível", () => {
    const vs = [
      { id: "a", name: "Azul", inStock: true },
      { id: "manual", name: "Extra" } as { id: string; name: string; inStock: boolean },
    ];
    expect(groupStock(vs, { inStock: false, variants: { a: false } }).inStock).toBe(true);
  });

  it("groupStock sem variações gravadas usa o cálculo da fila", () => {
    expect(groupStock(undefined, { inStock: true, variants: { a: true } })).toEqual({
      inStock: true,
      variants: [],
    });
  });
});
