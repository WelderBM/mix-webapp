export interface BowModel {
  id: string;
  name: string;
  subtitle: string;
  imageUrl: string;
  // Um modelo tem exatamente um tamanho — não dá pra montar o mesmo modelo
  // em tamanhos diferentes. Opcional só pra não quebrar modelos já
  // cadastrados antes dessa regra existir; o LacoBuilder trata ausência
  // como "modelo incompleto" (não pode ser selecionado até o admin
  // escolher um tamanho).
  sizeId?: string;
}

export interface BowSize {
  id: string;
  name: string;
  price: number;
}

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
  bowModels?: BowModel[];
  bowSizes?: BowSize[];
  // Flags atrás das quais features com domínio ainda não maturado ficam
  // escondidas da loja. Ausência do campo (docs de produção existentes,
  // pré-flag) deve ser tratada como OFF — ver #108.
  features?: {
    customKitEnabled?: boolean;
  };
}
