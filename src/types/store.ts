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

// Fonte de produtos de uma vitrine (issue #71) — cobre curadoria manual E
// vitrines "autodidatas" que se preenchem por regra sem edição manual.
//
// Decisões de escopo tomadas nos comentários da issue #71 (04/08/2026):
// - SEM `rule: "newest"`/`"on_sale"` como modo `auto` separado: as tags de
//   SISTEMA da #68 (`novidades`/`promocao`, ver src/lib/productTags.ts) já
//   cobrem os dois critérios — `mode: "tag"` com essas tags resolve sem
//   duplicar "o que é novidade"/"o que está em promoção" em dois lugares.
// - SEM `rule: "bestselling"`: não existe nenhum contador de vendas por
//   produto hoje (precisaria de agregação nova a partir de `orders`,
//   infraestrutura que não existe — não é só código de exibição). Fica de
//   fora do union até essa agregação existir, em vez de aceitar um valor
//   que nunca teria dado real.
export type SectionSource =
  | { mode: "manual"; productIds: string[] }
  | { mode: "category"; categoryId: string; subcategoryId?: string }
  // Cobre tags MANUAIS e tags de SISTEMA (`novidades`/`promocao`) com o
  // mesmo campo — ambas resolvem via getAllProductTags() (productTags.ts).
  | { mode: "tag"; tag: string }
  // Único modo "auto" com dado disponível hoje — ver isLowStock() em
  // src/lib/sections.ts.
  | { mode: "auto"; rule: "low_stock" };

export interface StoreSection {
  id: string;
  title: string;
  type: SectionType;
  width: SectionWidth;
  source: SectionSource;
  isActive: boolean;
  bannerUrl?: string;
  bannerLink?: string;
  // Máximo de produtos resolvidos a exibir (após aplicar `sort`). Sem
  // limite = mostra tudo que a fonte resolver.
  limit?: number;
  sort?: "newest" | "price_asc" | "price_desc";
  // @deprecated — pré-#71 (dado real de produção confirmado neste formato,
  // ver scripts/seed-data/from-production/settings.ts). Nunca escrever
  // aqui de novo; use `source: { mode: "manual", productIds }`. Passe por
  // normalizeSectionSource() (src/lib/sections.ts) em vez de ler
  // `productIds`/`source` direto — cobre os dois formatos sem exigir
  // migração de banco.
  productIds?: string[];
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
