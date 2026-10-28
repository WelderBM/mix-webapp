import { describe, expect, it } from "vitest";
import type { Product } from "@/types";
import { imagesFrom, refreshCandidates } from "./refresh";

const p = (o: Partial<Product>) => ({ id: o.name, type: "RIBBON", sourceCode: "1", ...o }) as Product;

describe("refreshCandidates", () => {
  it("fitas do Noturno com uma imagem só (ou nenhuma), em ordem de nome", () => {
    const list = refreshCandidates([
      p({ name: "Fita B", images: [{ id: "cover", url: "u", isCover: true }] }),
      p({ name: "Fita A", imageUrl: "u" }),
      p({ name: "Fita C" }),
      p({ name: "Com fotos", images: [{ id: "cover", url: "u", isCover: true }, { id: "foto-2", url: "v", isCover: false }] }),
      p({ name: "Sem Noturno", sourceCode: undefined }),
      p({ name: "Balão", type: "STANDARD_ITEM" }),
    ]);
    expect(list.map((x) => x.name)).toEqual(["Fita A", "Fita B", "Fita C"]);
  });
});

describe("imagesFrom", () => {
  it("a primeira é a capa", () => {
    expect(imagesFrom(["a", "b"])).toEqual({
      images: [
        { id: "cover", url: "a", isCover: true },
        { id: "foto-2", url: "b", isCover: false },
      ],
      imageUrl: "a",
    });
  });
});
