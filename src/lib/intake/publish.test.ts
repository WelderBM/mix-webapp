import { describe, it, expect } from "vitest";
import {
  buildGroupProductFromIntake,
  validateGroup,
  buildProductFromIntake,
  extractRollMeters,
  matchCategory,
  parsePrice,
  statusTransitionDeltas,
  validateLaunch,
  type LaunchInput,
} from "./publish";
import { getEffectiveUnitPrice } from "@/lib/ribbon-pricing";
import type { IntakeItem } from "@/types/intake";
import type { Product } from "@/types";

const item = (o: Partial<IntakeItem> = {}): IntakeItem =>
  ({
    id: "13734",
    sourceCode: "13734",
    name: "CANECA BRANCA 300ML",
    stock: 5,
    suggestedType: "STANDARD_ITEM",
    suggestedUnit: "un",
    status: "pendente",
    ...o,
  }) as IntakeItem;

const input = (o: Partial<LaunchInput> = {}): LaunchInput => ({
  name: "CANECA BRANCA 300ML",
  price: 19.9,
  categoryName: "Canecas",
  unit: "un",
  packQty: null,
  photoUrl: "https://img/x.webp",
  rollMeters: null,
  ...o,
});

describe("extractRollMeters", () => {
  it("lê a metragem do nome do Noturno", () => {
    expect(extractRollMeters("FITA MAXI TRUE LOVE 32MMX100M VERMELHO")).toBe(100);
    expect(extractRollMeters("FITA CETIM N.5 22MM 10 M")).toBe(10);
    expect(extractRollMeters("FITA GORGURAO 9MM X 50M")).toBe(50);
    expect(extractRollMeters("FITA CETIM 22MMX10MTS ROSE")).toBe(10);
    expect(extractRollMeters("FITA VOIL 38MM 10 METROS")).toBe(10);
    expect(extractRollMeters("FITA MAXI FM 03D 32MMX100 AMEIXA/OURO")).toBe(100);
    expect(extractRollMeters("FITA MAXI FM 100L 16MMX50 VERMELHO")).toBe(50);
  });

  it("não confunde milímetro nem mililitro com metro", () => {
    expect(extractRollMeters("FITA CETIM 22MM VERMELHA")).toBeNull();
    expect(extractRollMeters("FITA 48MMX40MM DE EMP")).toBeNull();
    expect(extractRollMeters("CANECA 300ML")).toBeNull();
  });
});

describe("matchCategory", () => {
  const cats = [{ name: "Fitas" }, { name: "sacos" }, { name: "Ursinhos" }];
  it("casa a chave normalizada com o nome livre da categoria", () => {
    expect(matchCategory("fitas", cats)).toBe("Fitas");
    expect(matchCategory("ursinhos", cats)).toBe("Ursinhos");
  });
  it("sem palpite ou sem categoria correspondente → null", () => {
    expect(matchCategory(null, cats)).toBeNull();
    expect(matchCategory("caixas", cats)).toBeNull();
  });
});

describe("parsePrice", () => {
  it("aceita vírgula, ponto e milhar pt-BR", () => {
    expect(parsePrice("12,90")).toBe(12.9);
    expect(parsePrice("12.90")).toBe(12.9);
    expect(parsePrice("1.234,50")).toBe(1234.5);
    expect(parsePrice("")).toBeNull();
    expect(parsePrice("abc")).toBeNull();
  });
});

describe("validateLaunch", () => {
  it("passa com tudo preenchido", () => {
    expect(validateLaunch(input(), false)).toBeNull();
  });
  it("exige preço positivo, categoria e foto", () => {
    expect(validateLaunch(input({ price: null }), false)).toMatch(/preço/);
    expect(validateLaunch(input({ price: 0 }), false)).toMatch(/preço/);
    expect(validateLaunch(input({ categoryName: "" }), false)).toMatch(/categoria/);
    expect(validateLaunch(input({ photoUrl: null }), false)).toMatch(/foto/);
  });
  it("exige escolher como é vendido (exceto fita)", () => {
    expect(validateLaunch(input({ unit: null }), false)).toMatch(/pacote, unidade ou metro/);
    expect(validateLaunch(input({ unit: null, rollMeters: 100 }), true)).toBeNull();
  });

  it("pacote exige quantidade inteira maior que 1", () => {
    expect(validateLaunch(input({ unit: "pct", packQty: null }), false)).toMatch(/unidades vêm no pacote/);
    expect(validateLaunch(input({ unit: "pct", packQty: 1 }), false)).toMatch(/unidades vêm no pacote/);
    expect(validateLaunch(input({ unit: "pct", packQty: 2.5 }), false)).toMatch(/unidades vêm no pacote/);
    expect(validateLaunch(input({ unit: "pct", packQty: 100 }), false)).toBeNull();
  });

  it("fita exige metragem do rolo", () => {
    expect(validateLaunch(input({ rollMeters: null }), true)).toMatch(/metros/);
    expect(validateLaunch(input({ rollMeters: 100 }), true)).toBeNull();
  });
});

describe("buildProductFromIntake", () => {
  it("grava a subcategoria escolhida (#232) e omite quando não há", () => {
    expect(buildProductFromIntake(item(), input({ subcategoryName: "Seda" })).subcategory).toBe("Seda");
    expect(buildProductFromIntake(item(), input({ subcategoryName: null })).subcategory).toBeUndefined();
    expect(buildProductFromIntake(item(), input()).subcategory).toBeUndefined();
  });

  it("item comum: preço, unidade, foto de capa e vínculo com o Noturno", () => {
    const p = buildProductFromIntake(item(), input());
    expect(p).toMatchObject({
      type: "STANDARD_ITEM",
      price: 19.9,
      unit: "un",
      category: "Canecas",
      imageUrl: "https://img/x.webp",
      images: [{ id: "cover", url: "https://img/x.webp", isCover: true }],
      inStock: true,
      disabled: false,
      sourceCode: "13734",
    });
    expect(getEffectiveUnitPrice({ id: "x", ...p } as Product)).toBe(19.9);
  });

  it("fita de laço vira rolo fechado vendável pelo preço do rolo", () => {
    const p = buildProductFromIntake(
      item({ suggestedType: "RIBBON" }),
      input({ price: 25, rollMeters: 100 })
    );
    expect(p).toMatchObject({
      type: "RIBBON",
      unit: "m",
      rollPrice: 25,
      canBeSoldAsRoll: true,
      ribbonInventory: { status: "FECHADO", remainingMeters: 100, totalRollMeters: 100 },
    });
    expect(p).not.toHaveProperty("price");
    expect(getEffectiveUnitPrice({ id: "x", ...p } as Product)).toBe(25);
  });

  it("pacote grava a quantidade; unidade não", () => {
    const pack = buildProductFromIntake(item(), input({ unit: "pct", packQty: 100, price: 18 }));
    expect(pack).toMatchObject({ unit: "pct", packQty: 100, price: 18 });
    const unit = buildProductFromIntake(item(), input({ unit: "un", packQty: 100 }));
    expect(unit.packQty).toBeUndefined();
  });

  it("estoque zero publica fora de estoque", () => {
    expect(buildProductFromIntake(item({ stock: 0 }), input()).inStock).toBe(false);
  });
});

describe("statusTransitionDeltas", () => {
  it("publicar tira um pendente da família", () => {
    expect(statusTransitionDeltas("pendente", "publicado")).toEqual({
      byStatus: { pendente: -1, publicado: 1 },
      familyPending: -1,
    });
  });
  it("voltar para pendentes devolve à família", () => {
    expect(statusTransitionDeltas("pulado", "pendente").familyPending).toBe(1);
  });
  it("mesmo status não muda nada", () => {
    expect(statusTransitionDeltas("pulado", "pulado")).toEqual({ byStatus: {}, familyPending: 0 });
  });
});

describe("lançamento em grupo (#201)", () => {
  const m = (sourceCode: string, label: string, stock: number) => ({
    item: item({ sourceCode, stock }),
    label,
  });
  it("um produto com uma variação por cor; id = código do Noturno", () => {
    const p = buildGroupProductFromIntake(
      [m("501", "Branco cor 501", 3), m("540", "Verde cor 540", 0)],
      input({ name: "Zíper nylon 15cm" }),
    );
    expect(p.name).toBe("Zíper nylon 15cm");
    expect(p.sourceCode).toBeUndefined();
    expect(p.inStock).toBe(true);
    expect(p.variants).toEqual([
      { id: "501", type: "Cor", name: "Branco cor 501", inStock: true, attributes: { Cor: "Branco cor 501" } },
      { id: "540", type: "Cor", name: "Verde cor 540", inStock: false, attributes: { Cor: "Verde cor 540" } },
    ]);
  });
  it("sem nenhuma cor em estoque, produto esgotado", () => {
    expect(buildGroupProductFromIntake([m("1", "A", 0), m("2", "B", 0)], input()).inStock).toBe(false);
  });
  it("valida: 2+ cores, nomes preenchidos e diferentes", () => {
    expect(validateGroup([m("1", "Azul", 1)])).toMatch(/2 cores/);
    expect(validateGroup([m("1", "Azul", 1), m("2", " ", 1)])).toMatch(/nome/);
    expect(validateGroup([m("1", "Azul", 1), m("2", "azul", 1)])).toMatch(/mesmo nome/);
    expect(validateGroup([m("1", "Azul", 1), m("2", "Verde", 1)])).toBeNull();
  });
});
