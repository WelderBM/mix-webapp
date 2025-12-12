export type ProductType =
  | "STANDARD_ITEM"
  | "BASE_CONTAINER"
  | "FILLER"
  | "WRAPPER"
  | "RIBBON"
  | "SUPPLY_BULK";

export type MeasureUnit = "un" | "m" | "pct";

export interface ProductVariant {
  id: string;
  name: string;
  imageUrl?: string;
  price?: number;
  inStock: boolean;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  type: ProductType;
  category: string;
  imageUrl: string;
  unit: MeasureUnit;
  description_adjective?: string;
  inStock: boolean;
  featured?: boolean;
  capacity?: number;
  itemSize?: number;
  variants?: ProductVariant[];

  canBeSoldAsRoll?: boolean;
}

export type CartItemType = "SIMPLE" | "CUSTOM_KIT" | "CUSTOM_RIBBON";

export interface CartItem {
  cartId: string;
  type: CartItemType;
  product?: Product;
  selectedVariant?: ProductVariant;
  quantity: number;
  kitName?: string;
  kitComponents?: Product[];
  kitTotalAmount?: number;

  ribbonDetails?: {
    fitaSelecionada: Product;
    tamanhoLaco: "PP" | "P" | "M" | "G" | "GG";
    quantidadeLacos: number;
    tipoLaco: string;
    // CORRIGIDO: Adicionado o campo que estava faltando no tipo
    metragemTotal: number;
  };
}

export interface StoreSettings {
  id: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundColor: string;
  };
  filters: {
    activeCategories: string[];
    categoryOrder: string[];
  };
  storeName: string;
  whatsappNumber: string;
}

export type OrderStatus =
  | "pending"
  | "processing"
  | "delivering"
  | "completed"
  | "cancelled";
export type DeliveryMethod = "pickup" | "delivery";
export type PaymentMethod = "pix" | "card" | "cash";
export type PaymentTiming = "prepaid" | "on_delivery";

export interface Order {
  id: string;
  createdAt: number;
  customerName?: string;
  total: number;
  items: CartItem[];
  status: OrderStatus;
  deliveryMethod: DeliveryMethod;
  address?: string;
  paymentMethod: PaymentMethod;
  paymentTiming: PaymentTiming;
}
