// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { BalloonSizeScale, FoilTextScale } from "./BalloonSizeScale";

describe("escala com a pessoa de 1,70 m (#344)", () => {
  it("tamanho único (Linha Uniq) mostra a pessoa e um balão", () => {
    const { container } = render(<BalloonSizeScale typeId="uniq" sizes={["16"]} />);
    expect(container.querySelectorAll("img")).toHaveLength(2);
    expect(container.textContent).toContain("1,70 m");
  });

  it("letras: uma imagem por letra, espaço separa as palavras", () => {
    const { container } = render(
      <FoilTextScale typeId="foil_numeros" size="40cm" text="ANA 15" hexes={["#d4a017"]} />,
    );
    // pessoa + A, N, A + 1, 5
    expect(container.querySelectorAll("img")).toHaveLength(6);
  });

  it("sem texto não mostra nada", () => {
    const { container } = render(
      <FoilTextScale typeId="foil_numeros" size="40cm" text="  " hexes={["#d4a017"]} />,
    );
    expect(container.innerHTML).toBe("");
  });
});
