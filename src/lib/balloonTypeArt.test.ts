import { describe, it, expect } from "vitest";
import {
  balloonSizeImage,
  balloonSizeLabel,
  balloonTypeImage,
  balloonVisualPx,
  sizeInInches,
} from "./balloonTypeArt";

describe("arte do montador de balões", () => {
  it("cada tipo tem a sua arte (data URL de SVG); tipo desconhecido não quebra", () => {
    const metal = balloonTypeImage("metalico");
    expect(metal.startsWith("data:image/svg+xml")).toBe(true);
    expect(metal).not.toBe(balloonTypeImage("simples"));
    expect(decodeURIComponent(balloonTypeImage("foil_numeros"))).toContain(">A</text>");
    expect(balloonTypeImage("tipo-novo-do-admin")).toContain("data:image/svg+xml");
    // sem legenda nem fundo no desenho do tamanho
    expect(decodeURIComponent(balloonSizeImage("candy"))).not.toContain("Pacote");
  });

  it("tamanho em proporção: 5 < 9 < 16; 40cm ≈ 16 pol; canudo fixo", () => {
    expect(balloonVisualPx("simples", "5")).toBeLessThan(balloonVisualPx("simples", "9"));
    expect(balloonVisualPx("simples", "9")).toBeLessThan(balloonVisualPx("simples", "16"));
    expect(sizeInInches("foil_numeros", "40cm")).toBe(16);
    expect(balloonVisualPx("foil_numeros", "40cm")).toBe(balloonVisualPx("simples", "16"));
    expect(sizeInInches("canudo", "260")).toBeNull();
  });

  it("rótulo certo para cada unidade", () => {
    expect(balloonSizeLabel("simples", "9")).toBe('9"');
    expect(balloonSizeLabel("simples", "6.5")).toBe('6.5"');
    expect(balloonSizeLabel("foil_numeros", "40cm")).toBe("40 cm");
    expect(balloonSizeLabel("canudo", "260")).toBe("260");
  });
});
