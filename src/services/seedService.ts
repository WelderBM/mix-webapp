import { collection, doc, writeBatch, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase"; // Certifique-se que este caminho está correto no seu projeto
import {
  Product,
  StoreSettings,
  AssembledKitProduct,
  KitRecipe,
  Unit,
} from "@/types";
import { BalloonConfig } from "@/types/balloon";

// Constantes de Referência
const ALL_PRODUCTS_REF = collection(db, "products");
const SETTINGS_REF = doc(db, "settings", "general");
const KIT_RECIPES_REF = collection(db, "kit_recipes");

// Helper para gerar imagem com texto
const getPlaceholdImage = (text: string) =>
  `https://placehold.co/400x400/f1f5f9/334155.png?text=${encodeURIComponent(
    text
  )}`;

// --- MUDANÇA PRINCIPAL: Nome da função exportada para 'runSeed' ---
export const runSeed = async () => {
  console.log("Iniciando Seed...");
  const batch = writeBatch(db);

  // 1. CONFIGURAÇÕES DA LOJA
  const initialSettings: StoreSettings = {
    id: "general",
    storeName: "Mix Novidades & Embalagens",
    whatsappNumber: "5595984244194",
    filters: {
      activeCategories: ["Fitas", "Bases", "Natura", "Acessórios"],
      categoryOrder: ["Fitas", "Bases", "Natura", "Acessórios"],
    },
    homeSections: [],
    theme: { activeTheme: "default" } as any,
  };
  // Atenção: batch.set precisa da referência do documento, não da coleção
  batch.set(SETTINGS_REF, initialSettings);

  // 2. PRODUTOS
  const products: Product[] = [
    // =======================================================================
    // FITAS (RIBBON)
    // =======================================================================
    {
      id: "FITA001",
      name: "Fita Laminada Ouro 32mm",
      price: 0.5,
      rollPrice: 40.0,
      type: "RIBBON",
      category: "Fitas 32mm",
      unit: "m" as Unit,
      inStock: true,
      disabled: false,
      imageUrl: getPlaceholdImage("Fita Ouro 32mm"),
      canBeSoldAsRoll: true,
      itemSize: 1.0,
      capacity: 100.0,
      ribbonInventory: {
        status: "FECHADO",
        remainingMeters: 100,
        totalRollMeters: 100,
      },
    },
    {
      id: "FITA002",
      name: "Fita PP Metalizada Verde 32mm",
      price: 0.5,
      rollPrice: 40.0,
      type: "RIBBON",
      category: "Fitas 32mm",
      unit: "m" as Unit,
      inStock: true,
      disabled: false,
      imageUrl: getPlaceholdImage("Fita Verde 32mm"),
      canBeSoldAsRoll: true,
      itemSize: 1.0,
      capacity: 100.0,
      ribbonInventory: {
        status: "ABERTO",
        remainingMeters: 45.5,
        totalRollMeters: 100,
      },
    },
    {
      id: "FITA003",
      name: "Fita Holográfica 16mm",
      price: 0.25,
      rollPrice: 40.0,
      type: "RIBBON",
      category: "Fitas 16mm",
      unit: "m" as Unit,
      inStock: true,
      disabled: false,
      imageUrl: getPlaceholdImage("Fita Holográfica"),
      canBeSoldAsRoll: true,
      itemSize: 0.5,
      capacity: 100.0,
      ribbonInventory: {
        status: "FECHADO",
        remainingMeters: 100,
        totalRollMeters: 100,
      },
    },
    {
      id: "FITA004",
      name: "Fita Cetim Nº5 Sortida",
      price: 0.35,
      type: "RIBBON",
      category: "Fitas 22mm",
      unit: "m" as Unit,
      inStock: true,
      disabled: false,
      imageUrl: getPlaceholdImage("Fita Cetim Sortida"),
      canBeSoldAsRoll: false,
      itemSize: 0.5,
      capacity: 50.0,
      ribbonInventory: {
        status: "ABERTO",
        remainingMeters: 50,
        totalRollMeters: 50,
      },
    },
    {
      id: "FITA005",
      name: "Fita Laminada Prata 32mm",
      price: 0.5,
      rollPrice: 40.0,
      type: "RIBBON",
      category: "Fitas 32mm",
      unit: "m" as Unit,
      inStock: true,
      disabled: false,
      imageUrl: getPlaceholdImage("Fita Prata 32mm"),
      canBeSoldAsRoll: true,
      itemSize: 1.0,
      capacity: 100.0,
      ribbonInventory: {
        status: "FECHADO",
        remainingMeters: 100,
        totalRollMeters: 100,
      },
    },
    {
      id: "FITA006",
      name: "Fita Xadrez Natal 16mm",
      price: 0.25,
      rollPrice: 35.0,
      type: "RIBBON",
      category: "Fitas 16mm",
      unit: "m" as Unit,
      inStock: true,
      disabled: false,
      imageUrl: getPlaceholdImage("Fita Natal"),
      canBeSoldAsRoll: true,
      itemSize: 0.5,
      capacity: 100.0,
      ribbonInventory: {
        status: "ABERTO",
        remainingMeters: 80,
        totalRollMeters: 100,
      },
    },

    // =======================================================================
    // BASES (BASE_CONTAINER)
    // =======================================================================
    {
      id: "BASE001",
      name: "Cesta Arco Madeira",
      price: 35.0,
      type: "BASE_CONTAINER",
      category: "Cestas",
      unit: "un" as Unit,
      inStock: true,
      disabled: false,
      imageUrl: getPlaceholdImage("Cesta Madeira"),
      isKitBase: true,
      capacity: 20.0,
      itemSize: 1.0,
    },
    {
      id: "BASE002",
      name: "Caixa Cartonada G",
      price: 18.0,
      type: "BASE_CONTAINER",
      category: "Caixas",
      unit: "un" as Unit,
      inStock: true,
      disabled: false,
      imageUrl: getPlaceholdImage("Caixa Grande"),
      isKitBase: true,
      capacity: 12.0,
      itemSize: 1.0,
    },
    {
      id: "BASE003",
      name: "Sacola Papel",
      price: 3.0,
      type: "BASE_CONTAINER",
      category: "Sacolas",
      unit: "un" as Unit,
      inStock: true,
      disabled: false,
      imageUrl: getPlaceholdImage("Sacola Papel"),
      isKitBase: true,
      capacity: 5.0,
      itemSize: 1.0,
    },
    {
      id: "BASE004",
      name: "Pacote Sacolas 50un",
      price: 99.0,
      type: "BASE_CONTAINER",
      category: "Sacolas",
      unit: "pct" as Unit,
      inStock: true,
      disabled: false,
      imageUrl: getPlaceholdImage("Pacote Sacolas"),
      isKitBase: false,
      capacity: 0,
      itemSize: 0,
      description: "Pacote fechado com 50 unidades.",
    },

    // =======================================================================
    // RECHEIOS (STANDARD_ITEM)
    // =======================================================================
    {
      id: "PROD_NAT01",
      name: "Sabonete TodoDia",
      price: 6.5,
      type: "STANDARD_ITEM",
      category: "Natura",
      unit: "un" as Unit,
      inStock: true,
      disabled: false,
      imageUrl: getPlaceholdImage("Sabonete Natura"),
      itemSize: 1.0,
    },
    {
      id: "PROD_NAT02",
      name: "Hidratante 400ml",
      price: 69.9,
      type: "STANDARD_ITEM",
      category: "Natura",
      unit: "un" as Unit,
      inStock: true,
      disabled: false,
      imageUrl: getPlaceholdImage("Hidratante Natura"),
      itemSize: 3.0,
    },
    {
      id: "PROD_BRINQ01",
      name: "Ursinho Pelúcia",
      price: 25.0,
      type: "STANDARD_ITEM",
      category: "Brinquedos",
      unit: "un" as Unit,
      inStock: true,
      disabled: false,
      imageUrl: getPlaceholdImage("Ursinho"),
      itemSize: 2.0,
    },
    {
      id: "PROD_ESCOLAR02",
      name: "Kit Canetas 10un",
      price: 35.0,
      type: "STANDARD_ITEM",
      category: "Material Escolar",
      unit: "pct" as Unit,
      inStock: true,
      disabled: false,
      imageUrl: getPlaceholdImage("Kit Canetas"),
      itemSize: 3.0,
    },
    {
      id: "PROD_FILLER01",
      name: "Papel Seda 10fls",
      price: 8.0,
      type: "FILLER",
      category: "Preenchimento",
      unit: "pct" as Unit,
      inStock: true,
      disabled: false,
      imageUrl: getPlaceholdImage("Papel Seda"),
      itemSize: 1.0,
    },

    // =======================================================================
    // ACESSÓRIOS (ACCESSORY)
    // =======================================================================
    {
      id: "LACO_PRONTO01",
      name: "Laço Puxar (Pct)",
      price: 12.0,
      type: "ACCESSORY",
      category: "Laços Prontos",
      unit: "pct" as Unit,
      inStock: true,
      disabled: false,
      imageUrl: getPlaceholdImage("Laço Puxar"),
      laçoType: "PUXAR",
      itemSize: 0.1,
    },
    {
      id: "LACO_PRONTO02",
      name: "Laço Bola Ouro",
      price: 4.5,
      type: "ACCESSORY",
      category: "Laços Prontos",
      unit: "un" as Unit,
      inStock: true,
      disabled: false,
      imageUrl: getPlaceholdImage("Laço Bola"),
      laçoType: "BOLA",
      itemSize: 0.5,
    },
  ];

  // 3. RECEITAS DE KITS
  const initialKitRecipes: KitRecipe[] = [
    {
      id: "KREC001",
      name: "Receita Essencial Sacola",
      description: "Sacola + Natura",
      disabled: false,
      assemblyCost: 5.0,
      components: [
        {
          componentId: "BASE003",
          name: "Sacola de Papel",
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
          name: "Laço de Puxar",
          type: "LAÇO_PRONTO",
          required: false,
          maxQuantity: 1,
          defaultQuantity: 0,
        },
        {
          componentId: "SERVICE-RIBBON",
          name: "Serviço Laço",
          type: "RIBBON_SERVICE",
          required: false,
          maxQuantity: 1,
          defaultQuantity: 0,
        },
      ],
    },
    {
      id: "KREC002",
      name: "Receita Afeto",
      description: "Cesta Vime + Ursinho",
      disabled: false,
      assemblyCost: 10.0,
      components: [
        {
          componentId: "BASE001",
          name: "Cesta Madeira",
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
          name: "Serviço Laço",
          type: "RIBBON_SERVICE",
          required: false,
          maxQuantity: 1,
          defaultQuantity: 0,
        },
      ],
    },
  ];

  // 4. KITS MONTADOS (VITRINE)
  const initialAssembledKitProducts: AssembledKitProduct[] = [
    {
      id: "KIT001",
      name: "Kit Essencial Natura",
      description: "Sacola e 2 Sabonetes de Brinde.",
      price: 18.0,
      type: "ASSEMBLED_KIT",
      imageUrl: getPlaceholdImage("Kit Natura"),
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
      name: "Kit Afeto Ursinho",
      description: "Cesta de Vime, Ursinho e Embalagem Premium.",
      price: 70.0,
      type: "ASSEMBLED_KIT",
      imageUrl: getPlaceholdImage("Kit Ursinho"),
      category: "Kits Premium",
      unit: "un" as Unit,
      inStock: true,
      disabled: false,
      canBeSoldAsRoll: false,
      recipeId: "KREC002",
      kitBasePrice: 70.0,
    },
  ];

  // =================================================================
  // EXECUÇÃO DO BATCH
  // =================================================================

  // Produtos Normais
  products.forEach((prod) => {
    const ref = doc(ALL_PRODUCTS_REF, prod.id);
    batch.set(ref, prod);
  });

  // Kits Montados
  initialAssembledKitProducts.forEach((kit) => {
    const ref = doc(ALL_PRODUCTS_REF, kit.id);
    batch.set(ref, kit);
  });

  // Receitas
  initialKitRecipes.forEach((recipe) => {
    const ref = doc(KIT_RECIPES_REF, recipe.id);
    batch.set(ref, recipe);
  });

  try {
    await batch.commit();
    console.log("✅ Seed completa realizada com sucesso!");
    // Opcional: Retornar algo para o frontend saber que deu certo sem olhar o console
    return { success: true };
  } catch (error) {
    console.error("Erro durante a seed:", error);
    throw error;
  }
};

export const seedBalloons = async () => {
  console.log("Iniciando Seed de Balões...");

  const balloonConfig: BalloonConfig = {
    types: [
      {
        id: "simples",
        name: "Balão Simples",
        colors: [
          "Vermelho",
          "Azul",
          "Amarelo",
          "Rosa",
          "Branco",
          "Preto",
          "Verde",
          "Laranja",
        ],
        sizes: [
          { size: "5", price: 11.0, unitsPerPackage: 50 },
          { size: "6.5", price: 7.5, unitsPerPackage: 50 },
          { size: "7", price: 10.0, unitsPerPackage: 50 },
          { size: "8", price: 13.0, unitsPerPackage: 50 },
          { size: "9", price: 16.0, unitsPerPackage: 50 },
          { size: "16", price: 20.0, unitsPerPackage: 20 },
        ],
      },
      {
        id: "metalico",
        name: "Metálico",
        colors: [
          "Dourado",
          "Prata",
          "Rose Gold",
          "Azul Metálico",
          "Vermelho Metálico",
        ],
        sizes: [
          { size: "5", price: 17.5, unitsPerPackage: 25 },
          { size: "9", price: 27.0, unitsPerPackage: 25 },
          { size: "16", price: 38.0, unitsPerPackage: 10 },
        ],
      },
      {
        id: "candy",
        name: "Candy Colors",
        colors: [
          "Rosa Candy",
          "Azul Candy",
          "Verde Candy",
          "Lilás Candy",
          "Amarelo Candy",
        ],
        sizes: [
          { size: "5", price: 6.5, unitsPerPackage: 25 },
          { size: "9", price: 10.0, unitsPerPackage: 25 },
          { size: "16", price: 20.0, unitsPerPackage: 10 },
        ],
      },
      {
        id: "cintilante",
        name: "Cintilante",
        colors: ["Perolado", "Champagne", "Branco Cintilante"],
        sizes: [
          { size: "7", price: 17.5, unitsPerPackage: 50 },
          { size: "8", price: 10.0, unitsPerPackage: 25 },
          { size: "9", price: 13.0, unitsPerPackage: 25 },
        ],
      },
      {
        id: "canudo",
        name: "Canudo",
        colors: ["Sortido"],
        sizes: [{ size: "Único", price: 15.0, unitsPerPackage: 50 }],
      },
      {
        id: "uniq16",
        name: "Uniq 16",
        colors: ["Sortido"],
        sizes: [{ size: "Único", price: 20.0, unitsPerPackage: 1 }],
      },
    ],
    allColors: [],
  };

  try {
    await setDoc(doc(db, "settings", "balloons"), balloonConfig);
    console.log("✅ Seed de balões realizada com sucesso!");
    return { success: true };
  } catch (error) {
    console.error("Erro na seed de balões:", error);
    throw error;
  }
};
