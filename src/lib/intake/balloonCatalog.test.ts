import { describe, it, expect } from "vitest";
import type { BalloonConfig } from "@/types/balloon";
import { isSoldOut, matchBalloon, surveyCatalog, withAddedColors } from "./balloonCatalog";

// Recorte do catálogo real do staging (settings/balloons).
const config: BalloonConfig = {
  allColors: [],
  types: [
    {
      id: "simples",
      name: "Balão Simples (Liso)",
      sizes: [{ size: "7", price: 10, unitsPerPackage: 50 }, { size: "9", price: 16, unitsPerPackage: 50 }, { size: "16", price: 20, unitsPerPackage: 20 }],
      colors: ["Verde Folha", "Preto", "Rosa Choque", "Rosa Tutti Frutti", "Branco"],
    },
    {
      id: "candy",
      name: "Candy Colors",
      sizes: [{ size: "16", price: 20, unitsPerPackage: 10 }],
      colors: ["Rosa Candy", "Azul Candy"],
    },
    {
      id: "metalico",
      name: "Metálico",
      sizes: [{ size: "9", price: 27, unitsPerPackage: 25 }],
      colors: ["Prata", "Dourado", "Rose Gold"],
    },
    {
      id: "foil_numeros",
      name: "Números & Letras (Foil)",
      sizes: [{ size: "40cm", price: 12, unitsPerPackage: 1 }],
      colors: ["Rose Gold", "Prata"],
    },
  ],
};

describe("matchBalloon (nomes reais do Noturno)", () => {
  it("abreviação e palavra quebrada", () => {
    expect(matchBalloon("BALAO 16 LISO RED C/10 VD FOLHA", config)).toMatchObject({ typeId: "simples", size: "16", color: "Verde Folha" });
    expect(matchBalloon("BALAO 16 LISO RED C/10 PR EBAN O", config)?.color).toBe("Preto");
  });
  it("nomes diferentes da mesma cor", () => {
    expect(matchBalloon("BALAO 7 LISO C/50 ROSA SHOCK", config)?.color).toBe("Rosa Choque");
    expect(matchBalloon("BALAO CANUDO C/50 ROS TUTTI FRUTTI", { ...config, types: [{ ...config.types[0], id: "canudo", sizes: [{ size: "260", price: 15, unitsPerPackage: 50 }] }] })?.color).toBe("Rosa Tutti Frutti");
    expect(matchBalloon("BALAO 16 CANDY COLORS C/10 ROSA", config)?.color).toBe("Rosa Candy");
    expect(matchBalloon("BALAO 9 METALLIC BALLOON C/ 25 PRATEADO", config)).toMatchObject({ typeId: "metalico", size: "9", color: "Prata" });
  });
  it("letra/número metalizado: cor sem a letra; ROSE = Rose Gold", () => {
    expect(matchBalloon("BALAO METALIZADO 1640 CM ROSE 2", config)).toMatchObject({ typeId: "foil_numeros", size: "40cm", color: "Rose Gold" });
  });
  it("formato e temático não são do catálogo", () => {
    expect(matchBalloon("BALAO METAL C25 CM CORACAO AZUL CROMO", config)).toBeNull();
    expect(matchBalloon("BALAO LEAO 76X72CM", config)).toBeNull();
    expect(matchBalloon("BALAO BOBO BALL TRANSP 17,3 44CM", config)).toBeNull();
  });
});

describe("surveyCatalog (levantamento)", () => {
  it("soma estoque por tipo/tamanho/cor e aponta cor e tamanho novos", () => {
    const s = surveyCatalog(
      [
        { family: "BALAO", name: "BALAO 9 LISO C/ 50 VERDE FOLHA", stock: 10 },
        { family: "BALAO", name: "BALAO 9 LISO C/50 VERDE FOLHA", stock: 2 },
        { family: "BALAO", name: "BALAO 9 LISO C/ 50 PRETO", stock: 0 },
        { family: "BALAO", name: "BALAO 9 LISO C/50 AZUL PETROLEO", stock: 22 },
        { family: "BALAO", name: "BALAO 11 LISO C/50 PRETO", stock: 5 },
        { family: "BALAO", name: "BALAO LEAO 76X72CM", stock: 3 },
        { family: "BALAO", name: "BALAO 9 LISO C/50 BRANCO", stock: 9, inLatestImport: false },
        { family: "CANETA", name: "CANETA AZUL", stock: 9 },
      ],
      config,
    );
    expect(s.stock).toEqual({ simples: { "9": { "Verde Folha": 12, Preto: 0 } } });
    expect(s.newColors).toEqual([{ typeId: "simples", size: "9", color: "Azul Petroleo", stock: 22, items: 1 }]);
    expect(s.newSizes).toEqual([{ typeId: "simples", size: "11", stock: 5, items: 1 }]);
    expect(s.notCatalog).toBe(1);
  });
});

describe("isSoldOut (montador)", () => {
  const stock = { simples: { "9": { Preto: 0, "Verde Folha": 12 } } };
  it("esconde só o que o Noturno confirma zerado", () => {
    expect(isSoldOut(stock, "simples", "9", "Preto")).toBe(true);
    expect(isSoldOut(stock, "simples", "9", "Verde Folha")).toBe(false);
    expect(isSoldOut(stock, "simples", "9", "Branco")).toBe(false); // sem informação: mostra
    expect(isSoldOut(null, "simples", "9", "Preto")).toBe(false);
  });
});

describe("withAddedColors", () => {
  it("acrescenta só no tipo certo e não repete (ignora acento/caixa)", () => {
    const out = withAddedColors(config.types, [
      { typeId: "simples", color: "Azul Petróleo" },
      { typeId: "simples", color: "preto" },
      { typeId: "candy", color: "Laranja Candy" },
    ]);
    expect(out[0].colors).toEqual([...config.types[0].colors, "Azul Petróleo"]);
    expect(out[1].colors).toEqual(["Rosa Candy", "Azul Candy", "Laranja Candy"]);
    expect(out[2]).toBe(config.types[2]);
  });
});
