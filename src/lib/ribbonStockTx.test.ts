import { describe, it, expect, vi, beforeEach } from "vitest";

// Firestore em memória: só o que a transação usa.
const store: Record<string, Record<string, unknown>> = {};
const DELETE = Symbol("delete");
vi.mock("firebase/firestore", () => ({
  deleteField: () => DELETE,
  doc: (_db: unknown, col: string, id: string) => ({ path: `${col}/${id}` }),
  runTransaction: async (_db: unknown, fn: (tx: unknown) => Promise<void>) => {
    const writes: [string, Record<string, unknown>][] = [];
    await fn({
      get: async (ref: { path: string }) => ({
        ref,
        exists: () => ref.path in store,
        data: () => store[ref.path],
      }),
      update: (ref: { path: string }, patch: Record<string, unknown>) => writes.push([ref.path, patch]),
    });
    for (const [path, patch] of writes) {
      for (const [k, v] of Object.entries(patch)) {
        if (k === "ribbonInventory.remainingMeters") {
          (store[path].ribbonInventory as Record<string, unknown>).remainingMeters = v;
        } else if (v === DELETE) delete store[path][k];
        else store[path][k] = v;
      }
    }
  },
}));

import { ribbonStockChange, updateStatusWithRibbonStock } from "./ribbonStockTx";

const fita = { id: "pm", unit: "m", ribbonInventory: { status: "ABERTO", remainingMeters: 10, totalRollMeters: 50 } };
const items = [{ cartId: "a", type: "SIMPLE", quantity: 3, product: fita }];

beforeEach(() => {
  for (const k of Object.keys(store)) delete store[k];
  store["products/pm"] = { ribbonInventory: { status: "ABERTO", remainingMeters: 10, totalRollMeters: 50 } };
  store["orders/o1"] = { status: "preparing", items };
});

describe("baixa da metragem no status do pedido (#415)", () => {
  it("decide pelo pedido em memória", () => {
    expect(ribbonStockChange({ items } as never, "ready")).toBe("apply");
    expect(ribbonStockChange({ items, stockApplied: { pm: 3 } } as never, "delivered")).toBeNull();
    expect(ribbonStockChange({ items, stockApplied: { pm: 3 } } as never, "cancelled")).toBe("revert");
    expect(ribbonStockChange({ items: [] } as never, "ready")).toBeNull();
  });

  it("Pronto desconta uma vez só; cancelar devolve", async () => {
    const now = new Date("2026-11-27T12:00:00Z");
    await updateStatusWithRibbonStock({} as never, "o1", "ready", now);
    expect((store["products/pm"].ribbonInventory as { remainingMeters: number }).remainingMeters).toBe(7);
    expect(store["orders/o1"]).toMatchObject({ status: "ready", stockApplied: { pm: 3 } });

    await updateStatusWithRibbonStock({} as never, "o1", "delivered", now);
    expect((store["products/pm"].ribbonInventory as { remainingMeters: number }).remainingMeters).toBe(7);

    await updateStatusWithRibbonStock({} as never, "o1", "cancelled", now);
    expect((store["products/pm"].ribbonInventory as { remainingMeters: number }).remainingMeters).toBe(10);
    expect("stockApplied" in store["orders/o1"]).toBe(false);
  });

  it("produto apagado não quebra a troca de status", async () => {
    delete store["products/pm"];
    await updateStatusWithRibbonStock({} as never, "o1", "ready", new Date());
    expect(store["orders/o1"].status).toBe("ready");
  });
});
