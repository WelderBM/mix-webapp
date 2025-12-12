import { collection, doc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product, StoreSettings } from "@/lib/types";

export const seedDatabase = async () => {
  const batch = writeBatch(db);

  // 1. CONFIGURAÇÕES INICIAIS (Com Vitrine Curada)
  const settingsRef = doc(db, "settings", "general");
  const initialSettings: StoreSettings = {
    id: "general",
    storeName: "Mix Novidades",
    whatsappNumber: "5595984244194",
    theme: {
      primaryColor: "#7c3aed", // Roxo Mix
    },
    filters: { activeCategories: [], categoryOrder: [] },
    // AQUI ESTÁ A MÁGICA: Já cria seções iniciais vazias
    homeSections: [
      {
        id: "sec_natal",
        title: "🎄 Especial de Natal",
        type: "manual",
        productIds: [],
        isActive: true,
      },
      {
        id: "sec_fitas",
        title: "🎀 Fitas Mais Vendidas",
        type: "manual",
        productIds: [],
        isActive: true,
      },
      {
        id: "sec_promo",
        title: "🔥 Ofertas da Semana",
        type: "manual",
        productIds: [],
        isActive: true,
      },
    ],
  };
  batch.set(settingsRef, initialSettings);

  // 2. PRODUTOS (Exemplos com a nova lógica de Slots e Fitas)
  const products: Product[] = [
    {
      id: "prod_sabonete",
      name: "Sabonete TodoDia (Unidade)",
      price: 6.5,
      type: "STANDARD_ITEM",
      category: "Perfumaria",
      unit: "un",
      inStock: true,
      imageUrl: "https://placehold.co/400x400/png?text=Sabonete",
      // O Gabarito: Slot 1.0
      itemSize: 1.0,
    },
    {
      id: "prod_hidratante",
      name: "Hidratante Algodão 400ml",
      price: 69.9,
      type: "STANDARD_ITEM",
      category: "Perfumaria",
      unit: "un",
      inStock: true,
      imageUrl: "https://placehold.co/400x400/png?text=Hidratante",
      // O Gabarito: Ocupa 3 sabonetes
      itemSize: 3.0,
    },
    {
      id: "prod_fita_cetim",
      name: "Fita Cetim Nº9 Vermelha",
      price: 18.0,
      type: "RIBBON",
      category: "Fitas",
      unit: "m", // Vendido por metro na área de corte
      inStock: true,
      imageUrl: "https://placehold.co/400x400/png?text=Fita+Vermelha",
      itemSize: 0.5,
      // A Chave Seletora: Permite corte? SIM
      canBeSoldAsRoll: true, // Se false, aparece só na área de corte. Se true, aparece o rolo na vitrine.
    },
    {
      id: "base_cesta_m",
      name: "Cesta Vime Média",
      price: 25.0,
      type: "BASE_CONTAINER",
      category: "Cestas",
      unit: "un",
      inStock: true,
      imageUrl: "https://placehold.co/400x400/png?text=Cesta+M",
      itemSize: 0,
      // Capacidade calibrada: Cabe 20 sabonetes
      capacity: 20.0,
    },
  ];

  products.forEach((prod) => {
    const ref = doc(db, "products", prod.id);
    batch.set(ref, prod);
  });

  await batch.commit();
  console.log("Banco de dados populado com sucesso!");
};
