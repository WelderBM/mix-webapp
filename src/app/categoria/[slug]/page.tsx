// src/app/categoria/[slug]/page.tsx
//
// Página de listagem por categoria (issue #70). Segue o mesmo padrão
// client-side de /fitas e /produto/[id]: sem fetch server-side, dados vêm
// dos stores Zustand já compartilhados com a Navbar (useCategoryStore via
// onSnapshot, useProductStore via getDocs) — sem query extra por categoria,
// só filtra em memória o catálogo que a Navbar/outras páginas já carregam.
"use client";

import { Suspense, useEffect, useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { useCategoryStore } from "@/store/categoryStore";
import { useProductStore } from "@/store/productStore";
import { StoreHeader } from "@/components/layout/StoreHeader";
import { ProductCard } from "@/components/features/ProductCard";
import { BackButton } from "@/components/ui/BackButton";
import { filterProductsByCategory } from "@/lib/categories";
import { cn } from "@/lib/utils";

function CategoriaContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params?.slug as string | undefined;
  const subParam = searchParams.get("sub");

  const categories = useCategoryStore((state) => state.categories);
  const categoriesLoading = useCategoryStore((state) => state.isLoading);
  const subscribeToCategories = useCategoryStore((state) => state.subscribe);

  const allProducts = useProductStore((state) => state.allProducts);
  const productsLoading = useProductStore((state) => state.isLoading);
  const fetchProducts = useProductStore((state) => state.fetchProducts);

  useEffect(() => {
    subscribeToCategories();
  }, [subscribeToCategories]);

  useEffect(() => {
    if (allProducts.length === 0 && productsLoading) {
      fetchProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Categoria inativa se comporta como "não encontrada" — não deve ficar
  // navegável por link direto se o admin desativou.
  const category = useMemo(
    () => categories.find((c) => c.id === slug && c.active) ?? null,
    [categories, slug]
  );

  const activeSubcategory = useMemo(
    () =>
      category && subParam
        ? category.subcategories.find((s) => s.id === subParam) ?? null
        : null,
    [category, subParam]
  );

  const products = useMemo(() => {
    if (!category) return [];
    return filterProductsByCategory(
      allProducts,
      category.name,
      activeSubcategory?.name
    );
  }, [allProducts, category, activeSubcategory]);

  const isLoading = categoriesLoading || productsLoading;

  if (isLoading && !category) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-2xl font-bold text-slate-800">
          Categoria não encontrada 😕
        </h1>
        <p className="text-slate-500 max-w-sm">
          Essa categoria pode ter sido renomeada ou removida.
        </p>
        <BackButton fallbackHref="/" variant="outline" />
      </div>
    );
  }

  const sortedSubcategories = category.subcategories
    .slice()
    .sort((a, b) => a.order - b.order);

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      <StoreHeader />

      <div className="max-w-6xl mx-auto px-0 sm:px-4 -mt-4 relative z-10">
        <div className="bg-white sm:rounded-3xl shadow-sm border-t sm:border border-slate-100 overflow-hidden min-h-[400px]">
          <div className="p-6 sm:p-8 border-b bg-linear-to-r from-slate-50 to-white">
            <BackButton
              fallbackHref="/"
              className="mb-3 px-0 text-slate-400 hover:text-slate-800"
            />
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
              {category.name}
            </h1>
            <p className="text-sm sm:text-base text-slate-500 mt-1">
              {products.length}{" "}
              {products.length === 1
                ? "produto encontrado"
                : "produtos encontrados"}
            </p>

            {sortedSubcategories.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                <Link
                  href={`/categoria/${category.id}`}
                  className={cn(
                    // min-h-11/min-w-11 (44px): baseline de touch target
                    // (mobile-first-guide) — chip de filtro é tocado com
                    // frequência, não pode ficar abaixo de 44px mesmo em
                    // telas pequenas (não há variante `md:` escondendo isso
                    // no mobile).
                    "min-h-11 min-w-11 flex items-center justify-center text-xs font-bold rounded-full px-3 py-1.5 border transition-colors",
                    !activeSubcategory
                      ? "bg-purple-600 border-purple-600 text-white"
                      : "bg-white border-slate-200 text-slate-600 hover:border-purple-300"
                  )}
                >
                  Todas
                </Link>
                {sortedSubcategories.map((sub) => (
                  <Link
                    key={sub.id}
                    href={`/categoria/${category.id}?sub=${sub.id}`}
                    className={cn(
                      "min-h-11 min-w-11 flex items-center justify-center text-xs font-bold rounded-full px-3 py-1.5 border transition-colors",
                      activeSubcategory?.id === sub.id
                        ? "bg-purple-600 border-purple-600 text-white"
                        : "bg-white border-slate-200 text-slate-600 hover:border-purple-300"
                    )}
                  >
                    {sub.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 sm:p-8">
            {/* `category` já pode estar resolvida (via categoriesLoading)
                enquanto `allProducts` ainda está carregando — sem esse
                gate, "Nenhum produto disponível" pisca antes da lista real
                aparecer, já que `products` some vazio até allProducts
                popular. */}
            {productsLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-300" />
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <PackageSearch size={40} className="text-slate-300" />
                <p className="text-slate-500 font-medium">
                  Nenhum produto disponível aqui no momento.
                </p>
                <BackButton fallbackHref="/" variant="outline" />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function CategoriaPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
        </div>
      }
    >
      <CategoriaContent />
    </Suspense>
  );
}
