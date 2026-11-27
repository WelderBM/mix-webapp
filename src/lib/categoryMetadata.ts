import type { Metadata } from "next";
import type { Category } from "@/types";

// Título, descrição e canônico de /categoria/{id} (vistoria de SEO, 27/11).
export function categoryMetadata(category: Pick<Category, "id" | "name">): Metadata {
  const title = `${category.name} em Boa Vista`;
  const description = `${category.name} na Mix Novidades, loja de presentes e festas em Boa Vista - RR. Veja preços e peça pelo site com retirada ou entrega.`;
  return {
    title,
    description,
    alternates: { canonical: `/categoria/${category.id}` },
    openGraph: { title: `${title} | Mix Novidades`, description },
  };
}
