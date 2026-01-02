export type ProductType =
  | "BASE_CONTAINER"
  | "STANDARD_ITEM"
  | "FILLER"
  | "ACCESSORY"
  | "WRAPPER"
  | "RIBBON"
  | "ASSEMBLED_KIT";

export type Unit = "m" | "un" | "pct";
export type LacoModelType = "BOLA" | "BORBOLETA" | "PUXAR";
export type CapacityRef = "P" | "M" | "G";
export type RibbonRollStatus = "FECHADO" | "ABERTO";

export interface RibbonInventory {
  status: RibbonRollStatus;
  remainingMeters: number;
  totalRollMeters: number;
}

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  inStock: boolean;
  imageUrl?: string;
}

export interface ProductImage {
  id: string;
  url: string;
  isCover: boolean;
  label?: string; // e.g., "Versão Azul", "Vista Lateral"
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  rollPrice?: number;
  originalPrice?: number;
  type: ProductType;
  category: string;
  images?: ProductImage[]; // New support for multiple images
  imageUrl?: string; // Legacy support (computed from Cover)
  unit: Unit;
  inStock: boolean;
  disabled: boolean;
  itemSize?: number;
  capacity?: number;
  capacityRef?: CapacityRef;
  canBeSoldAsRoll?: boolean;
  isAvailableForCustomBow?: boolean;
  ribbonInventory?: RibbonInventory;
  isKitBase?: boolean;
  laçoType?: LacoModelType;
  variants?: ProductVariant[];
  defaultComponents?: string[];
  wrapperConstraints?: {
    minSlots: number;
    maxSlots: number;
  };
  width?: number;
  height?: number;
  depth?: number;
  weight?: number;

  kitStyle?: string;
  requiredWrapperSize?: string;
  wrapperSize?: string;
  recipeId?: string;
  kitBasePrice?: number;
}
export interface AssembledKitProduct extends Product {
  type: "ASSEMBLED_KIT";
  recipeId: string;
  kitBasePrice: number;
}
