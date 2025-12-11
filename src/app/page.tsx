"use client";

import { useEffect, useRef, useMemo } from "react";
import { useProductStore } from "@/store/productStore";
import { useCartStore } from "@/store/cartStore";
import { ProductCard } from "@/components/features/ProductCard";
import { BuilderTrigger } from "@/components/features/BuilderTrigger";
import { KitBuilderModal } from "@/components/features/KitBuilderModal";
import { CartSidebar } from "@/components/features/CartSidebar";
import {
  ShoppingCart,
  SlidersHorizontal,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CATEGORY_PRIORITY } from "@/lib/constants";

export default function Home() {
  const {
    displayProducts,
    fetchProducts,
    isLoading,
    setCategory,
    setSort,
    loadMore,
    filterCategory,
    allProducts,
  } = useProductStore();

  const { openCart, items } = useCartStore();

  const observerTarget = useRef(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const categories = useMemo(() => {
    const uniqueCats = Array.from(new Set(allProducts.map((p) => p.category)));

    return uniqueCats.sort((a, b) => {
      const indexA = CATEGORY_PRIORITY.indexOf(a);
      const indexB = CATEGORY_PRIORITY.indexOf(b);

      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [allProducts]);

  const hasMore =
    allProducts.length > 0 &&
    (filterCategory === "ALL"
      ? displayProducts.length < allProducts.length
      : displayProducts.length <
        allProducts.filter((p) => p.category === filterCategory).length);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) observer.unobserve(observerTarget.current);
    };
  }, [loadMore]);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: "smooth" });
    }
  };

  if (isLoading && displayProducts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        <p className="text-slate-500 animate-pulse">Carregando loja...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-24">
      <header className="bg-white/90 p-4 shadow-sm mb-6 sticky top-0 z-50 backdrop-blur-md transition-all">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">
            Mix WebApp
          </h1>
          <Button
            variant="ghost"
            size="icon"
            className="relative hover:bg-slate-100"
            onClick={openCart}
          >
            <ShoppingCart className="text-slate-700" />
            {items.length > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-[10px] animate-in zoom-in">
                {items.length}
              </Badge>
            )}
          </Button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 space-y-6">
        <BuilderTrigger />
        <KitBuilderModal />
        <CartSidebar />

        <div className="sticky top-[72px] z-40 space-y-3 bg-slate-50/95 py-2 backdrop-blur-sm -mx-4 px-4 md:mx-0 md:px-0 md:bg-transparent">
          <div className="flex flex-col md:flex-row gap-3 justify-between items-start md:items-center bg-white p-3 md:p-4 rounded-xl shadow-sm border border-slate-100">
            {/* LADO ESQUERDO: FILTROS (Flex-1 para ocupar espaço disponível sem empurrar) */}
            <div className="flex items-center gap-2 relative w-full md:w-auto md:flex-1 md:min-w-0">
              <Button
                variant="ghost"
                size="icon"
                className="hidden md:flex h-8 w-8 rounded-full flex-shrink-0 hover:bg-slate-100"
                onClick={scrollLeft}
              >
                <ChevronLeft size={18} />
              </Button>

              <div
                ref={scrollContainerRef}
                className="flex items-center gap-2 w-full overflow-x-auto pb-2 md:pb-0 no-scrollbar scroll-smooth mask-fade-right"
              >
                <Button
                  size="sm"
                  onClick={() => {
                    setCategory("ALL");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className={cn(
                    "rounded-full px-5 transition-all duration-300 flex-shrink-0",
                    filterCategory === "ALL"
                      ? "bg-purple-600 hover:bg-purple-700 text-white shadow-md font-semibold ring-2 ring-purple-100"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-purple-200"
                  )}
                >
                  Todos
                </Button>

                <div className="h-6 w-px bg-slate-200 flex-shrink-0 mx-1"></div>

                {categories.map((cat) => (
                  <Button
                    key={cat}
                    size="sm"
                    onClick={() => {
                      setCategory(cat);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className={cn(
                      "rounded-full px-5 whitespace-nowrap transition-all duration-300 flex-shrink-0",
                      filterCategory === cat
                        ? "bg-purple-600 hover:bg-purple-700 text-white shadow-md font-semibold"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-purple-200"
                    )}
                  >
                    {cat}
                  </Button>
                ))}
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="hidden md:flex h-8 w-8 rounded-full flex-shrink-0 hover:bg-slate-100"
                onClick={scrollRight}
              >
                <ChevronRight size={18} />
              </Button>
            </div>

            {/* LADO DIREITO: ORDENAÇÃO (Shrink-0 para não ser esmagado) */}
            <div className="flex items-center gap-2 w-full md:w-auto flex-shrink-0 border-t md:border-t-0 md:border-l pt-2 md:pt-0 md:pl-4 border-slate-100">
              <SlidersHorizontal size={16} className="text-slate-400" />
              <Select onValueChange={(val: any) => setSort(val)}>
                <SelectTrigger className="border-0 shadow-none focus:ring-0 bg-transparent h-8 p-0 text-slate-600 font-medium min-w-[130px] justify-between">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="name_asc">Nome (A-Z)</SelectItem>
                  <SelectItem value="price_asc">Menor Preço</SelectItem>
                  <SelectItem value="price_desc">Maior Preço</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-lg md:text-xl font-bold text-slate-800 flex items-center gap-2">
              {filterCategory === "ALL" ? "Catálogo Completo" : filterCategory}
            </h2>
            <span className="text-xs font-medium text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded-md shadow-sm">
              {displayProducts.length} produtos
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-6">
            {displayProducts.map((product) => (
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

          {hasMore && (
            <div className="w-full flex justify-center py-8">
              <Button
                onClick={loadMore}
                variant="outline"
                className="bg-white border-purple-200 text-purple-700 hover:bg-purple-50 hover:text-purple-800 px-8 py-6 rounded-full shadow-sm hover:shadow-md transition-all text-base font-medium group"
              >
                Ver Mais Produtos
                <ChevronDown className="ml-2 h-4 w-4 group-hover:translate-y-1 transition-transform" />
              </Button>
            </div>
          )}

          {!hasMore && displayProducts.length > 0 && (
            <div className="text-center py-10 text-slate-400 text-sm">
              — Você chegou ao fim da lista —
            </div>
          )}

          <div
            ref={observerTarget}
            className="h-10 w-full flex justify-center p-4"
          ></div>
        </section>
      </div>
    </main>
  );
}
