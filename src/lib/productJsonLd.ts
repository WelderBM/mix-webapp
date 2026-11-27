import type { Product } from "@/types";
import { getEffectiveUnitPrice } from "@/lib/ribbon-pricing";
import { SITE_URL } from "@/lib/siteUrl";

// Dados estruturados de Produto (schema.org) da página /produto/[id]. Com
// eles o Google pode mostrar preço e disponibilidade no resultado da busca
// e entender que é uma loja de Boa Vista. Sem preço, sai sem `offers` (o
// Google não aceita oferta sem preço).
export function productJsonLd(product: Product, image?: string) {
  const url = `${SITE_URL}/produto/${product.id}`;
  const price = getEffectiveUnitPrice(product);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    url,
    sku: product.sourceCode ?? product.id,
    ...(image ? { image: [image] } : {}),
    ...(product.description ? { description: product.description } : {}),
    ...(product.brand ? { brand: { "@type": "Brand", name: product.brand } } : {}),
    ...(product.category ? { category: product.category } : {}),
    ...(price != null
      ? {
          offers: {
            "@type": "Offer",
            url,
            price: price.toFixed(2),
            priceCurrency: "BRL",
            availability:
              product.inStock && product.disabled !== true
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
            seller: { "@type": "LocalBusiness", "@id": SITE_URL, name: "Mix Novidades" },
          },
        }
      : {}),
  };
}

// JSON dentro de <script>: "<" escapado para nenhum texto fechar a tag.
export const jsonLdString = (data: unknown) =>
  JSON.stringify(data).replace(/</g, "\\u003c");
