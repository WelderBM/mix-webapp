import { SITE_URL } from "@/lib/siteUrl";
import { openingHoursSpecification } from "@/lib/storeHours";

export default function OrganizationJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Mix Novidades",
    // Domínio real (era mixnovidades.com.br, que não existe, e logo.png dava 404 — #400).
    image: `${SITE_URL}/icon.png`,
    "@id": SITE_URL,
    url: SITE_URL,
    telephone: "+5595984244194",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Rua Pedro Aldemar Bantim, 945",
      addressLocality: "Boa Vista",
      addressRegion: "RR",
      postalCode: "69300-000", // Update with accurate zip if known
      addressCountry: "BR",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 2.818, // Approximate, update with real coordinates if possible
      longitude: -60.671,
    },
    openingHoursSpecification: openingHoursSpecification(),
    // Formas de pagamento e área atendida (vistoria de SEO, 27/11). O CEP e as
    // coordenadas acima ainda são provisórios: o dono confirma qual é o certo
    // (Noturno: 69314-543, Dr. Silvio Botelho; Google Maps: 69316-544, Sen.
    // Hélio Campos).
    priceRange: "$",
    currenciesAccepted: "BRL",
    paymentAccepted: "Pix, Dinheiro, Cartão de crédito, Cartão de débito",
    areaServed: { "@type": "City", name: "Boa Vista" },
    sameAs: ["https://instagram.com/mixnovidades_rr"],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
