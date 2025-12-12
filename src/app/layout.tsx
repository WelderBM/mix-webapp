import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    template: "%s | Mix Novidades",
    default: "Mix Novidades - Sua Loja de Presentes em Boa Vista",
  },
  description:
    "Encontre os melhores kits Natura, cestas de presentes, fitas, embalagens e utilidades em Boa Vista, Roraima. Entrega rápida e produtos exclusivos.",
  keywords: [
    "Natura",
    "Presentes",
    "Cestas",
    "Fitas",
    "Boa Vista",
    "Roraima",
    "Mix Novidades",
    "Embalagens",
  ],
  authors: [{ name: "Mix Novidades" }],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://mixnovidades.com", // Substitua pelo seu domínio real se tiver
    siteName: "Mix Novidades",
    images: [
      {
        url: "/loja-fachada.webp", // Usa a imagem que configuramos
        width: 1200,
        height: 630,
        alt: "Fachada da Mix Novidades",
      },
    ],
  },
};

// Dados Estruturados (Schema.org) para Negócio Local
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Store",
  name: "Mix Novidades",
  image: "https://mixnovidades.com/loja-fachada.webp",
  description:
    "Sua loja completa de presentes, embalagens e utilidades em Boa Vista.",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Rua Pedro Aldemar Bantim, 945",
    addressLocality: "Boa Vista",
    addressRegion: "RR",
    postalCode: "69300-000",
    addressCountry: "BR",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 2.8235,
    longitude: -60.6758,
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
  telephone: "+5595984244194",
  priceRange: "$$",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        {/* JSON-LD Inserido Corretamente no Server Side */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {children}

        {/* Componente de Notificações (Toast) */}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
