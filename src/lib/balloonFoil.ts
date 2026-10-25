import { balloonSizeLabel } from "@/lib/balloonTypeArt";

// Balão foil de letras e números: cada caractere é uma peça. O cliente
// digita o que quer ("ANA", "15") e cada caractere vira um balão.
export const FOIL_TYPE_ID = "foil_numeros";
export const FOIL_MAX_CHARS = 20;

// Maiúsculas, sem acento, só letras, números, "&" e "?" (o que a loja tem).
export function foilCharacters(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9&?]/g, "")
    .slice(0, FOIL_MAX_CHARS);
}

// Nome do balão no carrinho, no pedido e no WhatsApp:
// 'Balão Simples 9" · 23 cm' · 'Números & Letras (Foil) 40 cm · 16": ANA'.
export function balloonItemLabel(d: {
  typeId: string;
  typeName: string;
  size: string;
  characters?: string;
}): string {
  const base = `${d.typeName} ${balloonSizeLabel(d.typeId, d.size)}`;
  return d.characters ? `${base}: ${d.characters}` : base;
}
