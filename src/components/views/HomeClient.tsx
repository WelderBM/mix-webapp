// src/components/views/HomeClient.tsx (PADRÃO CONSOLIDADO: Named Imports)
"use client";

import { useEffect, useRef, useMemo } from "react";
// Named Imports para Stores
import { useProductStore } from "@/store/productStore";
import { useCartStore } from "@/store/cartStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useKitBuilderStore } from "@/store/kitBuilderStore";
// Named Imports para Componentes
import { ProductCard } from "@/components/features/ProductCard";
import { BuilderTrigger } from "@/components/features/BuilderTrigger";
import { KitBuilderModal } from "@/components/features/KitBuilderModal";
import { RibbonBuilderTrigger } from "@/components/features/RibbonBuilderTrigger";
import { NaturaBanner } from "@/components/features/NaturaBanner";
import { StoreHeader } from "@/components/layout/StoreHeader";
// Named Imports para Utilities e Tipos (assumindo que utils.ts não tem default export)
import { cn, hexToRgb, getContrastColor, adjustColor } from "@/lib/utils";
import {
  Product,
  StoreSettings,
  StoreSection,
  AssembledKitProduct,
} from "@/lib/types";

interface HomeClientProps {
  initialProducts: Product[];
  initialSettings: StoreSettings;
}

// CORRIGIDO: O componente HomeClient é o default export da página.
export default function HomeClient({
  initialProducts,
  initialSettings,
}: HomeClientProps) {
  // NOVO: Importamos getProductById para uma busca mais robusta
  const { allProducts, getProductById } = useProductStore();
  const { openCart, addItem } = useCartStore();
  const { settings } = useSettingsStore();

  // Controles do Kit Builder Modal
  const {
    isOpen: isKitModalOpen,
    selectedKitId,
    closeKitBuilder,
  } = useKitBuilderStore();

  const shelvesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Injeta as configurações diretamente
    useSettingsStore.setState({ settings: initialSettings, isLoading: false });
    // Inicia o carregamento e filtro dos produtos/kits
    useProductStore.getState().fetchProducts();
  }, [initialSettings]);

  // Usamos os produtos carregados pela Store (já filtrados) ou os iniciais
  const productsToRender =
    allProducts.length > 0 ? allProducts : initialProducts;
  const settingsToRender = settings.id ? settings : initialSettings;

  // CORREÇÃO: Busca o kit selecionado usando getProductById
  const selectedKit = useMemo(() => {
    if (!selectedKitId) return undefined;

    // Busca o produto mais atualizado pelo ID na Store
    const kit = getProductById(selectedKitId);

    // Confirma que ele é um Kit Montado antes de retornar
    if (kit?.type === "ASSEMBLED_KIT") {
      return kit as AssembledKitProduct;
    }
    return undefined;
  }, [selectedKitId, getProductById]);

  // --- LÓGICA DE ESTILOS DE TEMA ---
  const themeStyles = useMemo(() => {
    const primary = settingsToRender.theme?.primaryColor || "#7c3aed";
    const secondary =
      settingsToRender.theme?.secondaryColor || adjustColor(primary, -30);

    const bannerKitColor = primary;
    const bannerRibbonColor = adjustColor(primary, 40);
    const bannerNaturaColor = adjustColor(primary, -40);

    return {
      "--primary": primary,
      "--primary-rgb": hexToRgb(primary),
      "--primary-contrast": getContrastColor(primary),
      "--secondary": secondary,
      "--secondary-rgb": hexToRgb(secondary),
      "--secondary-contrast": "#ffffff",

      "--banner-kit": bannerKitColor,
      "--banner-ribbon": bannerRibbonColor,
      "--banner-natura": bannerNaturaColor,
    } as React.CSSProperties;
  }, [settingsToRender]);

  // Função simplificada, pois Kits são tratados pelo ProductCard/KitBuilderStore
  const handleDirectAdd = (product: Product) => {
    // Apenas adiciona produtos simples que podem ser adicionados diretamente
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
            <div className="flex-1 flex flex-col justify-center">
              <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide snap-x md:mx-0 md:px-0 items-stretch h-full">
                {sectionProducts.map((product) => (
                  <div
                    key={product.id}
                    className="min-w-[160px] w-[45%] md:w-[220px] snap-center h-full"
                  >
                    <ProductCard
                      product={product}
                      // onSelect só é usado para forçar a adição direta em produtos simples que o ProductCard não adiciona sozinho
                      onSelect={
                        product.type === "ASSEMBLED_KIT"
                          ? undefined
                          : () => handleDirectAdd(product)
                      }
                      actionLabel={
                        product.type === "ASSEMBLED_KIT"
                          ? "Montar Kit"
                          : "Adicionar"
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      // 2. Banners
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

      {/* RENDERIZAÇÃO DO MODAL DE MONTAGEM */}
      {/* O modal só renderiza se o selectedKit existir E o estado de abertura for true */}
      {selectedKit && isKitModalOpen && (
        <KitBuilderModal
          assembledKit={selectedKit}
          isOpen={isKitModalOpen}
          onClose={closeKitBuilder}
        />
      )}

      {/* SISTEMA DE GRID INTELIGENTE */}
      <div ref={shelvesRef} className="max-w-6xl mx-auto px-4 mt-8 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {settingsToRender.homeSections
            ?.filter((s) => s.isActive)
            .map((section) => (
              <div
                key={section.id}
                className={cn(
                  "animate-in fade-in zoom-in-95 duration-500 h-full",
                  section.width === "full" ? "md:col-span-2" : "md:col-span-1"
                )}
              >
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
