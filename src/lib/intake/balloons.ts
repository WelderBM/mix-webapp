// Balões sem foto (#236): o nome do Noturno vira atributos (formato, cor,
// letra/número, tamanho, pacote) e daí uma arte gerada (balloonArt.ts).
// Balão é a maior família do Noturno (655 itens); 88% caem num formato
// conhecido. Os temáticos (leão, margarida, "revelação"…) devolvem null —
// esses precisam de foto de verdade.

export type BalloonShape = "letra" | "numero" | "coracao" | "estrela" | "redondo" | "latex";

export interface BalloonInfo {
  shape: BalloonShape;
  glyph: string | null; // letra ou número do balão
  colorName: string | null; // como veio, em português ("Vermelho", "Rose gold")
  colors: string[]; // hex; 2+ = multicolorido (arco-íris, sortido)
  metallic: boolean;
  sizeLabel: string | null; // "40 cm", "9\""
  packQty: number | null;
}

// Cor → hex. Ordem importa: compostas antes das simples.
const COLOR_TABLE: [RegExp, string, string[]][] = [
  [/\bARCO ?IRIS\b|\bACO IRIS\b|\bARCOIRIS\b/, "Arco-íris", ["#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#a855f7"]],
  [/\bSORTID[OA]S?\b|\bCANDY\b|\bCOLOR(IDO)?\b/, "Sortido", ["#f472b6", "#60a5fa", "#facc15", "#4ade80"]],
  [/\bROSE ?GOLD\b|\bROSE\b/, "Rose gold", ["#e8a598"]],
  [/\bAZUL (BABY|BEBE|CLARO)\b/, "Azul bebê", ["#93c5fd"]],
  [/\bAZUL TIFFANY\b|\bTIFFANY\b/, "Azul tiffany", ["#5fd3c8"]],
  [/\bAZUL (ROYAL|ESCURO|MARINHO)\b/, "Azul royal", ["#1d4ed8"]],
  [/\bVERDE (FOLHA|BANDEIRA)\b/, "Verde folha", ["#2f9e44"]],
  [/\bVERDE (LIMA|LIMAO|CLARO)\b/, "Verde lima", ["#84cc16"]],
  [/\bLILAS( BABY)?\b/, "Lilás", ["#c4b5fd"]],
  [/\bROXO UVA\b|\bROXO\b|\bPURPLE\b|\bVIOLETA\b/, "Roxo", ["#7c3aed"]],
  [/\bROSA (BEBE|BABY|CLARO)\b/, "Rosa bebê", ["#f9a8d4"]],
  [/\bPINK\b|\bPINK\b/, "Pink", ["#ec4899"]],
  [/\bROSA\b/, "Rosa", ["#f472b6"]],
  [/\bVERMELH[OA]\b|\bRED\b|\bVERM\b/, "Vermelho", ["#dc2626"]],
  [/\bDOURAD[OA]\b|\bOURO\b|\bGOLD\b/, "Dourado", ["#d4a017"]],
  [/\bPRATA\b|\bPRATEAD[OA]\b|\bSILVER\b/, "Prata", ["#b8bec8"]],
  [/\bAZUL\b/, "Azul", ["#2563eb"]],
  [/\bVERDE\b/, "Verde", ["#16a34a"]],
  [/\bAMAREL[OA]\b/, "Amarelo", ["#facc15"]],
  [/\bLARANJA\b/, "Laranja", ["#f97316"]],
  [/\bBRANC[OA]\b/, "Branco", ["#f1f5f9"]],
  [/\bPRET[OA]\b/, "Preto", ["#1f2937"]],
  [/\bMARROM\b/, "Marrom", ["#92400e"]],
  [/\bTRANSP(ARENTE)?\b/, "Transparente", ["#dbeafe"]],
];

export function balloonColor(name: string): { colorName: string | null; colors: string[] } {
  const n = name.toUpperCase();
  for (const [re, colorName, colors] of COLOR_TABLE) {
    if (re.test(n)) return { colorName, colors };
  }
  return { colorName: null, colors: ["#e11d48"] };
}

// "16 40CM VERMELHO V", "1640 CM ROSE 2", "40 100CM ARCO IRIS L": o último
// caractere sozinho é a letra/número do balão metalizado.
const RE_GLYPH = /\b(16 ?40 ?CM|1640 ?CM|40 ?100 ?CM|32 ?75 ?CM)\b.*\s([A-Z0-9&])$/;

function sizeLabel(n: string): string | null {
  // "1640 CM" / "16 40CM" = 16 polegadas = 40 cm (não "640 cm").
  const inchCm = /\b(16|32|40) ?(40|75|100) ?CM\b/.exec(n);
  if (inchCm) return `${Number(inchCm[2])} cm`;
  const cm = /\bC?(\d{2,3}) ?CM\b/.exec(n);
  if (cm) return `${Number(cm[1])} cm`;
  const inch = /^BALAO (?:\D+ )?(\d{1,2}(?:,\d)?)\b/.exec(n);
  return inch ? `${inch[1]}"` : null;
}

export function parseBalloon(rawName: string): BalloonInfo | null {
  const n = (rawName ?? "").toUpperCase().replace(/\s+/g, " ").trim();
  if (!n.startsWith("BALAO")) return null;
  const { colorName, colors } = balloonColor(n);
  const pack = /\bC\/ ?(\d+)|\b(\d+) ?UN(D|ID)?\b|\b50X1\b/.exec(n);
  const packQty = pack ? Number(pack[1] ?? pack[2] ?? 50) : null;
  const base = { colorName, colors, sizeLabel: sizeLabel(n), packQty };

  const g = RE_GLYPH.exec(n);
  if (g) {
    const glyph = g[2];
    return { ...base, shape: /\d/.test(glyph) ? "numero" : "letra", glyph, metallic: true };
  }
  const metallic = /\bMETAL/.test(n) || /\bCROMO\b/.test(n);
  if (/\bCORACAO\b/.test(n)) return { ...base, shape: "coracao", glyph: null, metallic };
  if (/\bESTRELA\b/.test(n)) return { ...base, shape: "estrela", glyph: null, metallic };
  if (/\bLISO\b|\bC\/ ?\d+|\bNEON\b|METALLIC BALLOON|\bUNIQ\b|\bCANDY\b|\bN\.\d/.test(n)) {
    return { ...base, shape: "latex", glyph: null, metallic: /METALLIC/.test(n) };
  }
  if (/\bREDONDO\b/.test(n)) return { ...base, shape: "redondo", glyph: null, metallic };
  return null; // temático: precisa de foto
}
