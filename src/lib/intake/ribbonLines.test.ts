import { describe, it, expect } from "vitest";
import { buildRibbonProduct, groupRibbonLines, isPlasticRibbon, ribbonLabel, validateLinePrices } from "./ribbonLines";

let n = 0;
const fita = (name: string, stock = 5, status = "pendente", suggestedType = "RIBBON") =>
  ({ id: String(++n), sourceCode: String(n), family: "FITA", name, suggestedType, status, stock }) as {
    id: string;
    sourceCode: string;
    family: string;
    name: string;
    suggestedType: "RIBBON" | "STANDARD_ITEM";
    status: "pendente" | "publicado";
    stock: number;
  };

describe("fitas de plástico por linha (nomes reais do Noturno)", () => {
  it("separa plástico para laço de tecido e adesiva", () => {
    expect(isPlasticRibbon(fita("FITA MAXI FM03D 32MMX100 AMARELO"))).toBe(true);
    expect(isPlasticRibbon(fita("FITA TNT LISA 40MMX50M AZUL ESCURO"))).toBe(false);
    expect(isPlasticRibbon(fita("FITA CETIM 10MM 50M ROSA"))).toBe(false);
    expect(isPlasticRibbon(fita("FITA ADESIVA 38MIC 48X30", 5, "pendente", "STANDARD_ITEM"))).toBe(false);
  });

  it("agrupa por linha × largura × metragem; só pendentes", () => {
    const lines = groupRibbonLines([
      fita("FITA MAXI AMOR SEM FIM 32MMX100M ROSA", 3),
      fita("FITA MAXI FM 03D 32MMX100 PRETO/OURO", 4),
      fita("FITA MAXI FM 100L 16MMX50 AZUL ESCURO", 2),
      fita("FITA MAXI LINE 32MMX100M ROSA BALE", 1, "publicado"),
      fita("FITA PLASTICA 32MMX25M VERMELHA"),
    ]);
    expect(lines.map((l) => [l.label, l.members.length, l.stock])).toEqual([
      ["Maxi 32mm × 100m", 2, 7],
      ["Maxi 16mm × 50m", 1, 2],
      ["Plástica 32mm × 25m", 1, 5],
    ]);
  });

  it("rótulo da cor/estampa sem linha e medidas", () => {
    expect(ribbonLabel("FITA MAXI AMOR SEM FIM 32MMX100M ROSA")).toBe("Amor Sem Fim Rosa");
    expect(ribbonLabel("FITA PLASTICA GLITTER OURO 18MMX25M C/1 UN")).toBe("Glitter Ouro");
    expect(ribbonLabel("FITA MAXI FM 100L 16MMX50 AZUL ESCURO")).toBe("Azul Escuro");
    expect(ribbonLabel("FITA MAXI FM03D 32MMX100 AMARELO")).toBe("Amarelo");
    expect(ribbonLabel("FITA PLASTICA GLITTER AZUL CLARO C/")).toBe("Glitter Azul Claro");
    expect(ribbonLabel("FITA POLIPROP. 02.5 CM X 50.0 MT BN PEROLADO")).toBe("Bn Perolado");
  });

  it("produto RIBBON: rolo fechado cheio, dois preços, montador de laço", () => {
    const p = buildRibbonProduct(
      { sourceCode: "77", stock: 4 },
      { line: "MAXI", widthMm: 32, meters: 100 },
      "Amor Sem Fim Rosa",
      { rollPrice: 18.9, meterPrice: 0.5 },
      "https://img/x.webp",
    );
    expect(p).toMatchObject({
      name: "Fita Maxi 32mm Amor Sem Fim Rosa",
      type: "RIBBON",
      category: "Fitas",
      subcategory: "Fita para laço",
      unit: "m",
      price: 0.5,
      rollPrice: 18.9,
      canBeSoldAsRoll: true,
      isAvailableForCustomBow: true,
      ribbonInventory: { status: "FECHADO", remainingMeters: 100, totalRollMeters: 100 },
      width: 32,
      inStock: true,
      sourceCode: "77",
      imageUrl: "https://img/x.webp",
    });
  });

  it("os dois preços são obrigatórios", () => {
    expect(validateLinePrices({ rollPrice: null, meterPrice: 1 })).toMatch(/rolo/);
    expect(validateLinePrices({ rollPrice: 10, meterPrice: 0 })).toMatch(/metro/);
    expect(validateLinePrices({ rollPrice: 10, meterPrice: 0.4 })).toBeNull();
  });
});
