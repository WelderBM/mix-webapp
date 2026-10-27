import { describe, expect, it } from "vitest";
import { clampMeters, stepMeters } from "./meters";

describe("stepMeters", () => {
  it("anda de 0,5 em 0,5", () => {
    expect(stepMeters(1, 1)).toBe(1.5);
    expect(stepMeters(1.5, -1)).toBe(1);
  });

  it("arredonda valor quebrado no primeiro toque", () => {
    expect(stepMeters(0.75, 1)).toBe(1);
    expect(stepMeters(0.75, -1)).toBe(0.5);
    expect(stepMeters(1.2, 1)).toBe(1.5);
    expect(stepMeters(1.2, -1)).toBe(1);
  });

  it("não desce abaixo de 0,5 m (o menos não remove o item)", () => {
    expect(stepMeters(0.5, -1)).toBe(0.5);
    expect(stepMeters(0.3, -1)).toBe(0.5);
  });

  it("respeita o estoque", () => {
    expect(stepMeters(9.5, 1, 10)).toBe(10);
    expect(stepMeters(10, 1, 10)).toBe(10);
  });
});

describe("clampMeters", () => {
  it("corrige digitação inválida", () => {
    expect(clampMeters(Number.NaN)).toBe(0.5);
    expect(clampMeters(0.2)).toBe(0.5);
    expect(clampMeters(0)).toBe(0.5);
    expect(clampMeters(30, 25)).toBe(25);
    expect(clampMeters(0.75)).toBe(0.75);
  });
});
