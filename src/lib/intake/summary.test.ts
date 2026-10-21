import { describe, it, expect } from "vitest";
import { applyWrites, buildIntakeSummary, sortedFamilies, NO_FAMILY } from "./summary";
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
    expect(s.byStatus).toEqual({ pendente: 3, publicado: 1, pulado: 0, fora_da_loja: 0 });
    expect(s.families.FITA).toEqual({ total: 2, pending: 1, isCore: true });
    expect(s.families.CANETA).toEqual({ total: 1, pending: 1, isCore: false });
    expect(s.families[NO_FAMILY].total).toBe(1);
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
