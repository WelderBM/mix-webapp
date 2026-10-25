import { describe, expect, it } from "vitest";
import { buildNameIndex, filterAdminProducts } from "./productsTabFilter";

const products = [
  { id: "1", name: "Balão Liso Azul", type: "STANDARD_ITEM", category: "Balões" },
  { id: "2", name: "Fita Cetim Vermelha", type: "RIBBON", category: "Fitas" },
  { id: "3", name: "Caixa Coração", type: "STANDARD_ITEM", category: "Caixas" },
] as const;

const list = [...products];
const index = buildNameIndex(list);

describe("filterAdminProducts", () => {
  it("busca vazia devolve tudo", () => {
    expect(filterAdminProducts(list, index, "", "ALL")).toHaveLength(3);
    expect(filterAdminProducts(list, index, "   ", "ALL")).toHaveLength(3);
  });

  it("ignora acento e maiúscula", () => {
    expect(filterAdminProducts(list, index, "balao", "ALL").map((p) => p.id)).toEqual(["1"]);
    expect(filterAdminProducts(list, index, "CORAÇÃO", "ALL").map((p) => p.id)).toEqual(["3"]);
  });

  it("combina busca e tipo", () => {
    expect(filterAdminProducts(list, index, "", "RIBBON").map((p) => p.id)).toEqual(["2"]);
    expect(filterAdminProducts(list, index, "fita", "STANDARD_ITEM")).toEqual([]);
  });

  it("filtra por categoria", () => {
    expect(filterAdminProducts(list, index, "", "ALL", "Caixas").map((p) => p.id)).toEqual(["3"]);
  });

  it("produto fora do índice ainda é encontrado", () => {
    const extra = { id: "9", name: "Laço Pronto", type: "STANDARD_ITEM", category: "" } as const;
    expect(filterAdminProducts([...list, extra], index, "laco", "ALL").map((p) => p.id)).toEqual(["9"]);
  });
});
