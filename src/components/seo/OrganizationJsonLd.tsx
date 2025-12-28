export default function OrganizationJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Mix Novidades",
    image: "https://mixnovidades.com.br/logo.png", // Ensure this exists or use a valid URL
    "@id": "https://mixnovidades.com.br",
    url: "https://mixnovidades.com.br",
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
        ],
        opens: "08:00",
        closes: "19:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Sunday",
        opens: "08:00",
        closes: "12:00",
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
