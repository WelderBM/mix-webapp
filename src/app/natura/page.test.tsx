// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import NaturaPage from "./page";

// Página é um Server Component async que busca produtos/settings no Firestore.
// Mockamos firebase/firestore pra resolver com dados vazios e testar só a
// renderização (hero via next/image + ISR config), sem tocar em rede real.
vi.mock("firebase/firestore", async () => {
  const actual = await vi.importActual<typeof import("firebase/firestore")>(
    "firebase/firestore"
  );
  return {
    ...actual,
    collection: vi.fn(),
    query: vi.fn(),
    orderBy: vi.fn(),
    doc: vi.fn(),
    getDocs: vi.fn().mockResolvedValue({ docs: [] }),
    getDoc: vi.fn().mockResolvedValue({
      exists: () => false,
      data: () => ({}),
    }),
  };
});

describe("NaturaPage", () => {
  it("renders the hero heading without throwing", async () => {
    const jsx = await NaturaPage();
    render(jsx);
    expect(
      screen.getByRole("heading", { level: 1, name: /Natura em Boa Vista/i })
    ).toBeTruthy();
  });

  it("renders the hero image via next/image with fill, priority and real sizes instead of a CSS background", async () => {
    const jsx = await NaturaPage();
    const { container } = render(jsx);

    expect(container.innerHTML).not.toContain("bg-cover");

    const heroImg = container.querySelector("img");
    expect(heroImg).not.toBeNull();
    expect(heroImg?.getAttribute("sizes")).toBe("100vw");
    expect(heroImg?.src).toContain("images.unsplash.com");
  });
});
