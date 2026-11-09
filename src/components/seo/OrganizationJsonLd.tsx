import { SITE_URL } from "@/lib/siteUrl";

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
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        opens: "09:00",
        closes: "13:00",
      },
    ],
    sameAs: ["https://instagram.com/mixnovidades_rr"],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
