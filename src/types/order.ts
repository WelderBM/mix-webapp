export type OrderStatus =
  | "pending" // Pendente
  | "preparing" // Preparando
  | "ready" // Pronto para retirada
  | "out_for_delivery" // Saiu para entrega
  | "delivered" // Entregue
  | "cancelled"; // Cancelado

import { CartItem } from "./cart";
export type PaymentMethod = "pix" | "credit_card" | "debit_card" | "cash";
export type PaymentTiming = "prepaid" | "on_delivery";
export type PixPaymentDestination = "store" | "carrier";

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  details?: string; // Para balões ou fitas personalizadas
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  // Gravados no checkout (CartSidebar) desde sempre, mas nunca declarados
  // aqui nem exibidos no admin — cliente preenche, equipe nunca vê (#54).
  paymentTiming?: PaymentTiming;
  pixPaymentDestination?: PixPaymentDestination | null;
  // Troco pedido pelo cliente quando paymentMethod === "cash". Só existe
  // nesse caso — não confundir com valor total do pedido (#72).
  changeFor?: string | null;
  observation?: string | null;
  deliveryMethod: "pickup" | "delivery";
  address?: string;
  // Estruturado a partir do checkout (#72) — reference é opcional
  // (ponto de referência), o resto só existe quando deliveryMethod === "delivery".
  addressDetails?: {
    cep?: string;
    street?: string;
    number?: string;
    neighborhood?: string;
    city?: string;
    reference?: string | null;
  } | null;
  createdAt: string; // ISO String
  items: CartItem[]; // Itens completos do carrinho
  timestamp?: any; // Firebase Server Timestamp
}
