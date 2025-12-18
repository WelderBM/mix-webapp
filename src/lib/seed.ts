// src/lib/seed.ts (NOVA VERSÃO EXTENSA)
import { collection, doc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Product,
  StoreSettings,
  AssembledKitProduct,
  KitRecipe,
  Unit,
} from "@/types";

// Coleções
const ALL_PRODUCTS_REF = collection(db, "products");
const SETTINGS_REF = doc(db, "settings", "general");
const KIT_RECIPES_REF = collection(db, "kit_recipes");

export const seedDatabase = async () => {
  const batch = writeBatch(db);

  // 1. CONFIGURAÇÕES INICIAIS
  const initialSettings: StoreSettings = {
    id: "general",
    storeName: "Mix Novidades & Embalagens",
    whatsappNumber: "5595984244194",
    filters: {
      activeCategories: ["Fitas", "Bases", "Natura", "Acessórios"],
      categoryOrder: ["Fitas", "Bases", "Natura", "Acessórios"],
    },
    homeSections: [
      {
        id: "sec_natal",
        title: "🎁 Kits Prontos de Natal",
        type: "product_shelf",
        productIds: ["KIT001", "KIT002"], // Kits Montados
        width: "full",
        isActive: true,
      },
      {
        id: "sec_natura",
        title: "✨ Área Natura - Recheios",
        type: "product_shelf",
        productIds: ["PROD_NAT01", "PROD_NAT02", "PROD_NAT03", "PROD_NAT04"],
        width: "half",
        isActive: true,
      },
      {
        id: "sec_fitas_32",
        title: "🎀 Fitas 32mm (Rolos Fechados)",
        type: "product_shelf",
        productIds: ["FITA001", "FITA002"],
        width: "half",
        isActive: true,
      },
    ],
    theme: {
      primaryColor: "",
      secondaryColor: "",
      accentColor: "",
      backgroundColor: "",
      activeTheme: "default",
    },
  };
  batch.set(SETTINGS_REF, initialSettings);

  // =================================================================
  // 2. PRODUTOS (Fitas, Bases, Recheios, Laços Prontos)
  // =================================================================

  const products: Product[] = [
    // --- 6 x FITAS (RIBBON) ---
    {
      id: "FITA001",
      name: "Fita Laminada Ouro 32mm",
      price: 1.8,
      type: "RIBBON",
      category: "Fitas 32mm",
      unit: "m" as Unit,
      inStock: true,
      disabled: false,
      imageUrl: "/images/fitas/ouro-32.webp",
      canBeSoldAsRoll: true,
      originalPrice: 2.5,
      itemSize: 1.0,
      capacity: 100.0, // 100 metros
    },
    {
      id: "FITA002",
      name: "Fita PP Metalizada Verde 32mm",
      price: 2.2,
      type: "RIBBON",
      category: "Fitas 32mm",
      unit: "m" as Unit,
      inStock: true,
      disabled: false,
      imageUrl: "/images/fitas/verde-32.webp",
      canBeSoldAsRoll: true,
      itemSize: 1.0,
      capacity: 100.0,
    },
    {
      id: "FITA003",
      name: "Fita PP Brilho Holográfico 16mm",
      price: 0.9,
      type: "RIBBON",
      category: "Fitas 16mm",
      unit: "m" as Unit,
      inStock: true,
      disabled: false,
      imageUrl: "/images/fitas/holografica-16.webp",
      canBeSoldAsRoll: true,
      itemSize: 0.5,
      capacity: 100.0,
    },
    {
      id: "FITA004",
      name: "Fita Cetim Nº5 (Cores Sortidas)",
      price: 0.7,
      type: "RIBBON",
      category: "Fitas 16mm",
      unit: "m" as Unit,
      inStock: true,
      disabled: false,
      imageUrl: "https://placehold.co/400x400/png?text=Fita+Cetim",
      canBeSoldAsRoll: false,
      itemSize: 0.5,
      capacity: 50.0, // Rolo mexido
    },
    {
      id: "FITA005",
      name: "Fita Laminada Prata 32mm",
      price: 1.9,
      type: "RIBBON",
      category: "Fitas 32mm",
      unit: "m" as Unit,
      inStock: true,
      disabled: false,
      imageUrl: "/images/fitas/prata-32.webp",
      canBeSoldAsRoll: true,
      itemSize: 1.0,
      capacity: 100.0,
    },
    {
      id: "FITA006",
      name: "Fita Xadrez Natal 16mm",
      price: 1.1,
      type: "RIBBON",
      category: "Fitas 16mm",
      unit: "m" as Unit,
      inStock: true,
      disabled: false,
      imageUrl: "/images/fitas/xadrez-16.webp",
      canBeSoldAsRoll: true,
      itemSize: 0.5,
      capacity: 100.0,
    },

    // --- 4 x BASES (BASE_CONTAINER) ---
    {
      id: "BASE001",
      name: "Cesta com Arco de Madeira",
      price: 35.0,
      type: "BASE_CONTAINER",
      category: "Cestas",
      unit: "un" as Unit,
      inStock: true,
      disabled: false,
      imageUrl: "/images/bases/cesta-madeira.webp",
      isKitBase: true,
      capacity: 20.0,
      itemSize: 1.0,
    },
    {
      id: "BASE002",
      name: "Caixa Cartonada Fechada (Grande)",
      price: 18.0,
      type: "BASE_CONTAINER",
      category: "Caixas",
      unit: "un" as Unit,
      inStock: true,
      disabled: false,
      imageUrl: "/images/bases/caixa-cartonada.webp",
      isKitBase: true,
      capacity: 12.0,
      itemSize: 1.0,
    },
    {
      id: "BASE003",
      name: "Sacola de Papel (Cor Única)",
      price: 3.0,
      type: "BASE_CONTAINER",
      category: "Sacolas",
      unit: "un" as Unit,
      inStock: true,
      disabled: false,
      imageUrl: "/images/bases/sacola-papel.webp",
      isKitBase: true,
      capacity: 5.0,
      itemSize: 1.0,
    },
    {
      id: "BASE004",
      name: "Sacola de Papel (Pacote 50 un.)",
      price: 99.0,
      type: "BASE_CONTAINER",
      category: "Sacolas",
      unit: "pct" as Unit,
      inStock: true,
      disabled: false,
      imageUrl: "/images/bases/sacola-pacote.webp",
      isKitBase: false, // Não é base de kit, é venda de pacote
      capacity: 0,
      itemSize: 0,
      description: "Pacote fechado com 50 sacolas de papel cor única.",
    },

    // --- 6 x RECHEIOS/ITENS (STANDARD_ITEM) ---
    {
      id: "PROD_NAT01",
      name: "Sabonete TodoDia (Unidade)",
      price: 6.5,
      type: "STANDARD_ITEM",
      category: "Natura",
      unit: "un" as Unit,
      inStock: true,
      disabled: false,
      imageUrl: "/images/natura/sabonete.webp",
      itemSize: 1.0,
    },
    {
      id: "PROD_NAT02",
      name: "Hidratante Algodão 400ml",
      price: 69.9,
      type: "STANDARD_ITEM",
      category: "Natura",
      unit: "un" as Unit,
      inStock: true,
      disabled: false,
      imageUrl: "/images/natura/hidratante.webp",
      itemSize: 3.0,
    },
    {
      id: "PROD_BRINQ01",
      name: "Ursinho Pelúcia (Pequeno)",
      price: 25.0,
      type: "STANDARD_ITEM",
      category: "Brinquedos",
      unit: "un" as Unit,
      inStock: true,
      disabled: false,
      imageUrl: "/images/recheios/ursinho.webp",
      itemSize: 2.0,
    },
    {
      id: "PROD_ESCOLAR01",
      name: "Caneta Colorida Gel (Unidade)",
      price: 5.0,
      type: "STANDARD_ITEM",
      category: "Material Escolar",
      unit: "un" as Unit,
      inStock: true,
      disabled: false,
      imageUrl: "/images/recheios/caneta.webp",
      itemSize: 0.5,
    },
    {
      id: "PROD_ESCOLAR02",
      name: "Kit Canetas (Pacote 10 uni.)",
      price: 35.0,
      type: "STANDARD_ITEM",
      category: "Material Escolar",
      unit: "pct" as Unit,
      inStock: true,
      disabled: false,
      imageUrl: "/images/recheios/caneta-pacote.webp",
      itemSize: 3.0,
    },
    {
      id: "PROD_FILLER01",
      name: "Papel Seda (Pacote 10 fls)",
      price: 8.0,
      type: "FILLER",
      category: "Preenchimento",
      unit: "pct" as Unit,
      inStock: true,
      disabled: false,
      imageUrl: "/images/recheios/papel-seda.webp",
      itemSize: 1.0,
    },

    // --- 4 x LAÇOS PRONTOS/ACESSÓRIOS (ACCESSORY) ---
    {
      id: "LACO_PRONTO01",
      name: "Laço de Puxar Vermelho (Pacote)",
      price: 12.0,
      type: "ACCESSORY",
      category: "Laços Prontos",
      unit: "pct" as Unit,
      inStock: true,
      disabled: false,
      imageUrl: "/images/acessorios/laco-puxar.webp",
      laçoType: "PUXAR",
      itemSize: 0.1,
      description: "Pacote com 10 laços de puxar.",
    },
    {
      id: "LACO_PRONTO02",
      name: "Laço Bola Ouro (Unidade)",
      price: 4.5,
      type: "ACCESSORY",
      category: "Laços Prontos",
      unit: "un" as Unit,
      inStock: true,
      disabled: false,
      imageUrl: "/images/acessorios/laco-bola.webp",
      laçoType: "BOLA",
      itemSize: 0.5,
    },
    {
      id: "LACO_PRONTO03",
      name: "Tag 'De/Para' Natalino (Pacote)",
      price: 5.0,
      type: "ACCESSORY",
      category: "Acessórios",
      unit: "pct" as Unit,
      inStock: true,
      disabled: false,
      imageUrl: "/images/acessorios/tag.webp",
      itemSize: 0.1,
      description: "Pacote com 20 tags natalinas.",
    },
    {
      id: "LACO_PRONTO04",
      name: "Fio de Fada Led (1m)",
      price: 15.0,
      type: "ACCESSORY",
      category: "Acessórios",
      unit: "un" as Unit,
      inStock: true,
      disabled: false,
      imageUrl: "/images/acessorios/fio-fada.webp",
      itemSize: 0.5,
    },
  ];

  // =================================================================
  // 3. RECEITAS DE KITS (KitRecipe)
  // =================================================================

  const initialKitRecipes: KitRecipe[] = [
    {
      id: "KREC001",
      name: "Receita Essencial Sacola - Sacola + Natura",
      description:
        "Kit ideal para pequenos presentes Natura. Foca na Sacola como base.",
      disabled: false,
      assemblyCost: 5.0,
      components: [
        {
          componentId: "BASE003",
          name: "Sacola de Papel (Base)",
          type: "BASE",
          required: true,
          maxQuantity: 1,
          defaultQuantity: 1,
        },
        {
          componentId: "PROD_NAT01",
          name: "Sabonete TodoDia",
          type: "FILLER",
          required: true,
          maxQuantity: 4,
          defaultQuantity: 2,
        },
        {
          componentId: "LAÇO_PRONTO01",
          name: "Laço de Puxar Vermelho",
          type: "LAÇO_PRONTO",
          required: false,
          maxQuantity: 1,
          defaultQuantity: 0,
        },
        {
          componentId: "SERVICE-RIBBON",
          name: "Serviço Laço Customizado",
          type: "RIBBON_SERVICE",
          required: false,
          maxQuantity: 1,
          defaultQuantity: 0,
        },
      ],
    },
    {
      id: "KREC002",
      name: "Receita Afeto - Cesta e Ursinho",
      description:
        "Kit com Cesta Vime, Ursinho e Fio de Fada. Foco em Laços BOLA/COMUM.",
      disabled: false,
      assemblyCost: 10.0,
      components: [
        {
          componentId: "BASE001",
          name: "Cesta com Arco de Madeira",
          type: "BASE",
          required: true,
          maxQuantity: 1,
          defaultQuantity: 1,
        },
        {
          componentId: "PROD_BRINQ01",
          name: "Ursinho Pelúcia",
          type: "FILLER",
          required: true,
          maxQuantity: 1,
          defaultQuantity: 1,
        },
        {
          componentId: "PROD_FILLER01",
          name: "Papel Seda",
          type: "FILLER",
          required: false,
          maxQuantity: 2,
          defaultQuantity: 1,
        },
        {
          componentId: "LAÇO_PRONTO02",
          name: "Laço Bola Ouro",
          type: "LAÇO_PRONTO",
          required: false,
          maxQuantity: 1,
          defaultQuantity: 0,
        },
        {
          componentId: "SERVICE-RIBBON",
          name: "Serviço Laço Customizado",
          type: "RIBBON_SERVICE",
          required: false,
          maxQuantity: 1,
          defaultQuantity: 0,
        },
      ],
    },
    {
      id: "KREC003",
      name: "Receita Escolar - Caixa e Canetas",
      description:
        "Kit focado em material escolar. Base Caixa Cartonada e itens do tipo PACOTE.",
      disabled: false,
      assemblyCost: 4.0,
      components: [
        {
          componentId: "BASE002",
          name: "Caixa Cartonada Fechada",
          type: "BASE",
          required: true,
          maxQuantity: 1,
          defaultQuantity: 1,
        },
        {
          componentId: "PROD_ESCOLAR02",
          name: "Kit Canetas (Pacote 10 uni.)",
          type: "FILLER",
          required: true,
          maxQuantity: 1,
          defaultQuantity: 1,
        },
        {
          componentId: "LAÇO_PRONTO03",
          name: "Tag Natalina (Pacote)",
          type: "LAÇO_PRONTO",
          required: false,
          maxQuantity: 1,
          defaultQuantity: 0,
        },
        {
          componentId: "SERVICE-RIBBON",
          name: "Serviço Laço Customizado",
          type: "RIBBON_SERVICE",
          required: false,
          maxQuantity: 1,
          defaultQuantity: 0,
        },
      ],
    },
  ];

  // =================================================================
  // 4. PRODUTOS KITS MONTADOS (Para Vitrine)
  // =================================================================

  const initialAssembledKitProducts: AssembledKitProduct[] = [
    {
      id: "KIT001",
      name: "Kit Essencial Natura (Montado)",
      description: "Sacola e 2 Sabonetes de Brinde. Personalize o Laço!",
      price: 18.0, // BASE003(3.0) + PROD_NAT01x2(13.0) + assembly(5.0) = 21.0. Colocando 18.0 para promoção.
      type: "ASSEMBLED_KIT",
      imageUrl: "/images/kits/kit001-natura.webp",
      category: "Kits Rápidos",
      unit: "un" as Unit,
      inStock: true,
      disabled: false,
      canBeSoldAsRoll: false,
      recipeId: "KREC001",
      kitBasePrice: 18.0,
    },
    {
      id: "KIT002",
      name: "Kit Afeto Ursinho Completo",
      description:
        "Cesta de Vime, Ursinho e Embalagem Premium. Ideal para Natal.",
      price: 70.0, // BASE001(35.0) + PROD_BRINQ01(25.0) + assembly(10.0) = 70.0
      type: "ASSEMBLED_KIT",
      imageUrl: "/images/kits/kit002-afeto.webp",
      category: "Kits Premium",
      unit: "un" as Unit,
      inStock: true,
      disabled: false,
      canBeSoldAsRoll: false,
      recipeId: "KREC002",
      kitBasePrice: 70.0,
    },
    {
      id: "KIT003",
      name: "Kit Escolar (Canetas + Caixa)",
      description: "Perfeito para crianças. Inclui Caixa e Pacote de Canetas.",
      price: 57.0, // BASE002(18.0) + PROD_ESCOLAR02(35.0) + assembly(4.0) = 57.0
      type: "ASSEMBLED_KIT",
      imageUrl: "/images/kits/kit003-escolar.webp",
      category: "Kits Rápidos",
      unit: "un" as Unit,
      inStock: true,
      disabled: false,
      canBeSoldAsRoll: false,
      recipeId: "KREC003",
      kitBasePrice: 57.0,
    },
  ];

  // =================================================================
  // 5. FUNÇÃO PRINCIPAL
  // =================================================================

  // Limpa produtos antigos e insere novos
  products.forEach((prod) => {
    const ref = doc(ALL_PRODUCTS_REF, prod.id);
    batch.set(ref, prod);
  });

  // Insere Kits Montados na coleção de produtos para exibição
  initialAssembledKitProducts.forEach((kit) => {
    const ref = doc(ALL_PRODUCTS_REF, kit.id);
    batch.set(ref, kit);
  });

  // Insere Receitas de Kits (Configuração do Builder)
  initialKitRecipes.forEach((recipe) => {
    const ref = doc(KIT_RECIPES_REF, recipe.id);
    batch.set(ref, recipe);
  });

  try {
    await batch.commit();
    console.log(
      "Banco de dados populado com a nova estrutura de Kits e Tipos!"
    );
  } catch (error) {
    console.error("Erro durante a seed do banco de dados:", error);
  }
};
