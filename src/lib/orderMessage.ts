import type { CartItem } from "@/types/cart";
import type { Order, PaymentMethod } from "@/types/order";
import { balloonItemLabel } from "@/lib/balloonFoil";
import { getCartItemTotalOrNull, isPerMeterCartItem } from "@/lib/cart-pricing";
import { formatCurrency } from "@/lib/utils";

// Mensagem do pedido (relatório 27/10): quem manda agora é a ATENDENTE,
// do WhatsApp da loja para o cliente. O checkout não abre mais o WhatsApp
// (num iPhone não abria, e a venda se perdia); o pedido já chega no admin
// na hora. Só o necessário, com o nome do cliente, e o ID inteiro no link
// do rastreio.

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  pix: "PIX",
  credit_card: "Cartão de Crédito",
  debit_card: "Cartão de Débito",
  cash: "Dinheiro",
};

export function orderItemName(item: CartItem): string {
  let name: string;
  if (item.type === "CUSTOM_BALLOON" && item.balloonDetails) {
    name = `${balloonItemLabel(item.balloonDetails)} (${item.balloonDetails.color})`;
  } else {
    name = item.type === "CUSTOM_KIT" ? `Kit ${item.kitName}` : item.product?.name || item.kitName || "Produto";
  }
  if (item.selectedVariant) name += ` (${item.selectedVariant.type}: ${item.selectedVariant.name})`;
  else if (item.selectedImageLabel) name += ` (${item.selectedImageLabel})`;
  return name;
}

// "1x Laço Bola - R$ 5,00" ou "1,5 m de Fita… - R$ 1,50".
export function orderItemLine(item: CartItem): string {
  const qty = isPerMeterCartItem(item)
    ? `${String(item.quantity).replace(".", ",")} m de`
    : `${item.quantity}x`;
  const total = getCartItemTotalOrNull(item);
  return `${qty} ${orderItemName(item)}${total != null ? ` - ${formatCurrency(total)}` : ""}`;
}

export function trackingUrl(origin: string, orderId: string): string {
  return `${origin.replace(/\/$/, "")}/meu-pedido?id=${orderId}`;
}

type MessageOrder = Pick<
  Order,
  "id" | "customerName" | "items" | "total" | "paymentMethod" | "deliveryMethod" | "changeFor" | "addressDetails" | "address"
>;

export function customerOrderMessage(order: MessageOrder, origin: string): string {
  const firstName = order.customerName.trim().split(/\s+/)[0] || "";
  const lines = [
    "PEDIDO - MIX NOVIDADES",
    "",
    `Olá${firstName ? `, ${firstName}` : ""}! Estamos separando seu pedido. Qualquer informação passamos por aqui, obrigado pela preferência!`,
    "",
    "ITENS:",
    ...order.items.map(orderItemLine),
    "",
    `Total: ${formatCurrency(order.total)}`,
  ];
  let payment = `Pagamento: ${PAYMENT_LABEL[order.paymentMethod] ?? "a combinar"}`;
  if (order.paymentMethod === "cash" && order.changeFor) payment += ` (troco para R$ ${order.changeFor})`;
  lines.push(payment);
  if (order.deliveryMethod === "delivery") {
    const a = order.addressDetails;
    const where = a?.street ? `${a.street}, ${a.number ?? "s/n"} - ${a.neighborhood ?? ""}`.replace(/ - $/, "") : order.address;
    lines.push(`Entrega: ${where || "no endereço informado"} (+ corrida do motoboy)`);
  } else {
    lines.push("Entrega: Retirada no Local");
  }
  lines.push(`Acompanhe seu pedido (ID - ${order.id}): ${trackingUrl(origin, order.id)}`);
  return lines.join("\n");
}

// Número do cliente para o wa.me: só dígitos e com o 55 do Brasil.
// "(95) 98424-4194" → "5595984244194"; quem já digitou o 55 não dobra.
export function waPhone(phone: string | undefined | null): string | null {
  const d = (phone ?? "").replace(/\D/g, "");
  if (d.length === 10 || d.length === 11) return `55${d}`;
  if ((d.length === 12 || d.length === 13) && d.startsWith("55")) return d;
  return null;
}

export function customerWhatsAppUrl(order: MessageOrder & { customerPhone: string }, origin: string): string | null {
  const phone = waPhone(order.customerPhone);
  if (!phone) return null;
  return `https://wa.me/${phone}?text=${encodeURIComponent(customerOrderMessage(order, origin))}`;
}
