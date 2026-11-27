import { describe, it, expect } from "vitest";
import { parseBalloon } from "./balloons";

describe("parseBalloon (nomes reais do Noturno)", () => {
  it("letra e número metalizados", () => {
    expect(parseBalloon("BALAO METALIZADO 16 40CM VERMELHO V")).toMatchObject({
      shape: "letra",
      glyph: "V",
      colorName: "Vermelho",
      metallic: true,
      sizeLabel: "40 cm",
    });
    expect(parseBalloon("BALAO METALIZADO 1640 CM ROSE 2")).toMatchObject({
      shape: "numero",
      glyph: "2",
      colorName: "Rose gold",
      sizeLabel: "40 cm",
    });
    expect(parseBalloon("BALAO METALIZADO 40 100CM ARCO IRIS L")).toMatchObject({
      shape: "letra",
      glyph: "L",
      colorName: "Arco-íris",
      sizeLabel: "100 cm",
    });
  });

  it("número foil no formato 'N.x' (#364)", () => {
    expect(parseBalloon("BALAO METAL C70-75 CM N.0 PRATA")).toMatchObject({
      shape: "numero",
      glyph: "0",
      metallic: true,
      sizeLabel: "75 cm",
    });
  });

  it("látex em pacote", () => {
    expect(parseBalloon("BALAO 9 LISO C/ 50 AZUL BABY")).toMatchObject({
      shape: "latex",
      colorName: "Azul bebê",
      packQty: 50,
      sizeLabel: '9"',
    });
    expect(parseBalloon("BALAO 5 NEON C/ 25 ROSA")).toMatchObject({ shape: "latex", packQty: 25 });
  });

  it("coração, estrela e redondo", () => {
    expect(parseBalloon("BALAO METAL C25 CM CORACAO AZUL CROMO")).toMatchObject({
      shape: "coracao",
      colorName: "Azul",
      metallic: true,
    });
    expect(parseBalloon("BALAO METAL C12 CM ESTRELA ROSE GOLD")?.shape).toBe("estrela");
    expect(parseBalloon("BALAO METAL C45 CM REDONDO PARABENS DOURADO")).toMatchObject({
      shape: "redondo",
      colorName: "Dourado",
    });
  });

  it("cor fora da tabela: sem arte (nunca uma cor errada)", () => {
    expect(parseBalloon("BALAO METALIZADO 16 40CM TURQUESA ESCURO A")).toBeNull();
    expect(parseBalloon("BALAO METALIZADO 16 40CM CHAMPAGNE A")).toMatchObject({ colorName: "Champagne", glyph: "A" });
  });

  it("temático não tem arte (precisa de foto)", () => {
    expect(parseBalloon("BALAO LEAO 76X72CM")).toBeNull();
    expect(parseBalloon("BALAO 45 CM REVELACAO GIRL OR BOY")).toBeNull();
    expect(parseBalloon("CANETA AZUL")).toBeNull();
  });
});

describe("foil com o número no meio do nome (#287, revisão do #438)", () => {
  it("preto vira arte de número preto", () => {
    const p = parseBalloon("BALAO METALIZADO 16 40CM 3 PRETO");
    expect(p).toMatchObject({ shape: "numero", glyph: "3", metallic: true });
    expect(p?.colors).toHaveLength(1);
  });
  it("candy fica sem arte (vai com foto), em vez de um número multicolorido", () => {
    expect(parseBalloon("BALAO METALIZADO 16 40CM 0 AZUL TURQUESA CANDY")).toBeNull();
    expect(parseBalloon("BALAO METALIZADO 16 40CM 9 ROSA BEBE CANDY")).toBeNull();
  });
});
