import { Metadata } from "next";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  limit,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product } from "@/lib/types";
import ProductDetailClient from "@/components/views/ProductDetailClient";

// 1. Gerar Metadados para SEO (Título e Descrição do Produto)
export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const docRef = doc(db, "products", params.id);
  const snap = await getDoc(docRef);

  if (!snap.exists()) return { title: "Produto não encontrado" };

  const product = snap.data() as Product;
  return {
    title: `${product.name} | Mix Novidades`,
    description:
      product.description || `Compre ${product.name} por R$ ${product.price}.`,
    openGraph: {
      images: [product.imageUrl || "/placeholder.png"],
    },
  };
}

// 2. Buscar Dados do Produto + Relacionados
async function getProductData(id: string) {
  const docRef = doc(db, "products", id);
  const snap = await getDoc(docRef);

  if (!snap.exists()) return null;

  const product = { id: snap.id, ...snap.data() } as Product;

  // Buscar 4 produtos da mesma categoria (Relacionados)
  const relatedQ = query(
    collection(db, "products"),
    where("category", "==", product.category),
    limit(5)
  );
  const relatedSnap = await getDocs(relatedQ);
  const relatedProducts = relatedSnap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Product))
    .filter((p) => p.id !== product.id) // Remove o próprio produto
    .slice(0, 4);

  return { product, relatedProducts };
}

export default async function ProductPage({
  params,
}: {
  params: { id: string };
}) {
  const data = await getProductData(params.id);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Produto não encontrado.
      </div>
    );
  }

  return (
    <ProductDetailClient
      product={data.product}
      relatedProducts={data.relatedProducts}
    />
  );
}
