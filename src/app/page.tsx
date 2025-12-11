"use client";

import { useEffect } from "react";
import { useProductStore } from "@/store/productStore";
import { useCartStore } from "@/store/cartStore"; // Novo
import { ProductCard } from "@/components/features/ProductCard";
import { BuilderTrigger } from "@/components/features/BuilderTrigger";
import { KitBuilderModal } from "@/components/features/KitBuilderModal";
import { CartSidebar } from "@/components/features/CartSidebar"; // Novo
import { ShoppingCart } from "lucide-react"; // Novo
import { Button } from "@/components/ui/button"; // Novo
import { Badge } from "@/components/ui/badge"; // Novo

export default function Home() {
  const { products, fetchProducts, isLoading } = useProductStore();
  const { openCart, items } = useCartStore(); // Pegamos o total de itens para o badge

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
      {/* Header Atualizado */}
      <header className="bg-white p-4 shadow-sm mb-6 sticky top-0 z-40 backdrop-blur-md bg-white/80">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">
            Mix WebApp
          </h1>

          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={openCart}
          >
            <ShoppingCart className="text-slate-700" />
            {items.length > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-[10px]">
                {items.length}
              </Badge>
            )}
          </Button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 space-y-10">
        <BuilderTrigger />
        <KitBuilderModal />
        <CartSidebar /> {/* O Carrinho fica aqui, escondido até ser chamado */}
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
              <ProductCard
                key={product.id}
                product={product}
                // Usamos a função de adicionar ao carrinho para produtos soltos
                onSelect={() => {
                  const { addItem } = useCartStore.getState();
                  addItem({
                    cartId: crypto.randomUUID(),
                    type: "SIMPLE",
                    product: product,
                    quantity: 1,
                    kitTotalAmount: 0, // Não é usado em item simples
                  });
                  useCartStore.getState().openCart(); // Abre o carrinho ao adicionar
                }}
                actionLabel="Adicionar"
              />
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
              <ProductCard
                key={product.id}
                product={product}
                // Bases geralmente não são vendidas soltas, mas se quiser permitir:
                onSelect={() => {
                  const { addItem } = useCartStore.getState();
                  addItem({
                    cartId: crypto.randomUUID(),
                    type: "SIMPLE",
                    product: product,
                    quantity: 1,
                    kitTotalAmount: 0,
                  });
                  useCartStore.getState().openCart();
                }}
                actionLabel="Comprar Avulso"
              />
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
              <ProductCard
                key={product.id}
                product={product}
                onSelect={() => {
                  const { addItem } = useCartStore.getState();
                  addItem({
                    cartId: crypto.randomUUID(),
                    type: "SIMPLE",
                    product: product,
                    quantity: 1,
                    kitTotalAmount: 0,
                  });
                  useCartStore.getState().openCart();
                }}
                actionLabel="Adicionar"
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
