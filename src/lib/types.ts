export type ProductType =
  | "STANDARD_ITEM" // Antes era STANDARD_ITEM. Agora serve para qualquer produto principal.
  | "BASE_CONTAINER"
  | "FILLER"
  | "WRAPPER"
  | "RIBBON"
  | "SUPPLY_BULK";

export type MeasureUnit = "un" | "m" | "kg" | "pct";

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
}

export interface CartItem {
  cartId: string;
  type: "SIMPLE" | "CUSTOM_KIT";
  product?: Product;
  quantity: number;
  kitName?: string;
  kitComponents?: Product[];
  kitTotalAmount?: number;
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
