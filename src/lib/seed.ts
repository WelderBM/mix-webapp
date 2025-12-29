import { collection, doc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product, StoreSettings, Unit } from "@/types";

interface KitComponent {
  componentId: string;
  name: string;
  type: string;
  required: boolean;
  maxQuantity: number;
  defaultQuantity: number;
}
interface KitRecipe {
  id: string;
  name: string;
  description: string;
  disabled: boolean;
  assemblyCost: number;
  components: KitComponent[];
}

const ALL_PRODUCTS_REF = collection(db, "products");
const SETTINGS_REF = doc(db, "settings", "general");
const KIT_RECIPES_REF = collection(db, "kit_recipes");

const getPlaceholdImage = (text: string) =>
  `https://placehold.co/400x400/f1f5f9/334155.png?text=${encodeURIComponent(
    text
  )}`;

// Nome da função DEVE ser seedDatabase para bater com seu SuperAdminZone
export const seedDatabase = async () => {
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
    theme: {
      primaryColor: "#0f172a",
      activeTheme: "default",
    } as any,
  };
  batch.set(SETTINGS_REF, initialSettings);

  // 2. PRODUTOS (Exemplo reduzido para teste, pode adicionar mais)
  const products: Product[] = [
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
      kitStyle: "ROUND", // Novo campo
    },
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
  ];

  products.forEach((prod) => {
    const ref = doc(ALL_PRODUCTS_REF, prod.id);
    batch.set(ref, prod);
  });

  try {
    await batch.commit();
    console.log("✅ Seed completa realizada com sucesso!");
  } catch (error) {
    console.error("Erro durante a seed:", error);
    throw error;
  }
};

// --- MIGRATED FROM seedService.ts ---
import { BalloonConfig } from "@/types/balloon";
import { setDoc } from "firebase/firestore";

export const seedBalloons = async () => {
  console.log("Iniciando Seed de Balões...");

  const balloonConfig: BalloonConfig = {
    types: [
      {
        id: "simples",
        name: "Balão Simples (Liso)",
        colors: [
          "Amarelo",
          "Amarelo Citrino",
          "Azul Baby",
          "Azul Celeste",
          "Azul Cobalto",
          "Azul Mandalin",
          "Azul Royal",
          "Azul Turquesa",
          "Branco",
          "Cafe Brasil",
          "Cinza",
          "Laranja",
          "Laranja Mandalin",
          "Lilas Baby",
          "Marfim",
          "Marrom",
          "Mostarda",
          "Nude",
          "Pink",
          "Preto",
          "Rosa Baby",
          "Rosa Choque",
          "Rosa Tutti Frutti",
          "Rose",
          "Roxo",
          "Salmao",
          "Terra Cota",
          "Verde Agua",
          "Verde Bandeira",
          "Verde Folha",
          "Verde Limao",
          "Verde Maca",
          "Verde Militar",
          "Vermelho",
          "Vermelho Quente",
          "Vermelho Rubi",
          "Vinho",
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
        name: "Metálico / Perolado",
        colors: [
          "Amarelo Perolado",
          "Azul Perolado",
          "Branco Perolado",
          "Champagne",
          "Cobre",
          "Dourado",
          "Laranja Perolado",
          "Lilas Perolado",
          "Ouro",
          "Prata",
          "Preto Perolado",
          "Rosa Perolado",
          "Rose Gold",
          "Verde Perolado",
          "Vermelho Perolado",
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
          "Amarelo Candy",
          "Azul Candy",
          "Lilas Candy",
          "Rosa Candy",
          "Verde Candy",
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
        colors: [
          "Amarelo Perolado",
          "Azul Perolado",
          "Branco Perolado",
          "Champagne",
          "Cobre",
          "Dourado",
          "Laranja Perolado",
          "Lilas Perolado",
          "Ouro",
          "Prata",
          "Rosa Perolado",
          "Rose Gold",
          "Verde Perolado",
        ],
        sizes: [
          { size: "7", price: 17.5, unitsPerPackage: 50 },
          { size: "8", price: 10.0, unitsPerPackage: 25 },
          { size: "9", price: 13.0, unitsPerPackage: 25 },
        ],
      },
      {
        id: "canudo",
        name: "Canudo / 260",
        colors: ["Sortido", "Branco", "Preto", "Vermelho", "Azul", "Amarelo"],
        sizes: [{ size: "260", price: 15.0, unitsPerPackage: 50 }],
      },
      {
        id: "uniq",
        name: "Linha Uniq",
        colors: [
          "Areia",
          "Azul Ardosia",
          "Azul Chuva",
          "Azul Navy",
          "Bege",
          "Blush",
          "Cacau",
          "Camurca",
          "Caramelo",
          "Creme",
          "Eucalipto",
          "Framboesa",
          "Jade",
          "Lavanda",
          "Marsala",
          "Menta",
          "Mostarda Uniq",
          "Oliva",
          "Papaya",
          "Pessego",
          "Rosa Antigo",
          "Rosa Cha",
          "Rosa Chiclete",
          "Rosa Seco",
          "Terracota",
          "Tiffany",
          "Uva",
          "Verde Floresta",
          "Verde Musgo",
          "Vermelho Cereja",
        ],
        sizes: [
          { size: "9", price: 22.0, unitsPerPackage: 50 },
          { size: "11", price: 25.0, unitsPerPackage: 50 },
          { size: "16", price: 35.0, unitsPerPackage: 15 },
        ],
      },
      {
        id: "foil_numeros",
        name: "Números & Letras (Foil)",
        colors: ["Dourado", "Prata", "Rose Gold", "Vermelho", "Azul", "Pink"],
        sizes: [
          { size: "40cm", price: 12.0, unitsPerPackage: 1 },
          { size: "75cm", price: 25.0, unitsPerPackage: 1 },
        ],
      },
    ],
    allColors: [],
  };

  try {
    // Note: We need to use database instance here. Assuming 'db' is available from top level import
    await setDoc(doc(db, "settings", "balloons"), balloonConfig);
    console.log("✅ Seed de balões realizada com sucesso!");
    return { success: true };
  } catch (error) {
    console.error("Erro na seed de balões:", error);
    throw error;
  }
};
