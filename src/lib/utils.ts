import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- INTELEGÊNCIA DE CORES ---

// Converte HEX (#7c3aed) para RGB (124, 58, 237)
export function hexToRgb(hex: string): string {
  const cleanHex = hex.replace("#", "");
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(cleanHex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(
        result[3],
        16
      )}`
    : "0, 0, 0";
}

// Calcula contraste (Texto Preto ou Branco)
export function getContrastColor(hex: string): "#ffffff" | "#0f172a" {
  const rgbString = hexToRgb(hex);
  const [r, g, b] = rgbString.split(",").map(Number);
  // Fórmula YIQ
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#0f172a" : "#ffffff";
}

// Clarear ou Escurecer uma cor (amount positivo = clarear, negativo = escurecer)
export function adjustColor(hex: string, amount: number): string {
  const color = hex.replace("#", "");
  const num = parseInt(color, 16);
  let r = (num >> 16) + amount;
  let b = ((num >> 8) & 0x00ff) + amount;
  let g = (num & 0x0000ff) + amount;

  if (r > 255) r = 255;
  else if (r < 0) r = 0;
  if (b > 255) b = 255;
  else if (b < 0) b = 0;
  if (g > 255) g = 255;
  else if (g < 0) g = 0;

  return "#" + (g | (b << 8) | (r << 16)).toString(16).padStart(6, "0");
}
