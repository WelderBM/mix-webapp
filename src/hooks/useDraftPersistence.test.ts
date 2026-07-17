// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useDraftPersistence } from "./useDraftPersistence";

describe("useDraftPersistence", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("reports no draft when localStorage is empty", () => {
    const { result } = renderHook(() =>
      useDraftPersistence("test-key", { name: "" })
    );
    expect(result.current.hasDraft).toBe(false);
    expect(result.current.restoreDraft()).toBeNull();
  });

  it("detects an existing draft on mount", () => {
    localStorage.setItem("draft:test-key", JSON.stringify({ name: "rascunho" }));
    const { result } = renderHook(() =>
      useDraftPersistence("test-key", { name: "" })
    );
    expect(result.current.hasDraft).toBe(true);
    expect(result.current.restoreDraft()).toEqual({ name: "rascunho" });
  });

  it("writes to localStorage after the debounce delay when enabled", () => {
    const { rerender } = renderHook(
      ({ value }) => useDraftPersistence("test-key", value, { debounceMs: 500 }),
      { initialProps: { value: { name: "a" } } }
    );

    rerender({ value: { name: "ab" } });
    expect(localStorage.getItem("draft:test-key")).toBeNull();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(localStorage.getItem("draft:test-key")).toBe(
      JSON.stringify({ name: "ab" })
    );
  });

  it("does not write anything while disabled", () => {
    const { rerender } = renderHook(
      ({ value }) =>
        useDraftPersistence("test-key", value, {
          debounceMs: 100,
          enabled: false,
        }),
      { initialProps: { value: { name: "a" } } }
    );

    rerender({ value: { name: "ab" } });
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(localStorage.getItem("draft:test-key")).toBeNull();
  });

  it("clearDraft removes the entry and flips hasDraft to false", () => {
    localStorage.setItem("draft:test-key", JSON.stringify({ name: "rascunho" }));
    const { result } = renderHook(() =>
      useDraftPersistence("test-key", { name: "rascunho" })
    );
    expect(result.current.hasDraft).toBe(true);

    act(() => {
      result.current.clearDraft();
    });

    expect(result.current.hasDraft).toBe(false);
    expect(localStorage.getItem("draft:test-key")).toBeNull();
  });

  it("keys drafts independently per `key`", () => {
    localStorage.setItem("draft:product-1", JSON.stringify({ name: "P1" }));
    const { result } = renderHook(() =>
      useDraftPersistence("product-2", { name: "" })
    );
    expect(result.current.hasDraft).toBe(false);
  });

  it("does not treat freshly-loaded data as a draft the moment persistence turns on", () => {
    // Reproduz o bug relatado: `enabled` vira true assim que o primeiro
    // onSnapshot chega, sem nenhuma edição real do usuário ainda. Usa a
    // MESMA referência de objeto entre renders pra simular um chamador
    // memoizado (como admin/page.tsx e ProductFormDialog.tsx agora fazem)
    // — só a mudança de `enabled` deve poder disparar uma escrita indevida
    // aqui, e é exatamente isso que o skip-da-primeira-escrita evita.
    const loadedValue = { name: "carregado-do-servidor" };
    const editedValue = { name: "editado-pelo-usuario" };

    const { rerender } = renderHook(
      ({ enabled, value }) =>
        useDraftPersistence("test-key", value, { debounceMs: 100, enabled }),
      { initialProps: { enabled: false, value: loadedValue } }
    );

    // enabled vira true, mas com a MESMA referência — nenhuma edição.
    rerender({ enabled: true, value: loadedValue });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(localStorage.getItem("draft:test-key")).toBeNull();

    // Re-render repassando a mesma referência de novo — ainda nada.
    rerender({ enabled: true, value: loadedValue });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(localStorage.getItem("draft:test-key")).toBeNull();

    // Só uma edição de verdade (referência/dado diferente) grava.
    rerender({ enabled: true, value: editedValue });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(localStorage.getItem("draft:test-key")).toBe(
      JSON.stringify(editedValue)
    );
  });
});
