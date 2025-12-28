export type OrderStatus =
  | "pending" // Pendente
  | "preparing" // Preparando
  | "ready" // Pronto para retirada
  | "out_for_delivery" // Saiu para entrega
  | "delivered" // Entregue
  | "cancelled"; // Cancelado

import { CartItem } from "./cart";
export type PaymentMethod = "pix" | "credit_card" | "debit_card" | "cash";

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
  deliveryMethod: "pickup" | "delivery";
  address?: string;
  createdAt: string; // ISO String
  items: CartItem[]; // Itens completos do carrinho
  timestamp?: any; // Firebase Server Timestamp
}
