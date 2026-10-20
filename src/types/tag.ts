// Catálogo gerenciado de tags manuais (issue #68) — mesmo padrão de
// `src/types/category.ts`: id/slug do documento, nome de exibição, ordem
// pra UI, `active` pra desativar sem apagar (produtos já usando a tag não
// quebram). Sem `subcategories` — tag é plana, many-to-many, não hierarquia.
//
// Tags de SISTEMA (`novidades`/`promocao`, ver src/lib/productTags.ts) não
// têm doc nesta coleção — são calculadas, nunca cadastradas à mão.
export interface Tag {
  id: string;
  name: string;
  order: number;
  active: boolean;
}
