import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Orçamento de Balões",
  description:
    "Crie seu arranjo de balões personalizado. Escolha cores, tamanhos e modelos para sua festa.",
  openGraph: {
    title: "Orçamento de Balões | Mix Novidades",
    description:
      "Personalize balões para sua festa. Orçamento rápido via WhatsApp.",
    images: ["/og-baloes.jpg"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
