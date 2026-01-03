export type SectionType =
  | "product_shelf"
  | "banner_kit"
  | "banner_ribbon"
  | "banner_natura"
  | "banner_balloon"
  | "assembled_kit_shelf"
  | "custom_banner";

export type SectionWidth = "full" | "half";

export interface StoreSection {
  id: string;
  title: string;
  type: SectionType;
  width: SectionWidth;
  productIds: string[];
  isActive: boolean;
  bannerUrl?: string;
  bannerLink?: string;
}

export interface StoreSettings {
  id: string;
  storeName: string;
  whatsappNumber: string;
  theme: {
    primaryColor: string;
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
  whatsappGroupLink?: string;
}
