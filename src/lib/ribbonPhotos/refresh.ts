import type { Product, ProductImage } from "@/types";

// Trocar desenhos por fotos reais nas fitas JÁ cadastradas (relatório
// 27/10): o desenho do rolo e a foto real ficam no mesmo lugar do Storage,
// então não dá para saber pela URL qual é qual. A lista mostra as fitas do
// Noturno com uma imagem só e quem confere é a pessoa, lado a lado.

export function refreshCandidates(products: Product[]): Product[] {
  return products
    .filter((p) => p.type === "RIBBON" && !!p.sourceCode)
    .filter((p) => (p.images?.length ?? (p.imageUrl ? 1 : 0)) <= 1)
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

// Várias fotos: a primeira é a capa (mesmo formato do cadastro).
export function imagesFrom(urls: string[]): Pick<Product, "images" | "imageUrl"> {
  const images: ProductImage[] = urls.map((url, i) => ({
    id: i === 0 ? "cover" : `foto-${i + 1}`,
    url,
    isCover: i === 0,
  }));
  return { images, imageUrl: urls[0] ?? "" };
}
