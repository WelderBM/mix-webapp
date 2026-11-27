"use client";

import { useEffect, useRef } from "react";
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
import { StoreSettings, StoreSection } from "@/types";
import type { ShelfProducts } from "@/lib/shelves";
import { cn } from "@/lib/utils";

interface HomeClientProps {
  initialSettings: StoreSettings;
  // Produtos de cada vitrine, já resolvidos no servidor (#399): a home não
  // recebe nem carrega o catálogo inteiro.
  initialShelves: ShelfProducts;
}

export default function HomeClient({
  initialSettings,
  initialShelves,
}: HomeClientProps) {
  // 1. Hook de Hidratação
  useStoreHydration(initialSettings);

  // 2. Acesso às Stores
  const { settings, isLoading: settingsLoading } = useSettingsStore();
  // Servidor sem dados (só acontece no build: fora dele a página relança e o
  // ISR mantém a última versão boa): as vitrines são resolvidas aqui, com o
  // catálogo do navegador (revisão do #429).
  const serverFailed = !initialSettings?.id;
  const allProducts = useProductStore((s) => s.allProducts);
  useEffect(() => {
    if (serverFailed) useProductStore.getState().ensureProducts();
  }, [serverFailed]);

  // 3. Dados Computados
  // A store nasce com DEFAULT_SETTINGS (já com id "general" e sem seções):
  // só vale depois de carregada. Antes disso — inclusive no HTML do servidor,
  // que é o que o Google lê — usa as configurações reais que vieram do
  // Firestore. Sem isso a home saía como "vitrine vazia" no primeiro render.
  const settingsToRender = settingsLoading ? initialSettings : settings;
  // Servidor falhou ({} sem id) e o navegador ainda está buscando: não
  // mostra o aviso de vitrine vazia antes de saber.
  const awaitingSettings = settingsLoading && !initialSettings?.id;
  const activeSections = (settingsToRender.homeSections ?? []).filter(
    (s: StoreSection) => s.isActive
  );

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
          {activeSections.map((section: StoreSection) => (
              <div
                key={section.id}
                className={cn(
                  "animate-in fade-in zoom-in-95 duration-500 h-full",
                  section.width === "full" ? "md:col-span-2" : "md:col-span-1"
                )}
              >
                <SectionRenderer
                  section={section}
                  products={
                    serverFailed ? allProducts : (initialShelves[section.id] ?? [])
                  }
                  preResolved={!serverFailed}
                  onScrollRequest={handleScrollToShelves}
                  inGrid
                />
              </div>
            ))}

          {activeSections.length === 0 && !awaitingSettings && (
            <EmptyStoreState />
          )}
        </div>
      </div>
    </main>
  );
}
