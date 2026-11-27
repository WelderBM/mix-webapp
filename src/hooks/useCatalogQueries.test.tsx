// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { Product } from "@/types";

// Store: catálogo trocável por teste; fetchProducts espionado.
const store = { allProducts: [] as Product[], fetchProducts: vi.fn() };
vi.mock("@/store/productStore", () => {
  const useProductStore = (selector: (s: typeof store) => unknown) => selector(store);
  useProductStore.getState = () => store;
  return { useProductStore };
});

// Firestore: a consulta por `in` devolve `recent` (ou falha); as outras, `slice`.
const docs: { slice: Product[]; recent: Product[]; recentFails: boolean } = {
  slice: [],
  recent: [],
  recentFails: false,
};
const { whereMock } = vi.hoisted(() => ({
  whereMock: vi.fn((field: string, _op: string, value: unknown) => ({ field, value })),
}));
vi.mock("firebase/firestore", () => ({
  collection: vi.fn(() => ({})),
  documentId: vi.fn(() => "__id__"),
  limit: vi.fn(() => ({})),
  where: whereMock,
  query: vi.fn((_c: unknown, ...cs: { field?: string }[]) => ({
    byId: cs.some((c) => c.field === "__id__"),
  })),
  getDocs: vi.fn(async (q: { byId: boolean }) => {
    if (q.byId && docs.recentFails) throw new Error("in falhou");
    return {
      docs: (q.byId ? docs.recent : docs.slice).map((p) => ({ id: p.id, data: () => p })),
    };
  }),
}));

import { useCategoryProducts, useProductNeighbors } from "./useCatalogQueries";

const p = (over: Partial<Product>): Product =>
  ({ id: "x", name: "P", price: 1, type: "STANDARD_ITEM", unit: "un", inStock: true, ...over }) as Product;

beforeEach(() => {
  store.allProducts = [];
  store.fetchProducts.mockClear();
  whereMock.mockClear();
  docs.slice = [];
  docs.recent = [];
  docs.recentFails = false;
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("useCategoryProducts (#399)", () => {
  it("store vazia: lê só a categoria e tira desativados", async () => {
    docs.slice = [p({ id: "a", category: "Cestas" }), p({ id: "b", category: "Cestas", disabled: true })];
    const { result } = renderHook(() => useCategoryProducts("Cestas"));
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.products.map((x) => x.id)).toEqual(["a"]);
    expect(whereMock).toHaveBeenCalledWith("category", "==", "Cestas");
    expect(store.fetchProducts).not.toHaveBeenCalled();
  });

  it("catálogo já na store: usa a store sem ler", () => {
    store.allProducts = [p({ id: "a", category: "Cestas" })];
    const { result } = renderHook(() => useCategoryProducts("Cestas"));
    expect(result.current).toEqual({ products: store.allProducts, loading: false });
    expect(whereMock).not.toHaveBeenCalled();
  });

  it("kit no recorte pede o catálogo completo (a store avalia a receita)", async () => {
    docs.slice = [p({ id: "k", category: "Kits", type: "ASSEMBLED_KIT" })];
    renderHook(() => useCategoryProducts("Kits"));
    await waitFor(() => expect(store.fetchProducts).toHaveBeenCalledTimes(1));
  });
});

describe("useProductNeighbors (#399)", () => {
  it("subcategoria vazia também entra na consulta, igual ao filtro em memória", async () => {
    const current = p({ id: "c", category: "Fitas", subcategory: "" });
    renderHook(() => useProductNeighbors(current, [], 8));
    await waitFor(() => expect(whereMock).toHaveBeenCalledWith("subcategory", "==", ""));
  });

  it("falha nos vistos não apaga os relacionados; id inválido não vai para a consulta", async () => {
    const current = p({ id: "c", category: "Fitas" });
    docs.slice = [current, p({ id: "irma", category: "Fitas" })];
    docs.recentFails = true;
    const { result } = renderHook(() => useProductNeighbors(current, ["", "a/b", "v1"], 8));
    await waitFor(() =>
      expect(result.current.relatedProducts.map((x) => x.id)).toEqual(["irma"])
    );
    expect(result.current.recentlyViewedProducts).toEqual([]);
    expect(whereMock).toHaveBeenCalledWith("__id__", "in", ["v1"]);
  });
});
