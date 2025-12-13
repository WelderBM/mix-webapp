// src/lib/types.ts (VERSÃO CORRIGIDA)
//

// =================================================================
// 1. TIPOS DE PRODUTO & CONTROLE
// =================================================================

export type ProductType =
  | "BASE_CONTAINER" // Cesta, Caixa, Sacola (Ocupa o espaço principal)
  | "STANDARD_ITEM" // Urso, Perfume, Chocolate (Itens de Preenchimento)
  | "FILLER" // Papel Seda, Palha, Crepom (Preenchimento de volume)
  | "ACCESSORY" // Laço Pronto, Fio de Fada, Tags (Opcionais/Componentes)
  | "WRAPPER" // Saco Celofane, Saco Poli (Embalagem Final)
  | "RIBBON" // Fitas Albano (Venda por metro/rolo)
  | "ASSEMBLED_KIT"; // Meta-Produto (Kit Pré-montado para venda)

export type MeasureUnit = "m" | "un" | "kg" | "l" | "pct";

export type SaleUnitType = "UNITARIO" | "PACOTE";

export type LacoModelType = "BOLA" | "COMUM_CHANEL" | "PUXAR";

// 2. TIPO DE SEÇÃO
export type SectionType =
  | "product_shelf"
  | "banner_kit"
  | "banner_ribbon"
  | "banner_natura";

export type SectionWidth = "full" | "half";

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  inStock: boolean;
  imageUrl?: string;
}

// =================================================================
// 3. PRODUTO (BASE)
// =================================================================

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
  disabled: boolean; // NOVO: Para controle de estoque/dependência

  // Slots e Capacidade
  itemSize?: number; // Slot ocupado
  capacity?: number; // Capacidade total de slots (para BASE_CONTAINER)

  // Comum para Bases e Itens:
  saleUnitType?: SaleUnitType; // NOVO: Unidade ou Pacote

  // Específico para RIBBON
  canBeSoldAsRoll?: boolean; // Pode ser vendido em rolo completo?

  // Específico para BASES e ACESSÓRIOS:
  isKitBase?: boolean; // É uma Base de Kit (Caixa/Cesta/Sacola)?
  laçoType?: LacoModelType; // Para identificar Laços Prontos (ACCESSORY)

  variants?: ProductVariant[];
  defaultComponents?: string[];

  // Antigos mantidos por compatibilidade
  wrapperConstraints?: {
    minSlots: number;
    maxSlots: number;
  };
}

// =================================================================
// 4. RECEITAS DE KIT (KitRecipe)
// =================================================================

export type KitComponentType =
  | "BASE"
  | "FILLER"
  | "RIBBON_SERVICE"
  | "LAÇO_PRONTO";

export interface KitComponent {
  componentId: string;
  name: string;
  type: KitComponentType;
  required: boolean;
  maxQuantity: number;
  defaultQuantity: number;
}

export interface KitRecipe {
  id: string;
  name: string;
  description: string;
  disabled: boolean;

  components: KitComponent[];

  assemblyCost: number;
}

export interface AssembledKitProduct extends Product {
  type: "ASSEMBLED_KIT";
  recipeId: string;
  kitBasePrice: number;
}

// =================================================================
// 5. CARRINHO (CART)
// =================================================================

export interface CustomizationDetails {
  style: string;
  size: string;
  [key: string]: any;
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
    modelo: LacoModelType;
    tamanho: "P" | "M" | "G";
    metragemGasta: number;
    assemblyCost: number;
  };

  customizations?: CustomizationDetails; // CORREÇÃO: customizations adicionado

  // Customizações para Kit Montado (CUSTOM_KIT)
  kitComposition?: {
    recipeId: string;
    baseProductId: string;
    finalRibbonDetails?: {
      laçoType: LacoModelType;
      fitaId?: string;
      accessoryId?: string;
    };
    items: { productId: string; quantity: number }[];
  };
}

// =================================================================
// 6. CONFIGURAÇÕES DA LOJA (SETTINGS)
// =================================================================

export interface StoreSection {
  id: string;
  title: string;
  type: SectionType;
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
    // CORREÇÃO: Adicionado secondaryColor (para ProductDetailClient.tsx)
    secondaryColor?: string;
    accentColor?: string;
    backgroundColor?: string;
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
