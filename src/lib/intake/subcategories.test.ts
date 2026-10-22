import { describe, it, expect } from "vitest";
import {
  classifySubcategory,
  hasSubcategoryRules,
  matchSubcategory,
  planTaxonomy,
  buildTaxonomyWrites,
} from "./subcategories";

const it_ = (family: string | null, name: string, suggestedType = "STANDARD_ITEM") =>
  ({ family, name, suggestedType }) as Parameters<typeof classifySubcategory>[0];

describe("classifySubcategory (nomes reais do Noturno)", () => {
  it("fita: plástico para laço × cetim/tecido × adesiva", () => {
    expect(classifySubcategory(it_("FITA", "FITA MAXI FM03D 32MMX100 AMARELO", "RIBBON"))).toEqual({
      category: "Fitas",
      subcategory: "Fita para laço",
    });
    expect(classifySubcategory(it_("FITA", "FITA PLASTICA LISA 5CM", "RIBBON"))?.subcategory).toBe("Fita para laço");
    expect(classifySubcategory(it_("FITA", "FITA CETIM 10MM 50M ROSA", "RIBBON"))?.subcategory).toBe("Cetim e tecido");
    expect(classifySubcategory(it_("FITA", "FITA ORGANZA/LUREX 38MM", "RIBBON"))?.subcategory).toBe("Cetim e tecido");
    // Material vence acabamento: TNT LISA é tecido, não plástico.
    expect(classifySubcategory(it_("FITA", "FITA TNT LISA 40MMX50M AZUL ESCURO", "RIBBON"))?.subcategory).toBe("Cetim e tecido");
    expect(classifySubcategory(it_("FITA", "FITA ADESIVA 38MIC 48X30"))).toEqual({
      category: "Material Escolar",
      subcategory: "Fitas adesivas",
    });
  });

  it("fita de laço sem pista fica sem subcategoria (vai pra varredura)", () => {
    expect(classifySubcategory(it_("FITA", "FITA PARA ARCO DE BALAO", "RIBBON"))).toBeNull();
  });

  it("papéis por tipo", () => {
    const sub = (n: string) => classifySubcategory(it_("PAPEL", n))?.subcategory;
    expect(sub("PAPEL DE SEDA PRETO")).toBe("Seda");
    expect(sub("PAPEL EVA 40X60 AZUL")).toBe("EVA");
    expect(sub("PAPEL GUACHE COLORSET VERMELHO 66X48")).toBe("Guache");
    expect(sub("PAPEL MICROONDULADO 50X80 AZUL")).toBe("Microondulado");
    expect(sub("PAPEL CREPOM SUPER AMARELO")).toBe("Crepom");
    expect(sub("PAPEL CARTAO M AZUL")).toBe("Cartão");
    expect(sub("PAPEL CONTACTO COLOR")).toBe("Contact");
    expect(sub("PAPEL FOTOGRAFICO 180G A4")).toBe("Fotográfico");
    expect(sub("PAPEL A4 REPORT MULTIUSO 500F")).toBe("Sulfite e A4");
    expect(sub("PAPEL PARANA 80X100")).toBe("Paraná");
    expect(sub("PAPEL EVAC/ GLITER 40 X 48 DIVERSOS")).toBe("EVA");
    expect(classifySubcategory(it_("PAPEL", "PAPEL C/ PAUTA"))).toBeNull();
  });

  it("caixas, cestas e cachepôs na categoria Caixas; EVA/Cartolina em Papéis", () => {
    expect(classifySubcategory(it_("CESTA", "CESTA VIME P"))).toEqual({ category: "Caixas", subcategory: "Cestas" });
    expect(classifySubcategory(it_("CACHEPOT", "CACHEPOT RD AZUL"))?.subcategory).toBe("Cachepôs");
    expect(classifySubcategory(it_("CAIXA", "CAIXA KRAFT 20X20"))?.subcategory).toBe("Caixas");
    expect(classifySubcategory(it_("EVA", "EVA ESTAMPADO"))?.category).toBe("Papéis");
    expect(classifySubcategory(it_("CANETA", "CANETA BIC"))).toBeNull();
    expect(hasSubcategoryRules("CANETA")).toBe(false);
  });
});

describe("matchSubcategory", () => {
  const cats = [{ name: "Fitas", subcategories: [{ id: "a", name: "fita para laco", order: 0 }] }];
  it("casa por texto normalizado na categoria escolhida", () => {
    expect(matchSubcategory("Fita para laço", "fitas", cats)).toBe("fita para laco");
    expect(matchSubcategory("Cetim e tecido", "Fitas", cats)).toBeNull();
    expect(matchSubcategory("Fita para laço", "Caixas", cats)).toBeNull();
    expect(matchSubcategory(null, "Fitas", cats)).toBeNull();
  });
});

describe("planTaxonomy (varredura pós-importação)", () => {
  it("conta por subcategoria, lista o que falta criar e o que ficou sem regra", () => {
    const items = [
      it_("FITA", "FITA MAXI 32MMX100", "RIBBON"),
      it_("FITA", "FITA MAXI 32MMX100 AZUL", "RIBBON"),
      it_("FITA", "FITA PARA ARCO DE BALAO", "RIBBON"),
      it_("PAPEL", "PAPEL DE SEDA AZUL"),
      it_("CANETA", "CANETA BIC"),
    ];
    const cats = [{ name: "Fitas", subcategories: [{ id: "x", name: "Fita para laço", order: 0 }] }];
    const p = planTaxonomy(items, cats);
    expect(p.classified).toEqual([
      { category: "Fitas", subcategory: "Fita para laço", count: 2 },
      { category: "Papéis", subcategory: "Seda", count: 1 },
    ]);
    expect(p.missingCategories).toEqual(["Papéis"]);
    expect(p.missingSubcategories).toEqual([{ category: "Papéis", subcategory: "Seda" }]);
    expect(p.unclassified).toEqual([{ family: "FITA", count: 1, examples: ["FITA PARA ARCO DE BALAO"] }]);
  });
});

describe("buildTaxonomyWrites (criar o que falta)", () => {
  const slug = (n: string, ids: string[]) => {
    const b = n.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-");
    return ids.includes(b) ? `${b}-2` : b;
  };
  it("cria categoria nova com subcategorias e acrescenta subcategorias nas existentes", () => {
    const cats = [
      { id: "fitas", name: "Fitas", order: 0, active: true, subcategories: [{ id: "x", name: "Outra", order: 0 }] },
    ];
    const w = buildTaxonomyWrites(
      {
        missingCategories: ["Papéis"],
        missingSubcategories: [
          { category: "Fitas", subcategory: "Fita para laço" },
          { category: "Papéis", subcategory: "Seda" },
          { category: "Papéis", subcategory: "Seda" },
        ],
      },
      cats,
      slug,
    );
    const fitas = w.find((x) => x.id === "fitas")!;
    expect(fitas.isNew).toBe(false);
    expect(fitas.data).toEqual({
      subcategories: [
        { id: "x", name: "Outra", order: 0 },
        { id: "fita-para-laco", name: "Fita para laço", order: 1 },
      ],
    });
    const papeis = w.find((x) => x.id === "papeis")!;
    expect(papeis.isNew).toBe(true);
    expect(papeis.data).toMatchObject({ name: "Papéis", active: true, order: 1 });
    expect(papeis.data.subcategories).toEqual([{ id: "seda", name: "Seda", order: 0 }]);
    expect(cats[0].subcategories).toHaveLength(1); // não muta a entrada
  });
});
