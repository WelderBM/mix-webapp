"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";

/**
 * Escreve/remove chaves na query string da rota atual sem navegar (router.replace
 * + scroll:false). Lê sempre `window.location.search` ao vivo em vez do
 * `searchParams` do closure, pra chamadas em sequência (ex: trocar de aba e
 * limpar os params da aba anterior no mesmo clique) não se pisarem.
 */
export function useSearchParamsPatch() {
  const router = useRouter();
  const pathname = usePathname();

  return useCallback(
    (patch: Record<string, string | undefined>) => {
      const params = new URLSearchParams(window.location.search);
      Object.entries(patch).forEach(([key, value]) => {
        if (!value) params.delete(key);
        else params.set(key, value);
      });
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname]
  );
}
