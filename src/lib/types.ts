export type MeasureUnit = "m" | "un" | "kg" | "l" | "pct";
export type ProductType =
  | "STANDARD_ITEM"
  | "RIBBON"
  | "BASE_CONTAINER"
  | "FILLER"
  | "WRAPPER"
  | "SUPPLY_BULK";
export type DeliveryMethod = "pickup" | "delivery";
export type PaymentMethod = "pix" | "card" | "cash";
export type PaymentTiming = "prepaid" | "on_delivery";
export type OrderStatus =
  | "pending"
  | "processing"
  | "delivering"
  | "completed"
  | "cancelled";

export interface ProductVariant {
  id: string;
  name: string; // Ex: "Rolo 10m"
  price: number;
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
  imageUrl?: string;
  unit: MeasureUnit;
  inStock: boolean;
  itemSize?: number; // Para montagem de kits (slots ocupados)
  capacity?: number; // Para bases de kits (capacidade de slots)
  canBeSoldAsRoll?: boolean; // Específico para fitas
  variants?: ProductVariant[]; // Novo: Array de variantes
}

export interface CartItem {
  cartId: string;
  type: "SIMPLE" | "CUSTOM_KIT" | "CUSTOM_RIBBON";
  quantity: number;
  product?: Product; // Para itens simples
  selectedVariant?: ProductVariant; // Novo: Variante selecionada
  kitName?: string; // Para kits/laços
  kitComponents?: any[]; // Itens do kit
  kitTotalAmount?: number; // Preço final do kit/laço
  ribbonDetails?: any; // Detalhes do laço builder
}

export interface Order {
  id: string;
  createdAt: number;
  total: number;
  status: OrderStatus;
  items: CartItem[];
  customerName: string;
  deliveryMethod: DeliveryMethod;
  address?: string | null;
  paymentMethod: PaymentMethod;
  paymentTiming: PaymentTiming;
}

// --- NOVO: ESTRUTURA DA VITRINE CURADA ---
export interface StoreSection {
  id: string;
  title: string;
  type: "manual"; // Por enquanto manual, futuro 'category'
  productIds: string[]; // IDs dos produtos nesta seção, na ordem correta
  isActive: boolean;
}

export interface StoreSettings {
  id: string;
  storeName: string;
  whatsappNumber: string;
  theme: {
    primaryColor: string; // Única cor que o admin escolhe
  };
  filters: {
    activeCategories: string[];
    categoryOrder: string[];
  };
  homeSections: StoreSection[]; // Lista ordenada de seções da Home
}
