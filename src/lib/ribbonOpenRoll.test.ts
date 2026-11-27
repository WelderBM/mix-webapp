import { describe, it, expect } from "vitest";
import {
  activePerMeterFor,
  buildPerMeterProduct,
  closePerMeterPatch,
  hasSoldFromRoll,
  perMeterName,
} from "./ribbonOpenRoll";
import type { Product } from "@/types/product";

const roll = {
  id: "rolo1",
  name: "Plástica 32mm Cromus Vermelho ",
  type: "RIBBON",
  category: "Fitas",
  unit: "un",
  inStock: true,
  disabled: false,
  rollPrice: 20,
  sourceCode: "1234",
  imageUrl: "https://x/y.jpg",
  ribbonInventory: { status: "FECHADO", remainingMeters: 50, totalRollMeters: 50 },
} as Product;

const open = (over: Partial<Product>) =>
  ({ ...roll, id: "pm", openedFromId: "rolo1", ribbonInventory: { status: "ABERTO", remainingMeters: 10, totalRollMeters: 50 }, ...over }) as Product;

describe("ribbonOpenRoll (#413)", () => {
  it("nome pronto e sem espaço sobrando", () => {
    expect(perMeterName(roll)).toBe("Plástica 32mm Cromus Vermelho p/ metro");
  });

  it("p/ metro novo: cheio, por metro, ligado ao rolo e sem campo undefined", () => {
    const pm = buildPerMeterProduct(roll, "Fita p/ metro", 0.9);
    expect(pm).toMatchObject({
      name: "Fita p/ metro",
      unit: "m",
      price: 0.9,
      openedFromId: "rolo1",
      sourceCode: "1234",
      ribbonInventory: { status: "ABERTO", remainingMeters: 50, totalRollMeters: 50 },
    });
    expect(Object.values(pm).some((v) => v === undefined)).toBe(false);
    expect("rollPrice" in pm).toBe(false);
  });

  it("um aberto por vez: ativo com metragem trava; encerrado ou zerado libera", () => {
    expect(activePerMeterFor("rolo1", [open({})])?.id).toBe("pm");
    expect(activePerMeterFor("rolo1", [open({ disabled: true })])).toBeUndefined();
    expect(
      activePerMeterFor("rolo1", [open({ ribbonInventory: { status: "ABERTO", remainingMeters: 0, totalRollMeters: 50 } })])
    ).toBeUndefined();
    expect(activePerMeterFor("outro", [open({})])).toBeUndefined();
  });

  it("encerrar com sobra registra a metragem e a data", () => {
    const now = new Date("2026-11-27T10:00:00Z");
    expect(closePerMeterPatch(open({}), now)).toEqual({
      disabled: true,
      closedWithMeters: 10,
      closedAt: "2026-11-27T10:00:00.000Z",
    });
  });

  it("sabe se já vendeu parte do rolo", () => {
    expect(hasSoldFromRoll(open({}))).toBe(true);
    expect(
      hasSoldFromRoll(open({ ribbonInventory: { status: "ABERTO", remainingMeters: 50, totalRollMeters: 50 } }))
    ).toBe(false);
  });
});
