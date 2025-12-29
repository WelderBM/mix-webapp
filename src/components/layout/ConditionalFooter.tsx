"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/layout/Footer";

export default function ConditionalFooter() {
  const pathname = usePathname();
  // Se estiver na rota /admin ou subrotas, não renderiza o Footer
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) return null;

  return <Footer />;
}
