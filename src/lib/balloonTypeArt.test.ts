import { describe, it, expect } from "vitest";
import {
  balloonColorImage,
  balloonSizeHint,
  balloonSizeImage,
  balloonSizeLabel,
  sizeScale,
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
    // As duas medidas (#320).
    expect(balloonSizeLabel("simples", "9")).toBe('9" · 23 cm');
    expect(balloonSizeLabel("simples", "6.5")).toBe('6,5" · 17 cm');
    expect(balloonSizeLabel("foil_numeros", "40cm")).toBe('40 cm · 16"');
    expect(balloonSizeLabel("foil_numeros", "45cm")).toBe('45 cm · 18"');
    expect(balloonSizeLabel("foil_numeros", "70-75cm")).toBe('70–75 cm · 28–30"');
    expect(balloonSizeLabel("canudo", "260")).toBe("260");
  });
});

describe("sizeScale (#322)", () => {
  it("balões na escala de uma pessoa de 1,70 m", () => {
    const s = sizeScale("simples", ["9", "16"], 170);
    expect(s).toEqual([
      { size: "9", cm: 23, px: 23 },
      { size: "16", cm: 41, px: 41 },
    ]);
    expect(sizeScale("foil_numeros", ["70-75cm"], 170)[0].cm).toBe(76);
    expect(sizeScale("simples", ["5"], 50)[0].px).toBe(8); // mínimo visível
    expect(sizeScale("canudo", ["260"], 170)).toEqual([]);
  });
});

describe("balloonColorImage (#321)", () => {
  const svg = (u: string) => decodeURIComponent(u.replace("data:image/svg+xml;utf8,", ""));
  it("látex na cor escolhida", () => {
    const s = svg(balloonColorImage("simples", "#ff0000"));
    expect(s).toContain("#ff0000");
    expect(s).not.toContain("<text");
  });
  it("foil desenha a letra/número pedido, na cor, com brilho metálico", () => {
    const a = svg(balloonColorImage("foil_numeros", "#c0c0c0", "0"));
    expect(a).toMatch(/>0<\/text>/);
    expect(a).toContain("linearGradient");
    expect(svg(balloonColorImage("foil_numeros", "#c0c0c0"))).toMatch(/>A<\/text>/);
  });
  it("arco-íris usa as várias cores; marca usa a arte do tipo base", () => {
    expect(svg(balloonColorImage("foil_numeros", ["#ff0000", "#00ff00", "#0000ff"], "A"))).toContain("#00ff00");
    // Látex arco-íris: um balão só (não buquê de 3).
    const latex = svg(balloonColorImage("simples", ["#ff0000", "#00ff00", "#0000ff", "#ffff00"]));
    expect(latex).toBe(svg(balloonColorImage("simples", "#ff0000")));
    expect(balloonColorImage("simples__riberball", "#123456")).toBe(balloonColorImage("simples", "#123456"));
  });
});

describe("balloonColorImage: cores de degradê (⚪ do #334)", () => {
  const svg = (u: string) => decodeURIComponent(u.replace("data:image/svg+xml;utf8,", ""));
  it("canudo com 2 tons desenha um tubo só, sem cor indefinida", () => {
    const s = svg(balloonColorImage("canudo", ["#FFD700", "#FDB931"]));
    expect(s).not.toContain("undefined");
    expect(s.match(/stroke-width="42"/g)?.length).toBe(1);
  });
  it("Ouro no foil usa o ramo metálico de uma cor (não faixas)", () => {
    const one = svg(balloonColorImage("foil_numeros", ["#FFD700"], "A"));
    expect(svg(balloonColorImage("foil_numeros", ["#FFD700", "#FDB931"], "A"))).toBe(one);
  });
});
