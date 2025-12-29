import { Product, ProductVariant, LacoModelType, CapacityRef } from "./product";

export interface CustomizationDetails {
  style: string;
  size: string;
  [key: string]: any;
}

export interface CartItem {
  cartId: string;
  type: "SIMPLE" | "CUSTOM_KIT" | "CUSTOM_RIBBON" | "CUSTOM_BALLOON";
  quantity: number;
  product?: Product;
  selectedVariant?: ProductVariant;
  kitName?: string;
  kitComponents?: Product[];
  kitTotalAmount?: number;
  ribbonDetails?: {
    fitaPrincipalId: string;
    fitaSecundariaId?: string;
    cor?: string;
    modelo: LacoModelType;
    tamanho: CapacityRef;
    metragemGasta: number;
    assemblyCost: number;
  };
  customizations?: CustomizationDetails;
  kitComposition?: {
    recipeId?: string;
    baseProductId: string;
    wrapperProductId?: string;
    finalRibbonDetails?: {
      laçoType: LacoModelType;
      fitaId?: string;
      accessoryId?: string;
    };
    items: { productId: string; quantity: number }[];
  };
  balloonDetails?: {
    typeId: string;
    typeName: string;
    size: string;
    color: string;
    unitsPerPackage: number;
  };
}

export type DeliveryMethod = "pickup" | "delivery";
export type PaymentMethod = "pix" | "credit_card" | "debit_card" | "cash";
export type PaymentTiming = "prepaid" | "on_delivery";
export type OrderStatus =
  | "pending"
  | "processing"
  | "delivering"
  | "completed"
  | "cancelled";

export interface Order {
  id: string;
  createdAt: number;
  total: number;
  status: OrderStatus;
  items: CartItem[];
  customerName: string;
  customerPhone: string;
  deliveryMethod: DeliveryMethod;
  address?: string | null;
  paymentMethod: PaymentMethod;
  paymentTiming: PaymentTiming;
}
