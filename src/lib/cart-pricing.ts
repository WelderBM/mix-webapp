import { CartItem } from "@/types/cart";
import { Product } from "@/types/product";
import { getEffectiveUnitPrice } from "./ribbon-pricing";

// Preço unitário de um item SIMPLE — variação tem prioridade sobre o
// produto; produto passa por getEffectiveUnitPrice pra respeitar o estado
// de fita (rolo fechado vs aberto) em vez de ler `.price` cru. `null`
// propaga "não dá pra vender isso" — nunca é convertido em 0 aqui.
export function getCartItemUnitPrice(item: CartItem): number | null {
  if (item.selectedVariant?.price != null) return item.selectedVariant.price;
  if (item.product) return getEffectiveUnitPrice(item.product);
  return null;
}

// Fonte única do total de um item de carrinho — antes desta função existiam
// três fórmulas divergentes (cartStore.getCartTotal, mensagem de WhatsApp em
// CartSidebar, /meu-pedido/[id]), cada uma com sua própria interpretação de
// `kitTotalAmount`. Kits/laços/balões carregam o total já calculado em
// `kitTotalAmount` (não é um preço unitário — não multiplicar de novo por
// `quantity` além do que já foi considerado ao montá-lo). Itens SIMPLE nunca
// usam `kitTotalAmount`; o total vem sempre de preço unitário × quantidade.
//
// Preço unitário `null` (SIMPLE) nunca deveria chegar aqui: `cartStore.addItem`
// é o único portão de entrada e recusa adicionar um item SIMPLE sem preço
// efetivo. Se isso acontecer mesmo assim (ex: carrinho persistido no
// localStorage de antes desse portão existir), a rede de segurança aqui é
// lançar — não silenciar em `0`, que faria o pedido sair de graça e é
// exatamente a classe de bug que este arquivo existe pra evitar.
export function getCartItemTotal(item: CartItem): number {
  if (
    item.type === "CUSTOM_KIT" ||
    item.type === "CUSTOM_RIBBON" ||
    item.type === "CUSTOM_BALLOON"
  ) {
    return (item.kitTotalAmount || 0) * item.quantity;
  }
  const unitPrice = getCartItemUnitPrice(item);
  if (unitPrice == null) {
    throw new Error(
      `Item de carrinho sem preço efetivo (cartId=${item.cartId}, product=${item.product?.id}). ` +
        `Isso não deveria ser possível — cartStore.addItem deveria ter recusado a entrada.`
    );
  }
  return unitPrice * item.quantity;
}

// Carrinho persiste em localStorage entre sessões — um item SIMPLE pode ter
// entrado válido e o produto ter ficado indisponível depois (desativado por
// nome placeholder nunca editado, ver ProductFormDialog, ou removido/sem
// preço), sem o carrinho saber. Compara contra o catálogo vivo (não o
// snapshot embutido no item) pra detectar isso; `null` = segue disponível.
// Não lança — quem bloqueia a venda de verdade é a validação em
// CartSidebar.handleCheckout antes de gravar o pedido; isto aqui só decide
// o que mostrar durante a navegação normal.
export function getCartItemUnavailableReason(
  item: CartItem,
  liveProducts: Product[]
): string | null {
  if (item.type !== "SIMPLE" || !item.product) return null;

  const name = item.product.name || "Este item";
  const live = liveProducts.find((p) => p.id === item.product!.id);
  // Produto desativado já não aparece em `liveProducts` (productStore filtra
  // `disabled` do catálogo do cliente) — "sumiu" e "está desativado" caem no
  // mesmo caso aqui.
  if (!live) return `${name} não está mais disponível para venda.`;
  if (getEffectiveUnitPrice(live) == null) {
    return `${name} está sem preço configurado no momento.`;
  }
  return null;
}

// Total pra exibição (ex: rodapé do carrinho) — precisa sobreviver a um item
// que ficou indisponível (ver getCartItemUnavailableReason acima) sem
// derrubar a tela inteira; ignora esse item da soma em vez de lançar, já que
// quem impede a venda de fato é a validação no checkout, não este total.
export function sumCartItemTotals(items: CartItem[]): number {
  return items.reduce((total, item) => {
    try {
      return total + getCartItemTotal(item);
    } catch {
      return total;
    }
  }, 0);
}
