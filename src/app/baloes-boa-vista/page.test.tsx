// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import BaloesBoaVistaPage from "./page";

describe("BaloesBoaVistaPage", () => {
  it("renders the hero heading without throwing", () => {
    render(<BaloesBoaVistaPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: /Balões em Boa Vista/i })
    ).toBeTruthy();
  });

  it("renders the hero image via next/image with fill, priority and real sizes instead of a CSS background", () => {
    const { container } = render(<BaloesBoaVistaPage />);

    // A imagem de fundo não deve mais existir como CSS "background: url(...)".
    expect(container.innerHTML).not.toContain("bg-cover");

    const heroImg = container.querySelector("img");
    expect(heroImg).not.toBeNull();
    expect(heroImg?.getAttribute("sizes")).toBe("100vw");
    expect(heroImg?.src).toContain("images.unsplash.com");
  });
});
