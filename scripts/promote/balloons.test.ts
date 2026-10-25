import { describe, expect, it } from "vitest";
import type { BalloonConfig } from "../../src/types/balloon";
import {
  catalogImageUrls,
  describeCatalogChange,
  downloadUrl,
  parseStorageUrl,
  rewriteImageUrls,
  samePhoto,
} from "./balloons";

const url = downloadUrl("mix-webapp-staging.firebasestorage.app", "balloons/candy 9.webp", "tok");

const cfg = (o: Partial<BalloonConfig> = {}): BalloonConfig => ({
  allColors: [],
  types: [
    {
      id: "candy",
      name: "Candy Colors",
      brand: "São Roque",
      imageUrl: url,
      colors: ["Rosa", "Azul"],
      sizes: [
        { size: "5", price: 17.5, unitsPerPackage: 25 },
        { size: "9", price: 27, unitsPerPackage: 25 },
      ],
    },
  ],
  ...o,
});

describe("promover balões (#319)", () => {
  it("lê bucket e caminho do link de download (ida e volta)", () => {
    expect(parseStorageUrl(url)).toEqual({ bucket: "mix-webapp-staging.firebasestorage.app", path: "balloons/candy 9.webp" });
    expect(parseStorageUrl("https://exemplo.com/x.png")).toBeNull();
    expect(parseStorageUrl("não é link")).toBeNull();
  });

  it("lista as fotos sem repetir e troca pelos links novos", () => {
    const c = cfg({ placeholderUrl: url });
    expect(catalogImageUrls(c)).toEqual([url]);
    const out = rewriteImageUrls(c, new Map([[url, "https://novo"]]));
    expect(out.types[0].imageUrl).toBe("https://novo");
    expect(out.placeholderUrl).toBe("https://novo");
    expect(c.types[0].imageUrl).toBe(url); // não muda o original
  });

  it("descreve tipo novo, preço mudado, tamanho que sai e cores", () => {
    expect(describeCatalogChange(null, cfg())[0]).toMatch(/^\+ Candy Colors \(São Roque\): tipo novo/);
    const prod = cfg();
    const next = cfg();
    next.types[0].sizes = [{ size: "9", price: 30, unitsPerPackage: 25 }];
    next.types[0].colors = ["Rosa", "Verde", "Lilás"];
    const [line] = describeCatalogChange(prod, next);
    expect(line).toContain("9 R$ 27,00→R$ 30,00");
    expect(line).toContain("−5");
    expect(line).toContain("+2 cores");
    expect(line).toContain("−1 cores");
    expect(describeCatalogChange(prod, cfg({ types: [] }))).toEqual(["− Candy Colors: sai do catálogo"]);
    expect(describeCatalogChange(prod, cfg())).toEqual([]);
  });
});

describe("promover balões: comparação (⚪ do #329)", () => {
  it("preço e pacote mudando juntos aparecem os dois", () => {
    const prod = cfg();
    const next = cfg();
    next.types[0].sizes = [
      { size: "5", price: 17.5, unitsPerPackage: 25 },
      { size: "9", price: 30, unitsPerPackage: 50 },
    ];
    const [line] = describeCatalogChange(prod, next);
    expect(line).toContain("9 R$ 27,00→R$ 30,00");
    expect(line).toContain("9 pacote 25→50");
  });

  it("mesma foto em outro bucket/token não conta como mudança", () => {
    const prodCfg = cfg();
    prodCfg.types[0].imageUrl = downloadUrl("mix-webapp.firebasestorage.app", "balloons/candy 9.webp", "outro");
    expect(describeCatalogChange(prodCfg, cfg())).toEqual([]);
    expect(samePhoto(url, downloadUrl("b", "outra.webp", "t"))).toBe(false);
  });
});
