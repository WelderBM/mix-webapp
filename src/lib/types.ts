// src/lib/types.ts

// =================================================================
// 1. TIPOS DE PRODUTO
// =================================================================

export type ProductType =
  | "BASE_CONTAINER" // Cesta, Caixa, Sacola (Ocupa o espaço principal)
  | "STANDARD_ITEM" // Urso, Perfume, Chocolate (Itens de Preenchimento)
  | "FILLER" // Papel Seda, Palha (Preenchimento de volume)
  | "ACCESSORY" // Laço Pronto, Fio de Fada, Tags (Opcionais/Componentes)
  | "WRAPPER" // Saco Celofane, Saco Poli (Embalagem Final)
  | "RIBBON" // Fitas Albano (Venda por metro/rolo)
  | "ASSEMBLED_KIT"; // Meta-Produto (Kit Pré-montado para venda)

export type MeasureUnit = "m" | "un" | "kg" | "l" | "pct";

export type SaleUnitType = "UNITARIO" | "PACOTE"; // NOVO: Diferencia preço unitário de pacote

// Tipos de laços prontos ou modelos de laço para o serviço (Laço Builder)
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

  // Comum para Bases e Itens:
  itemSize?: number; // Slot ocupado (para BASE_CONTAINER)
  capacity?: number; // Capacidade total de slots (para BASE_CONTAINER)
  saleUnitType?: SaleUnitType; // NOVO: Unidade ou Pacote

  // Específico para RIBBON
  canBeSoldAsRoll?: boolean; // Pode ser vendido em rolo completo?

  // Específico para BASES e ACESSÓRIOS:
  isKitBase?: boolean; // É uma Base de Kit (Caixa/Cesta/Sacola)?
  laçoType?: LacoModelType; // NOVO: Para identificar Laços Prontos (ACCESSORY)

  // Antigos, mantidos por segurança:
  wrapperConstraints?: {
    minSlots: number;
    maxSlots: number;
  };

  variants?: ProductVariant[];
  defaultComponents?: string[];
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
  componentId: string; // ID do produto base que este componente representa
  name: string;
  type: KitComponentType;
  required: boolean; // É obrigatório para o kit ser válido?
  maxQuantity: number; // Quantidade máxima permitida
  defaultQuantity: number; // Quantidade inicial (para BASE/FILLER)
}

/**
 * A RECEITA de um Kit pré-definido pelo vendedor (Guia de Montagem).
 */
export interface KitRecipe {
  id: string;
  name: string;
  description: string;
  disabled: boolean;

  components: KitComponent[];

  assemblyCost: number; // Custo de montagem/mão de obra (fixo)
}

/**
 * PRODUTO KITS MONTADO (O item que aparece na prateleira da loja).
 */
export interface AssembledKitProduct extends Product {
  type: "ASSEMBLED_KIT";
  recipeId: string; // ID da KitRecipe que define a composição
  kitBasePrice: number; // Preço inicial do Kit (BASE + assemblyCost)
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
    modelo: LacoModelType; // NOVO: Laço Bola ou Comum/Chanel
    tamanho: "P" | "M" | "G";
    metragemGasta: number;
    assemblyCost: number; // Custo de mão de obra do laço
  };

  // Customizações para Kit Montado (CUSTOM_KIT)
  kitComposition?: {
    recipeId: string;
    baseProductId: string;
    finalRibbonDetails?: {
      laçoType: LacoModelType;
      fitaId?: string;
      accessoryId?: string;
    }; // Qual laço foi escolhido
    items: { productId: string; quantity: number }[]; // Itens adicionados
  };
}

// ... (outros exports de interfaces)
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
