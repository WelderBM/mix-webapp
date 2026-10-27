"use client";

import { useEffect, useMemo } from "react";
import { useProductStore } from "@/store/productStore";
import { ProductCard } from "@/components/features/ProductCard";
import { normalizeText } from "@/lib/intake/search";
import { CUSTOM_BALLOON_SUBCATEGORY } from "@/lib/intake/subcategories";

// Página de balões: além do montador (lisos, metálicos, candy…), os balões
// que ele não vende — temáticos, de formato, gigantes — aparecem aqui
// juntos. São produtos comuns da subcategoria "Balões personalizados".
const SUB = normalizeText(CUSTOM_BALLOON_SUBCATEGORY);

export function CustomBalloonShelf() {
  const allProducts = useProductStore((s) => s.allProducts);
  const loading = useProductStore((s) => s.isLoading);
  const fetchProducts = useProductStore((s) => s.fetchProducts);

  // Visitante que chega direto em /baloes: catálogo ainda não carregado.
  useEffect(() => {
    if (allProducts.length === 0 && loading) fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const products = useMemo(
    () => allProducts.filter((p) => p.subcategory && normalizeText(p.subcategory) === SUB),
    [allProducts],
  );

  if (products.length === 0) return null;
  return (
    <section aria-labelledby="baloes-personalizados" className="p-4 sm:p-8 border-t">
      <h2 id="baloes-personalizados" className="text-xl sm:text-2xl font-bold text-slate-800 mb-1">
        {CUSTOM_BALLOON_SUBCATEGORY}
      </h2>
      <p className="text-sm text-slate-500 mb-4">
        Temáticos, de formato e gigantes, prontos para levar.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
