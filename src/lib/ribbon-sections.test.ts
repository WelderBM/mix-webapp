import { describe, it, expect } from "vitest";
import { filterRibbons, ribbonSectionOf, ribbonSections } from "./ribbon-sections";

const p = (name: string, width?: number) => ({ name, width });

describe("seções da loja de fitas (#345)", () => {
  it("linha + largura pelo nome", () => {
    expect(ribbonSectionOf(p("Fita Master 16mm Lisa Borgonha")).label).toBe("Master 16mm");
    expect(ribbonSectionOf(p("Fita Plástica 32mm Xingo Listrada Laranja")).label).toBe("Plástica 32mm");
    expect(ribbonSectionOf(p("Fita Maxi Rosa", 32)).label).toBe("Maxi 32mm");
    expect(ribbonSectionOf(p("Fita de cetim vermelha")).label).toBe("Outras fitas");
    // Nome antigo com a metragem colada na largura (revisão do #353).
    expect(ribbonSectionOf(p("Fita Maxi 32mmx100m Rosa")).label).toBe("Maxi 32mm");
  });

  it("maiores primeiro e Outras no fim", () => {
    const s = ribbonSections([
      p("Fita de cetim"),
      p("Fita Master 16mm A"),
      p("Fita Master 16mm B"),
      p("Fita Maxi 32mm A"),
    ]);
    expect(s.map((x) => `${x.label}:${x.count}`)).toEqual(["Master 16mm:2", "Maxi 32mm:1", "Outras fitas:1"]);
  });

  it("filtra por seção e busca sem acento", () => {
    const list = [p("Fita Master 16mm Lisa Rosa"), p("Fita Maxi 32mm Rosa Pink"), p("Fita Master 16mm Prata")];
    expect(filterRibbons(list, "master 16mm", "")).toHaveLength(2);
    expect(filterRibbons(list, "", "rosa")).toHaveLength(2);
    expect(filterRibbons(list, "master 16mm", "ROSA")).toEqual([list[0]]);
    expect(filterRibbons([p("Fita Plástica 32mm Xadrez")], "", "plastica")).toHaveLength(1);
  });
});
