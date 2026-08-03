export interface BowModel {
  id: string;
  name: string;
  subtitle: string;
  imageUrl: string;
  // Um modelo pode ser oferecido em vários tamanhos (P/M/G) sem duplicar
  // cadastro/imagem — ver #144. `sizeIds` é a fonte de verdade nova.
  sizeIds?: string[];
  // @deprecated — mantido só como leitura tolerante de dado de produção
  // cadastrado antes de #144 (1 modelo = 1 tamanho). Nunca escrever aqui de
  // novo; use `sizeIds`. Passe por `getModelSizeIds(model)` em vez de ler
  // `sizeId`/`sizeIds` direto — ele cobre os dois formatos.
  sizeId?: string;
}

// Único ponto de leitura de "quais tamanhos este modelo aceita" — cobre
// tanto o dado novo (`sizeIds`) quanto o legado (`sizeId` único, pré-#144)
// sem exigir migração: modelo de produção salvo antes de #144 continua
// funcionando, tratado como uma lista de um item só.
export function getModelSizeIds(model: BowModel): string[] {
  return model.sizeIds ?? (model.sizeId ? [model.sizeId] : []);
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
