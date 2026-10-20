// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CategoryManager } from "./CategoryManager";
import type { Category } from "@/types/category";
import type { Product } from "@/types/product";

function makeProduct(overrides: Partial<Product>): Product {
  return {
    id: `p-${Math.random()}`,
    name: "Produto",
    type: "STANDARD_ITEM",
    category: "Balões",
    unit: "un",
    inStock: true,
    disabled: false,
    price: 10,
    ...overrides,
  };
}

describe("CategoryManager — nudges (issue #69)", () => {
  it("avisa quando uma categoria não tem nenhum produto vinculado", () => {
    const categories: Category[] = [
      { id: "vazia", name: "Categoria Vazia", order: 0, active: true, subcategories: [] },
    ];
    const products: Product[] = [makeProduct({ category: "Outra Categoria" })];

    render(<CategoryManager categories={categories} products={products} />);

    expect(
      screen.getByText(/nenhum produto usa essa categoria hoje/i)
    ).toBeInTheDocument();
  });

  it("não avisa de categoria vazia quando nenhuma lista de produtos foi passada (evita falso positivo sem dado)", () => {
    const categories: Category[] = [
      { id: "vazia", name: "Categoria Vazia", order: 0, active: true, subcategories: [] },
    ];

    render(<CategoryManager categories={categories} />);

    expect(
      screen.queryByText(/nenhum produto usa essa categoria hoje/i)
    ).not.toBeInTheDocument();
  });

  it("não avisa de categoria vazia quando ela tem produtos vinculados", () => {
    const categories: Category[] = [
      { id: "baloes", name: "Balões", order: 0, active: true, subcategories: [] },
    ];
    const products: Product[] = [makeProduct({ category: "Balões" })];

    render(<CategoryManager categories={categories} products={products} />);

    expect(
      screen.queryByText(/nenhum produto usa essa categoria hoje/i)
    ).not.toBeInTheDocument();
  });

  it("avisa pra subdividir quando uma categoria tem 6+ produtos e nenhuma subcategoria", () => {
    const categories: Category[] = [
      { id: "baloes", name: "Balões", order: 0, active: true, subcategories: [] },
    ];
    const products: Product[] = Array.from({ length: 6 }, () =>
      makeProduct({ category: "Balões" })
    );

    render(<CategoryManager categories={categories} products={products} />);

    expect(
      screen.getByText(/6 produtos e nenhuma subcategoria/i)
    ).toBeInTheDocument();
  });

  it("não avisa pra subdividir com menos de 6 produtos", () => {
    const categories: Category[] = [
      { id: "fitas", name: "Fitas", order: 0, active: true, subcategories: [] },
    ];
    const products: Product[] = Array.from({ length: 5 }, () =>
      makeProduct({ category: "Fitas" })
    );

    render(<CategoryManager categories={categories} products={products} />);

    expect(
      screen.queryByText(/produtos e nenhuma subcategoria/i)
    ).not.toBeInTheDocument();
  });

  it("não avisa pra subdividir se a categoria já tem subcategoria, mesmo com muitos produtos", () => {
    const categories: Category[] = [
      {
        id: "baloes",
        name: "Balões",
        order: 0,
        active: true,
        subcategories: [{ id: "latex", name: "Látex", order: 0 }],
      },
    ];
    const products: Product[] = Array.from({ length: 8 }, () =>
      makeProduct({ category: "Balões" })
    );

    render(<CategoryManager categories={categories} products={products} />);

    expect(
      screen.queryByText(/produtos e nenhuma subcategoria/i)
    ).not.toBeInTheDocument();
  });
});
