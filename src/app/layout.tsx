// src/app/layout.tsx
"use client"; // Switch to client to check pathname

import { usePathname } from "next/navigation";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CartSidebar } from "@/components/features/CartSidebar";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Metadata cannot be exported from a "use client" file.
// Ideally, we split this, but for this project scope:
// We will just hide components via CSS or conditional rendering.

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: "Mix Novidades",
    image: "https://mixnovidades.com/loja-fachada.webp", // Sua URL real
    description:
      "Sua loja completa de presentes, embalagens e utilidades em Boa Vista.",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Rua Pedro Aldemar Bantim, 945",
      addressLocality: "Boa Vista",
      addressRegion: "RR",
      postalCode: "69300-000", // Coloque o CEP correto
      addressCountry: "BR",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 2.8235, // Coordenadas aproximadas de BV (pegue as exatas no Maps)
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
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <html lang="pt-BR" className="scroll-smooth">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50`}
        >
          <ThemeProvider>
            {!isAdmin && <Navbar />}
            {!isAdmin && <CartSidebar />}
            <div
              className={isAdmin ? "min-h-screen bg-slate-100" : "min-h-screen"}
            >
              {children}
            </div>
            {!isAdmin && <Footer />}
            <Toaster richColors position="top-center" />
          </ThemeProvider>
        </body>
      </html>
    </>
  );
}
