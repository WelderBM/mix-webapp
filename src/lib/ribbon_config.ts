// src/lib/ribbon_config.ts (VERSÃO FINAL CONSOLIDADA E CORRIGIDA)

import { Unit, CapacityRef } from "@/types";

export type LacoSizeType = "P" | "M" | "G";

export interface LacoSize {
  size: CapacityRef;
  metragem: number; // Metros necessários para UM laço deste tamanho (Regra Interna)
  servicePrice: number; // PREÇO FIXO DO SERVIÇO DE MONTAGEM (R$2, R$3, R$5)
  name: string;
  description: string;
  unit: Unit; // Deve ser 'm' (metro)
}

// Valores de preço fixo conforme regra (P: R$2, M: R$3, G: R$5)
export const LACO_SIZES: LacoSize[] = [
  {
    size: "P",
    metragem: 1.8,
    servicePrice: 2.0, // R$2,00
    name: "Laço Pequeno (P)",
    description: "Ideal para bases P (caixas pequenas/sacos).",
    unit: "m",
  },
  {
    size: "M",
    metragem: 2.5,
    servicePrice: 3.0, // R$3,00
    name: "Laço Médio (M)",
    description: "Tamanho padrão para bases M (cestas médias/caixas grandes).",
    unit: "m",
  },
  {
    size: "G",
    metragem: 3.5,
    servicePrice: 5.0, // R$5,00
    name: "Laço Grande (G)",
    description: "Para bases G (cestas grandes e presentes volumosos).",
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

// MODELOS RESTRITOS: Somente BOLA e BORBOLETA
export const LACO_STYLES_OPTIONS = [
  {
    value: "BOLA",
    label: "Laço Bola",
    description:
      "O estilo mais volumoso, com muitas alças. Ideal para presentes que precisam de grande destaque visual.",
    imageUrl: "https://placehold.co/400x400/png?text=Laco+Bola",
  },
  {
    value: "BORBOLETA",
    label: "Laço Borboleta",
    description:
      "Estilo elegante e clássico com duas 'orelhas'. Perfeito para um toque sofisticado sem excesso de volume.",
    imageUrl: "https://placehold.co/400x400/png?text=Laco+Borboleta",
  },
];

export const LACO_STYLES = LACO_STYLES_OPTIONS.map((o) => o.value);
