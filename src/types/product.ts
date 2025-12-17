export type ProductType =
  | "BASE_CONTAINER"
  | "STANDARD_ITEM"
  | "FILLER"
  | "ACCESSORY"
  | "WRAPPER"
  | "RIBBON"
  | "ASSEMBLED_KIT";

export type MeasureUnit = "m" | "un" | "kg" | "l" | "pct";
export type SaleUnitType = "UNITARIO" | "PACOTE";
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
  disabled: boolean;
  itemSize?: number;
  capacity?: number;
  capacityRef?: CapacityRef;
  saleUnitType?: SaleUnitType;
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
}
