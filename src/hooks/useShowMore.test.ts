// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useShowMore } from "./useShowMore";

describe("useShowMore (#345)", () => {
  const items = Array.from({ length: 30 }, (_, i) => i);

  it("mostra uma página e cresce no clique", () => {
    const { result } = renderHook(() => useShowMore(items, 12, "a"));
    expect(result.current.visible).toHaveLength(12);
    expect(result.current.remaining).toBe(18);
    act(() => result.current.showMore());
    expect(result.current.visible).toHaveLength(24);
  });

  it("volta à primeira página quando o filtro muda", () => {
    const { result, rerender } = renderHook(({ k }) => useShowMore(items, 12, k), {
      initialProps: { k: "a" },
    });
    act(() => result.current.showMore());
    rerender({ k: "b" });
    expect(result.current.visible).toHaveLength(12);
  });
});
