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
}

export interface BalloonConfig {
  types: BalloonTypeConfig[];
  allColors: string[];
}
