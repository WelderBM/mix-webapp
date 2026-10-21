import { describe, it, expect } from "vitest";
import {
  analyzeNoturnoRows,
  rowsFromSheet,
  priorityScore,
  normalizeText,
  type NoturnoRow,
} from "./noturno";

const row = (o: Partial<NoturnoRow>): NoturnoRow => ({
  code: "12345",
  ref: null,
  description: "PRODUTO TESTE QUALQUER",
  brand: "MARCA",
  stock: 5,
  unitCost: 2,
  ...o,
});

describe("rowsFromSheet", () => {
  it("acha o cabeçalho depois das linhas de endereço e lê as colunas", () => {
    const sheet = [
      ["MIX NOVIDADES"],
      ["RUA X, 945"],
      [],
      ["ID_PRODUTO", "REFORIGINAL", "DESCRICAO", "MARCA", "ESTOQUE", "CUSTOBASE"],
      [13734, "0-245.2.08", " PONTA GRAFITE 0,7MM", "VMP", 48, 0.74],
      [null, null, null, null, null, null],
    ];
    expect(rowsFromSheet(sheet)).toEqual([
      { code: "13734", ref: "0-245.2.08", description: " PONTA GRAFITE 0,7MM", brand: "VMP", stock: 48, unitCost: 0.74 },
    ]);
  });

  it("aceita número pt-BR em texto", () => {
    const sheet = [
      ["ID_PRODUTO", "REFORIGINAL", "DESCRICAO", "MARCA", "ESTOQUE", "CUSTOBASE"],
      ["1", "", "X", "", "5.933,000", "1,49"],
    ];
    const [r] = rowsFromSheet(sheet);
    expect(r.stock).toBe(5933);
    expect(r.unitCost).toBe(1.49);
    expect(r.ref).toBeNull();
  });

  it("erro claro quando o arquivo não é o export do Noturno", () => {
    expect(() => rowsFromSheet([["NOME", "PRECO"]])).toThrow(/Cabeçalho do Noturno/);
  });
});

describe("analyzeNoturnoRows", () => {
  it("limpa espaços do nome e monta texto de busca sem acento", () => {
    const [a] = analyzeNoturnoRows([row({ description: "  AGULHA  PONTA DUPLA  ", brand: "CÍRCULO", code: "777", ref: "AB-1" })]);
    expect(a.name).toBe("AGULHA PONTA DUPLA");
    expect(a.family).toBe("AGULHA");
    expect(a.searchText).toBe("agulha ponta dupla 777 ab-1 circulo");
  });

  it("fita de laço vira RIBBON por metro na categoria fitas", () => {
    const [a] = analyzeNoturnoRows([row({ description: "FITA CETIM N.5 VERMELHA" })]);
    expect(a.suggestedType).toBe("RIBBON");
    expect(a.suggestedUnit).toBe("m");
    expect(a.suggestedCategoryKey).toBe("fitas");
  });

  it("fita adesiva NÃO é fita de laço", () => {
    const [a] = analyzeNoturnoRows([row({ description: "FITA ADESIVA 38MIC 48X100" })]);
    expect(a.suggestedType).toBe("STANDARD_ITEM");
    expect(a.suggestedUnit).toBe("un");
    expect(a.suggestedCategoryKey).toBeNull();
    expect(a.isCoreFamily).toBe(false);
  });

  it("fita de laço conta como núcleo da loja", () => {
    const [a] = analyzeNoturnoRows([row({ description: "FITA MAXI TRUE LOVE 32MMX100M VERMELHO" })]);
    expect(a.isCoreFamily).toBe(true);
  });

  it("estoque fracionado sugere venda por metro", () => {
    const [a] = analyzeNoturnoRows([row({ description: "TNT BRANCO ROLO", stock: 12.5 })]);
    expect(a.flags).toContain("estoque_fracionario");
    expect(a.suggestedUnit).toBe("m");
  });

  it("canoniza marca com grafia variante", () => {
    const [a] = analyzeNoturnoRows([row({ brand: "BELO CHARME" })]);
    expect(a.brand).toBe("BELLO CHARME");
    expect(a.brandRaw).toBe("BELO CHARME");
    expect(a.flags).toContain("marca_variante");
  });

  it("marca duplicados com o mesmo grupo", () => {
    const res = analyzeNoturnoRows([
      row({ code: "1", description: "CANECA BRANCA 300ML" }),
      row({ code: "2", description: "CANECA  BRANCA 300ML" }),
      row({ code: "3", description: "CANECA AZUL 300ML" }),
    ]);
    expect(res[0].duplicateGroup).toBe(res[1].duplicateGroup);
    expect(res[0].duplicateGroup).not.toBeNull();
    expect(res[2].duplicateGroup).toBeNull();
  });

  it("datado de ano passado é marcado, do ano corrente não", () => {
    const [old, cur] = analyzeNoturnoRows([
      row({ code: "1", description: "AGENDA 2024 FLORAL" }),
      row({ code: "2", description: "AGENDA 2026 FLORAL" }),
    ]);
    expect(old.flags).toContain("datado");
    expect(cur.flags).not.toContain("datado");
  });

  it("perecível marcado, mas pelúcia de bombom não", () => {
    const [choc, plush] = analyzeNoturnoRows([
      row({ code: "1", description: "CHOCOLATE AO LEITE 90G" }),
      row({ code: "2", description: "PELUCIA URSO BOMBOM" }),
    ]);
    expect(choc.flags).toContain("perecivel");
    expect(plush.flags).not.toContain("perecivel");
  });

  it("EAN válido é aproveitado; inválido bloqueia", () => {
    const [ok, bad] = analyzeNoturnoRows([
      row({ code: "1", ref: "7891000315507" }),
      row({ code: "2", ref: "7891000315508" }),
    ]);
    expect(ok.ean).toBe("7891000315507");
    expect(ok.flags).not.toContain("sem_ean");
    expect(bad.ean).toBeNull();
    expect(bad.suggestedStatus).toBe("bloqueado");
  });

  it("registro coringa fica bloqueado", () => {
    const [a] = analyzeNoturnoRows([row({ code: "99999999", description: "PRODUTO NAO CADASTRADO" })]);
    expect(a.flags).toContain("placeholder");
    expect(a.suggestedStatus).toBe("bloqueado");
  });
});

describe("priorityScore", () => {
  const base = { isCoreFamily: false, flags: [] as any[], stock: 1, unitCost: 0 };

  it("núcleo da loja vem antes de fora do núcleo", () => {
    expect(priorityScore({ ...base, isCoreFamily: true })).toBeGreaterThan(
      priorityScore({ ...base, stock: 100, unitCost: 10 })
    );
  });

  it("mais dinheiro parado em estoque sobe", () => {
    expect(priorityScore({ ...base, stock: 50, unitCost: 10 })).toBeGreaterThan(
      priorityScore({ ...base, stock: 2, unitCost: 1 })
    );
  });

  it("descartável (datado/obsoleto/perecível) afunda mesmo no núcleo", () => {
    expect(priorityScore({ ...base, isCoreFamily: true, flags: ["datado"] })).toBeLessThan(
      priorityScore({ ...base })
    );
  });
});

describe("normalizeText", () => {
  it("remove acento, caixa e espaços extras", () => {
    expect(normalizeText("  Balão  ROXO ")).toBe("balao roxo");
  });
});
