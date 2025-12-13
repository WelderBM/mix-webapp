"use client";

import { useEffect, useRef, useMemo } from "react";
import { useProductStore } from "@/store/productStore";
import { useCartStore } from "@/store/cartStore";
import { useSettingsStore } from "@/store/settingsStore";
import { ProductCard } from "@/components/features/ProductCard";
import { BuilderTrigger } from "@/components/features/BuilderTrigger";
import {
  KitBuilderModal,
  openKitBuilder,
} from "@/components/features/KitBuilderModal";
import { RibbonBuilderTrigger } from "@/components/features/RibbonBuilderTrigger";
import { NaturaBanner } from "@/components/features/NaturaBanner";
import { StoreHeader } from "@/components/layout/StoreHeader";
import { cn, hexToRgb, getContrastColor, adjustColor } from "@/lib/utils";
import { Product, StoreSettings, StoreSection } from "@/lib/types";

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

  useEffect(() => {
    useProductStore.setState({
      allProducts: initialProducts,
      isLoading: false,
    });
    useSettingsStore.setState({ settings: initialSettings, isLoading: false });
  }, [initialProducts, initialSettings]);

  const productsToRender =
    allProducts.length > 0 ? allProducts : initialProducts;
  const settingsToRender = settings.id ? settings : initialSettings;

  const themeStyles = useMemo(() => {
    const primary = settingsToRender.theme?.primaryColor || "#7c3aed";
    const secondary = adjustColor(primary, -30);

    // GERA VARIAÇÕES AUTOMÁTICAS BASEADAS NA COR PRINCIPAL
    const bannerKitColor = primary; // Cor Principal
    const bannerRibbonColor = adjustColor(primary, 40); // 40% Mais Claro (Tom Pastel)
    const bannerNaturaColor = adjustColor(primary, -40); // 40% Mais Escuro (Tom Profundo)

    return {
      "--primary": primary,
      "--primary-rgb": hexToRgb(primary),
      "--primary-contrast": getContrastColor(primary),
      "--secondary": secondary,
      "--secondary-rgb": hexToRgb(secondary),
      "--secondary-contrast": "#ffffff",

      // Novas Variáveis para os Banners
      "--banner-kit": bannerKitColor,
      "--banner-ribbon": bannerRibbonColor,
      "--banner-natura": bannerNaturaColor,
    } as React.CSSProperties;
  }, [settingsToRender]);

  const handleDirectAdd = (product: Product) => {
    if (product.type === "KIT_TEMPLATE") {
      openKitBuilder(product);
    } else {
      addItem({
        cartId: crypto.randomUUID(),
        type: "SIMPLE",
        product: product,
        quantity: 1,
        kitTotalAmount: 0,
      });
      openCart();
    }
  };

  const handleNaturaClick = () => {
    shelvesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // --- RENDERIZADOR DINÂMICO ---
  const renderSectionComponent = (section: StoreSection) => {
    switch (section.type) {
      // 1. Vitrine de Produtos
      case "product_shelf":
        const sectionProducts = section.productIds
          .map((id) => productsToRender.find((p) => p.id === id))
          .filter((p): p is Product => p !== undefined);

        if (sectionProducts.length === 0) return null;

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
            {/* flex-1 garante que a área de produtos ocupe todo o espaço vertical disponível */}
            <div className="flex-1 flex flex-col justify-center">
              <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide snap-x md:mx-0 md:px-0 items-stretch h-full">
                {sectionProducts.map((product) => (
                  <div
                    key={product.id}
                    className="min-w-[160px] w-[45%] md:w-[220px] snap-center h-full"
                  >
                    <ProductCard
                      product={product}
                      onSelect={() => handleDirectAdd(product)}
                      actionLabel={
                        product.type === "KIT_TEMPLATE" ? "Montar" : "Adicionar"
                      }
                      // Passamos h-full para o card também se necessário, ou deixamos natural
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      // 2. Banners (Envolvidos em h-full para esticar junto com o vizinho)
      // OBS: Se o componente interno (ex: BuilderTrigger) tiver altura fixa, ele pode não esticar visualmente o conteúdo,
      // mas o container vai esticar. O ideal é que os componentes de banner aceitem className="h-full".
      // Aqui forçamos um container flex que tenta esticar os filhos.

      case "banner_kit":
        return (
          <div
            className="h-full flex flex-col [&>*]:flex-1"
            style={{ "--dynamic-bg": "var(--banner-kit)" } as any}
          >
            <BuilderTrigger />
          </div>
        );

      case "banner_ribbon":
        return (
          <div
            className="h-full flex flex-col [&>*]:flex-1"
            style={{ "--dynamic-bg": "var(--banner-ribbon)" } as any}
          >
            <RibbonBuilderTrigger />
          </div>
        );

      case "banner_natura":
        return (
          <div
            className="h-full flex flex-col [&>*]:flex-1"
            style={{ "--dynamic-bg": "var(--banner-natura)" } as any}
          >
            <NaturaBanner onClick={handleNaturaClick} />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 pb-20" style={themeStyles}>
      <StoreHeader />

      <KitBuilderModal />

      {/* SISTEMA DE GRID INTELIGENTE */}
      <div ref={shelvesRef} className="max-w-6xl mx-auto px-4 mt-8 mb-12">
        {/* items-stretch: O segredo! Faz com que todos os filhos na mesma LINHA tenham a mesma altura.
            gap-6: Espaçamento.
         */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {settingsToRender.homeSections
            ?.filter((s) => s.isActive)
            .map((section) => (
              <div
                key={section.id}
                className={cn(
                  "animate-in fade-in zoom-in-95 duration-500 h-full", // h-full aqui é essencial
                  section.width === "full" ? "md:col-span-2" : "md:col-span-1"
                )}
              >
                {/* O renderizador agora retorna componentes com h-full */}
                {renderSectionComponent(section)}
              </div>
            ))}

          {(!settingsToRender.homeSections ||
            settingsToRender.homeSections.length === 0) && (
            <div className="md:col-span-2 text-center py-20 text-slate-400 bg-white rounded-xl border-2 border-dashed">
              <p>Sua vitrine está vazia.</p>
              <p className="text-sm">Acesse o Admin e configure as seções.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
