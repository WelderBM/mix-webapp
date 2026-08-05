"use client";

// Hook client-side puro (issue #168, item 1) — "vistos recentemente" sem
// conta/login. Mesmo padrão de localStorage de `useDraftPersistence.ts`:
// guard `typeof window !== "undefined"` em toda leitura/escrita, try/catch
// em volta de JSON.parse/stringify/localStorage (quota cheia ou modo
// privado não pode derrubar a página por causa de uma conveniência).
//
// Guarda só os `productId`s (não o Product inteiro) — resolver pra objeto
// completo é responsabilidade de quem consome o hook, contra o
// `allProducts` já carregado (ver `resolveRecentlyViewedProducts` em
// src/lib/recentlyViewed.ts). Loja não tem conta de cliente, então isso é
// por NAVEGADOR, não por pessoa — reseta se o cliente limpar o storage ou
// trocar de dispositivo, o que é esperado aqui.
import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "recently-viewed:products";

// 10 — dá pra preencher uma vitrine de 2 fileiras (grid de 4-5 colunas em
// desktop) sem virar uma lista infinita de histórico; folga o suficiente
// pra sobreviver a algumas re-visitas ao mesmo produto sem perder itens
// distintos mais antigos rápido demais.
export const MAX_RECENTLY_VIEWED = 10;

function safeParseIds(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

function readRecentIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return safeParseIds(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return [];
  }
}

function writeRecentIds(ids: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Quota do localStorage cheia, modo privado sem storage, etc. —
    // "vistos recentemente" é conveniência, não pode quebrar a navegação.
  }
}

interface UseRecentlyViewedResult {
  // Ids mais recentes primeiro, deduplicados, limitados a
  // `MAX_RECENTLY_VIEWED`.
  recentIds: string[];
  // Registra uma visita: manda o id pro topo (ou move, se já existia),
  // remove duplicata e corta no limite. Idempotente-ish — chamar de novo
  // com o mesmo id só reordena, não duplica.
  recordVisit: (productId: string) => void;
}

export function useRecentlyViewed(): UseRecentlyViewedResult {
  const [recentIds, setRecentIds] = useState<string[]>([]);
  // Evita regravar no localStorage o mesmo valor que acabou de ser lido de
  // lá (efeito de hidratação abaixo) — só passa a persistir a partir da
  // primeira mudança de verdade (uma chamada a `recordVisit`).
  const hydratedRef = useRef(false);

  // Lido só depois de montar — evita mismatch de hidratação (server nunca
  // conhece o localStorage do visitante) e segue o mesmo padrão de
  // `useDraftPersistence.ts` (`hasDraft` também é assentado num useEffect).
  useEffect(() => {
    setRecentIds(readRecentIds());
  }, []);

  // Persiste sempre que `recentIds` muda, num efeito separado — de
  // propósito, não dentro do updater funcional de `recordVisit`. Escrever
  // no localStorage ali dentro seria um efeito colateral escondido num
  // updater de `setState`: updaters funcionais podem rodar de novo durante
  // o replay de render (Strict Mode, fila de updates), o mesmo padrão de
  // bug já corrigido neste projeto em `BalloonsTab.tsx`
  // (handleSyncSizesToAll/handleSyncColorsToAll) e `OrdersTab.tsx`
  // (toggleExpand) — lá o efeito tocava o Router; aqui tocaria
  // `localStorage`, menos grave mas a mesma classe de problema.
  useEffect(() => {
    if (!hydratedRef.current) {
      hydratedRef.current = true;
      return;
    }
    writeRecentIds(recentIds);
  }, [recentIds]);

  const recordVisit = useCallback((productId: string) => {
    if (!productId) return;
    setRecentIds((prev) => {
      const deduped = [productId, ...prev.filter((id) => id !== productId)];
      return deduped.slice(0, MAX_RECENTLY_VIEWED);
    });
  }, []);

  return { recentIds, recordVisit };
}
