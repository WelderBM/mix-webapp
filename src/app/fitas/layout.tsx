import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fitas em Boa Vista: por metro ou rolo",
  description:
    "Fitas de cetim, decorativas, metalizadas e para laço em Boa Vista - RR. Compre por metro ou rolo fechado e monte seu laço na Mix Novidades.",
  alternates: { canonical: "/fitas" },
  // Sem `images`: usa a capa da loja (app/opengraph-image). O /og-fitas.jpg
  // que estava aqui não existe e deixava o link compartilhado sem foto.
  openGraph: {
    title: "Fitas em Boa Vista | Mix Novidades",
    description:
      "Fitas de cetim, decorativas e para laço, por metro ou rolo fechado.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
