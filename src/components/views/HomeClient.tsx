"use client";

import { useRef } from "react";
// Stores
import { useProductStore } from "@/store/productStore";
import { useSettingsStore } from "@/store/settingsStore";
// Components Layout & Features
import { StoreHeader } from "@/components/layout/StoreHeader";
// Novos Componentes de Seção e Hooks
import { SectionRenderer } from "@/components/sections/SectionRenderer";
import { EmptyStoreState } from "@/components/views/EmptyStoreState";
import { useStoreHydration } from "@/hooks/useStoreHydration";
import { useThemeStyles } from "@/hooks/useThemeStyles";
// Types & Utils
import { Product, StoreSettings, StoreSection, KitRecipe } from "@/types";
import { cn } from "@/lib/utils";

interface HomeClientProps {
  initialProducts: Product[];
  initialSettings: StoreSettings;
  initialRecipes: KitRecipe[];
}

export default function HomeClient({
  initialProducts,
  initialSettings,
  initialRecipes,
}: HomeClientProps) {
  // 1. Hook de Hidratação
  useStoreHydration(initialProducts, initialSettings, initialRecipes);

  // 2. Acesso às Stores
  const { allProducts } = useProductStore();
  const { settings } = useSettingsStore();

  // 3. Dados Computados
  const productsToRender =
    allProducts.length > 0 ? allProducts : initialProducts;
  const settingsToRender = settings.id ? settings : initialSettings;

  const themeStyles = useThemeStyles(settingsToRender);

  // 4. Referência e Scroll
  const shelvesRef = useRef<HTMLDivElement>(null);
  const handleScrollToShelves = () => {
    shelvesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main className="min-h-screen bg-slate-50 pb-20" style={themeStyles}>
      <StoreHeader />

      {/* GRID DE SEÇÕES */}
      <div ref={shelvesRef} className="max-w-6xl mx-auto px-4 mt-8 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {settingsToRender.homeSections
            ?.filter((s: StoreSection) => s.isActive)
            .map((section: StoreSection) => (
              <div
                key={section.id}
                className={cn(
                  "animate-in fade-in zoom-in-95 duration-500 h-full",
                  section.width === "full" ? "md:col-span-2" : "md:col-span-1"
                )}
              >
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
