import { describe, it, expect } from "vitest";
import {
  DEFAULT_IMPORT_PERIOD_DAYS,
  daysSinceImport,
  importPeriodDays,
  isNoturnoImportDue,
} from "./noturnoImport";

const DAY = 24 * 60 * 60 * 1000;
const now = Date.UTC(2026, 10, 27, 15, 0);

describe("isNoturnoImportDue", () => {
  it("nunca importado vence", () => {
    expect(isNoturnoImportDue(null, 2, now)).toBe(true);
  });
  it("dentro do período não vence", () => {
    expect(isNoturnoImportDue(now - 2 * DAY + 1, 2, now)).toBe(false);
  });
  it("no limite exato vence", () => {
    expect(isNoturnoImportDue(now - 2 * DAY, 2, now)).toBe(true);
  });
  it("período ausente ou inválido usa o padrão", () => {
    const justBefore = now - DEFAULT_IMPORT_PERIOD_DAYS * DAY + 1;
    expect(isNoturnoImportDue(justBefore, undefined, now)).toBe(false);
    expect(isNoturnoImportDue(justBefore, 0, now)).toBe(false);
    expect(isNoturnoImportDue(justBefore, 1.5, now)).toBe(false);
  });
  it("período configurado maior adia o aviso", () => {
    expect(isNoturnoImportDue(now - 5 * DAY, 7, now)).toBe(false);
    expect(isNoturnoImportDue(now - 7 * DAY, 7, now)).toBe(true);
  });
});

describe("importPeriodDays / daysSinceImport", () => {
  it("aceita inteiro >= 1", () => {
    expect(importPeriodDays(3)).toBe(3);
    expect(importPeriodDays(-1)).toBe(DEFAULT_IMPORT_PERIOD_DAYS);
    expect(importPeriodDays(null)).toBe(DEFAULT_IMPORT_PERIOD_DAYS);
  });
  it("conta dias inteiros, nunca negativo", () => {
    expect(daysSinceImport(now - 3 * DAY - 5, now)).toBe(3);
    expect(daysSinceImport(now + DAY, now)).toBe(0);
  });
});
