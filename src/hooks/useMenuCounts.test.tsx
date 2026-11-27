// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

const state = { allProducts: [] as unknown[] };
vi.mock("@/store/productStore", () => {
  const useProductStore = (selector: (s: typeof state) => unknown) => selector(state);
  useProductStore.getState = () => state;
  return { useProductStore };
});

import { useMenuCounts } from "./useMenuCounts";

describe("useMenuCounts (#399)", () => {
  it("resposta sem contagem não fica guardada: a próxima montagem pede de novo", async () => {
    const counts = { Fitas: { total: 2, subs: {} } };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ counts: null }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ counts }) });
    vi.stubGlobal("fetch", fetchMock);

    const first = renderHook(() => useMenuCounts());
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    first.unmount();

    const second = renderHook(() => useMenuCounts());
    await waitFor(() => expect(second.result.current).toEqual(counts));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("com o catálogo já na store, não pede a contagem", async () => {
    state.allProducts = [{ id: "x" }];
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { result } = renderHook(() => useMenuCounts());
    await new Promise((r) => setTimeout(r, 0));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current).toBeNull();
    state.allProducts = [];
  });
});
