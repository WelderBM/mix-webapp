import { describe, it, expect } from "vitest";
import { googleImagesUrl, photoSearchQueries } from "./suggestions";

describe("sugestões de busca de foto (#347)", () => {
  it("nome, nome com fundo branco e versão curta, sem repetir", () => {
    expect(photoSearchQueries("Fita Master 16mm Lisa Borgonha")).toEqual([
      "Fita Master 16mm Lisa Borgonha",
      "Fita Master 16mm Lisa Borgonha fundo branco",
      "Fita Master 16mm Lisa",
    ]);
    expect(photoSearchQueries("Caneca  Branca")).toEqual(["Caneca Branca", "Caneca Branca fundo branco"]);
  });

  it("sem nome não sugere nada", () => {
    expect(photoSearchQueries("")).toEqual([]);
    expect(photoSearchQueries(undefined)).toEqual([]);
  });

  it("link do Google Imagens com a busca codificada", () => {
    expect(googleImagesUrl("fita & laço")).toBe("https://www.google.com/search?tbm=isch&q=fita%20%26%20la%C3%A7o");
  });
});
