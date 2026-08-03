import { cache } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product } from "@/types";
import { getEffectiveUnitPrice } from "@/lib/ribbon-pricing";
import ProductPageClient from "@/components/features/ProductPageClient";

// Rota depende de dado que muda a qualquer momento (preço, estoque, imagem
// escolhida pelo admin) e é acessada via link direto/compartilhado — mesma
// justificativa de `src/app/page.tsx` pra `force-dynamic`.
export const dynamic = "force-dynamic";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

// `cache()` do React deduplica a mesma busca dentro de um único request —
// `generateMetadata` e o Server Component da página rodam em paralelo e os
// dois precisam do mesmo produto; sem isso seria um getDoc duplicado por
// carregamento de página.
const getProduct = cache(async (id: string): Promise<Product | null> => {
  try {
    const docRef = doc(db, "products", id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as Product;
  } catch (error) {
    console.error(
      `Erro ao carregar produto ${id}: ${
        (error as any)?.message || "Erro desconhecido"
      }`
    );
    return null;
  }
});

function resolveOgImage(product: Product): string | undefined {
  const cover = product.images?.find((img) => img.isCover);
  return cover?.url || product.images?.[0]?.url || product.imageUrl || undefined;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return {
      title: "Produto não encontrado",
      description: "Este produto não está mais disponível na Mix Novidades.",
    };
  }

  const price = getEffectiveUnitPrice(product);
  const description =
    product.description ||
    `Confira ${product.name}${
      price != null ? ` por R$ ${price.toFixed(2)}` : ""
    } na Mix Novidades — presentes e festas em Boa Vista.`;
  const image = resolveOgImage(product);

  return {
    title: product.name,
    description,
    openGraph: {
      title: `${product.name} | Mix Novidades`,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  return <ProductPageClient product={product} />;
}
