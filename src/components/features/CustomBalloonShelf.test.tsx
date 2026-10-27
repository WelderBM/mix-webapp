// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { CustomBalloonShelf } from "./CustomBalloonShelf";

const { state } = vi.hoisted(() => ({
  state: { allProducts: [] as unknown[], isLoading: false, fetchProducts: vi.fn() },
}));
vi.mock("@/store/productStore", () => ({
  useProductStore: (sel: (s: typeof state) => unknown) => sel(state),
}));
vi.mock("@/components/features/ProductCard", () => ({
  ProductCard: ({ product }: { product: { name: string } }) => <div>{product.name}</div>,
}));

describe("Balões personalizados na página de balões", () => {
  beforeEach(() => {
    state.allProducts = [];
  });

  it("mostra só os produtos da subcategoria (nome com ou sem acento)", () => {
    state.allProducts = [
      { id: "1", name: "Balão Tema Bolinha", subcategory: "Balões personalizados" },
      { id: "2", name: "Balão Gigante Branco", subcategory: "baloes personalizados" },
      { id: "3", name: "Fita Master", subcategory: "Fita para laço" },
    ];
    render(<CustomBalloonShelf />);
    expect(screen.getByRole("heading", { name: "Balões personalizados" })).toBeTruthy();
    expect(screen.getByText("Balão Tema Bolinha")).toBeTruthy();
    expect(screen.getByText("Balão Gigante Branco")).toBeTruthy();
    expect(screen.queryByText("Fita Master")).toBeNull();
  });

  it("sem nenhum, a seção não aparece", () => {
    const { container } = render(<CustomBalloonShelf />);
    expect(container.innerHTML).toBe("");
  });
});
