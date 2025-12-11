"use client";

import { useEffect } from "react";
import { useProductStore } from "@/store/productStore";
import { ProductCard } from "@/components/features/ProductCard";
import { BuilderTrigger } from "@/components/features/BuilderTrigger";
import { KitBuilderModal } from "@/components/features/KitBuilderModal";

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
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-pulse text-slate-400">
          Carregando catálogo...
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-24">
      <header className="bg-white p-4 shadow-sm mb-6 sticky top-0 z-40 backdrop-blur-md bg-white/80">
        <h1 className="text-xl font-bold text-center text-slate-800 tracking-tight">
          Mix WebApp
        </h1>
      </header>

      <div className="max-w-6xl mx-auto px-4 space-y-10">
        <BuilderTrigger />
        <KitBuilderModal />

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-800">
              Destaques Natura
            </h2>
            <span className="text-sm text-slate-500">
              {naturaProducts.length} itens
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {naturaProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-800">
              Bases para Kits
            </h2>
            <span className="text-sm text-slate-500">Cestas & Caixas</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {baseProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-800">Acabamentos</h2>
            <span className="text-sm text-slate-500">Fitas & Laços</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {ribbonProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
