// src/lib/seed.ts
import { db } from "./firebase";
import { collection, doc, setDoc, writeBatch } from "firebase/firestore";
import { Product } from "./types";

export const SEED_PRODUCTS: Omit<Product, "id">[] = [
  {
    name: "Cesta Oval de Madeira M",
    price: 25.9,
    type: "BASE_CONTAINER",
    category: "Cestas",
    unit: "un",
    description_adjective: "Rústica e clássica",
    imageUrl: "https://placehold.co/400x400/png?text=Cesta+Madeira",
    inStock: true,
  },
  {
    name: "Caixa MDF Decorada P",
    price: 12.5,
    type: "BASE_CONTAINER",
    category: "Caixas",
    unit: "un",
    description_adjective: "Delicada",
    imageUrl: "https://placehold.co/400x400/png?text=Caixa+MDF",
    inStock: true,
  },

  {
    name: "Hidratante TodoDia Noz Pecã",
    price: 45.9,
    originalPrice: 69.9,
    type: "NATURA_ITEM",
    category: "Corpo e Banho",
    unit: "un",
    imageUrl: "https://placehold.co/400x400/png?text=Hidratante",
    inStock: true,
    featured: true,
  },
  {
    name: "Colônia Kayak Aventura",
    price: 120.0,
    type: "NATURA_ITEM",
    category: "Perfumaria",
    unit: "un",
    imageUrl: "https://placehold.co/400x400/png?text=Kayak",
    inStock: true,
  },
  {
    name: "Sabonete em Barra (Unidade)",
    price: 6.5,
    type: "NATURA_ITEM",
    category: "Corpo e Banho",
    unit: "un",
    imageUrl: "https://placehold.co/400x400/png?text=Sabonete",
    inStock: true,
  },

  {
    name: "Palha Decorativa (Punhado)",
    price: 3.0,
    type: "FILLER",
    category: "Decoração",
    unit: "un",
    imageUrl: "https://placehold.co/400x400/png?text=Palha",
    inStock: true,
  },
  {
    name: "Fita de Cetim Vermelha 22mm",
    price: 1.5,
    type: "RIBBON",
    category: "Fitas",
    unit: "m",
    description_adjective: "Vibrante",
    imageUrl: "https://placehold.co/400x400/png?text=Fita+Vermelha",
    inStock: true,
  },
];

export const runSeed = async () => {
  const batch = writeBatch(db);
  const productsRef = collection(db, "products");

  SEED_PRODUCTS.forEach((prod) => {
    const newDocRef = doc(productsRef);
    batch.set(newDocRef, { ...prod, id: newDocRef.id });
  });

  await batch.commit();
  console.log("Banco de dados populado com sucesso!");
};
