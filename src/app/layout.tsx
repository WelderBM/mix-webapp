import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/providers/ThemeProvider";
import Navbar from "@/components/layout/Navbar";
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
      {/* suppressHydrationWarning={true}
        Impede que extensões do navegador (como ColorZilla/Grammarly) quebram o app 
        ao injetar atributos no body antes do React carregar.
      */}
      <body className={inter.className} suppressHydrationWarning={true}>
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
