import { describe, it, expect } from "vitest";
import {
  balloonSizeHint,
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
    expect(decodeURIComponent(balloonTypeImage("foil_numeros"))).toContain(">A1</text>");
    expect(balloonTypeImage("tipo-novo-do-admin")).toContain("data:image/svg+xml");
    // Cartão do tipo é um buquê (packQty 3) e mesmo assim sai SEM legenda;
    // o desenho do tamanho sai sem fundo (sem <rect>).
    expect(decodeURIComponent(balloonTypeImage("simples"))).not.toContain("Pacote");
    expect(decodeURIComponent(balloonSizeImage("candy"))).not.toContain("<rect");
    expect(decodeURIComponent(balloonTypeImage("candy"))).toContain("<rect");
  });

  it("tamanho em proporção: 5 < 9 < 16; 40cm ≈ 16 pol; canudo fixo", () => {
    expect(balloonVisualPx("simples", "5")).toBeLessThan(balloonVisualPx("simples", "9"));
    expect(balloonVisualPx("simples", "9")).toBeLessThan(balloonVisualPx("simples", "16"));
    expect(sizeInInches("foil_numeros", "40cm")).toBe(16);
    expect(balloonVisualPx("foil_numeros", "40cm")).toBe(balloonVisualPx("simples", "16"));
    expect(sizeInInches("canudo", "260")).toBeNull();
    expect(balloonVisualPx("foil_numeros", "75cm")).toBeLessThanOrEqual(96);
  });

  it("canudo é tubo comprido (não gota); cintilante tem cor viva e pontos de brilho", () => {
    const canudo = decodeURIComponent(balloonTypeImage("canudo"));
    expect(canudo).toContain('stroke-linecap="round"');
    expect(canudo).not.toContain("<ellipse");
    expect(decodeURIComponent(balloonSizeImage("canudo"))).not.toContain("<rect");
    const cint = decodeURIComponent(balloonTypeImage("cintilante"));
    expect(cint).toContain("#db2777");
    expect(cint.match(/opacity="0.95"/g)?.length).toBe(5);
    expect(balloonSizeHint("canudo")).toContain("modelar");
    expect(balloonSizeHint("simples")).toBeNull();
  });

  it("rótulo certo para cada unidade", () => {
    expect(balloonSizeLabel("simples", "9")).toBe('9"');
    expect(balloonSizeLabel("simples", "6.5")).toBe('6.5"');
    expect(balloonSizeLabel("foil_numeros", "40cm")).toBe("40 cm");
    expect(balloonSizeLabel("canudo", "260")).toBe("260");
  });
});
