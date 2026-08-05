// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRecentlyViewed, MAX_RECENTLY_VIEWED } from "./useRecentlyViewed";

const STORAGE_KEY = "recently-viewed:products";

describe("useRecentlyViewed", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("starts with an empty list when localStorage has nothing stored", () => {
    const { result } = renderHook(() => useRecentlyViewed());
    expect(result.current.recentIds).toEqual([]);
  });

  it("reads a previously stored list on mount", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(["prod-2", "prod-1"]));
    const { result } = renderHook(() => useRecentlyViewed());
    expect(result.current.recentIds).toEqual(["prod-2", "prod-1"]);
  });

  it("does not throw when localStorage holds malformed JSON", () => {
    localStorage.setItem(STORAGE_KEY, "{not-json");
    const { result } = renderHook(() => useRecentlyViewed());
    expect(result.current.recentIds).toEqual([]);
  });

  it("recordVisit adds a new id to the front and persists it", () => {
    const { result } = renderHook(() => useRecentlyViewed());

    act(() => {
      result.current.recordVisit("prod-1");
    });

    expect(result.current.recentIds).toEqual(["prod-1"]);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual(["prod-1"]);
  });

  it("recordVisit accumulates distinct ids, most recent first", () => {
    const { result } = renderHook(() => useRecentlyViewed());

    act(() => {
      result.current.recordVisit("prod-1");
    });
    act(() => {
      result.current.recordVisit("prod-2");
    });
    act(() => {
      result.current.recordVisit("prod-3");
    });

    expect(result.current.recentIds).toEqual(["prod-3", "prod-2", "prod-1"]);
  });

  it("revisiting the same id moves it to the front without duplicating it", () => {
    const { result } = renderHook(() => useRecentlyViewed());

    act(() => {
      result.current.recordVisit("prod-1");
    });
    act(() => {
      result.current.recordVisit("prod-2");
    });
    act(() => {
      result.current.recordVisit("prod-1");
    });

    expect(result.current.recentIds).toEqual(["prod-1", "prod-2"]);
  });

  it(`caps the list at MAX_RECENTLY_VIEWED (${MAX_RECENTLY_VIEWED}), dropping the oldest entries`, () => {
    const { result } = renderHook(() => useRecentlyViewed());

    act(() => {
      // Visita MAX_RECENTLY_VIEWED + 3 produtos distintos.
      for (let i = 0; i < MAX_RECENTLY_VIEWED + 3; i++) {
        result.current.recordVisit(`prod-${i}`);
      }
    });

    expect(result.current.recentIds).toHaveLength(MAX_RECENTLY_VIEWED);
    // Mais recente primeiro: o último visitado é o índice mais alto.
    expect(result.current.recentIds[0]).toBe(
      `prod-${MAX_RECENTLY_VIEWED + 2}`
    );
    // Os 3 primeiros visitados (prod-0, prod-1, prod-2) saíram da lista.
    expect(result.current.recentIds).not.toContain("prod-0");
    expect(result.current.recentIds).not.toContain("prod-1");
    expect(result.current.recentIds).not.toContain("prod-2");
  });

  it("ignores an empty productId", () => {
    const { result } = renderHook(() => useRecentlyViewed());

    act(() => {
      result.current.recordVisit("");
    });

    expect(result.current.recentIds).toEqual([]);
  });
});
