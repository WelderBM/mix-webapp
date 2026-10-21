// Pacote × unidade (Marco 2). O nome no Noturno costuma dizer a quantidade
// ("PT C/100", "C/50", "50UN", "10PC", "C/10 RLS"), mas NEM SEMPRE é
// verdade: há item escrito "unidade" que é pacote e vice-versa. Por isso
// isto só SUGERE — a atendente confirma olhando a embalagem, e o card
// exige a escolha explícita de "Vende como".

export interface PackHint {
  qty: number;
  // Trecho do nome que gerou a sugestão, pra mostrar "lido no nome: …".
  evidence: string;
}

const RE_WITH =
  /\b(?:PT|PCT|PC|CX|PACOTE|EMB)?\.?\s*C\/\s?(\d{1,4})\b(?:\s?(?:UN|UND|UNID|PC|PCS|FLS|RLS|ROLOS)\b\.?)?/;
const RE_COUNT =
  /\b(\d{1,4})\s?(?:UN|UND|UNID|UNIDADES|PC|PCS|PCT|PCTS|FLS|FL|RLS|ROLOS)\b\.?/;

export function detectPack(name: string): PackHint | null {
  const s = name.toUpperCase();
  const m = RE_WITH.exec(s) ?? RE_COUNT.exec(s);
  if (!m) return null;
  const qty = Number(m[1]);
  if (!(qty > 0)) return null;
  return { qty, evidence: m[0].replace(/^[.\s]+/, "").trim() };
}

export function isPackHint(hint: PackHint | null): boolean {
  return hint != null && hint.qty > 1;
}

// Preço por unidade de um pacote, pra mostrar ao revendedor.
export function pricePerUnit(packPrice: number, qty: number): number | null {
  if (!(packPrice > 0) || !(qty > 1)) return null;
  return Math.round((packPrice / qty) * 100) / 100;
}
