import { describe, it, expect } from "vitest";
import {
  DRAFT_TTL_MS,
  DRAFT_VERSION,
  isExpired,
  isUsable,
  isWorthSaving,
  type LaunchDraftFields,
} from "./draft";

const defaults: LaunchDraftFields = {
  name: "SACO TRANSP 10X14 PT C/100",
  priceText: "",
  categoryName: "Sacos",
  unit: null,
  packText: "100",
  metersText: "",
};

describe("isWorthSaving", () => {
  it("card como abriu não vira rascunho", () => {
    expect(isWorthSaving({ ...defaults }, defaults, false)).toBe(false);
  });

  it("preço digitado, 'vende como' escolhido ou nome editado viram rascunho", () => {
    expect(isWorthSaving({ ...defaults, priceText: "12,90" }, defaults, false)).toBe(true);
    expect(isWorthSaving({ ...defaults, unit: "pct" }, defaults, false)).toBe(true);
    expect(isWorthSaving({ ...defaults, name: "Saco transparente" }, defaults, false)).toBe(true);
  });

  it("foto sozinha já vale rascunho (é o passo mais trabalhoso)", () => {
    expect(isWorthSaving({ ...defaults }, defaults, true)).toBe(true);
  });
});

describe("isUsable", () => {
  const now = 10 * DRAFT_TTL_MS;
  const ok = { ...defaults, v: DRAFT_VERSION, photo: null, savedAt: now - 1000 };
  it("aceita só o formato atual e dentro do prazo", () => {
    expect(isUsable(ok, now)).toBe(true);
    expect(isUsable({ ...ok, v: undefined }, now)).toBe(false);
    expect(isUsable({ ...ok, savedAt: now - DRAFT_TTL_MS - 1 }, now)).toBe(false);
    expect(isUsable({ foo: 1 }, now)).toBe(false);
    expect(isUsable(null, now)).toBe(false);
  });
});

describe("isExpired", () => {
  it("rascunho velho expira", () => {
    const now = 10 * DRAFT_TTL_MS;
    expect(isExpired({ savedAt: now - DRAFT_TTL_MS - 1 }, now)).toBe(true);
    expect(isExpired({ savedAt: now - 1000 }, now)).toBe(false);
  });
});
