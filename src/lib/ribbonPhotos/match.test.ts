import { describe, expect, it } from "vitest";
import { matchCatalog, pickSearchPhotos, ribbonTokens, searchQuery, widthOf } from "./match";

const p = (name: string, sku = "", images = ["https://albano.com.br/x.jpg"]) => ({ name, sku, images });

const catalog = [
  p("Fita Maxi Lisa 32mmx100m Lilás", "7893541316739"),
  p("Fita Maxi Lisa 32mmx100m Branco"),
  p("Fita Maxi Lisa 32mmx100m Azul Escuro"),
  p("Fita Maxi Select 16mmx50m Lilás"),
  p("Fita Maxi FM 03D 32mmx50m Vermelho/Ouro"),
  p("Fita Maxi FM 03D 32mmx50m Vermelho"),
  p("Fita Maxi Line 32mmx100m Azul Marinho/Ouro"),
  p("Fita Maxi Amore 32mmx100m Vermelho"),
  p("Fita Maxi Lisa 32mmx100m Amarela", "", []), // sem foto
];

describe("matchCatalog (fotos da Albano)", () => {
  it("o EAN manda", () => {
    expect(matchCatalog({ name: "QUALQUER", ean: "7893541316739" }, catalog)?.name).toBe("Fita Maxi Lisa 32mmx100m Lilás");
  });

  it("casa pelo nome, com as variações do Noturno", () => {
    const m = (name: string) => matchCatalog({ name }, catalog)?.name ?? null;
    expect(m("FITA MAXI LISO 32MMX100M BRANCA")).toBe("Fita Maxi Lisa 32mmx100m Branco");
    expect(m("FITA MAXI LISO 32MMX100M AZUL ESCURO P/ METRO")).toBe("Fita Maxi Lisa 32mmx100m Azul Escuro");
    expect(m("FITA MAXI LINE 32MMX100M AZUL MARINHO/OURO P METRO")).toBe("Fita Maxi Line 32mmx100m Azul Marinho/Ouro");
    // FM03D colado; a de menos palavras sobrando ganha (Vermelho, não Vermelho/Ouro).
    expect(m("FITA MAXI FM03D 32MMX100 VERMELHO")).toBe("Fita Maxi FM 03D 32mmx50m Vermelho");
  });

  it("não chuta: sem todas as palavras, ou sem foto, fica null", () => {
    expect(matchCatalog({ name: "FITA MAXI LISA 32MMX100M VERMELHO" }, catalog)).toBeNull(); // não confunde com Amore
    expect(matchCatalog({ name: "FITA MAXI LISO 32MMX100M AMARELO" }, catalog)).toBeNull(); // existe, mas sem foto
  });

  it("não põe foto de estampa em fita lisa (revisão #392)", () => {
    const cat = [
      p("Fita Maxi Chevron 32mmx100m Vermelho"),
      p("Fita Maxi Escamas 32mmx100m Vermelho"),
      p("Fita Maxi Lisa 32mmx100m Vermelha"),
      p("Fita Maxi Pois 16mmx50m Rosa"),
      p("Fita Maxi PaperLook Te Amo Mãe 16mmx50m Barbante/Ouro"),
      p("Fita Maxi Paper Look Glow 32mmx100m Barbante/Ouro"),
    ];
    const m = (name: string) => matchCatalog({ name }, cat)?.name ?? null;
    // Empate entre estampas e a lisa: sem modelo no nome, é a lisa.
    expect(m("FITA MAXI 32MMX100M VERMELHO")).toBe("Fita Maxi Lisa 32mmx100m Vermelha");
    // Só a estampa existe: sem modelo, não chuta.
    expect(m("FITA MAXI 16MMX50M ROSA")).toBeNull();
    // Mais de 1 palavra sobrando, ou outra largura com palavra a mais: outra fita.
    expect(m("FITA MAXI PAPERLOOK 16MMX50 BARBANTE/OURO")).toBeNull();
  });

  it("empate entre estampas sem a lisa: nenhuma", () => {
    const cat = [p("Fita Maxi Paperlook Chevron 32mmx100m Rosa"), p("Fita Maxi Paperlook Escamas 32mmx100m Rosa")];
    expect(matchCatalog({ name: "FITA MAXI PAPERLOOK 32MMX100M ROSA" }, cat)).toBeNull();
  });

  it("prefere a mesma largura", () => {
    const cat = [p("Fita Maxi Lilás 16mmx50m"), p("Fita Maxi Lilás 32mmx100m")];
    expect(matchCatalog({ name: "FITA MAXI 32MMX100M LILAS" }, cat)?.name).toBe("Fita Maxi Lilás 32mmx100m");
  });
});

describe("apoio", () => {
  it("medidas e palavras", () => {
    expect(widthOf("FITA PLASTICA 32X100 RIZZO LILI VERDE")).toBe(32);
    expect(widthOf("FITA PLASTICA RAPID METAL 30MMX100MM")).toBe(30);
    expect([...ribbonTokens("FITA PLASTICA GLITTER PINK 32MMX25M C/1 UN")]).toEqual(["PLASTICA", "GLITTER", "PINK"]);
  });

  it("monta a busca com a marca e a largura", () => {
    expect(searchQuery("FITA MASTER LISA AZUL ROYAL 32MMX100M", "XINGO")).toBe("fita xingo master lisa azul royal 32mm");
    expect(searchQuery("FITA PLASTICA RAPID METAL 30MMX100MM", "DIVERSOS")).toBe("fita plastica rapid metal 30mm");
  });

  it("escolhe fotos de produto: quase quadradas e com 300 px ou mais", () => {
    const r = (imageUrl: string, width: number | null, height: number | null) => ({ imageUrl, width, height });
    expect(
      pickSearchPhotos([r("banner", 1200, 400), r("ok1", 800, 800), r("mini", 120, 120), r("ok2", 600, 700), r("semtam", null, null), r("ok3", 500, 500), r("ok4", 900, 900)]),
    ).toEqual(["ok1", "ok2", "ok3"]);
  });
});
