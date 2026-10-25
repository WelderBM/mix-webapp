import { describe, it, expect } from "vitest";
import { balloonSvg } from "./balloonArt";
import { RAINBOW_HEXES } from "@/lib/balloonColors";

const letra = (colors: string[]) => ({
  shape: "letra" as const,
  glyph: "A",
  colors,
  metallic: true,
  colorName: null,
  sizeLabel: null,
  packQty: null,
});

describe("arte da letra foil (#343)", () => {
  it("tem relevo de luz e costura na borda", () => {
    const svg = balloonSvg(letra(["#d4a017"]), "2", { caption: false, background: false });
    expect(svg).toContain("<feSpecularLighting");
    expect(svg).toContain('stroke-dasharray="3 9"');
    expect(svg).toContain(">2</text>");
  });

  it("arco-íris de cima para baixo, rosa no alto e azul embaixo", () => {
    const svg = balloonSvg(letra(RAINBOW_HEXES), "1", { caption: false, background: false });
    expect(svg).toContain('x1="0" y1="130" x2="0" y2="395"');
    expect(svg.indexOf(RAINBOW_HEXES[0])).toBeLessThan(svg.indexOf(RAINBOW_HEXES[5]));
  });
});
