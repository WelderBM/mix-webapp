import { describe, it, expect } from "vitest";
import { buildRibbonProduct, groupRibbonLines, ribbonModel, isPlasticRibbon, ribbonLabel, splitBowRibbons, validateLinePrices } from "./ribbonLines";

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
    // Não são fita de laço da loja (#317).
    expect(isPlasticRibbon(fita("FITA POLIPROP. 02.5 CM X 50.0 MT BN PEROLADO"))).toBe(false);
    expect(isPlasticRibbon(fita("FITA LISA FIDEPLA DECORATIVA 15MMX30M VEDE ESC."))).toBe(false);
    expect(isPlasticRibbon(fita("FITA MASTER 16MMX50M LISA PRATA"))).toBe(true);
    expect(isPlasticRibbon(fita("FITA ECOPACK 10 36X50 MARROM"))).toBe(false);
    expect(isPlasticRibbon(fita("FITA CETIM 10MM 50M ROSA"))).toBe(false);
    expect(isPlasticRibbon(fita("FITA ADESIVA 38MIC 48X30", 5, "pendente", "STANDARD_ITEM"))).toBe(false);
  });

  it("fila: fita de laço pendente sai da lista comum; o resto fica", () => {
    const laco = fita("FITA MAXI FM03D 32MMX100 AMARELO");
    const feita = fita("FITA MAXI FM03D 32MMX100 AZUL", 5, "publicado");
    const tecido = fita("FITA CETIM 10MM 50M ROSA");
    const { queue, bow } = splitBowRibbons([laco, feita, tecido]);
    expect(bow).toEqual([laco]);
    expect(queue).toEqual([feita, tecido]);
  });

  it("fita de laço sem metragem fica na fila comum (não some das duas telas)", () => {
    const semMetro = fita("FITA PLASTICA GLITTER AZUL CLARO C/");
    const { queue, bow } = splitBowRibbons([semMetro]);
    expect(bow).toEqual([]);
    expect(queue).toEqual([semMetro]);
    expect(groupRibbonLines([semMetro])).toEqual([]);
  });

  it("agrupa por linha × largura × metragem: mesma medida, mesmo preço (dono, 27/10); só pendentes", () => {
    const lines = groupRibbonLines([
      fita("FITA MAXI FM 03D 32MMX100 PRETO/OURO", 4),
      fita("FITA MAXI FM03D 32MMX100 AMARELO", 3),
      fita("FITA MAXI LISO 32MMX100M ROSA", 2),
      fita("FITA MAXI FM 100L 16MMX50 AZUL ESCURO", 2),
      fita("FITA MAXI LINE 32MMX100M ROSA BALE", 1, "publicado"),
      fita("FITA PLASTICA 32MMX25M VERMELHA"),
    ]);
    expect(lines.map((l) => [l.label, l.members.length, l.stock])).toEqual([
      ["Maxi 32mm × 100m", 3, 9],
      ["Maxi 16mm × 50m", 1, 2],
      ["Plástica 32mm × 25m", 1, 5],
    ]);
    // O modelo continua no nome de cada cor.
    expect(lines[0].members.map((m) => m.label)).toEqual(["FM 03D Amarelo", "FM 03D Preto/ouro", "Rosa"]);
  });

  it("modelo do fabricante vai no nome da cor (a estampa continua identificável)", () => {
    expect(ribbonModel("FITA MAXI MODERN LOVE 32MMX100M ROSE/OURO")).toBe("Modern Love");
    expect(ribbonModel("FITA MAXI PAPER LOOK 32MMX100M AMEIXA")).toBe("Paperlook");
    expect(ribbonModel("FITA MAXI PAPERLOOK 32MMX100M ROSA PETALA")).toBe("Paperlook");
    expect(ribbonModel("FITA MAXI LISA 32MMX100M VERMELHO")).toBe("Lisa");
    expect(ribbonModel("FITA MASTER DECORADA FIORI BORGONHA 32MMX100M")).toBe("Decorada");
    expect(ribbonModel("FITA MASTER LISA PRATA 16MMX50M")).toBe("Lisa");
    expect(ribbonModel("FITA PLASTICA 32MMX100M XINGO FLORAL LARANJA", "XINGO")).toBe("Floral");
    expect(ribbonModel("FITA PLASTICA GLITTER OURO 18MMX25M C/1 UN")).toBe("Glitter");
    expect(ribbonModel("FITA PLASTICA VERMELHO 32MMX25M C/1 UN")).toBe("Lisa");
    expect(ribbonModel("FITA MAXI MODERN LOVE 32MM X 100M ROSE")).toBe("Modern Love");

    // Estampada sem cor no nome: a cor fica vazia, não "Lisa" (revisão do #380).
    const [urso] = groupRibbonLines([fita("FITA MAXI PAPERLOOK URSO NATAL 32MMX100M")]);
    expect(urso.members[0].label).toBe("Paperlook Urso Natal");
    expect(buildRibbonProduct({ sourceCode: "1", stock: 1 }, urso, urso.members[0].label, { rollPrice: 10, meterPrice: 1 }, null).name).toBe(
      "Fita Maxi 32mm Paperlook Urso Natal",
    );

    const lines = groupRibbonLines([
      { ...fita("FITA MAXI PAPER LOOK 32MMX100M AMEIXA"), brand: "ALBANO" },
      { ...fita("FITA MAXI PAPERLOOK 32MMX100M ROSA PETALA"), brand: "ALBANO" },
      { ...fita("FITA PLASTICA 32MMX100M XINGO FLORAL LARANJA"), brand: "XINGO" },
      { ...fita("FITA PLASTICA 32MMX100M XINGO LISTRADA LARANJA"), brand: "XINGO" },
    ]);
    expect(lines.map((l) => [l.label, l.members.map((m) => m.label)])).toEqual([
      ["Maxi 32mm × 100m", ["Paperlook Ameixa", "Paperlook Rosa Petala"]],
      // Fora da Albano, a marca entra no nome (como no carrinho do relatório).
      ["Plástica 32mm × 100m", ["Xingo Floral Laranja", "Xingo Listrada Laranja"]],
    ]);
  });

  it("nome repetido na mesma medida ganha o código do Noturno", () => {
    const [l] = groupRibbonLines([fita("FITA MAXI MODERN LOVE 32MMX100M ROSE/OURO"), fita("FITA MAXI MODERN LOVE 32MMX100M ROSE/OURO")]);
    expect(l.members.map((m) => m.label)).toEqual([
      `Modern Love Rose/ouro (cód. ${l.members[0].item.sourceCode})`,
      `Modern Love Rose/ouro (cód. ${l.members[1].item.sourceCode})`,
    ]);
  });

  it("rótulo da cor/estampa sem linha e medidas", () => {
    expect(ribbonLabel("FITA MAXI AMOR SEM FIM 32MMX100M ROSA")).toBe("Amor Sem Fim Rosa");
    expect(ribbonLabel("FITA PLASTICA GLITTER OURO 18MMX25M C/1 UN")).toBe("Glitter Ouro");
    expect(ribbonLabel("FITA MAXI FM 100L 16MMX50 AZUL ESCURO")).toBe("Azul Escuro");
    expect(ribbonLabel("FITA MAXI FM03D 32MMX100 AMARELO")).toBe("Amarelo");
    expect(ribbonLabel("FITA PLASTICA GLITTER AZUL CLARO C/")).toBe("Glitter Azul Claro");
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
