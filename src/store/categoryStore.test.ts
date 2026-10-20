import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock firebase/firestore before importing the store
vi.mock("firebase/firestore", () => ({
  collection: vi.fn(() => "categories-collection"),
  query: vi.fn((...args) => args),
  orderBy: vi.fn((field: string) => ({ field })),
  onSnapshot: vi.fn(),
}));

vi.mock("@/lib/firebase", () => ({
  db: {},
}));

import { onSnapshot } from "firebase/firestore";
import { useCategoryStore } from "@/store/categoryStore";

describe("categoryStore", () => {
  beforeEach(() => {
    useCategoryStore.setState({
      categories: [],
      isLoading: true,
      hasSubscribed: false,
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("starts with an empty categories list and isLoading true", () => {
    const store = useCategoryStore.getState();
    expect(store.categories).toEqual([]);
    expect(store.isLoading).toBe(true);
  });

  it("subscribes to the 'categories' collection ordered by 'order' and populates categories on snapshot", () => {
    (onSnapshot as any).mockImplementation((_q: any, onNext: any) => {
      onNext({
        docs: [
          { id: "fitas", data: () => ({ name: "Fitas", order: 0, active: true, subcategories: [] }) },
          { id: "baloes", data: () => ({ name: "Balões", order: 1, active: true, subcategories: [] }) },
        ],
      });
      return () => {};
    });

    useCategoryStore.getState().subscribe();

    const store = useCategoryStore.getState();
    expect(store.categories).toEqual([
      { id: "fitas", name: "Fitas", order: 0, active: true, subcategories: [] },
      { id: "baloes", name: "Balões", order: 1, active: true, subcategories: [] },
    ]);
    expect(store.isLoading).toBe(false);
  });

  it("does not open a second listener when subscribe is called more than once", () => {
    (onSnapshot as any).mockImplementation((_q: any, onNext: any) => {
      onNext({ docs: [] });
      return () => {};
    });

    useCategoryStore.getState().subscribe();
    useCategoryStore.getState().subscribe();
    useCategoryStore.getState().subscribe();

    expect(onSnapshot).toHaveBeenCalledTimes(1);
  });

  it("sets isLoading to false and logs the error when the snapshot listener errors", () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const error = new Error("Firestore connection error");

    (onSnapshot as any).mockImplementation((_q: any, _onNext: any, onError: any) => {
      onError(error);
      return () => {};
    });

    useCategoryStore.getState().subscribe();

    const store = useCategoryStore.getState();
    expect(store.isLoading).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalledWith("Erro ao buscar categorias:", error);

    consoleErrorSpy.mockRestore();
  });
});
