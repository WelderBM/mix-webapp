import { StoreSettings } from "../../src/types/store";
import { BalloonConfig } from "../../src/types/balloon";
import { categories } from "./categories";
import { stdComPreco, stdComPromo, assembledKit } from "./products";

const placeholder = (text: string) =>
  `https://placehold.co/1200x400/f1f5f9/334155.png?text=${encodeURIComponent(
    text
  )}`;

const activeCategoryNames = categories
  .filter((c) => c.active)
  .map((c) => c.name);

export const generalSettings: StoreSettings = {
  id: "general",
  storeName: "Mix Novidades (seed)",
  whatsappNumber: "5595999999999",
  theme: {
    primaryColor: "#FF6B6B",
    activeTheme: "default",
  },
  filters: {
    activeCategories: activeCategoryNames,
    categoryOrder: activeCategoryNames,
  },
  // ON em staging pra manter o fluxo atual do KitBuilder testável; produção
  // fica OFF por padrão (ausência do campo no doc real) até #108 maturar.
  features: {
    customKitEnabled: true,
  },
  homeSections: [
    {
      id: "seed-section-vitrine",
      title: "Destaques (seed)",
      type: "product_shelf",
      width: "full",
      // productIds resolvendo pra produtos REAIS seedados em products.ts —
      // o runner valida essa invariante depois de inserir tudo.
      productIds: [stdComPreco.id, stdComPromo.id, assembledKit.id],
      isActive: true,
    },
  ],
  bowModels: [
    // Modelo COMPLETO: tem sizeId apontando pra um BowSize existente.
    {
      id: "seed-bow-model-completo",
      name: "Bola (seed)",
      subtitle: "Clássico, pronto pra usar",
      imageUrl: placeholder("Laco Bola"),
      sizeId: "seed-bow-size-p",
    },
    // Modelo SEM sizeId — caso de borda: LacoBuilder trata como "incompleto",
    // não selecionável até o admin escolher um tamanho (ver BowModel em
    // src/types/store.ts).
    {
      id: "seed-bow-model-incompleto",
      name: "Borboleta (seed)",
      subtitle: "Sem tamanho definido ainda",
      imageUrl: placeholder("Laco Borboleta"),
    },
  ],
  bowSizes: [{ id: "seed-bow-size-p", name: "Pequeno", price: 8 }],
};

export const balloonConfig: BalloonConfig = {
  types: [
    {
      id: "seed-balao-liso",
      name: "Balão Liso (seed)",
      active: true,
      colors: ["Vermelho", "Azul", "Branco"],
      sizes: [
        { size: "9", price: 16, unitsPerPackage: 50 },
        { size: "16", price: 20, unitsPerPackage: 20 },
      ],
    },
    {
      id: "seed-balao-metalico",
      name: "Balão Metálico (seed)",
      active: true,
      colors: ["Dourado", "Prata"],
      sizes: [{ size: "9", price: 27, unitsPerPackage: 25 }],
    },
  ],
  allColors: ["Vermelho", "Azul", "Branco", "Dourado", "Prata"],
};
