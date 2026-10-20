import { describe, it, expect } from "vitest";
import {
  isNovidade,
  isPromocao,
  getSystemTags,
  isSystemTag,
  getAllProductTags,
  SYSTEM_TAG_NOVIDADES,
  SYSTEM_TAG_PROMOCAO,
  NOVIDADES_THRESHOLD_DAYS,
} from "./productTags";

const NOW = new Date("2026-08-05T12:00:00.000Z");
const DAY_MS = 24 * 60 * 60 * 1000;

describe("isNovidade", () => {
  it("retorna true para produto criado dentro do limiar de 30 dias (Date)", () => {
    const createdAt = new Date(NOW.getTime() - 10 * DAY_MS);
    expect(isNovidade({ createdAt }, NOW)).toBe(true);
  });

  it("retorna true exatamente no limite do limiar (30 dias corridos)", () => {
    const createdAt = new Date(
      NOW.getTime() - NOVIDADES_THRESHOLD_DAYS * DAY_MS
    );
    expect(isNovidade({ createdAt }, NOW)).toBe(true);
  });

  it("retorna false para produto criado fora do limiar de 30 dias", () => {
    const createdAt = new Date(
      NOW.getTime() - (NOVIDADES_THRESHOLD_DAYS + 1) * DAY_MS
    );
    expect(isNovidade({ createdAt }, NOW)).toBe(false);
  });

  it("aceita createdAt como number (epoch ms)", () => {
    const createdAt = NOW.getTime() - 5 * DAY_MS;
    expect(isNovidade({ createdAt }, NOW)).toBe(true);
  });

  it("aceita createdAt como objeto Timestamp-like do Firestore (toMillis())", () => {
    const createdAt = { toMillis: () => NOW.getTime() - 1 * DAY_MS };
    expect(isNovidade({ createdAt }, NOW)).toBe(true);
  });

  it("retorna false sem lançar erro quando createdAt está ausente (produto legado)", () => {
    expect(() => isNovidade({ createdAt: undefined }, NOW)).not.toThrow();
    expect(isNovidade({ createdAt: undefined }, NOW)).toBe(false);
  });

  it("retorna false quando createdAt é null", () => {
    expect(isNovidade({ createdAt: null }, NOW)).toBe(false);
  });

  it("retorna false para um formato de createdAt não reconhecido (string arbitrária)", () => {
    expect(isNovidade({ createdAt: "não é uma data" }, NOW)).toBe(false);
  });

  it("retorna false para createdAt no futuro (relógio incoerente, nunca vira idade negativa 'válida')", () => {
    const createdAt = new Date(NOW.getTime() + DAY_MS);
    expect(isNovidade({ createdAt }, NOW)).toBe(false);
  });
});

describe("isPromocao", () => {
  it("retorna true quando originalPrice > price", () => {
    expect(isPromocao({ originalPrice: 100, price: 80 })).toBe(true);
  });

  it("retorna false quando originalPrice === price (sem desconto real)", () => {
    expect(isPromocao({ originalPrice: 50, price: 50 })).toBe(false);
  });

  it("retorna false quando originalPrice < price", () => {
    expect(isPromocao({ originalPrice: 40, price: 50 })).toBe(false);
  });

  it("retorna false quando originalPrice está ausente", () => {
    expect(isPromocao({ originalPrice: undefined, price: 50 })).toBe(false);
  });

  it("retorna false quando price está ausente", () => {
    expect(isPromocao({ originalPrice: 100, price: undefined })).toBe(false);
  });

  it("retorna false quando os dois estão ausentes", () => {
    expect(
      isPromocao({ originalPrice: undefined, price: undefined })
    ).toBe(false);
  });

  it("trata price === 0 como valor real, não como ausência (guard explícito, nunca ||)", () => {
    // originalPrice > 0 (price) — é promoção de verdade, produto ficou
    // "grátis"/residual. Um `||` colapsaria price=0 com undefined e mudaria
    // o resultado por acidente.
    expect(isPromocao({ originalPrice: 10, price: 0 })).toBe(true);
  });

  it("retorna false quando originalPrice === 0 e price também é 0", () => {
    expect(isPromocao({ originalPrice: 0, price: 0 })).toBe(false);
  });
});

describe("isSystemTag", () => {
  it("reconhece 'novidades' e 'promocao' como tags de sistema", () => {
    expect(isSystemTag("novidades")).toBe(true);
    expect(isSystemTag("promocao")).toBe(true);
  });

  it("não reconhece uma tag manual comum como tag de sistema", () => {
    expect(isSystemTag("dia-das-maes")).toBe(false);
    expect(isSystemTag("Dia das Mães")).toBe(false);
  });
});

describe("getSystemTags", () => {
  it("retorna as duas tags quando o produto é novidade e está em promoção", () => {
    const product = {
      createdAt: new Date(NOW.getTime() - 2 * DAY_MS),
      originalPrice: 100,
      price: 70,
    };
    expect(getSystemTags(product, NOW)).toEqual([
      SYSTEM_TAG_NOVIDADES,
      SYSTEM_TAG_PROMOCAO,
    ]);
  });

  it("retorna lista vazia pra produto antigo e sem promoção", () => {
    const product = {
      createdAt: new Date(NOW.getTime() - 365 * DAY_MS),
      originalPrice: undefined,
      price: 30,
    };
    expect(getSystemTags(product, NOW)).toEqual([]);
  });

  it("retorna só 'promocao' pra produto legado sem createdAt mas com desconto ativo", () => {
    const product = {
      createdAt: undefined,
      originalPrice: 90,
      price: 60,
    };
    expect(getSystemTags(product, NOW)).toEqual([SYSTEM_TAG_PROMOCAO]);
  });
});

describe("getAllProductTags", () => {
  it("combina tags manuais com tags de sistema calculadas", () => {
    const product = {
      tags: ["dia-das-maes", "ate-r50"],
      createdAt: new Date(NOW.getTime() - 1 * DAY_MS),
      originalPrice: 100,
      price: 90,
    };
    expect(getAllProductTags(product, NOW)).toEqual([
      "dia-das-maes",
      "ate-r50",
      SYSTEM_TAG_NOVIDADES,
      SYSTEM_TAG_PROMOCAO,
    ]);
  });

  it("produto sem `tags` manual não quebra — retorna só as tags de sistema aplicáveis", () => {
    const product = {
      tags: undefined,
      createdAt: new Date(NOW.getTime() - 1 * DAY_MS),
      originalPrice: undefined,
      price: 20,
    };
    expect(getAllProductTags(product, NOW)).toEqual([SYSTEM_TAG_NOVIDADES]);
  });

  it("produto sem tags manuais e sem nenhuma tag de sistema aplicável retorna lista vazia", () => {
    const product = {
      tags: undefined,
      createdAt: undefined,
      originalPrice: undefined,
      price: 20,
    };
    expect(getAllProductTags(product, NOW)).toEqual([]);
  });
});
