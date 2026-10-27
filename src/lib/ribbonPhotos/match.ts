// Foto real da fita (relatório 27/10): o cadastro pelo Noturno busca sozinho
// a foto do fabricante. Padrão escolhido: a foto oficial da Albano (fita
// em curva, fundo branco, mesma luz em todas). Esta parte casa o nome do
// Noturno com o nome do catálogo da Albano; puro, sem rede, testável.

export interface CatalogProduct {
  name: string;
  sku: string;
  images: string[];
}

// Cor no masculino ("BRANCA" = "BRANCO"): o Noturno e a Albano variam.
const GENDER: Record<string, string> = {
  BRANCA: "BRANCO", AMARELA: "AMARELO", VERMELHA: "VERMELHO", ROXA: "ROXO",
  PRETA: "PRETO", DOURADA: "DOURADO", PRATEADA: "PRATEADO", ESCURA: "ESCURO", CLARA: "CLARO",
};
const NOISE = new Set(["FITA", "P", "METRO", "C", "UN", "UND", "COM", "DE", "E"]);

const base = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/PAPER\s*LOOK/g, "PAPERLOOK")
    .replace(/\bFM\s*(\d+[A-Z]?)\b/g, "FM $1")
    .replace(/(\d)\s*(MM)?\s*X\s*(?=\d)/g, "$1$2X");

// Largura em mm ("32MMX100M", "32X100", "30MMX100MM").
export function widthOf(name: string): number | null {
  const m = /(\d{1,3})(?:MM)?X\d/.exec(base(name));
  return m ? Number(m[1]) : null;
}

// Palavras que identificam modelo e cor, sem medidas nem ruído.
export function ribbonTokens(name: string): Set<string> {
  const words = base(name)
    .replace(/[^A-Z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((w) => !/^\d+(MM)?X\d/.test(w) && !/^\d+(MM|M|MTS?|CM)?$/.test(w))
    .map((w) => (w === "LISO" ? "LISA" : GENDER[w] ?? w))
    .filter((w) => !NOISE.has(w));
  return new Set(words);
}

// Melhor produto do catálogo: o EAN manda; senão, o produto que tem TODAS
// as palavras do nome do Noturno, na mesma largura se houver, com menos
// palavras sobrando. Sem candidato seguro, null (aí entra a busca).
export function matchCatalog(
  item: { name: string; ean?: string | null },
  catalog: CatalogProduct[],
): CatalogProduct | null {
  const withPhoto = catalog.filter((p) => p.images.length > 0);
  if (item.ean) {
    const byEan = withPhoto.find((p) => p.sku === item.ean);
    if (byEan) return byEan;
  }
  const want = ribbonTokens(item.name);
  if (want.size < 2) return null;
  const w = widthOf(item.name);
  let best: { p: CatalogProduct; score: number } | null = null;
  for (const p of withPhoto) {
    const have = ribbonTokens(p.name);
    let all = true;
    for (const t of want) if (!have.has(t)) { all = false; break; }
    if (!all) continue;
    const extra = have.size - want.size;
    const score = (w != null && widthOf(p.name) === w ? 0 : 10) + extra;
    if (!best || score < best.score) best = { p, score };
  }
  return best?.p ?? null;
}

// Busca (quando o fabricante não tem a foto): o que perguntar.
export function searchQuery(name: string, brand?: string | null): string {
  const words = [...ribbonTokens(name)].join(" ").toLowerCase();
  const w = widthOf(name);
  const b = brand && !/DIVERSOS/i.test(brand) ? `${brand.toLowerCase()} ` : "";
  return `fita ${b}${words}${w ? ` ${w}mm` : ""}`.replace(/\s+/g, " ").trim();
}

// Padrão para as fotos da busca: quase quadrada e com pelo menos 300 px,
// que é como fica a foto de produto (não banner, não print de anúncio).
export function pickSearchPhotos(
  results: { imageUrl: string; width: number | null; height: number | null }[],
  max = 3,
): string[] {
  const good = results.filter((r) => {
    if (!r.width || !r.height) return false;
    const ratio = r.width / r.height;
    return Math.min(r.width, r.height) >= 300 && ratio > 0.75 && ratio < 1.33;
  });
  return good.slice(0, max).map((r) => r.imageUrl);
}
