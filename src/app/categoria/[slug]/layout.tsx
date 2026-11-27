import type { Metadata } from "next";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Category } from "@/types";
import { categoryMetadata } from "@/lib/categoryMetadata";

// A página da categoria é montada no navegador; sem isto todas saíam com o
// título genérico da loja e sem canônico (vistoria de SEO, 27/11). O
// documento da categoria tem o próprio slug como id (Navbar → /categoria/{id}).
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  let category: Category | null = null;
  try {
    const snap = await getDoc(doc(db, "categories", slug));
    category = snap.exists() ? ({ id: snap.id, ...snap.data() } as Category) : null;
  } catch {
    // Sem Firestore (build do CI com credencial falsa): metadado padrão.
  }
  if (!category || !category.active) {
    return { title: "Categoria", robots: { index: false, follow: true } };
  }
  return categoryMetadata(category);
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
