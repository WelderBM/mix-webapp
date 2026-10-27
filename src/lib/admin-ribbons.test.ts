import { describe, it, expect } from "vitest";
import type { Product } from "@/types";
import { filterSortRibbons, nextSort, type RibbonTableFilter } from "./admin-ribbons";

const fita = (id: string, name: string, status: "FECHADO" | "ABERTO", rollPrice?: number, remaining = 100) =>
  ({
    id,
    name,
    type: "RIBBON",
    rollPrice,
    price: rollPrice ? rollPrice / 40 : undefined,
    ribbonInventory: { status, remainingMeters: remaining, totalRollMeters: 100 },
  }) as unknown as Product;

const list = [
  fita("a", "Fita Maxi 32mm Rosa", "FECHADO", 44),
  fita("b", "Fita Master 16mm Azul", "ABERTO", 30, 12),
  fita("c", "Fita Maxi 32mm Pêssego", "FECHADO"),
  { id: "x", name: "Balão", type: "SIMPLE" } as unknown as Product,
];
const base: RibbonTableFilter = { query: "", status: "todos", line: "", sort: { key: "name", dir: "asc" } };
const ids = (f: Partial<RibbonTableFilter>) => filterSortRibbons(list, { ...base, ...f }).map((p) => p.id);

describe("tabela de fitas do admin (#366)", () => {
  it("só fitas, ordenadas por nome", () => {
    expect(ids({})).toEqual(["b", "c", "a"]);
  });
  it("filtra por status, linha e busca sem acento", () => {
    expect(ids({ status: "ABERTO" })).toEqual(["b"]);
    expect(ids({ line: "maxi 32mm" })).toEqual(["c", "a"]);
    expect(ids({ query: "pessego" })).toEqual(["c"]);
  });
  it("preço sem valor vai para o fim nos dois sentidos", () => {
    expect(ids({ sort: { key: "rollPrice", dir: "asc" } })).toEqual(["b", "a", "c"]);
    expect(ids({ sort: { key: "rollPrice", dir: "desc" } })).toEqual(["a", "b", "c"]);
  });
  it("ordena por restante", () => {
    expect(ids({ sort: { key: "remaining", dir: "asc" } })).toEqual(["b", "c", "a"]);
  });
  it("clique no cabeçalho alterna o sentido", () => {
    expect(nextSort({ key: "name", dir: "asc" }, "name")).toEqual({ key: "name", dir: "desc" });
    expect(nextSort({ key: "name", dir: "desc" }, "status")).toEqual({ key: "status", dir: "asc" });
  });
});
