// src/lib/category_groups.ts

// Mapeamento: Chave (Nome na Home) -> Array de valores (Categorias no Admin)
export const HOME_CATEGORY_GROUPS: Record<string, string[]> = {
  "Kits & Presentes": [
    "Kits Prontos",
    "Presentes",
    "Canecas",
    "Pelúcias",
    "Dia das Mães",
    "Namorados",
  ],
  "Cestas & Caixas (Bases)": [
    "Cestas",
    "Cestas Vime",
    "Caixas Decoradas",
    "Caixas Visor",
    "Madeira",
    "Cestas Econômicas",
    "Bases",
  ],
  "Perfumaria & Corpo": [
    "Perfumaria Masculina",
    "Perfumaria Feminina",
    "Hidratantes",
    "Sabonetes",
    "Cuidados Homem",
    "Corpo e Banho",
    "Natura",
  ],
  "Fitas & Laços": [
    "Fitas",
    "Fitas 32mm",
    "Fitas 16mm",
    "Laços Prontos",
    "Laço Bola",
    "Fitas Decorativas",
  ],
  "Embalagens & Papelaria": [
    "Embalagens",
    "Sacos",
    "Papel de Seda",
    "Etiquetas",
    "Palha",
  ],
};

// Função auxiliar para descobrir a qual grupo um produto pertence
export const getProductGroup = (specificCategory: string): string => {
  for (const [group, specifics] of Object.entries(HOME_CATEGORY_GROUPS)) {
    // Verifica se a categoria específica está na lista OU se contém parte do nome
    // Ex: "Fita Cetim" vai cair em "Fitas & Laços" se "Fitas" estiver na lista
    if (
      specifics.some(
        (s) => s === specificCategory || specificCategory.includes(s)
      )
    ) {
      return group;
    }
  }
  return "Outros"; // Se não encaixar em nada
};
