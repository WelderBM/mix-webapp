"use client";

import { useEffect, useState } from "react";
import { useProductStore } from "@/store/productStore";
import type { CategoryCounts } from "@/lib/categories";

// Uma busca por visita, dividida entre todas as montagens da Navbar.
let request: Promise<CategoryCounts | null> | null = null;

function loadMenuCounts(): Promise<CategoryCounts | null> {
  request ??= fetch("/catalogo/menu")
    .then((r) => (r.ok ? r.json() : null))
    .then((j: { counts?: CategoryCounts | null } | null) => {
      if (!j?.counts) throw new Error("sem contagem");
      return j.counts;
    })
    .catch(() => {
      request = null; // falha ou resposta vazia: tenta de novo na próxima montagem
      return null;
    });
  return request;
}

// Contagem do menu "Loja" sem baixar o catálogo (#399). Se a página já
// carregou os produtos, conta a partir deles; senão, usa a contagem pronta
// do servidor. Em página que lê o catálogo ao abrir (/fitas, /baloes) a
// leitura ainda não terminou no microtask, então a contagem (~1 KB, CDN)
// também é pedida; quando o catálogo chega, ele passa a valer.
export function useMenuCounts(): CategoryCounts | null {
  const hasCatalog = useProductStore((s) => s.allProducts.length > 0);
  const [counts, setCounts] = useState<CategoryCounts | null>(null);

  useEffect(() => {
    let alive = true;
    // Microtask: a página (ex.: hidratação da home) roda o effect dela
    // depois da Navbar no mesmo commit; só busca se ela não trouxe nada.
    queueMicrotask(() => {
      if (!alive || useProductStore.getState().allProducts.length > 0) return;
      loadMenuCounts().then((c) => {
        if (alive) setCounts(c);
      });
    });
    return () => {
      alive = false;
    };
  }, []);

  return hasCatalog ? null : counts;
}
