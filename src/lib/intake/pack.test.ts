import { describe, it, expect } from "vitest";
import { detectPack, isPackHint, pricePerUnit } from "./pack";

describe("detectPack", () => {
  it.each([
    ["SACO TRANSP. 10X14 POA VERMELHO PT C/100", 100, "PT C/100"],
    ["BALAO 9 LISO C/ 50 ROXO UVA", 50, "C/ 50"],
    ["SACO P/PRESENTE N6 25X37 50UN TRANSPARENTE", 50, "50UN"],
    ["LACO FACIL G (32MMX47CM) LUXO VERMELHO C/5 REF.5245", 5, "C/5"],
    ["LACO F. G-RS E F. DUPLO DOUR. C/10", 10, "C/10"],
    ["FITILHO 5MMX50M PTO PCT C/10 RLS", 10, "PCT C/10 RLS"],
    ["CAIXA KIT BELLA FLORA C/APLIQUE 20CMX12CMX10CM 1PC ROSE", 1, "1PC"],
    ["POLI FLOW 49CMX69CM 50FLS VERMELHO/OURO", 50, "50FLS"],
  ])("%s → %i", (name, qty, evidence) => {
    expect(detectPack(name)).toEqual({ qty, evidence });
  });

  it("não confunde medida com quantidade", () => {
    expect(detectPack("FITA CETIM 22MM VERMELHA")).toBeNull();
    expect(detectPack("CANECA PORC. 300 ML TULIPA SORT")).toBeNull();
    expect(detectPack("SACOLA C/ VISOR LOVE")).toBeNull();
  });
});

describe("isPackHint", () => {
  it("só mais de 1 unidade sugere pacote", () => {
    expect(isPackHint({ qty: 50, evidence: "C/50" })).toBe(true);
    expect(isPackHint({ qty: 1, evidence: "1PC" })).toBe(false);
    expect(isPackHint(null)).toBe(false);
  });
});

describe("pricePerUnit", () => {
  it("divide o preço do pacote pela quantidade", () => {
    expect(pricePerUnit(18, 100)).toBe(0.18);
    expect(pricePerUnit(10, 3)).toBe(3.33);
  });
  it("sem pacote de verdade não calcula", () => {
    expect(pricePerUnit(18, 1)).toBeNull();
    expect(pricePerUnit(0, 50)).toBeNull();
  });
});
