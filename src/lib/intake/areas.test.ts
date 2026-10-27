import { describe, it, expect } from "vitest";
import {
  activeClaim,
  areaForItem,
  areaProgress,
  areasForFamily,
  CLAIM_TTL_MS,
  firstName,
  isAssignableFamily,
  isClosedRoll,
  nextArea,
  NO_AREA,
  STORE_AREAS,
} from "./areas";

const item = (family: string | null, name = "X", suggestedType = "STANDARD_ITEM") =>
  ({ family, name, suggestedType }) as Parameters<typeof areaForItem>[0];

describe("areaForItem", () => {
  it("famílias do levantamento caem na área certa", () => {
    expect(areaForItem(item("CAIXA"))).toBe(4);
    expect(areaForItem(item("CACHEPOT"))).toBe(4);
    expect(areaForItem(item("SACO"))).toBe(9);
    expect(areaForItem(item("LACO"))).toBe(9);
    expect(areaForItem(item("BALAO"))).toBe(8);
    expect(areaForItem(item("CANECA"))).toBe(12);
    expect(areaForItem(item("ZIPER"))).toBe(2);
    expect(areaForItem(item("BARBANTE"))).toBe(14);
  });

  it("família ambígua fica sem área; escolha manual vale para a família", () => {
    expect(areaForItem(item("KIT"))).toBe(NO_AREA);
    expect(areaForItem(item(null))).toBe(NO_AREA);
    expect(areaForItem(item("KIT"), { KIT: 4 })).toBe(4);
  });

  it("fita: fechada × em uso pela metragem; adesiva vai para papelaria", () => {
    expect(areaForItem(item("FITA", "FITA MAXI FM03D 32MMX100 AMARELO", "RIBBON"))).toBe(10);
    expect(areaForItem(item("FITA", "FITA CETIM 10MM 50M ROSA", "RIBBON"))).toBe(10);
    expect(areaForItem(item("FITA", "FITA CETIM 22MM 37M VERMELHA", "RIBBON"))).toBe(6);
    expect(areaForItem(item("FITA", "FITA ADESIVA 38MIC 48X30"))).toBe(5);
  });
});

describe("isClosedRoll", () => {
  it("redonda = fechada; quebrada = em uso; sem metragem = fechada", () => {
    expect(isClosedRoll("FITA LINE 32MMX100M ROSA")).toBe(true);
    expect(isClosedRoll("FITA 25M")).toBe(true);
    expect(isClosedRoll("FITA 12,5M")).toBe(false);
    expect(isClosedRoll("FITA 43M")).toBe(false);
    expect(isClosedRoll("FITA PARA ARCO DE BALAO")).toBe(true);
  });
});

describe("areasForFamily / isAssignableFamily", () => {
  it("FITA aparece em três áreas e não pode ser movida à mão", () => {
    expect(areasForFamily("FITA")).toEqual([5, 6, 10]);
    expect(isAssignableFamily("FITA")).toBe(false);
    expect(isAssignableFamily("CAIXA")).toBe(false);
    expect(isAssignableFamily("KIT")).toBe(true);
    expect(isAssignableFamily("(sem família)")).toBe(false);
  });
});

describe("areaProgress", () => {
  it("soma por área a partir do resumo por família", () => {
    const p = areaProgress(
      {
        CAIXA: { total: 100, pending: 40 },
        CESTA: { total: 50, pending: 50 },
        FITA: { total: 300, pending: 200 },
        KIT: { total: 10, pending: 10 },
      },
      {},
    );
    expect(p[4]).toEqual({ total: 150, pending: 90, families: ["CESTA", "CAIXA"] });
    expect(p[10].pending).toBe(200);
    expect(p[6]).toMatchObject({ pending: 0, families: ["FITA"] });
    expect(p[NO_AREA].families).toEqual(["KIT"]);
    expect(areaProgress({ KIT: { total: 10, pending: 3 } }, { KIT: 4 })[4].pending).toBe(3);
  });

  it("FITA é contada em cada área pela divisão do resumo", () => {
    const fams = { FITA: { total: 300, pending: 200 } };
    const p = areaProgress(fams, {}, {
      "5": { total: 20, pending: 5 },
      "6": { total: 30, pending: 30 },
      "10": { total: 250, pending: 165 },
    });
    expect([p[5].pending, p[6].pending, p[10].pending]).toEqual([5, 30, 165]);
    expect(p[6].families).toEqual(["FITA"]);
  });

  it("resumo antigo (só incrementos, sem total) cai na conta antiga", () => {
    const p = areaProgress({ FITA: { total: 300, pending: 200 } }, {}, { "6": { pending: -1 } });
    expect(p[10].pending).toBe(200);
    expect(p[6].pending).toBe(0);
  });
});

describe("claims e próxima área", () => {
  const now = 1_000_000_000;
  it("posse expira depois do prazo", () => {
    const c = { email: "a@x", name: "Ana", at: now - CLAIM_TTL_MS - 1 };
    expect(activeClaim(c, now)).toBeNull();
    expect(activeClaim({ ...c, at: now }, now)).not.toBeNull();
  });

  it("pula área sem pendência e área com outra pessoa", () => {
    const progress = {
      4: { total: 1, pending: 1, families: [] },
      5: { total: 1, pending: 0, families: [] },
      6: { total: 1, pending: 2, families: [] },
      8: { total: 1, pending: 5, families: [] },
    };
    const claims = { "6": { email: "bia@x", name: "Bia", at: now } };
    expect(nextArea(4, progress, claims, "ana@x", now)).toBe(8);
    expect(nextArea(4, progress, claims, "bia@x", now)).toBe(6);
    expect(nextArea(8, progress, claims, "ana@x", now)).toBe(4);
  });
});

it("áreas numeradas de 1 a 16 e nomes curtos", () => {
  expect(STORE_AREAS.map((a) => a.id)).toEqual([...Array(16)].map((_, i) => i + 1));
  expect(areaForItem(item("CARREGADOR"))).toBe(16);
  expect(areaForItem(item("FONE"))).toBe(16);
  expect(firstName("maria.silva@gmail.com")).toBe("Maria");
});
