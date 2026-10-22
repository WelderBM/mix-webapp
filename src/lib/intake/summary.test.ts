import { describe, it, expect } from "vitest";
import { applyWrites, buildIntakeSummary, coreProgress, sortedFamilies, NO_FAMILY } from "./summary";
import type { IntakeItem } from "@/types/intake";

const item = (o: Partial<IntakeItem>): IntakeItem =>
  ({ id: "1", family: "FITA", status: "pendente", isCoreFamily: true, inLatestImport: true, ...o }) as IntakeItem;

describe("buildIntakeSummary", () => {
  it("conta por família e status, ignorando o que saiu do Noturno", () => {
    const s = buildIntakeSummary([
      item({ id: "1" }),
      item({ id: "2", status: "publicado" }),
      item({ id: "3", family: "CANETA", isCoreFamily: false }),
      item({ id: "4", inLatestImport: false }),
      item({ id: "5", family: null }),
    ]);
    expect(s.totalItems).toBe(4);
    expect(s.byStatus).toEqual({ pendente: 3, publicado: 1, pulado: 0, fora_da_loja: 0, catalogo: 0 });
    expect(s.families.FITA).toEqual({ total: 2, pending: 1, isCore: true });
    expect(s.families.CANETA).toEqual({ total: 1, pending: 1, isCore: false });
    expect(s.families[NO_FAMILY].total).toBe(1);
  });
});

describe("FITA por área (#231)", () => {
  it("divide a fita em adesiva (5), em uso (6) e fechada (10)", () => {
    const s = buildIntakeSummary([
      item({ id: "a", name: "FITA MAXI 32MMX100M", suggestedType: "RIBBON" }),
      item({ id: "b", name: "FITA CETIM 37M", suggestedType: "RIBBON" }),
      item({ id: "c", name: "FITA ADESIVA 48X50", suggestedType: "STANDARD_ITEM", status: "pulado" }),
      item({ id: "d", family: "CANETA", name: "CANETA" }),
    ]);
    expect(s.ribbonAreas).toEqual({
      "10": { total: 1, pending: 1 },
      "6": { total: 1, pending: 1 },
      "5": { total: 1, pending: 0 },
    });
  });
});

describe("applyWrites", () => {
  it("aplica criação e atualização parcial sem mutar o mapa original", () => {
    const existing = new Map([["1", item({ id: "1", status: "publicado" })]]);
    const next = applyWrites(existing, [
      { id: "1", isNew: false, data: { stock: 3 } as Partial<IntakeItem> },
      { id: "2", isNew: true, data: item({ id: "2" }) },
    ]);
    expect(next.get("1")).toMatchObject({ status: "publicado", stock: 3 });
    expect(next.get("2")?.status).toBe("pendente");
    expect(existing.has("2")).toBe(false);
  });
});

describe("sortedFamilies", () => {
  it("núcleo primeiro, depois mais pendentes", () => {
    const s = buildIntakeSummary([
      item({ id: "1", family: "CANETA", isCoreFamily: false }),
      item({ id: "2", family: "CANETA", isCoreFamily: false }),
      item({ id: "3", family: "BALAO" }),
      item({ id: "4", family: "FITA" }),
      item({ id: "5", family: "FITA" }),
    ]);
    expect(sortedFamilies(s).map(([f]) => f)).toEqual(["FITA", "BALAO", "CANETA"]);
  });
});

describe("placar", () => {
  it("soma o valor em estoque publicado e conta por atendente", () => {
    const s = buildIntakeSummary([
      item({ id: "1", status: "publicado", stock: 10, unitCost: 2, publishedBy: "ana@loja" }),
      item({ id: "2", status: "publicado", stock: 5, unitCost: 4, publishedBy: "ana@loja" }),
      item({ id: "3", status: "publicado", stock: 1, unitCost: 1, publishedBy: "bia@loja" }),
      item({ id: "4", status: "pendente", stock: 100, unitCost: 100 }),
    ]);
    expect(s.publishedStockValue).toBe(41);
    expect(s.publishedBy).toEqual({ "ana@loja": 2, "bia@loja": 1 });
  });

  it("progresso da revenda conta triados (não-pendentes) só nas famílias de revenda", () => {
    const s = buildIntakeSummary([
      item({ id: "1", status: "publicado" }),
      item({ id: "2", status: "pulado" }),
      item({ id: "3" }),
      item({ id: "4", family: "CANETA", isCoreFamily: false, status: "publicado" }),
    ]);
    expect(coreProgress(s)).toEqual({ done: 2, total: 3 });
  });
});
