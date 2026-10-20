export interface CategorySubcategory {
  id: string;
  name: string;
  order: number;
}

export interface Category {
  id: string;
  name: string;
  order: number;
  active: boolean;
  subcategories: CategorySubcategory[];
}
