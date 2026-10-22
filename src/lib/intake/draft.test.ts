import { describe, it, expect } from "vitest";
import {
  DRAFT_TTL_MS,
  DRAFT_VERSION,
  isExpired,
  isUsable,
  isWorthSaving,
  normalizeDraft,
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

describe("normalizeDraft (#201: várias fotos)", () => {
  const base = { ...defaults, savedAt: 1 };
  it("rascunho antigo (v1, uma foto) vira lista com essa foto", () => {
    const blob = new Blob(["x"]);
    const d = normalizeDraft({ ...base, v: 1, photo: blob } as never);
    expect(d.v).toBe(DRAFT_VERSION);
    expect(d.photos).toEqual([blob]);
    expect("photo" in d).toBe(false);
    expect(normalizeDraft({ ...base, v: 1, photo: null } as never).photos).toEqual([]);
  });
  it("v1 continua utilizável; formato desconhecido não", () => {
    const now = 10;
    expect(isUsable({ ...base, v: 1, photo: null }, now)).toBe(true);
    expect(isUsable({ ...base, v: 99, photos: [] }, now)).toBe(false);
  });
});
