// src/lib/ribbon_config.ts

import { MeasureUnit } from "./types";

export interface LacoSize {
  size: "PP" | "P" | "M" | "G" | "GG";
  metragem: number; // Metros necessários para UM laço deste tamanho (Regra Interna)
  servicePrice: number; // PREÇO FIXO DO SERVIÇO DE MONTAGEM
  name: string;
  description: string;
  unit: MeasureUnit; // Deve ser 'm' (metro)
}

export const LACO_SIZES: LacoSize[] = [
  {
    size: "PP",
    metragem: 1.2,
    servicePrice: 2.0,
    name: "Mini Laço",
    description: "Ideal para pequenos sachês ou lembrancinhas de baixo volume.",
    unit: "m",
  },
  {
    size: "P",
    metragem: 1.8,
    servicePrice: 3.0,
    name: "Laço Simples",
    description: "Tamanho padrão para caixas pequenas ou garrafas.",
    unit: "m",
  },
  {
    size: "M",
    metragem: 2.5,
    servicePrice: 4.0,
    name: "Laço Bola (Cheio)",
    description: "Tamanho mais comum para cestas médias e caixas grandes.",
    unit: "m",
  },
  {
    size: "G",
    metragem: 3.0,
    servicePrice: 5.0,
    name: "Laço Duplo (Volume Extra)",
    description: "Para cestas grandes ou para dar máximo volume a um presente.",
    unit: "m",
  },
];

export const RIBBON_TYPES = [
  "Plástica",
  "Cetim",
  "Gorgurão",
  "Papel",
  "Sintética",
];

export const LACO_STYLES_OPTIONS = [
  {
    value: "Laço Bola",
    label: "Laço Bola",
    description:
      "É o estilo mais volumoso e completo, ideal para presentes que precisam de grande destaque visual. Usa mais material para ser cheio.",
    imageUrl: "https://placehold.co/400x400/png?text=Laco+Bola",
  },
  {
    value: "Laço Duplo",
    label: "Laço Duplo",
    description:
      "Estilo clássico e elegante. Duas alças grandes e duas pequenas, perfeito para dar um toque sofisticado sem tanto volume.",
    imageUrl: "https://placehold.co/400x400/png?text=Laco+Duplo",
  },
  {
    value: "Laço Simples",
    label: "Laço Simples",
    description:
      "Estilo rápido e discreto, com apenas uma alça, ideal para sacolas de papel ou pequenas lembrancinhas.",
    imageUrl: "https://placehold.co/400x400/png?text=Laco+Simples",
  },
];

export const LACO_STYLES = LACO_STYLES_OPTIONS.map((o) => o.value);
