import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/providers/ThemeProvider";
import Navbar from "@/components/layout/Navbar"; // Importando a Navbar
import { Footer } from "@/components/layout/Footer";
import { Toaster } from "@/components/ui/sonner";
import { CartSidebar } from "@/components/features/CartSidebar";
import { SeasonalAtmosphere } from "@/components/layout/SeasonalAtmosphere";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mix Novidades",
  description: "Sua loja de presentes e utilidades",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <ThemeProvider>
          <SeasonalAtmosphere />

          {/* NAVBAR FIXA NO TOPO */}
          <Navbar />

          {/* CONTEÚDO DA PÁGINA */}
          <div className="min-h-screen">{children}</div>

          {/* RODAPÉ E MODAIS GLOBAIS */}
          <Footer />
          <CartSidebar />
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
