"use client";

import { useEffect, useRef, useMemo, useState } from "react";
import { useProductStore } from "@/store/productStore";
import { useCartStore } from "@/store/cartStore";
import { useSettingsStore } from "@/store/settingsStore";
import { ProductCard } from "@/components/features/ProductCard";
import { BuilderTrigger } from "@/components/features/BuilderTrigger";
import { KitBuilderModal } from "@/components/features/KitBuilderModal";
import { RibbonBuilderTrigger } from "@/components/features/RibbonBuilderTrigger";
import { NaturaBanner } from "@/components/features/NaturaBanner";
import { StoreHeader } from "@/components/layout/StoreHeader";
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
import { cn, hexToRgb, getContrastColor } from "@/lib/utils";
import { Product, ProductVariant, StoreSettings } from "@/lib/types";
import { HOME_CATEGORY_GROUPS, getProductGroup } from "@/lib/category_groups";

// Props recebidas do Servidor
interface HomeClientProps {
  initialProducts: Product[];
  initialSettings: StoreSettings;
}

export default function HomeClient({
  initialProducts,
  initialSettings,
}: HomeClientProps) {
  const { allProducts } = useProductStore();
  const { openCart, addItem } = useCartStore();
  const { settings } = useSettingsStore();

  const [activeGroup, setActiveGroup] = useState("ALL");
  const [visibleGroupsCount, setVisibleGroupsCount] = useState(3);
  const [currentSort, setCurrentSort] = useState("name_asc");

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const shelvesRef = useRef<HTMLDivElement>(null);

  // --- HIDRATAÇÃO INICIAL (O Pulo do Gato) ---
  // Assim que o componente monta, ele já tem os dados.
  // Não precisa esperar o fetch do cliente.
  const initialized = useRef(false);
  if (!initialized.current) {
    useProductStore.setState({
      allProducts: initialProducts,
      isLoading: false,
    });
    useSettingsStore.setState({ settings: initialSettings, isLoading: false });
    initialized.current = true;
  }

  // Fallback: Usa os dados da prop se a store ainda estiver vazia (garante SSR visual)
  const productsToRender =
    allProducts.length > 0 ? allProducts : initialProducts;
  const settingsToRender = settings.id ? settings : initialSettings;

  // --- ESTILOS DINÂMICOS ---
  const themeStyles = useMemo(() => {
    const primary = settingsToRender.theme.primaryColor || "#7c3aed";
    const secondary = settingsToRender.theme.secondaryColor || "#16a34a";

    return {
      "--primary": primary,
      "--primary-rgb": hexToRgb(primary),
      "--primary-contrast": getContrastColor(primary),
      "--secondary": secondary,
      "--secondary-rgb": hexToRgb(secondary),
      "--secondary-contrast": getContrastColor(secondary),
    } as React.CSSProperties;
  }, [settingsToRender]);

  // Ordenação
  const sortedAllProducts = useMemo(() => {
    const products = [...productsToRender];
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
  }, [productsToRender, currentSort]);

  // Agrupamento
  const productsByGroup = useMemo(() => {
    const groups: Record<string, Product[]> = {};
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
    const activeGroups = Object.keys(HOME_CATEGORY_GROUPS).filter(
      (g) => productsByGroup[g]?.length > 0
    );

    if (settingsToRender.filters?.categoryOrder?.length > 0) {
      return activeGroups.sort((a, b) => {
        const indexA = settingsToRender.filters.categoryOrder.indexOf(a);
        const indexB = settingsToRender.filters.categoryOrder.indexOf(b);
        const valA = indexA === -1 ? 999 : indexA;
        const valB = indexB === -1 ? 999 : indexB;
        return valA - valB;
      });
    }
    return activeGroups;
  }, [productsByGroup, settingsToRender]);

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
    setActiveGroup("Perfumaria & Corpo");
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
              <h2
                className="text-xl md:text-2xl font-bold text-slate-800 pl-3 border-l-4"
                style={{ borderColor: "var(--primary)" }}
              >
                {groupName}
              </h2>
              {hasMore && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs md:text-sm font-semibold hover:bg-[rgba(var(--primary-rgb),0.1)]"
                  style={{ color: "var(--primary)" }}
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
                    className="h-full flex-col gap-2 rounded-xl w-full aspect-[3/4] border-2 border-dashed transition-all"
                    onClick={() => setActiveGroup(groupName)}
                    style={{
                      borderColor: "rgba(var(--primary-rgb), 0.3)",
                      color: "var(--primary)",
                      backgroundColor: "rgba(var(--primary-rgb), 0.02)",
                    }}
                  >
                    <div
                      className="p-3 rounded-full transition-colors"
                      style={{
                        backgroundColor: "rgba(var(--primary-rgb), 0.1)",
                      }}
                    >
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

  const renderGrid = () => {
    const products = productsByGroup[activeGroup] || [];
    return (
      <section className="min-h-screen py-8 animate-in fade-in zoom-in duration-300">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2
              className="text-2xl font-bold text-slate-800 pl-3 border-l-4"
              style={{ borderColor: "var(--primary)" }}
            >
              {activeGroup}
            </h2>
            <span
              className="text-sm font-semibold px-3 py-1 rounded-full"
              style={{
                backgroundColor: "rgba(var(--primary-rgb), 0.1)",
                color: "var(--primary)",
              }}
            >
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
    <main className="min-h-screen bg-slate-50 pb-0" style={themeStyles}>
      {/* 1. Header com Foto */}
      <StoreHeader />

      {/* 2. Área de Banners */}
      <div className="relative mt-12 z-20 px-4 mb-8">
        <div className="max-w-6xl mx-auto flex flex-col gap-4">
          <BuilderTrigger />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <RibbonBuilderTrigger />
            <NaturaBanner onClick={handleNaturaClick} />
          </div>
        </div>
      </div>

      <KitBuilderModal />

      {/* 3. Barra de Filtros */}
      <div
        ref={shelvesRef}
        className="sticky top-16 z-40 bg-slate-50/95 py-2 backdrop-blur-sm shadow-sm md:shadow-none border-b md:border-b-0 border-slate-200/50"
      >
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-3 justify-between items-center bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
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
                    "rounded-full px-5 transition-all flex-shrink-0 border"
                  )}
                  style={{
                    backgroundColor:
                      activeGroup === "ALL" ? "var(--primary)" : "white",
                    color:
                      activeGroup === "ALL"
                        ? "var(--primary-contrast)"
                        : "#475569",
                    borderColor:
                      activeGroup === "ALL" ? "transparent" : "#e2e8f0",
                  }}
                >
                  Início
                </Button>
                {groupNames.map((group) => (
                  <Button
                    key={group}
                    size="sm"
                    onClick={() => setActiveGroup(group)}
                    className={cn("rounded-full px-5 flex-shrink-0 border")}
                    style={{
                      backgroundColor:
                        activeGroup === group ? "var(--primary)" : "white",
                      color:
                        activeGroup === group
                          ? "var(--primary-contrast)"
                          : "#475569",
                      borderColor:
                        activeGroup === group ? "transparent" : "#e2e8f0",
                    }}
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

      {/* 4. Prateleiras de Produtos */}
      <div className="min-h-[50vh]">
        {activeGroup === "ALL" ? (
          <>
            {renderShelves()}
            {visibleGroupsCount < groupNames.length && (
              <div className="w-full flex justify-center py-12 bg-gradient-to-b from-slate-50 to-white">
                <Button
                  onClick={handleLoadMoreSections}
                  className="bg-white border-2 px-8 py-6 rounded-full shadow-sm text-base font-bold group transition-all transform hover:scale-105"
                  style={{
                    borderColor: "rgba(var(--primary-rgb), 0.3)",
                    color: "var(--primary)",
                  }}
                >
                  <Plus
                    className="mr-2 h-5 w-5 rounded-full p-1"
                    style={{
                      backgroundColor: "var(--primary)",
                      color: "var(--primary-contrast)",
                    }}
                  />{" "}
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
