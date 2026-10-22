import { describe, it, expect } from "vitest";
import { buildGroups, groupKeyFor, splitVariantName } from "./groups";

const it_ = (sourceCode: string, name: string, family = "ZIPER", suggestedType = "STANDARD_ITEM") =>
  ({ sourceCode, name, family, suggestedType }) as {
    sourceCode: string;
    name: string;
    family: string;
    suggestedType: "STANDARD_ITEM" | "RIBBON";
  };

describe("splitVariantName (nomes reais do Noturno)", () => {
  it("cor simples, composta e código de cor", () => {
    expect(splitVariantName("ZIPER NYLON 15CM COR 540 VERDE")).toEqual({
      base: "ZIPER NYLON 15CM",
      label: "Verde cor 540",
    });
    expect(splitVariantName("PAPEL CARTAO AZUL ROYAL")).toEqual({ base: "PAPEL CARTAO", label: "Azul royal" });
    expect(splitVariantName("BALAO 9 LISO C/50 ROXO UVA")).toEqual({ base: "BALAO 9 LISO C/50", label: "Roxo uva" });
    expect(splitVariantName("MEIA ABS COL 6MM - PEROLA COR 100").base).toBe("MEIA ABS COL 6MM");
  });

  it("sem cor no nome: sem rótulo", () => {
    expect(splitVariantName("CANETA BIC CRISTAL")).toEqual({ base: "CANETA BIC CRISTAL", label: null });
  });

  it("não confunde palavra que contém cor (ROSADO, PRETOS…)", () => {
    expect(splitVariantName("BLUSH ROSADO MATTE").label).toBeNull();
  });
});

describe("groupKeyFor", () => {
  it("fita de laço não agrupa (preço/estoque por rolo)", () => {
    expect(groupKeyFor(it_("1", "FITA CETIM N5 VERMELHA", "FITA", "RIBBON"))).toBeNull();
  });
  it("mesma base em famílias diferentes não junta", () => {
    expect(groupKeyFor(it_("1", "KIT AZUL", "KIT"))).not.toBe(groupKeyFor(it_("2", "KIT AZUL", "CAIXA")));
  });
});

describe("buildGroups", () => {
  it("junta as cores da mesma base; item sozinho continua solto", () => {
    const { groups, singles } = buildGroups([
      it_("10", "ZIPER NYLON 15CM COR 540 VERDE"),
      it_("11", "ZIPER NYLON 15CM COR 501 BRANCO"),
      it_("12", "ZIPER NYLON 15CM COR 312 PINK"),
      it_("20", "ZIPER METAL 18CM COR 189 NUDE"),
      it_("30", "ZIPER INVISIVEL 30CM"),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].base).toBe("Ziper nylon 15cm");
    expect(groups[0].members.map((m) => m.label)).toEqual(["Branco cor 501", "Pink cor 312", "Verde cor 540"]);
    expect(singles.map((s) => s.sourceCode).sort()).toEqual(["20", "30"]);
  });

  it("rótulo repetido (cadastro duplicado) ganha o código", () => {
    const { groups } = buildGroups([
      it_("1", "AGULHA CROCHE COLORIDO COR 300", "AGULHA"),
      it_("2", "AGULHA CROCHE COLORIDO COR 300", "AGULHA"),
      it_("3", "AGULHA CROCHE COLORIDO COR 200", "AGULHA"),
    ]);
    expect(groups[0].members.map((m) => m.label)).toEqual([
      "Colorido cor 200",
      "Colorido cor 300 (cód. 1)",
      "Colorido cor 300 (cód. 2)",
    ]);
  });
});
