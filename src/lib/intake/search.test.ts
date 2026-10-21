import { describe, it, expect } from "vitest";
import { matchesQuery, parseQuery, searchTokensFor, tokenize } from "./search";

describe("tokenize", () => {
  it("separa por pontuação, sem acento e minúsculo", () => {
    expect(tokenize("BALÃO ROXO N.7 C/50 UND.")).toEqual(["balao", "roxo", "n", "7", "c", "50", "und"]);
  });
});

describe("searchTokensFor", () => {
  it("gera prefixos a partir de 2 letras, sem duplicar", () => {
    const t = searchTokensFor("roxo rosa");
    expect(t).toEqual(["ro", "ros", "rosa", "rox", "roxo"]);
  });

  it("limita o tamanho do prefixo pra palavras enormes", () => {
    const t = searchTokensFor("a".repeat(30));
    expect(Math.max(...t.map((x) => x.length))).toBe(15);
  });
});

describe("parseQuery", () => {
  it("usa o termo mais longo como chave de consulta", () => {
    expect(parseQuery("balao roxo 7")).toEqual({ indexToken: "balao", terms: ["balao", "roxo", "7"] });
  });

  it("evita nome de família e palavra genérica, que trariam centenas de itens", () => {
    const families = new Set(["balao", "saco"]);
    expect(parseQuery("balao roxo 7", families).indexToken).toBe("roxo");
    expect(parseQuery("saco para presente", families).indexToken).toBe("presente");
  });

  it("evita cor, mesmo digitada pela metade", () => {
    expect(parseQuery("fita cetim vermelh", new Set(["fita"])).indexToken).toBe("cetim");
  });

  it("se só houver termos comuns, usa o mais longo mesmo assim", () => {
    expect(parseQuery("balao", new Set(["balao"])).indexToken).toBe("balao");
  });

  it("sem termo de 2+ letras não consulta o banco", () => {
    expect(parseQuery("7").indexToken).toBeNull();
  });

  it("chave de consulta respeita o mesmo limite dos tokens salvos", () => {
    expect(parseQuery("x".repeat(20)).indexToken).toHaveLength(15);
  });

  it("toda chave de consulta existe nos tokens do item que ela deve achar", () => {
    const item = "fita cetim progresso n.5 vermelho";
    for (const q of ["verm", "progresso", "cetim n5", "fi"]) {
      const { indexToken } = parseQuery(q);
      expect(searchTokensFor(item)).toContain(indexToken);
    }
  });
});

describe("matchesQuery", () => {
  const item = "balao roxo n.7 c/50 und. 2041 circulo";

  it("casa termos fora de ordem e parciais", () => {
    expect(matchesQuery(item, tokenize("rox bal 7"))).toBe(true);
  });

  it("acha pelo código do Noturno", () => {
    expect(matchesQuery(item, tokenize("2041"))).toBe(true);
  });

  it("não casa se um dos termos não existe", () => {
    expect(matchesQuery(item, tokenize("balao azul"))).toBe(false);
  });

  it("termo no meio da palavra não conta (só começo)", () => {
    expect(matchesQuery(item, tokenize("alao"))).toBe(false);
  });
});
