import { describe, expect, it, vi } from "vitest";
import { findRibbonPhotos } from "./find";

const catalog = [{ name: "Fita Maxi Lisa 32mmx100m Lilás", sku: "", images: ["https://albano/a.jpg", "https://albano/b.jpg"] }];
const img = (imageUrl: string) => ({ title: "", imageUrl, thumbnailUrl: imageUrl, width: 800, height: 800, domain: "" });

describe("findRibbonPhotos", () => {
  it("fabricante primeiro, sem gastar busca; o resto vai para a busca", async () => {
    const search = vi.fn(async () => [img("https://x/1.jpg"), img("https://x/2.jpg")]);
    const out = await findRibbonPhotos(
      [
        { id: "a", name: "FITA MAXI LISO 32MMX100M LILAS", brand: "ALBANO" },
        { id: "b", name: "FITA MASTER LISA AZUL ROYAL 32MMX100M", brand: "XINGO" },
      ],
      catalog,
      search,
    );
    expect(out.a).toEqual({ urls: ["https://albano/a.jpg", "https://albano/b.jpg"], source: "fabricante" });
    expect(out.b).toEqual({ urls: ["https://x/1.jpg", "https://x/2.jpg"], source: "busca" });
    expect(search).toHaveBeenCalledTimes(1);
    expect(search).toHaveBeenCalledWith("fita xingo master lisa azul royal 32mm");
  });

  it("sem chave da busca ou com erro: fica sem foto (o cadastro usa o desenho)", async () => {
    const item = { id: "b", name: "FITA MASTER LISA AZUL ROYAL 32MMX100M" };
    expect((await findRibbonPhotos([item], [], null)).b).toEqual({ urls: [], source: null });
    const boom = vi.fn(async () => {
      throw new Error("cota");
    });
    expect((await findRibbonPhotos([item], [], boom)).b).toEqual({ urls: [], source: null });
  });
});
