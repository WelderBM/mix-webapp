import type { ProductType, Unit } from "./product";

// Fila de lançamento (issue #198): itens importados do sistema da loja
// física (Noturno Softwares) que ainda NÃO são produtos da loja online.
// A atendente completa preço (da etiqueta física) e foto e publica —
// só aí nasce um `Product`. Coleção `intake_items`, doc id = código do
// Noturno (`sourceCode`), pra reimportação fazer upsert sem duplicar.

export type IntakeFlag =
  | "placeholder"
  | "ean_invalido"
  | "estoque_suspeito"
  | "duplicado"
  | "datado"
  | "obsoleto"
  | "perecivel"
  | "descricao_generica"
  | "marca_generica"
  | "marca_variante"
  | "estoque_fracionario"
  | "custo_extremo"
  | "estoque_unico"
  | "cadastro_antigo"
  | "sem_ean";

export type IntakeSuggestedStatus =
  | "candidato"
  | "atencao"
  | "revisar"
  | "bloqueado";

// Estado do trabalho da atendente — NUNCA sobrescrito por reimportação.
export type IntakeWorkflowStatus =
  | "pendente"
  | "publicado"
  | "pulado"
  | "fora_da_loja";

// Campos que vêm do Noturno (ou derivam dele) — a reimportação recalcula
// e sobrescreve todos.
export interface IntakeSourceFields {
  source: "noturno";
  sourceCode: string;
  sourceRef: string | null;
  ean: string | null;
  rawName: string;
  name: string;
  family: string | null;
  brandRaw: string | null;
  brand: string | null;
  stock: number;
  unitCost: number;
  flags: IntakeFlag[];
  suggestedStatus: IntakeSuggestedStatus;
  priority: number;
  isCoreFamily: boolean;
  // Chave normalizada (sem acento, minúscula) da categoria do site
  // sugerida pela família — casada contra as categorias reais na hora de
  // publicar, porque o nome exibido delas é livre. `null` = sem palpite.
  suggestedCategoryKey: string | null;
  suggestedType: ProductType;
  suggestedUnit: Unit;
  duplicateGroup: number | null;
  // Texto pré-normalizado pra busca tolerante (#199): nome + códigos +
  // marca, sem acento, minúsculo.
  searchText: string;
  // Prefixos (2+ letras) das palavras de `searchText`, pra consulta
  // `array-contains` — ver src/lib/intake/search.ts.
  searchTokens: string[];
}

export interface IntakeItem extends IntakeSourceFields {
  id: string;
  status: IntakeWorkflowStatus;
  productId?: string;
  inLatestImport: boolean;
  firstImportedAt?: any;
  lastImportedAt?: any;
}
