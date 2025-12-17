// src/components/views/HomeClient.tsx
"use client";

import { useRef, useMemo } from "react";
// Stores
import { useProductStore } from "@/store/productStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useKitBuilderStore } from "@/store/kitBuilderStore";
// Components Layout & Features
import { StoreHeader } from "@/components/layout/StoreHeader";
import { KitBuilderModal } from "@/components/features/KitBuilderModal";
// Novos Componentes de Seção e Hooks
import { SectionRenderer } from "@/components/sections/SectionRenderer";
import { EmptyStoreState } from "@/components/views/EmptyStoreState";
import { useStoreHydration } from "@/hooks/useStoreHydration";
import { useThemeStyles } from "@/hooks/useThemeStyles";
// Types & Utils
import {
  Product,
  StoreSettings,
  StoreSection,
  AssembledKitProduct,
} from "@/types";
import { cn } from "@/lib/utils";

interface HomeClientProps {
  initialProducts: Product[];
  initialSettings: StoreSettings;
}

export default function HomeClient({
  initialProducts,
  initialSettings,
}: HomeClientProps) {
  // 1. Hook de Hidratação: Sincroniza dados iniciais com as Stores
  useStoreHydration(initialProducts, initialSettings);

  // 2. Acesso às Stores
  const { allProducts, getProductById } = useProductStore();
  const { settings } = useSettingsStore();
  const {
    isOpen: isKitModalOpen,
    selectedKitId,
    closeKitBuilder,
  } = useKitBuilderStore();

  // 3. Dados Computados e Estilos
  // Prioriza dados da store (atualizados), fallback para iniciais (SSR)
  const productsToRender =
    allProducts.length > 0 ? allProducts : initialProducts;
  const settingsToRender = settings.id ? settings : initialSettings;

  // Hook de cálculo de tema
  const themeStyles = useThemeStyles(settingsToRender);

  // 4. Lógica do Modal de Kit
  // Busca o kit selecionado usando a store para garantir dados frescos
  const selectedKit = useMemo(() => {
    if (!selectedKitId) return undefined;
    const kit = getProductById(selectedKitId);
    if (kit?.type === "ASSEMBLED_KIT") {
      return kit as AssembledKitProduct;
    }
    return undefined;
  }, [selectedKitId, getProductById]);

  // 5. Referência e Scroll
  const shelvesRef = useRef<HTMLDivElement>(null);
  const handleScrollToShelves = () => {
    shelvesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main className="min-h-screen bg-slate-50 pb-20" style={themeStyles}>
      <StoreHeader />

      {/* RENDERIZAÇÃO DO MODAL DE MONTAGEM */}
      {selectedKit && isKitModalOpen && (
        <KitBuilderModal
          assembledKit={selectedKit}
          isOpen={isKitModalOpen}
          onClose={closeKitBuilder}
        />
      )}

      {/* GRID DE SEÇÕES */}
      <div ref={shelvesRef} className="max-w-6xl mx-auto px-4 mt-8 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {settingsToRender.homeSections
            ?.filter((section: StoreSection) => section.isActive)
            .map((section: StoreSection) => (
              <div
                key={section.id}
                className={cn(
                  "animate-in fade-in zoom-in-95 duration-500 h-full",
                  section.width === "full" ? "md:col-span-2" : "md:col-span-1"
                )}
              >
                {/* O Renderizador decide qual componente mostrar baseada na section */}
                <SectionRenderer
                  section={section}
                  products={productsToRender}
                  onScrollRequest={handleScrollToShelves}
                />
              </div>
            ))}

          {(!settingsToRender.homeSections ||
            settingsToRender.homeSections.length === 0) && <EmptyStoreState />}
        </div>
      </div>
    </main>
  );
}
