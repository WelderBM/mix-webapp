import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/providers/ThemeProvider";
import Navbar from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Toaster } from "@/components/ui/sonner";
import { CartSidebar } from "@/components/features/CartSidebar";
// 1. IMPORT DO MODAL
import { KitBuilderModal } from "@/components/features/KitBuilderModal";
import OrganizationJsonLd from "@/components/seo/OrganizationJsonLd";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || "https://mixnovidades.com.br"
  ),
  title: {
    default: "Mix Novidades | Presentes e Festas em Boa Vista",
    template: "%s | Mix Novidades",
  },
  description:
    "Sua loja completa de ficas, balões personalizados, kits de presentes e produtos Natura em Boa Vista - RR. Encomende online e receba em casa!",
  keywords: [
    "Mix Novidades",
    "Fitas",
    "Balões",
    "Presentes",
    "Natura",
    "Boa Vista",
    "Roraima",
    "Decoração de Festas",
    "Laços Personalizados",
  ],
  authors: [{ name: "Mix Novidades" }],
  creator: "Mix Novidades",
  publisher: "Mix Novidades",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    title: "Mix Novidades | Presentes e Festas",
    description:
      "A melhor seleção de fitas, balões e presentes de Boa Vista. Personalize seu pedido online!",
    siteName: "Mix Novidades WebApp",
    images: [
      {
        url: "/og-image.jpg", // Make sure to add a default og-image to public folder later
        width: 1200,
        height: 630,
        alt: "Mix Novidades - Loja Online",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mix Novidades | Presentes e Festas",
    description: "Encomende fitas, balões e presentes online em Boa Vista.",
    creator: "@mixnovidades",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "google-site-verification-code", // Placeholder
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      {/* suppressHydrationWarning={true}
        Impede que extensões do navegador (como ColorZilla/Grammarly) quebram o app 
        ao injetar atributos no body antes do React carregar.
      */}
      <body className={inter.className} suppressHydrationWarning={true}>
        <ThemeProvider>
          <Navbar />

          {/* 2. MODAL DISPONÍVEL GLOBALMENTE */}
          <KitBuilderModal />

          <div className="min-h-screen">{children}</div>

          <Footer />
          <CartSidebar />
          <Toaster richColors position="top-center" />
          <OrganizationJsonLd />
        </ThemeProvider>
      </body>
    </html>
  );
}
