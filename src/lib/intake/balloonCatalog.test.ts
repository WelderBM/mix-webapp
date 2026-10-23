import { describe, it, expect } from "vitest";
import type { BalloonConfig } from "@/types/balloon";
import {
  applyCatalogProposal,
  homeBrands,
  isSoldOut,
  matchBalloon,
  proposeCatalog,
  surveyCatalog,
  withAddedColors,
} from "./balloonCatalog";

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
    // Palavra quebrada casa com o nome completo; nunca com o "parecido".
    const ebano = { ...config, types: [{ ...config.types[0], colors: ["Preto Ébano"] }, ...config.types.slice(1)] };
    expect(matchBalloon("BALAO 16 LISO RED C/10 PR EBAN O", ebano)?.color).toBe("Preto Ébano");
    expect(matchBalloon("BALAO 16 LISO RED C/10 PR EBAN O", config)).toMatchObject({ color: null, rawColor: "Preto Ebano" });
  });
  it("nomes diferentes da mesma cor", () => {
    expect(matchBalloon("BALAO 7 LISO C/50 ROSA SHOCK", config)?.color).toBe("Rosa Choque");
    expect(matchBalloon("BALAO CANUDO C/50 ROS TUTTI FRUTTI", { ...config, types: [{ ...config.types[0], id: "canudo", sizes: [{ size: "260", price: 15, unitsPerPackage: 50 }] }] })?.color).toBe("Rosa Tutti Frutti");
    expect(matchBalloon("BALAO 16 CANDY COLORS C/10 ROSA", config)?.color).toBe("Rosa Candy");
    expect(matchBalloon("BALAO 9 METALLIC BALLOON C/ 25 PRATEADO", config)).toMatchObject({ typeId: "metalico", size: "9", color: "Prata" });
  });
  it("cor parecida NÃO junta: Roxo Uva e Roxo Ametista não viram Roxo (teste do dono, 23/10)", () => {
    const roxo = { ...config, types: [{ ...config.types[0], sizes: [{ size: "9", price: 16, unitsPerPackage: 50 }], colors: ["Roxo", "Pink", "Amarelo"] }, ...config.types.slice(1)] };
    for (const [name, raw] of [["BALAO 9 LISO C/ 50 ROXO UVA", "Roxo Uva"], ["BALAO 9 LISO C/ 50 ROXO AMETISTA", "Roxo Ametista"], ["BALAO 9 LISO C/50 NEW PINK", "New Pink"], ["BALAO 9 LISO C/50 AMARELO OCRE", "Amarelo Ocre"]]) {
      expect(matchBalloon(name, roxo), name).toMatchObject({ color: null, rawColor: raw });
    }
    // Marca não é cor: "AMARELO ART LATEX" é Amarelo.
    expect(matchBalloon("BALAO 9 LISO C/50 AMARELO ART LATEX", roxo)?.color).toBe("Amarelo");
    expect(matchBalloon("BALAO 6,5 LISO BASIC VERMELHO C/50UND", roxo)?.rawColor).toBe("Vermelho");
  });
  it("temático, coração de látex e gigante não são do catálogo", () => {
    for (const n of ["BALAO 9 TEMA BOLINHA C/25 VERMELHO/BRANCO", "BALAO CORACAO 11 LISO P/UNID VERMELHO QUENTE", "BALAO GIGANTE LISO BRANCO", "BALAO FELIZ ANIVERSARIO N 10 C/50 UND.", "BALAO 9 FLAMINGO C/25 SORTIDO"]) {
      expect(matchBalloon(n, config), n).toBeNull();
    }
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
    // Cor que o catálogo ainda não tem também entra no estoque.
    expect(s.stock).toEqual({ simples: { "9": { "Verde Folha": 12, Preto: 0, "Azul Petroleo": 22 } } });
    expect(s.newColors).toEqual([{ typeId: "simples", size: "9", color: "Azul Petroleo", stock: 22, items: 1 }]);
    expect(s.newSizes).toEqual([{ typeId: "simples", size: "11", stock: 5, items: 1 }]);
    expect(s.notCatalog).toBe(1);
  });
});

describe("isSoldOut (montador)", () => {
  const stock = { simples: { "9": { Preto: 0, "Verde Folha": 12 } } };
  it("cor só aparece no tamanho em que o Noturno tem unidade (pedido do dono, 23/10)", () => {
    expect(isSoldOut(stock, "simples", "9", "Preto")).toBe(true);
    expect(isSoldOut(stock, "simples", "9", "Verde Folha")).toBe(false);
    expect(isSoldOut(stock, "simples", "9", "Branco")).toBe(true); // Noturno não tem no 9"
    expect(isSoldOut(stock, "simples", "7", "Verde Folha")).toBe(true); // nada no 7"
  });
  it("sem estoque do tipo (cadastro manual ou não importado): mostra", () => {
    expect(isSoldOut(null, "simples", "9", "Preto")).toBe(false);
    expect(isSoldOut(stock, "candy", "9", "Rosa Candy")).toBe(false);
  });
  it("compara o nome sem acento, espaço nem tom (#hex)", () => {
    const st = { simples: { "9": { "Branco Polar": 4, "Preto Ébano": 2 } } };
    expect(isSoldOut(st, "simples", "9", "Branco Pola R")).toBe(false);
    expect(isSoldOut(st, "simples", "9", "Preto Ebano|#1B1B1B")).toBe(false);
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

describe("montar o catálogo pelo Noturno", () => {
  const items = [
    { family: "BALAO", name: "BALAO 9 LISO C/ 50 VERDE FOLHA", stock: 10 },
    { family: "BALAO", name: "BALAO 9 LISO C/50 AZUL PETROLEO", stock: 22 },
    { family: "BALAO", name: "BALAO 9 LISO C/50 PRETO", stock: 0 },
    { family: "BALAO", name: "BALAO 11 LISO C/50 PRETO", stock: 5 },
    { family: "BALAO", name: "BALAO 16 CANDY COLORS C/10 ROSA", stock: 4 },
    { family: "BALAO", name: "BALAO METAL C25 CM CORACAO AZUL CROMO", stock: 3 },
  ];

  it("com o catálogo vazio: propõe tipos, tamanhos (pacote do nome) e cores com estoque", () => {
    const p = proposeCatalog(items, { types: [], allColors: [] });
    const simples = p.find((t) => t.typeId === "simples")!;
    expect(simples).toMatchObject({ name: "Balão Simples (Liso)", exists: false });
    expect(simples.sizes).toEqual([
      { size: "9", unitsPerPackage: 50, packSource: "lido", stock: 32, currentPrice: null },
      { size: "11", unitsPerPackage: 50, packSource: "lido", stock: 5, currentPrice: null },
    ]);
    expect(simples.colors.map((c) => c.name)).toEqual(["Azul Petroleo", "Verde Folha", "Preto"]);
    expect(p.map((t) => t.typeId)).toEqual(["simples", "candy"]); // coração é produto
  });

  it("aplica: cria tipo só com preço; tamanho sem preço fica de fora", () => {
    const empty = { types: [], allColors: [] };
    const p = proposeCatalog(items, empty);
    const out = applyCatalogProposal(empty, p, { include: {}, prices: { "simples|9": 16 } });
    expect(out.types).toHaveLength(1); // candy sem preço não é criado
    expect(out.types[0].sizes).toEqual([{ size: "9", price: 16, unitsPerPackage: 50 }]);
    expect(out.types[0].colors).toContain("Azul Petroleo");
  });

  it("pacote não lido no nome ou que discorda fica marcado para conferir; pacote corrigido vale", () => {
    const p = proposeCatalog(
      [
        { family: "BALAO", name: "BALAO 9 CANDY COLORS ROSA", stock: 3 },
        { family: "BALAO", name: "BALAO 16 CANDY COLORS C/10 ROSA", stock: 3 },
        { family: "BALAO", name: "BALAO 16 CANDY COLORS C/25 AZUL", stock: 3 },
      ],
      { types: [], allColors: [] },
    );
    const sizes = p[0].sizes;
    expect(sizes.find((s) => s.size === "9")).toMatchObject({ packSource: "padrao", unitsPerPackage: 1 });
    expect(sizes.find((s) => s.size === "16")?.packSource).toBe("misto");
    const out = applyCatalogProposal({ types: [], allColors: [] }, p, {
      include: {},
      prices: { "candy|9": 8 },
      packs: { "candy|9": 25 },
    });
    expect(out.types[0].sizes).toEqual([{ size: "9", price: 8, unitsPerPackage: 25 }]);
  });

  it("mescla com o existente: mantém preço, acrescenta tamanho e cor; tira cor que o Noturno não tem", () => {
    const p = proposeCatalog(items, config);
    expect(p.find((t) => t.typeId === "simples")!.stale).toEqual(["Rosa Choque", "Rosa Tutti Frutti", "Branco"]);
    const out = applyCatalogProposal(config, p, { include: {}, prices: { "simples|11": 18 } });
    const s = out.types.find((t) => t.id === "simples")!;
    expect(s.sizes.map((z) => [z.size, z.price])).toEqual([["7", 10], ["9", 16], ["11", 18], ["16", 20]]);
    expect(s.colors).toEqual(["Verde Folha", "Preto", "Azul Petroleo"]);
    // Desmarcando a limpeza, nada sai.
    const keep = applyCatalogProposal(config, p, { include: {}, prices: {}, removeStale: { simples: false } });
    expect(keep.types[0].colors).toEqual([...config.types[0].colors, "Azul Petroleo"]);
    expect(out.types.find((t) => t.id === "metalico")).toEqual(config.types[2]);
    expect(config.types[0].sizes).toHaveLength(3); // não muta a entrada
  });

  it("cor salva com tom (Nome|#hex) não conta como sobra nem duplica (revisão do #273)", () => {
    const comTom = {
      types: [{
        id: "simples", name: "Liso", sizes: [{ size: "9", price: 16, unitsPerPackage: 50 }],
        colors: ["Preto Ébano|#1B1B1B", "Azul|#0000FF"],
      }],
      allColors: [],
    };
    const noturno = [
      { family: "BALAO", name: "BALAO 9 LISO RED C/50 PR EBAN O", stock: 4 },
      { family: "BALAO", name: "BALAO 9 LISO C/50 AZUL", stock: 0 },
    ];
    const p = proposeCatalog(noturno, comTom);
    expect(p[0].stale).toEqual([]);
    for (const removeStale of [{}, { simples: false }] as Record<string, boolean>[]) {
      const out = applyCatalogProposal(comTom, p, { include: {}, prices: {}, removeStale });
      expect(out.types[0].colors).toEqual(["Preto Ébano|#1B1B1B", "Azul|#0000FF"]);
    }
  });

  it("corrige nome quebrado salvo antes e junta grafias da mesma cor (staging, 23/10)", () => {
    const old = {
      types: [{
        id: "simples", name: "Liso", sizes: [{ size: "9", price: 16, unitsPerPackage: 50 }],
        colors: ["Branco Pola R", "Verde Euca Lipto", "Verde Euclipto", "Sortidos", "Preto Ébano",
          "Tema Unicornio Charm Sortido", "Herois Sortido", "Basic Azul"],
      }],
      allColors: [],
    };
    const noturno = [
      { family: "BALAO", name: "BALAO 9 LISO RED C/50 BR POLA R", stock: 5 },
      { family: "BALAO", name: "BALAO 9 LISO C/50 VERDE EUCALIPTO", stock: 3 },
      { family: "BALAO", name: "BALAO 9 LISO RED C/10 VD EUCA LIPTO", stock: 2 },
      { family: "BALAO", name: "BALAO 9 LISO RED C/50 VERDE EUCLIPTO", stock: 1 },
      { family: "BALAO", name: "BALAO LISO GRANFESTA 9 50X1 SORTIDO", stock: 6 },
      { family: "BALAO", name: "BALAO 9 LISO RED C/50 PR EBAN O", stock: 4 },
      { family: "BALAO", name: "BALAO 9 HEROIS C/25 SORTIDO", stock: 5 },
      { family: "BALAO", name: "BALAO 9 TEMA UNICORNIO CHARM C/25 SORTIDO", stock: 3 },
    ];
    const p = proposeCatalog(noturno, old);
    const out = applyCatalogProposal(old, p, { include: {}, prices: {} });
    expect(out.types[0].colors).toEqual(["Branco Polar", "Verde Eucalipto", "Preto Ébano", "Sortido"]);
    expect(p[0].renames).toEqual(
      expect.arrayContaining([{ from: "Branco Pola R", to: "Branco Polar" }, { from: "Verde Euca Lipto", to: "Verde Eucalipto" }]),
    );
  });
});

describe("marca (o cliente escolhe a marca primeiro — dono, 23/10)", () => {
  const items = [
    { family: "BALAO", name: "BALAO 7 LISO C/50 ROXO UVA", stock: 9, brand: "SAO ROQUE" },
    { family: "BALAO", name: "BALAO 9 LISO C/50 PRETO", stock: 4, brand: "SAO ROQUE" },
    { family: "BALAO", name: "BALAO ROXO N.7 C/50 UND.", stock: 6, brand: "RIBERBALL" },
    { family: "BALAO", name: "BALAO 6,5 C/50 LILAS", stock: 2, brand: "REGINA" },
    { family: "BALAO", name: "BALAO 5 NEON C/ 25 VERDE", stock: 9, brand: "SAO ROQUE" },
    { family: "BALAO", name: "BALAO METALIZADO 1640 CM ROSE 2", stock: 3, brand: "GATE" },
  ];

  it("marca da casa de cada tipo é a mais frequente; o catálogo registrado manda", () => {
    expect(homeBrands(items, { types: [], allColors: [] })).toMatchObject({ simples: "SAO ROQUE", foil_numeros: "GATE", neon: "SAO ROQUE" });
    const reg = { types: [{ id: "simples", name: "Liso", brand: "Riberball", sizes: [], colors: [] }], allColors: [] };
    expect(homeBrands(items, reg).simples).toBe("Riberball");
  });

  it("outra marca vira tipo à parte, com a marca no nome; neon é tipo próprio", () => {
    const p = proposeCatalog(items, { types: [], allColors: [] });
    const by = Object.fromEntries(p.map((t) => [t.typeId, t]));
    expect(by.simples).toMatchObject({ name: "Balão Simples (Liso)", brand: "São Roque" });
    expect(by.simples.colors.map((c) => c.name)).toEqual(["Roxo Uva", "Preto"]);
    expect(by.simples__riberball).toMatchObject({ name: "Liso Riberball", brand: "Riberball" });
    expect(by.simples__riberball.colors.map((c) => c.name)).toEqual(["Roxo"]);
    expect(by.simples__regina).toMatchObject({ name: "Liso Regina", brand: "Regina" });
    expect(by.neon.colors.map((c) => c.name)).toEqual(["Verde"]);
    expect(by.foil_numeros.brand).toBe("Gate");
    const out = applyCatalogProposal({ types: [], allColors: [] }, p, {
      include: {},
      prices: { "simples|7": 10, "simples|9": 16, "simples__riberball|7": 8 },
    });
    expect(out.types.map((t) => [t.id, t.brand])).toEqual([["simples", "São Roque"], ["simples__riberball", "Riberball"]]);
  });

  it("estoque fica separado por marca", () => {
    const cfg = {
      allColors: [],
      types: [
        { id: "simples", name: "Liso", brand: "São Roque", sizes: [{ size: "7", price: 10, unitsPerPackage: 50 }], colors: ["Roxo Uva"] },
        { id: "simples__riberball", name: "Liso Riberball", brand: "Riberball", sizes: [{ size: "7", price: 8, unitsPerPackage: 50 }], colors: ["Roxo"] },
      ],
    };
    const s = surveyCatalog(items, cfg);
    expect(s.stock.simples).toEqual({ "7": { "Roxo Uva": 9 } });
    expect(s.stock.simples__riberball).toEqual({ "7": { Roxo: 6 } });
  });
});
