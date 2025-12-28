import { ProductType } from "@/types";

/**
 * Gerador de Placeholder Dinâmico (URL)
 * Útil para criar imagens com texto explicativo quando não houver foto.
 */
export function getDynamicPlaceholder(
  text: string = "Sem Imagem",
  size: string = "400x400"
): string {
  // Garante que haja um texto
  const cleanText = text || "Sem imagem";
  // Cores: Fundo Cinza Claro (#f1f5f9) / Texto Cinza Escuro (#334155)
  // Adicionamos .png explicitamente se não estiver presente para evitar SVG em alguns casos do Next.js
  const baseUrl = `https://placehold.co/${size}/f1f5f9/334155.png`;
  return `${baseUrl}?text=${encodeURIComponent(cleanText)}`;
}

/**
 * Função Inteligente para resolver a imagem
 */
export function getProductImage(
  imageUrl: string | undefined | null,
  name: string = "Sem imagem"
): string {
  // 1. Se tiver imagem real (URL do Firebase ou Externa), usa ela
  if (imageUrl && imageUrl.trim() !== "") {
    return imageUrl;
  }

  // 2. Se não, retorna o placeholder dinâmico com o nome do tipo
  return getDynamicPlaceholder(name);
}
