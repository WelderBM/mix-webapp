export type ProductType =
  | "NATURA_ITEM"
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
