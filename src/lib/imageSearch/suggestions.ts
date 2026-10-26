// Sugestões de busca de foto a partir do produto (#347). O modal de imagem
// aparece em vários lugares do admin; com o nome do produto em mãos, a
// atendente toca numa sugestão em vez de digitar. Nenhuma busca roda
// sozinha: a cota do Serper é limitada.
export function photoSearchQueries(name: string | undefined | null): string[] {
  const base = (name ?? "").replace(/\s+/g, " ").trim();
  if (base.length < 2) return [];
  const words = base.split(" ");
  const short = words.length > 4 ? words.slice(0, 4).join(" ") : "";
  return [...new Set([base, `${base} fundo branco`, short].filter(Boolean))];
}

// Sem a chave do Serper: abre a busca de imagens do Google numa aba nova
// (grátis); a atendente salva a foto e envia por Arquivo ou Link.
export function googleImagesUrl(q: string): string {
  return `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(q)}`;
}
