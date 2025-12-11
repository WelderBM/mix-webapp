"use client";

import { useEffect } from "react";
import { useProductStore } from "@/store/productStore";
import { ProductCard } from "@/components/features/ProductCard";

export default function Home() {
  const { products, fetchProducts, isLoading } = useProductStore();

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const naturaProducts = products.filter((p) => p.type === "NATURA_ITEM");
  const baseProducts = products.filter((p) => p.type === "BASE_CONTAINER");
  const ribbonProducts = products.filter((p) => p.type === "RIBBON");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Carregando loja...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white p-6 shadow-sm mb-8">
        <h1 className="text-2xl font-bold text-center text-slate-800">
          Mix WebApp Store
        </h1>
      </header>

      <div className="max-w-6xl mx-auto px-4 space-y-12">
        <section>
          <h2 className="text-xl font-bold mb-4 text-slate-700">
            Produtos Natura
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {naturaProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4 text-slate-700">
            Para Montar seu Kit
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {baseProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4 text-slate-700">
            Fitas & Laços
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {ribbonProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
