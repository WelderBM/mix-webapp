import { describe, it, expect } from "vitest";
import { jsonLdString, productJsonLd } from "./productJsonLd";
import type { Product } from "@/types";

const base = {
  id: "abc",
  name: "Caneca Vidro Laço 3D 300ml",
  type: "STANDARD_ITEM",
  category: "Canecas e Xícaras",
  unit: "un",
  price: 34.9,
  inStock: true,
  disabled: false,
  sourceCode: "13495",
  brand: "Cromus",
} as Product;

describe("productJsonLd (SEO)", () => {
  it("produto com preço vira Product com Offer em reais e em estoque", () => {
    const ld = productJsonLd(base, "https://img/x.jpg") as Record<string, any>;
    expect(ld["@type"]).toBe("Product");
    expect(ld.url).toMatch(/\/produto\/abc$/);
    expect(ld.sku).toBe("13495");
    expect(ld.brand).toEqual({ "@type": "Brand", name: "Cromus" });
    expect(ld.image).toEqual(["https://img/x.jpg"]);
    expect(ld.offers).toMatchObject({
      price: "34.90",
      priceCurrency: "BRL",
      availability: "https://schema.org/InStock",
    });
  });

  it("sem estoque ou desativado sai como OutOfStock", () => {
    const ld = productJsonLd({ ...base, inStock: false }) as Record<string, any>;
    expect(ld.offers.availability).toBe("https://schema.org/OutOfStock");
  });

  it("sem preço não manda Offer (o Google recusa oferta sem preço)", () => {
    const ld = productJsonLd({ ...base, price: undefined }) as Record<string, any>;
    expect(ld.offers).toBeUndefined();
  });

  it("escapa < para não fechar o <script>", () => {
    expect(jsonLdString({ n: "</script>" })).not.toContain("</script>");
  });
});
