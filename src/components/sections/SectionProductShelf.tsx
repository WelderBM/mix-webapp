"use client";

import { Product, StoreSection, AssembledKitProduct } from "@/lib/types";
import { ProductCard } from "@/components/features/ProductCard";
import { useCartStore } from "@/store/cartStore";

interface SectionProductShelfProps {
  section: StoreSection;
  allProducts: Product[];
}

export const SectionProductShelf = ({
  section,
  allProducts,
}: SectionProductShelfProps) => {
  const { openCart, addItem } = useCartStore();

  // Filtra os produtos desta seção
  const sectionProducts = section.productIds
    .map((id) => allProducts.find((p) => p.id === id))
    .filter((p): p is Product => p !== undefined);

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
              className="min-w-[160px] w-[45%] md:w-[220px] snap-center h-full"
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
