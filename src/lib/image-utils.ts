import { ProductType } from "@/types";

// 1. Definição Centralizada dos Placeholders
// Se você mudar o nome de um arquivo no futuro, muda SÓ AQUI.
export const PLACEHOLDERS = {
  DEFAULT: "/placeholder_produto_padrao.webp",
  RIBBON: "/placeholder_fita_rolo.webp",
  ACCESSORY: "/placeholder_fita_rolo.webp",
  BASE_CONTAINER: "/placeholder_cesta_base.webp",
  ASSEMBLED_KIT: "/placeholder_cesta_base.webp",
  STANDARD_ITEM: "/placeholder_produto_padrao.webp",
  FILLER: "/placeholder_enchimento.webp",
  WRAPPER: "/saco-placeholder.webp",
} as const;

// 2. Fallback Universal (Aquele SVG Base64 que nunca falha)
export const UNIVERSAL_FALLBACK_SVG = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNjYmNjZDEiIHN0cm9rZS13aWR0aD0iMSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0ibdWNpZGUgbdWNpZGUtaW1hZ2Utb2ZmIj48bGluZSB4MT0iMiIgeTE9IjIiIHgyPSIyMiIgeTI9IjIyIi8+PHBhdGggZD0iTTEwLjQxIDEwLjQxYTItMiAwIDEgMS0yLjgzLTIuODMiLz48bGluZSB4MT0iMTMuNSIgeTE9IjEzLjUiIHgyPSI2IiB5Mj0iMjEiLz48bGluZSB4MT0iMTgiIHkxPSIxMiIgeDI9IjIxIiB5Mj0iMTUiLz48cGF0aCBkPSJNM142djE0YTIgMiAwIDAgMCAyIDJoMTRhMiAyIDAgMCAwIDItMnYtNSIvPjxwYXRoIGQ9Ik0yMV4xM1Y2YTIgMiAwIDAgMC0yLTJIOSIvPjwvc3ZnPg==`;

/**
 * Função Inteligente para resolver a imagem
 * Prioridade:
 * 1. URL do Produto (Firebase Storage)
 * 2. Placeholder Específico do Tipo
 * 3. Placeholder Padrão
 */
export function getProductImage(
  imageUrl: string | undefined | null,
  type: ProductType
): string {
  // Se tiver imagem real, usa ela
  if (imageUrl && imageUrl.trim() !== "") {
    return imageUrl;
  }

  // Se não, tenta o placeholder do tipo
  const placeholder = PLACEHOLDERS[type as keyof typeof PLACEHOLDERS];

  // Se não achar o tipo, retorna o default
  return placeholder || PLACEHOLDERS.DEFAULT;
}
