// src/lib/types.ts

// 1. TIPOS DE PRODUTO (Atualizado com Sacos, Preenchimento, etc)
export type ProductType =
  | "BASE_CONTAINER" // Cesta, Caixa, Bandeja
  | "STANDARD_ITEM" // Urso, Perfume, Chocolate
  | "FILLER" // Papel Seda, Palha, Crepom (Preenchimento)
  | "ACCESSORY" // Fio de Fada, Tags (Opcionais)
  | "WRAPPER" // Saco Celofane, Saco Poli (Embalagem)
  | "RIBBON" // Laços (Fácil ou Bola)
  | "KIT_TEMPLATE"; // Kits pré-montados

export type MeasureUnit = "m" | "un" | "kg" | "l" | "pct";

// 2. TIPO DE SEÇÃO (Isso corrige o erro "no exported member SectionType")
export type SectionType =
  | "product_shelf" // Vitrine
  | "banner_kit" // Banner Kit
  | "banner_ribbon" // Banner Fitas
  | "banner_natura"; // Banner Natura

export type SectionWidth = "full" | "half";

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  inStock: boolean;
  imageUrl?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  type: ProductType;
  category: string;
  imageUrl?: string;
  unit: MeasureUnit;
  inStock: boolean;

  // Capacidade e Tamanho
  itemSize?: number;
  capacity?: number;

  // Restrições para Sacos (Wrappers)
  wrapperConstraints?: {
    minSlots: number;
    maxSlots: number;
  };

  canBeSoldAsRoll?: boolean;
  variants?: ProductVariant[];
  defaultComponents?: string[];
}

export interface CartItem {
  cartId: string;
  type: "SIMPLE" | "CUSTOM_KIT" | "CUSTOM_RIBBON";
  quantity: number;
  product?: Product;
  selectedVariant?: ProductVariant;

  kitName?: string;
  kitComponents?: Product[];
  kitTotalAmount?: number;

  ribbonDetails?: {
    fitaId: string;
    cor: string;
    modelo: string;
    tamanho: "P" | "M" | "G";
    metragemGasta: number;
  };
}

export interface StoreSection {
  id: string;
  title: string;
  type: SectionType; // Usa o tipo exportado acima
  width: SectionWidth;
  productIds: string[];
  isActive: boolean;
}

export interface StoreSettings {
  id: string;
  storeName: string;
  whatsappNumber: string;
  theme: {
    primaryColor: string;
    activeTheme: "default" | "christmas" | "mothers_day" | "valentines";
  };
  filters: {
    activeCategories: string[];
    categoryOrder: string[];
  };
  homeSections: StoreSection[];
}

export type DeliveryMethod = "pickup" | "delivery";
export type PaymentMethod = "pix" | "card" | "cash";
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
