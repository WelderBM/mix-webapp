"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";

/**
 * Escreve/remove chaves na query string da rota atual sem navegar (router.replace
 * + scroll:false por padrão). Lê sempre `window.location.search` ao vivo em vez do
 * `searchParams` do closure, pra chamadas em sequência (ex: trocar de aba e
 * limpar os params da aba anterior no mesmo clique) não se pisarem.
 *
 * `options.push`: usa `router.push` em vez de `replace` — cria uma entrada
 * nova no histórico do navegador, então o botão "voltar" desfaz só essa
 * mudança específica (ex: abrir um modal de produto via `?produto=`, sem
 * perder o `?pedido=`/scroll de onde o usuário estava). Filtros comuns
 * (status, busca, página) continuam com `replace` — não fazem sentido como
 * degraus separados do histórico.
 */
export function useSearchParamsPatch() {
  const router = useRouter();
  const pathname = usePathname();

  return useCallback(
    (
      patch: Record<string, string | undefined>,
      options?: { push?: boolean }
    ) => {
      const params = new URLSearchParams(window.location.search);
      Object.entries(patch).forEach(([key, value]) => {
        if (!value) params.delete(key);
        else params.set(key, value);
      });
      const qs = params.toString();
      const url = qs ? `${pathname}?${qs}` : pathname;
      if (options?.push) {
        router.push(url, { scroll: false });
      } else {
        router.replace(url, { scroll: false });
      }
    },
    [router, pathname]
  );
}
