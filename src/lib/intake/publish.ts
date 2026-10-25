import type { Category, Product, ProductImage, ProductVariant, Unit } from "@/types";
import type { IntakeItem, IntakeWorkflowStatus } from "@/types/intake";
import { normalizeText } from "./search";

// Card de lançamento (issue #200): transforma um item da fila + o que a
// atendente preencheu (preço da etiqueta, foto) num `Product`. Fita de laço
// entra como rolo FECHADO com preço do rolo — mesmo formato do
// ProductFormDialog — porque a etiqueta da prateleira é do rolo.

export interface LaunchInput {
  name: string;
  price: number | null;
  categoryName: string;
  // Subcategoria real da categoria (#232); null/"" = sem subcategoria.
  subcategoryName?: string | null;
  // null = atendente ainda não escolheu "Vende como" (escolha obrigatória:
  // o nome do Noturno nem sempre diz a verdade sobre pacote × unidade).
  unit: Unit | null;
  // Unidades no pacote (só quando unit === "pct").
  packQty: number | null;
  // Fotos já enviadas, na ordem; a primeira é a capa (#201).
  photoUrls: string[];
  // Só fita de laço: metragem do rolo.
  rollMeters: number | null;
}

export function isRibbonItem(item: Pick<IntakeItem, "suggestedType">): boolean {
  return item.suggestedType === "RIBBON";
}

// "FITA MAXI TRUE LOVE 32MMX100M" → 100; "FITA CETIM 10M" / "10MTS" → 10.
// Pega a última medida em metros (M sozinho, não MM nem ML).
export function extractRollMeters(name: string): number | null {
  const matches = [
    ...name
      .toUpperCase()
      .matchAll(/(\d+(?:[.,]\d+)?)\s?M(?:TS?|ETROS?)?(?![A-Z])/g),
  ];
  if (matches.length === 0) {
    // "32MMX100" (largura × metragem, sem o M final).
    const wxl = /\d\s?MM\s?X\s?(\d+(?:[.,]\d+)?)(?![\d.,]*\s?MM)/.exec(
      name.toUpperCase(),
    );
    if (!wxl) return null;
    const n = Number(wxl[1].replace(",", "."));
    return n > 0 ? n : null;
  }
  const n = Number(matches[matches.length - 1][1].replace(",", "."));
  return n > 0 ? n : null;
}

// Categoria sugerida pela família (chave normalizada) → categoria real do
// site, cujo nome exibido é livre ("Fitas", "sacos"…).
export function matchCategory(
  key: string | null,
  categories: Pick<Category, "name">[],
): string | null {
  if (!key) return null;
  const found = categories.find((c) => normalizeText(c.name) === key);
  return found ? found.name : null;
}

export function validateLaunch(
  input: LaunchInput,
  ribbon: boolean,
): string | null {
  if (!input.name.trim()) return "Preencha o nome do produto.";
  if (!input.categoryName) return "Escolha a categoria.";
  if (!ribbon && !input.unit) {
    return "Escolha como é vendido: pacote, unidade ou metro.";
  }
  if (
    input.unit === "pct" &&
    !(
      input.packQty != null &&
      Number.isInteger(input.packQty) &&
      input.packQty > 1
    )
  ) {
    return "Digite quantas unidades vêm no pacote.";
  }
  if (input.price == null || !(input.price > 0)) {
    return ribbon
      ? "Digite o preço do rolo (da etiqueta)."
      : "Digite o preço da etiqueta.";
  }
  if (ribbon && !(input.rollMeters != null && input.rollMeters > 0)) {
    return "Digite quantos metros tem o rolo.";
  }
  if (input.photoUrls.length === 0) return "Tire a foto do produto.";
  return null;
}

// Converte "12,90" / "12.90" / "1.234,50" em número; vazio → null.
export function parsePrice(raw: string): number | null {
  const s = raw.trim();
  if (!s) return null;
  const normalized = s.includes(",")
    ? s.replace(/\./g, "").replace(",", ".")
    : s;
  const n = Number(normalized);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}

// Produto sem `id` e sem `createdAt` (preenchidos na gravação).
export function buildProductFromIntake(
  item: IntakeItem,
  input: LaunchInput,
): Omit<Product, "id" | "createdAt"> {
  const images: ProductImage[] = input.photoUrls.map((url, i) => ({
    id: i === 0 ? "cover" : `foto-${i + 1}`,
    url,
    isCover: i === 0,
  }));
  const base = {
    name: input.name.trim(),
    category: input.categoryName,
    // undefined some no clean() antes de gravar.
    subcategory: input.subcategoryName || undefined,
    images,
    imageUrl: input.photoUrls[0] ?? "",
    inStock: item.stock > 0,
    disabled: false,
    sourceCode: item.sourceCode,
  };
  if (isRibbonItem(item)) {
    const meters = input.rollMeters ?? 0;
    return {
      ...base,
      type: "RIBBON",
      unit: "m",
      rollPrice: input.price ?? undefined,
      canBeSoldAsRoll: true,
      ribbonInventory: {
        status: "FECHADO",
        remainingMeters: meters,
        totalRollMeters: meters,
      },
    };
  }
  return {
    ...base,
    type: "STANDARD_ITEM",
    unit: input.unit ?? "un",
    price: input.price ?? undefined,
    packQty: input.unit === "pct" ? (input.packQty ?? undefined) : undefined,
  };
}

// Ajuste do placar (`intake_meta/summary`) quando um item muda de status.
// Devolve deltas pra aplicar com increment().
export function statusTransitionDeltas(
  from: IntakeWorkflowStatus,
  to: IntakeWorkflowStatus,
): {
  byStatus: Partial<Record<IntakeWorkflowStatus, number>>;
  familyPending: number;
} {
  if (from === to) return { byStatus: {}, familyPending: 0 };
  return {
    byStatus: { [from]: -1, [to]: 1 },
    familyPending: (to === "pendente" ? 1 : 0) - (from === "pendente" ? 1 : 0),
  };
}

// ── Lançamento em grupo (#201, parte 2) ──────────────────────────────
// Um produto da loja com uma variação por item do Noturno. O id da
// variação é o código do Noturno: é por ele que a reimportação acha a
// variação certa para atualizar o estoque (stockSync).
export interface GroupMember {
  item: IntakeItem;
  label: string; // nome da variação, editável pela atendente
  attribute?: string; // o que varia: "Cor" (padrão), "Letra", "Número"
}

export function buildGroupProductFromIntake(
  members: GroupMember[],
  input: LaunchInput,
): Omit<Product, "id" | "createdAt"> {
  const base = buildProductFromIntake(members[0].item, input);
  return {
    ...base,
    // Vínculo com o Noturno fica nas variações, não no produto.
    sourceCode: undefined,
    inStock: members.some((m) => m.item.stock > 0),
    variants: members.map((m) => ({
      id: m.item.sourceCode,
      type: m.attribute ?? "Cor",
      name: m.label.trim(),
      inStock: m.item.stock > 0,
      attributes: { [m.attribute ?? "Cor"]: m.label.trim() },
    })),
  };
}

// Cor nova num produto já lançado em grupo (#253): acrescenta uma variação
// por item, com o código do Noturno como id (o stockSync acha por ele).
// Código que já é variação do produto não duplica; nome repetido é erro.
export function appendGroupVariants(
  existing: ProductVariant[] | undefined,
  members: GroupMember[],
): { variants: ProductVariant[]; inStock: boolean } | { error: string } {
  const current = existing ?? [];
  const ids = new Set(current.map((v) => v.id));
  const names = new Set(current.map((v) => v.name.trim().toLowerCase()));
  const added: ProductVariant[] = [];
  for (const m of members) {
    if (ids.has(m.item.sourceCode)) continue;
    const name = m.label.trim();
    if (!name) return { error: "Toda opção precisa de um nome." };
    if (names.has(name.toLowerCase()))
      return { error: `O produto já tem uma opção "${name}".` };
    names.add(name.toLowerCase());
    const type = m.attribute ?? "Cor";
    added.push({
      id: m.item.sourceCode,
      type,
      name,
      inStock: m.item.stock > 0,
      attributes: { [type]: name },
    });
  }
  const variants = [...current, ...added];
  // Mesma regra da loja e do stockSync: só `inStock === false` é esgotado.
  return { variants, inStock: variants.some((v) => v.inStock !== false) };
}

// Cada cor = 2 gravações (variação no produto + item da fila) num batch
// de no máximo 500.
export const MAX_GROUP_SIZE = 200;

export function validateGroup(members: GroupMember[]): string | null {
  if (members.length < 2) return "Escolha pelo menos 2 opções para lançar em grupo.";
  if (members.length > MAX_GROUP_SIZE)
    return `Grupo grande demais: lance no máximo ${MAX_GROUP_SIZE} opções de uma vez.`;
  const names = members.map((m) => m.label.trim().toLowerCase());
  if (names.some((n) => !n)) return "Toda opção precisa de um nome.";
  if (new Set(names).size !== names.length) return "Há duas opções com o mesmo nome.";
  return null;
}
