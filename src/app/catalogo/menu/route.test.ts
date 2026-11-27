import { describe, it, expect, vi } from "vitest";

const { getDocsMock } = vi.hoisted(() => ({ getDocsMock: vi.fn() }));
vi.mock("@/lib/firebase", () => ({ db: {} }));
vi.mock("firebase/firestore", () => ({
  collection: vi.fn((_db: unknown, name: string) => name),
  getDocs: getDocsMock,
}));

import { GET } from "./route";

const snap = (docs: Record<string, unknown>[]) => ({
  docs: docs.map(({ id, ...rest }) => ({ id, data: () => rest })),
});

describe("GET /catalogo/menu (#399)", () => {
  it("devolve só a contagem de vendáveis por categoria", async () => {
    getDocsMock.mockImplementation(async (name: string) =>
      name === "products"
        ? snap([
            { id: "a", category: "Fitas", subcategory: "Cetim", inStock: true, type: "RIBBON" },
            { id: "b", category: "Fitas", inStock: true, disabled: true, type: "RIBBON" },
          ])
        : snap([])
    );
    const res = await GET();
    expect(await res.json()).toEqual({
      counts: { Fitas: { total: 1, subs: { Cetim: 1 } } },
    });
  });

  it("falha na leitura relança (o Next mantém a última contagem boa)", async () => {
    getDocsMock.mockImplementation(async () => {
      throw new Error("offline");
    });
    vi.spyOn(console, "error").mockImplementation(() => {});
    let caught: unknown = null;
    try {
      await GET();
    } catch (e) {
      caught = e;
    }
    expect((caught as Error)?.message).toBe("offline");
  });
});
