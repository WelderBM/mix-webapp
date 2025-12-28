import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Central de Fitas",
  description:
    "Compre fitas em metro ou rolo fechado. Diversas cores e modelos para seus presentes e artesanato.",
  openGraph: {
    title: "Central de Fitas | Mix Novidades",
    description:
      "Fitas de cetim, decorativas e muito mais. Venda por metro ou atacado.",
    images: ["/og-fitas.jpg"], // Placeholder
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
