import { balloonSizeLabel } from "@/lib/balloonTypeArt";

// Balão foil de letras e números: cada caractere é uma peça. O cliente
// digita o que quer ("ANA", "15") e cada caractere vira um balão.
// Sem limite de caracteres (#342): quem limita é o estoque da cor.
export const FOIL_TYPE_ID = "foil_numeros";

// Maiúsculas, sem acento, só letras, números, "&" e "?" (o que a loja tem).
// Espaço separa palavras ("FELIZ 15 ANOS") e não vira balão; espaços
// repetidos viram um só. Um espaço no fim fica, para a próxima palavra.
export function foilCharacters(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9&? ]/g, "")
    .replace(/ +/g, " ")
    .replace(/^ /, "");
}

// Só os balões: o texto sem os espaços.
export function foilPieces(text: string): string {
  return text.replace(/ /g, "");
}

// Palavras do texto, na ordem: cada uma aparece numa linha da prévia.
export function foilWords(text: string): string[] {
  return text.split(" ").filter(Boolean);
}

// Nome do balão no carrinho, no pedido e no WhatsApp:
// 'Balão Simples 9" · 23 cm' · 'Números & Letras (Foil) 40 cm · 16": ANA'.
// Mais de uma palavra: 'FELIZ / 15 / ANOS', para a atendente separar.
export function balloonItemLabel(d: {
  typeId: string;
  typeName: string;
  size: string;
  characters?: string;
}): string {
  const base = `${d.typeName} ${balloonSizeLabel(d.typeId, d.size)}`;
  const words = d.characters ? foilWords(d.characters) : [];
  return words.length ? `${base}: ${words.join(" / ")}` : base;
}
