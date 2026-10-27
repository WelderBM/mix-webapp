import { useState } from "react";

// Lista longa no celular (#345): mostra `pageSize` itens e um botão
// "Mostrar mais". Quando `resetKey` muda (outro filtro, outra busca),
// volta para a primeira página.
export function useShowMore<T>(items: T[], pageSize: number, resetKey: unknown) {
  const [state, setState] = useState({ key: resetKey, shown: pageSize });
  let shown = state.shown;
  if (!Object.is(state.key, resetKey)) {
    shown = pageSize;
    setState({ key: resetKey, shown });
  }
  return {
    visible: items.slice(0, shown),
    remaining: Math.max(0, items.length - shown),
    showMore: () => setState((s) => ({ ...s, shown: s.shown + pageSize })),
  };
}
