export interface BalloonSizeConfig {
  size: string;
  price: number;
  unitsPerPackage: number;
}

export interface BalloonTypeConfig {
  id: string;
  name: string;
  sizes: BalloonSizeConfig[];
  colors: string[];
  active?: boolean; // New field for toggling visibility
  imageUrl?: string; // Image for the specific balloon type
  // Marca ("São Roque", "Riberball"…): o montador da loja pede a marca
  // primeiro. Tipo de outra marca tem id "base__marca" ("simples__riberball").
  brand?: string;
}

export interface BalloonConfig {
  types: BalloonTypeConfig[];
  allColors: string[];
  placeholderUrl?: string;
}

// Estoque dos balões vindo do Noturno (#236): tipo → tamanho → cor →
// quantidade. Documento próprio (`settings/balloonStock`) — não dentro de
// `settings/balloons`, que o admin regrava inteiro ao salvar.
export type BalloonStock = Record<string, Record<string, Record<string, number>>>;

// Foil de letras e números: tamanho → cor → caractere → quantidade.
export type FoilCharStock = Record<string, Record<string, Record<string, number>>>;

export interface BalloonStockDoc {
  stock: BalloonStock;
  chars?: FoilCharStock;
  updatedAt?: unknown;
}
