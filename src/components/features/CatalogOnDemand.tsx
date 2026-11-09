"use client";

import { useEffect } from "react";
import { useCartStore } from "@/store/cartStore";
import { useKitBuilderStore } from "@/store/kitBuilderStore";
import { useProductStore } from "@/store/productStore";

// O catálogo inteiro só desce quando alguém precisa dele (#399): o
// carrinho aberto confere se os itens ainda estão à venda, e o montador
// de kit lista as peças. Antes a Navbar baixava tudo em toda página.
export function CatalogOnDemand() {
  const cartOpen = useCartStore((s) => s.isCartOpen);
  const kitOpen = useKitBuilderStore((s) => s.isOpen);

  useEffect(() => {
    if (cartOpen || kitOpen) useProductStore.getState().ensureProducts();
  }, [cartOpen, kitOpen]);

  return null;
}
