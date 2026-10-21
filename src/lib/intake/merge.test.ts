import { describe, it, expect } from "vitest";
import { mergeIntake, isTruncationOf } from "./merge";
import { analyzeNoturnoRows, type NoturnoRow } from "./noturno";
import type { IntakeItem } from "@/types/intake";

const src = (o: Partial<NoturnoRow>) =>
  analyzeNoturnoRows([
    { code: "1", ref: null, description: "CANECA BRANCA 300ML", brand: "X", stock: 5, unitCost: 2, ...o },
  ])[0];

const stored = (o: Partial<NoturnoRow>, extra: Partial<IntakeItem> = {}): IntakeItem => ({
  ...src(o),
  id: o.code ?? "1",
  status: "pendente",
  inLatestImport: true,
  ...extra,
});

describe("mergeIntake", () => {
  it("item novo entra como pendente", () => {
    const r = mergeIntake(new Map(), [src({})]);
    expect(r.created).toBe(1);
    expect(r.writes[0]).toMatchObject({ id: "1", isNew: true, data: { status: "pendente", inLatestImport: true } });
  });

  it("item igual não gera escrita", () => {
    const r = mergeIntake(new Map([["1", stored({})]]), [src({})]);
    expect(r.unchanged).toBe(1);
    expect(r.writes).toEqual([]);
  });

  it("só escreve os campos que mudaram e preserva o trabalho da atendente", () => {
    const prev = stored({}, { status: "publicado", productId: "p9" });
    const r = mergeIntake(new Map([["1", prev]]), [src({ stock: 3 })]);
    expect(r.updated).toBe(1);
    const data = r.writes[0].data;
    expect(data.stock).toBe(3);
    expect(data).not.toHaveProperty("status");
    expect(data).not.toHaveProperty("productId");
    expect(data).not.toHaveProperty("name");
  });

  it("nome cortado do PDF não sobrescreve o nome completo do Excel", () => {
    const full = "PONTA GRAFITE 0,7MM 12UN PCT C/12 TUBOS PRETO";
    const cut = "PONTA GRAFITE 0,7MM 12UN PCT C/12 TUBOS PRE";
    const r = mergeIntake(new Map([["1", stored({ description: full })]]), [src({ description: cut, stock: 9 })]);
    expect(r.writes[0].data.stock).toBe(9);
    expect(r.writes[0].data).not.toHaveProperty("name");
    expect(r.writes[0].data).not.toHaveProperty("searchText");
  });

  it("item que saiu do Noturno é marcado uma vez, sem apagar", () => {
    const existing = new Map([["1", stored({})], ["2", stored({ code: "2" })]]);
    const r = mergeIntake(existing, [src({})]);
    expect(r.missing).toBe(1);
    expect(r.writes).toContainEqual({ id: "2", isNew: false, data: { inLatestImport: false } });

    const again = mergeIntake(
      new Map([["1", stored({})], ["2", stored({ code: "2" }, { inLatestImport: false })]]),
      [src({})]
    );
    expect(again.missing).toBe(0);
  });

  it("item que volta ao Noturno é reativado", () => {
    const r = mergeIntake(new Map([["1", stored({}, { inLatestImport: false })]]), [src({})]);
    expect(r.writes[0].data).toEqual({ inLatestImport: true });
  });

  it("código repetido no arquivo conta uma vez só", () => {
    const r = mergeIntake(new Map(), [src({}), src({})]);
    expect(r.created).toBe(1);
  });
});

describe("isTruncationOf", () => {
  it("detecta prefixo estrito", () => {
    expect(isTruncationOf("ABC", "ABCD")).toBe(true);
    expect(isTruncationOf("ABCD", "ABCD")).toBe(false);
    expect(isTruncationOf("ABX", "ABCD")).toBe(false);
  });
});
