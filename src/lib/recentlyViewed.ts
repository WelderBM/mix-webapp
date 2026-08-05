// src/lib/recentlyViewed.ts
//
// Resolução do modo `recently_viewed` (issue #168, item 1) — FORA de
// `resolveSectionProducts` (src/lib/sections.ts) de propósito. Os outros
// modos de `SectionSource` são funções puras contra `allProducts`/
// `categories` já carregados globalmente (mesmo dado em qualquer sessão);
// este modo depende do `localStorage` do visitante, que só existe no
// client e é diferente por navegador. Forçar `resolveSectionProducts` a
// aceitar uma fonte de dado que não é passada como parâmetro (ex: ler
// `window.localStorage` dentro de uma função hoje pura, chamada também no
// admin/preview) trocaria uma função testável e previsível por uma com
// efeito colateral escondido — por isso esta função separada, chamada só
// por quem já tem os ids (de `useRecentlyViewed`) e o catálogo carregado.
import { Product } from "@/types";

// Mesmo padrão de ordenação do modo "manual" em resolveBySource: preserva a
// ordem de `recentIds` (mais recente primeiro), não a ordem de
// `allProducts`.
export const resolveRecentlyViewedProducts = (
  recentIds: string[],
  allProducts: Product[],
  excludeProductId?: string
): Product[] =>
  recentIds
    .filter((id) => id !== excludeProductId)
    .map((id) => allProducts.find((p) => p.id === id))
    .filter((p): p is Product => p !== undefined);
