"use client";

import { useEffect, useRef, useMemo, useState } from "react";
import { useProductStore } from "@/store/productStore";
import { useCartStore } from "@/store/cartStore";
import { ProductCard } from "@/components/features/ProductCard";
import { BuilderTrigger } from "@/components/features/BuilderTrigger";
import { KitBuilderModal } from "@/components/features/KitBuilderModal";
import { RibbonBuilderTrigger } from "@/components/features/RibbonBuilderTrigger";
import { NaturaBanner } from "@/components/features/NaturaBanner";
import { HeroSection } from "@/components/layout/HeroSection";
import {
  SlidersHorizontal,
  ChevronRight,
  ChevronLeft,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Product, ProductVariant } from "@/lib/types";
import { HOME_CATEGORY_GROUPS, getProductGroup } from "@/lib/category_groups";

export default function Home() {
  const { fetchProducts, isLoading, allProducts } = useProductStore();
  const { openCart, addItem } = useCartStore();

  // Estado local para filtros e ordenação
  const [activeGroup, setActiveGroup] = useState("ALL");
  const [visibleGroupsCount, setVisibleGroupsCount] = useState(3);
  const [currentSort, setCurrentSort] = useState("name_asc");

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const shelvesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // 1. Ordenação dos Produtos
  const sortedAllProducts = useMemo(() => {
    const products = [...allProducts];

    return products.sort((a, b) => {
      switch (currentSort) {
        case "price_asc":
          return a.price - b.price;
        case "price_desc":
          return b.price - a.price;
        case "name_asc":
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }, [allProducts, currentSort]);

  // 2. Agrupamento dos Produtos (já ordenados)
  const productsByGroup = useMemo(() => {
    const groups: Record<string, Product[]> = {};

    // Inicializa a ordem dos grupos
    Object.keys(HOME_CATEGORY_GROUPS).forEach((key) => (groups[key] = []));
    groups["Outros"] = [];

    sortedAllProducts.forEach((product) => {
      const group = getProductGroup(product.category);
      if (!groups[group]) groups[group] = [];
      groups[group].push(product);
    });

    return groups;
  }, [sortedAllProducts]);

  const groupNames = useMemo(() => {
    return Object.keys(HOME_CATEGORY_GROUPS).filter(
      (g) => productsByGroup[g]?.length > 0
    );
  }, [productsByGroup]);

  // Ações
  const handleDirectAdd = (product: Product, variant?: ProductVariant) => {
    addItem({
      cartId: crypto.randomUUID(),
      type: "SIMPLE",
      product: product,
      selectedVariant: variant,
      quantity: 1,
      kitTotalAmount: 0,
    });
    openCart();
  };

  const handleNaturaClick = () => {
    setActiveGroup("Perfumaria & Corpo"); // Nome exato do grupo no category_groups.ts
    setTimeout(() => {
      shelvesRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  const scrollFiltersLeft = () => {
    if (scrollContainerRef.current)
      scrollContainerRef.current.scrollBy({ left: -200, behavior: "smooth" });
  };
  const scrollFiltersRight = () => {
    if (scrollContainerRef.current)
      scrollContainerRef.current.scrollBy({ left: 200, behavior: "smooth" });
  };
  const handleLoadMoreSections = () => {
    setVisibleGroupsCount((prev) => prev + 3);
  };

  if (isLoading && allProducts.length === 0)
    return (
      <div className="flex justify-center h-screen items-center text-slate-400 animate-pulse">
        Carregando loja...
      </div>
    );

  // Renderização das Prateleiras (Modo 'ALL')
  const renderShelves = () => {
    const groupsToShow = groupNames.slice(0, visibleGroupsCount);

    return groupsToShow.map((groupName) => {
      const products = productsByGroup[groupName] || [];
      if (products.length === 0) return null;

      const productsInShelf = products.slice(0, 8);
      const hasMore = products.length > 8;

      return (
        <section
          key={groupName}
          className="min-h-[40vh] flex flex-col justify-center py-6 border-b border-slate-50 last:border-0 animate-in fade-in slide-in-from-bottom-4 duration-700"
        >
          <div className="max-w-6xl mx-auto w-full px-4 space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xl md:text-2xl font-bold text-slate-800">
                {groupName}
              </h2>

              {hasMore && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-purple-600 hover:text-purple-800 text-xs md:text-sm font-semibold"
                  onClick={() => {
                    setActiveGroup(groupName);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  Ver todos <ChevronRight size={16} />
                </Button>
              )}
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide snap-x md:mx-0 md:px-0">
              {productsInShelf.map((product) => (
                <div
                  key={product.id}
                  className="min-w-[180px] w-[50vw] md:w-[240px] snap-center"
                >
                  <ProductCard
                    product={product}
                    onSelect={(variant) => handleDirectAdd(product, variant)}
                    actionLabel="Adicionar"
                  />
                </div>
              ))}

              {hasMore && (
                <div className="min-w-[100px] flex items-center justify-center snap-center">
                  <Button
                    variant="ghost"
                    className="h-full flex-col gap-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl w-full aspect-[3/4] border-2 border-dashed border-slate-100 hover:border-purple-200"
                    onClick={() => setActiveGroup(groupName)}
                  >
                    <div className="bg-slate-50 p-3 rounded-full group-hover:bg-white transition-colors">
                      <ChevronRight className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-medium">Ver +</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>
      );
    });
  };

  // Renderização da Grade Completa (Modo Categoria Específica)
  const renderGrid = () => {
    const products = productsByGroup[activeGroup] || [];
    return (
      <section className="min-h-screen py-8 animate-in fade-in zoom-in duration-300">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-800">{activeGroup}</h2>
            <span className="text-sm text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-full">
              {products.length} itens
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={(variant) => handleDirectAdd(product, variant)}
                actionLabel="Adicionar"
              />
            ))}
          </div>
          <div className="mt-8 text-center">
            <Button variant="outline" onClick={() => setActiveGroup("ALL")}>
              Voltar para Início
            </Button>
          </div>
        </div>
      </section>
    );
  };

  return (
    <main className="min-h-screen bg-slate-50 pb-0">
      <HeroSection />

      {/* ÁREA DE TRIGGERS E BANNERS */}
      <div className="relative -mt-8 z-20 px-4 mb-8">
        <div className="max-w-6xl mx-auto flex flex-col gap-4">
          {/* 1. Monte seu Kit (Principal) */}
          <BuilderTrigger />

          {/* 2. Grid de Banners Secundários (Mesma Altura) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <RibbonBuilderTrigger />
            <NaturaBanner onClick={handleNaturaClick} />
          </div>
        </div>
      </div>

      <KitBuilderModal />

      {/* BARRA DE FILTROS FIXA */}
      <div
        ref={shelvesRef}
        className="sticky top-16 z-40 bg-slate-50/95 py-2 backdrop-blur-sm shadow-sm md:shadow-none border-b md:border-b-0 border-slate-200/50"
      >
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-3 justify-between items-center bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
            {/* Scroll de Grupos */}
            <div className="flex items-center gap-2 relative w-full md:w-auto md:flex-1 md:min-w-0">
              <Button
                variant="ghost"
                size="icon"
                className="hidden md:flex h-8 w-8 rounded-full flex-shrink-0"
                onClick={scrollFiltersLeft}
              >
                <ChevronLeft size={18} />
              </Button>
              <div
                ref={scrollContainerRef}
                className="flex items-center gap-2 w-full overflow-x-auto pb-2 md:pb-0 no-scrollbar scroll-smooth"
              >
                <Button
                  size="sm"
                  onClick={() => {
                    setActiveGroup("ALL");
                    setVisibleGroupsCount(3);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className={cn(
                    "rounded-full px-5 transition-all flex-shrink-0",
                    activeGroup === "ALL"
                      ? "bg-purple-600 text-white"
                      : "bg-white border text-slate-600"
                  )}
                >
                  Início
                </Button>
                {groupNames.map((group) => (
                  <Button
                    key={group}
                    size="sm"
                    onClick={() => setActiveGroup(group)}
                    className={cn(
                      "rounded-full px-5 flex-shrink-0",
                      activeGroup === group
                        ? "bg-purple-600 text-white"
                        : "bg-white border text-slate-600"
                    )}
                  >
                    {group}
                  </Button>
                ))}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="hidden md:flex h-8 w-8 rounded-full flex-shrink-0"
                onClick={scrollFiltersRight}
              >
                <ChevronRight size={18} />
              </Button>
            </div>

            {/* Seletor de Ordenação */}
            <div className="flex items-center gap-2 w-full md:w-auto flex-shrink-0 border-t md:border-t-0 md:border-l pt-2 md:pt-0 md:pl-4 border-slate-100">
              <SlidersHorizontal size={16} className="text-slate-400" />
              <Select value={currentSort} onValueChange={setCurrentSort}>
                <SelectTrigger className="border-0 shadow-none focus:ring-0 bg-transparent h-8 p-0 text-slate-600 font-medium min-w-[120px] justify-between">
                  <SelectValue placeholder="Ordenar" />
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
      </div>

      {/* ÁREA DE PRODUTOS */}
      <div className="min-h-[50vh]">
        {activeGroup === "ALL" ? (
          <>
            {renderShelves()}
            {visibleGroupsCount < groupNames.length && (
              <div className="w-full flex justify-center py-12 bg-gradient-to-b from-slate-50 to-white">
                <Button
                  onClick={handleLoadMoreSections}
                  className="bg-white border-2 border-purple-100 text-purple-700 hover:bg-purple-50 hover:border-purple-200 px-8 py-6 rounded-full shadow-sm text-base font-bold group transition-all transform hover:scale-105"
                >
                  <Plus className="mr-2 h-5 w-5 bg-purple-100 rounded-full p-1" />{" "}
                  Ver mais grupos
                </Button>
              </div>
            )}
          </>
        ) : (
          renderGrid()
        )}
      </div>
    </main>
  );
}
