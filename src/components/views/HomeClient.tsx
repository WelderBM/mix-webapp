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
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, hexToRgb, getContrastColor, adjustColor } from "@/lib/utils";
import { Product, StoreSettings } from "@/lib/types";

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

  const shelvesRef = useRef<HTMLDivElement>(null);

  // Init Data
  const initialized = useRef(false);
  if (!initialized.current) {
    useProductStore.setState({
      allProducts: initialProducts,
      isLoading: false,
    });
    useSettingsStore.setState({ settings: initialSettings, isLoading: false });
    initialized.current = true;
  }

  const productsToRender =
    allProducts.length > 0 ? allProducts : initialProducts;
  const settingsToRender = settings.id ? settings : initialSettings;

  // --- ESTILOS DINÂMICOS (Cor Única) ---
  const themeStyles = useMemo(() => {
    const primary = settingsToRender.theme.primaryColor || "#7c3aed";
    // Gera a secundária automaticamente (20% mais escura para contraste em botões)
    const secondary = adjustColor(primary, -30);

    return {
      "--primary": primary,
      "--primary-rgb": hexToRgb(primary),
      "--primary-contrast": getContrastColor(primary),
      "--secondary": secondary,
      "--secondary-rgb": hexToRgb(secondary),
      "--secondary-contrast": "#ffffff", // Botão escuro sempre branco
    } as React.CSSProperties;
  }, [settingsToRender]);

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

  const handleNaturaClick = () => {
    shelvesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // --- RENDERIZAÇÃO DAS SEÇÕES MANUAIS ---
  const renderSections = () => {
    const sections = settingsToRender.homeSections || [];

    if (sections.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-slate-50 rounded-xl m-4 border-2 border-dashed">
          <p>Nenhuma seção configurada.</p>
          <p className="text-sm">Acesse o Admin {">"} Vitrine para criar.</p>
        </div>
      );
    }

    return sections
      .filter((s) => s.isActive)
      .map((section) => {
        // Mapeia os IDs salvos para os produtos reais, mantendo a ordem definida no Admin
        const sectionProducts = section.productIds
          .map((id) => productsToRender.find((p) => p.id === id))
          .filter((p) => p !== undefined) as Product[];

        if (sectionProducts.length === 0) return null;

        return (
          <section
            key={section.id}
            className="min-h-[40vh] flex flex-col justify-center py-8 border-b border-slate-100 last:border-0"
          >
            <div className="max-w-6xl mx-auto w-full px-4 space-y-6">
              {/* Cabeçalho da Seção */}
              <div className="flex items-center justify-between px-1">
                <h2
                  className="text-xl md:text-2xl font-bold text-slate-800 pl-3 border-l-4"
                  style={{ borderColor: "var(--primary)" }}
                >
                  {section.title}
                </h2>
              </div>

              {/* Scroll Horizontal de Produtos */}
              <div className="flex gap-4 overflow-x-auto pb-6 -mx-4 px-4 scrollbar-hide snap-x md:mx-0 md:px-0">
                {sectionProducts.map((product) => (
                  <div
                    key={product.id}
                    className="min-w-[180px] w-[50vw] md:w-[240px] snap-center h-full"
                  >
                    <ProductCard
                      product={product}
                      onSelect={() => handleDirectAdd(product)}
                      actionLabel="Adicionar"
                    />
                  </div>
                ))}

                {/* Card Final "Ver Mais" (Decorativo) */}
                <div className="min-w-[100px] flex items-center justify-center snap-center">
                  <div className="h-[280px] flex flex-col gap-2 justify-center items-center rounded-xl w-full opacity-50">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{
                        backgroundColor: "rgba(var(--primary-rgb), 0.1)",
                        color: "var(--primary)",
                      }}
                    >
                      <ChevronRight />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
      });
  };

  return (
    <main className="min-h-screen bg-slate-50 pb-20" style={themeStyles}>
      <StoreHeader />

      <div className="relative mt-8 z-20 px-4 mb-12">
        <div className="max-w-6xl mx-auto flex flex-col gap-4">
          <BuilderTrigger />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <RibbonBuilderTrigger />
            <NaturaBanner onClick={handleNaturaClick} />
          </div>
        </div>
      </div>

      <KitBuilderModal />

      <div ref={shelvesRef} className="min-h-[50vh]">
        {renderSections()}
      </div>
    </main>
  );
}
