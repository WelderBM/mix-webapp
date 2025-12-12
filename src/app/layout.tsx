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

  return (
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
  );
}
