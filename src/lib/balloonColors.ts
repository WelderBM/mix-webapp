export const SAO_ROQUE_COLORS: Record<string, string> = {
  // Lisos / Standard
  amarelo: "#FFCC00",
  "amarelo citrino": "#F9F446",
  "azul baby": "#89CFF0",
  "azul celeste": "#00BFFF",
  "azul cobalto": "#0047AB",
  "azul mandalin": "#0F52BA",
  "azul royal": "#4169E1",
  "azul turquesa": "#00CED1",
  branco: "#FFFFFF",
  "cafe brasil": "#6F4E37",
  cinza: "#808080",
  laranja: "#FFA500",
  "laranja mandalin": "#FF8C00",
  "lilas baby": "#E6A8D7",
  marfim: "#FFFFF0",
  marrom: "#8B4513",
  mostarda: "#FFDB58",
  nude: "#E3BC9A",
  pink: "#FFC0CB",
  preto: "#000000",
  "rosa baby": "#FFB6C1",
  "rosa choque": "#FC0FC0",
  "rosa tutti frutti": "#FF00FF",
  rose: "#FF007F",
  roxo: "#800080",
  salmao: "#FA8072",
  "terra cota": "#E2725B",
  "verde agua": "#00FFFF",
  "verde bandeira": "#008000",
  "verde folha": "#006400",
  "verde limao": "#32CD32",
  "verde maca": "#8DB600",
  "verde militar": "#4B5320",
  vermelho: "#FF0000",
  "vermelho quente": "#FF4500",
  "vermelho rubi": "#E0115F",
  vinho: "#800000",

  // Cintilantes / Perolados
  "amarelo perolado": "#FFFACD",
  "azul perolado": "#ADD8E6",
  "branco perolado": "#F5F5F5",
  champagne: "#F7E7CE",
  cobre: "#B87333",
  dourado: "#FFD700",
  "laranja perolado": "#FFDAB9",
  "lilas perolado": "#E6E6FA",
  ouro: "#FFD700",
  prata: "#C0C0C0",
  "preto perolado": "#333333",
  "rosa perolado": "#FFC0CB",
  "rose gold": "#B76E79",
  "verde perolado": "#90EE90",
  "vermelho perolado": "#FF6347",

  // Candy Color
  "amarelo candy": "#FFFACD",
  "azul candy": "#E0FFFF",
  "lilas candy": "#E6E6FA",
  "rosa candy": "#FFB6C1",
  "verde candy": "#98FB98",

  // Neon
  "amarelo neon": "#FFFF00",
  "azul neon": "#00FFFF",
  "laranja neon": "#FFA500",
  "pink neon": "#FF69B4",
  "roxo neon": "#8A2BE2",
  "verde neon": "#39FF14",
  "vermelho neon": "#FF0000",

  // Uniq (Tons pastéis modernos ou especiais)
  areia: "#C2B280",
  "azul ardósia": "#778899",
  "azul chuva": "#708090",
  "azul navy": "#000080",
  bege: "#F5F5DC",
  blush: "#DE5D83",
  cacau: "#3D2B1F",
  camurça: "#CFB53B",
  caramelo: "#C68E17",
  creme: "#FFFDD0",
  eucalipto: "#44D7A8",
  framboesa: "#E30B5C",
  jade: "#00A86B",
  lavanda: "#E6E6FA",
  marsala: "#955251",
  menta: "#98FF98",
  "mostarda uniq": "#FFDB58",
  oliva: "#808000",
  papaya: "#FFEFD5",
  pessego: "#FFDAB9",
  "rosa antigo": "#C08081",
  "rosa cha": "#F88379",
  "rosa chiclete": "#FF69B4",
  "rosa seco": "#DB7093",
  terracota: "#E2725B",
  tiffany: "#0ABAB5",
  uva: "#6F2DA8",
  "verde floresta": "#228B22",
  "verde musgo": "#8A9A5B",
  "vermelho cereja": "#DE3163",
};

/**
 * Tries to find the best matching hex color for a given color name
 * using simple fuzzy matching against the São Roque database.
 */
export function suggestHexColor(colorName: string): string | null {
  const normalizedInput = colorName.toLowerCase().trim();

  // 1. Direct match
  if (SAO_ROQUE_COLORS[normalizedInput]) {
    return SAO_ROQUE_COLORS[normalizedInput];
  }

  // 2. Contains match (e.g. "Azul" matches "Azul Baby" -> returns first found)
  // We prioritize keys that start with the input for better accuracy
  const startsWithMatch = Object.keys(SAO_ROQUE_COLORS).find((key) =>
    key.startsWith(normalizedInput)
  );
  if (startsWithMatch) return SAO_ROQUE_COLORS[startsWithMatch];

  const containsMatch = Object.keys(SAO_ROQUE_COLORS).find((key) =>
    key.includes(normalizedInput)
  );
  if (containsMatch) return SAO_ROQUE_COLORS[containsMatch];

  // 3. Reverse contains match (e.g. input "Azul Escuro" might map to "Azul" if strict)
  // But usually typically we want the specific one.

  return null;
}
