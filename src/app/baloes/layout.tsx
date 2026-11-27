import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Orçamento de Balões",
  description:
    "Monte seu pacote de balões em Boa Vista - RR: látex, metalizados, números e letras. Escolha marca, cor e tamanho e peça pelo WhatsApp.",
  alternates: { canonical: "/baloes" },
  // Sem `images`: usa a capa da loja. O /og-baloes.jpg não existe.
  openGraph: {
    title: "Orçamento de Balões | Mix Novidades",
    description:
      "Personalize balões para sua festa em Boa Vista. Orçamento rápido via WhatsApp.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
