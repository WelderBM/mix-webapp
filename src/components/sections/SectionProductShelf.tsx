"use client";

import { useEffect } from "react";
import { Product, StoreSection } from "@/types";
import { ProductCard } from "@/components/features/ProductCard";
import { useCartStore } from "@/store/cartStore";
import { useCategoryStore } from "@/store/categoryStore";
import { resolveSectionProducts } from "@/lib/sections";

interface SectionProductShelfProps {
  section: StoreSection;
  allProducts: Product[];
}

export const SectionProductShelf = ({
  section,
  allProducts,
}: SectionProductShelfProps) => {
  const { openCart, addItem } = useCartStore();
  // `source: { mode: "category" }` precisa resolver categoryId -> nome
  // (mesma convenção de nome-vs-id das issues #69/#70) — mesma fonte já
  // compartilhada com a Navbar/página de categoria, subscribe() é
  // idempotente.
  const categories = useCategoryStore((state) => state.categories);
  const subscribeToCategories = useCategoryStore((state) => state.subscribe);

  useEffect(() => {
    subscribeToCategories();
  }, [subscribeToCategories]);

  // Resolve os produtos desta seção a partir de `source` (curadoria manual
  // OU vitrine autodidata por categoria/tag/estoque baixo — issue #71).
  const sectionProducts = resolveSectionProducts(
    section,
    allProducts,
    categories
  );

  if (sectionProducts.length === 0) return null;

  // Lógica de adição direta (movida do HomeClient para cá)
  const handleDirectAdd = (product: Product) => {
    addItem({
      cartId: crypto.randomUUID(),
      type: "SIMPLE",
      product: product,
      quantity: 1,
      kitTotalAmount: 0,
    });
    openCart();
  };

  return (
    <div className="flex flex-col h-full justify-between py-4">
      {section.title && (
        <h2
          className="text-xl font-bold text-slate-800 pl-3 border-l-4 mb-4 shrink-0"
          style={{ borderColor: "var(--primary)" }}
        >
          {section.title}
        </h2>
      )}
      <div className="flex-1 flex flex-col justify-center">
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide snap-x md:mx-0 md:px-0 items-stretch h-full">
          {sectionProducts.map((product) => (
            <div
              key={product.id}
              className="min-w-[200px] w-[200px] md:w-[220px] snap-center h-full shrink-0"
            >
              <ProductCard
                product={product}
                // onSelect: Adição direta para produtos simples, undefined para Kits (ProductCard abre modal)
                onSelect={
                  product.type === "ASSEMBLED_KIT"
                    ? undefined
                    : () => handleDirectAdd(product)
                }
                actionLabel={
                  product.type === "ASSEMBLED_KIT" ? "Montar Kit" : "Adicionar"
                }
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
