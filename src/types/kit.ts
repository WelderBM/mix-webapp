import { Product, LacoModelType } from "./product";

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
