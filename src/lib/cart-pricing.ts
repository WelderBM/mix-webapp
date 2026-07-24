import { CartItem } from "@/types/cart";
import { getEffectiveUnitPrice } from "./ribbon-pricing";

// Preço unitário de um item SIMPLE — variação tem prioridade sobre o
// produto; produto passa por getEffectiveUnitPrice pra respeitar o estado
// de fita (rolo fechado vs aberto) em vez de ler `.price` cru.
export function getCartItemUnitPrice(item: CartItem): number {
  if (item.selectedVariant?.price != null) return item.selectedVariant.price;
  if (item.product) return getEffectiveUnitPrice(item.product);
  return 0;
}

// Fonte única do total de um item de carrinho — antes desta função existiam
// três fórmulas divergentes (cartStore.getCartTotal, mensagem de WhatsApp em
// CartSidebar, /meu-pedido/[id]), cada uma com sua própria interpretação de
// `kitTotalAmount`. Kits/laços/balões carregam o total já calculado em
// `kitTotalAmount` (não é um preço unitário — não multiplicar de novo por
// `quantity` além do que já foi considerado ao montá-lo). Itens SIMPLE nunca
// usam `kitTotalAmount`; o total vem sempre de preço unitário × quantidade.
export function getCartItemTotal(item: CartItem): number {
  if (
    item.type === "CUSTOM_KIT" ||
    item.type === "CUSTOM_RIBBON" ||
    item.type === "CUSTOM_BALLOON"
  ) {
    return (item.kitTotalAmount || 0) * item.quantity;
  }
  return getCartItemUnitPrice(item) * item.quantity;
}
