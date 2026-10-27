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
// Linha e cores: um nome só com estas palavras não diz o modelo (é a lisa).
const PLAIN = new Set(
  ("MAXI PLASTICA CETIM GORGURAO AZUL VERMELHO ROSA PINK LILAS VERDE AMARELO BRANCO PRETO OURO PRATA " +
    "MARINHO ESCURO CLARO LARANJA ROXO MARROM BEGE BEIGE NUDE CAQUI AMEIXA MERLOT ROSE BARBANTE CHA BALE " +
    "PETALA LAVANDA CINZA DOURADO PRATEADO TIFFANY TURQUESA VINHO BORDO CORAL SALMAO FUCSIA CREME PEROLA " +
    "NATURAL AREIA PETROLEO CHERRY PO BEBE CEREJA GRAFITE CHUMBO OFF WHITE").split(" "),
);

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
  // No máximo 1 palavra a mais no catálogo: mais que isso é outra estampa
  // ("PAPERLOOK BARBANTE/OURO" não é "PaperLook Te Amo Mãe Barbante/Ouro").
  const plain = [...want].every((t) => PLAIN.has(t));
  const cands: { p: CatalogProduct; score: number; lisa: boolean }[] = [];
  for (const p of withPhoto) {
    const have = ribbonTokens(p.name);
    let all = true;
    for (const t of want) if (!have.has(t)) { all = false; break; }
    if (!all) continue;
    const extra = have.size - want.size;
    const sameWidth = w != null && widthOf(p.name) === w;
    // Em outra largura, só o nome exato (a mesma fita em outro tamanho).
    if (extra > 1 || (!sameWidth && extra > 0)) continue;
    // Nome sem modelo ("MAXI 16MM ROSA"): a palavra a mais só pode ser LISA,
    // senão é uma estampa (Pois, Chevron…) com a mesma cor.
    if (extra === 1 && plain && !have.has("LISA")) continue;
    const score = (sameWidth ? 0 : 10) + extra;
    cands.push({ p, score, lisa: have.has("LISA") && !want.has("LISA") });
  }
  if (cands.length === 0) return null;
  const top = Math.min(...cands.map((c) => c.score));
  const tied = cands.filter((c) => c.score === top);
  // Mesmas palavras = mesma fita (só muda a metragem): qualquer uma serve.
  const key = (p: CatalogProduct) => [...ribbonTokens(p.name)].sort().join(" ");
  if (new Set(tied.map((c) => key(c.p))).size === 1) return tied[0].p;
  // Empate entre produtos diferentes ("MAXI VERMELHO" casa com Lisa,
  // Chevron, Escamas…): sem modelo no nome, é a lisa; senão, nenhuma
  // (foto errada na loja é pior que ir para a busca).
  const lisa = tied.filter((c) => c.lisa);
  return lisa.length > 0 && new Set(lisa.map((c) => c.p.name)).size === 1 ? lisa[0].p : null;
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
