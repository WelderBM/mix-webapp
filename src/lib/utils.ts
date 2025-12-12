import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utilitário padrão para combinar classes do Tailwind de forma inteligente.
 * Resolve conflitos de classes (ex: 'p-4' vs 'p-2').
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- FUNÇÕES DE INTELIGÊNCIA DE CORES ---

/**
 * Converte uma cor HEX (#7c3aed) para o formato RGB (124, 58, 237).
 * Útil para usar variáveis CSS com opacidade (ex: rgba(var(--primary-rgb), 0.5)).
 */
export function hexToRgb(hex: string): string {
  // Remove o # se existir
  const cleanHex = hex.replace("#", "");

  // Lógica para expandir hex curto (ex: #FFF -> #FFFFFF) se necessário,
  // mas aqui focamos no padrão de input type="color" que retorna 6 dígitos.
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(
        result[3],
        16
      )}`
    : "0, 0, 0"; // Retorno de segurança (preto)
}

/**
 * Calcula a cor de texto ideal (Preto ou Branco) para garantir leitura
 * sobre um determinado fundo, usando a fórmula de luminosidade YIQ.
 * * @param hex A cor de fundo em formato HEX
 * @returns '#0f172a' (Slate-900) para fundos claros ou '#ffffff' para fundos escuros.
 */
export function getContrastColor(hex: string): "#ffffff" | "#0f172a" {
  const rgbString = hexToRgb(hex);
  const [r, g, b] = rgbString.split(",").map(Number);

  // Fórmula YIQ para calcular a luminosidade percebida pelo olho humano
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;

  // O limiar padrão é 128. Se for maior (claro), o texto deve ser escuro.
  return yiq >= 128 ? "#0f172a" : "#ffffff";
}
