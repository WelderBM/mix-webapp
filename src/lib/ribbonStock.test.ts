import { describe, it, expect } from "vitest";
import { nextRemaining, ribbonMetersByProduct, statusConsumesRibbon } from "./ribbonStock";
import type { CartItem } from "@/types/cart";

const aberto = { id: "pm", unit: "m", ribbonInventory: { status: "ABERTO", remainingMeters: 40, totalRollMeters: 50 } };
const fechado = { id: "rolo", unit: "un", ribbonInventory: { status: "FECHADO", remainingMeters: 50, totalRollMeters: 50 } };

const item = (over: Partial<CartItem>) => ({ cartId: "c", type: "SIMPLE", quantity: 1, ...over }) as CartItem;

describe("ribbonStock (#415)", () => {
  it("fita por metro desconta a quantidade; rolo fechado não", () => {
    const out = ribbonMetersByProduct([
      item({ product: aberto as never, quantity: 2.5 }),
      item({ product: fechado as never, quantity: 1 }),
    ]);
    expect(out).toEqual({ pm: 2.5 });
  });

  it("laço desconta metersUsed × quantidade; sem metragem não desconta", () => {
    const out = ribbonMetersByProduct([
      item({ type: "CUSTOM_RIBBON", product: aberto as never, quantity: 2, customizations: { style: "Bola", size: "G", metersUsed: 1.2 } }),
      item({ type: "CUSTOM_RIBBON", product: { ...aberto, id: "outra" } as never, customizations: { style: "Bola", size: "P" } }),
    ]);
    expect(out).toEqual({ pm: 2.4 });
  });

  it("soma o mesmo produto em itens diferentes", () => {
    const out = ribbonMetersByProduct([
      item({ product: aberto as never, quantity: 1 }),
      item({ type: "CUSTOM_RIBBON", product: aberto as never, customizations: { style: "x", size: "M", metersUsed: 0.8 } }),
    ]);
    expect(out).toEqual({ pm: 1.8 });
  });

  it("status que consomem: pronto, saiu para entrega, entregue", () => {
    expect(statusConsumesRibbon("ready")).toBe(true);
    expect(statusConsumesRibbon("delivered")).toBe(true);
    expect(statusConsumesRibbon("preparing")).toBe(false);
    expect(statusConsumesRibbon("cancelled")).toBe(false);
  });

  it("metragem nunca negativa e estorno não passa do total", () => {
    expect(nextRemaining(1, 50, -3)).toBe(0);
    expect(nextRemaining(49, 50, 3)).toBe(50);
    expect(nextRemaining(10, 50, -2.5)).toBe(7.5);
  });
});
