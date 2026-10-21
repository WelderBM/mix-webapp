import { describe, it, expect } from "vitest";
import { computeStockSync, isIgnorableSyncError } from "./stockSync";
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
