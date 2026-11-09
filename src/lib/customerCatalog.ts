import type { AssembledKitProduct, KitRecipe, Product } from "@/types";

// Catálogo que o cliente vê: sem produto desativado e só com os kits que
// dá para vender. Mesma regra no navegador (productStore) e no servidor
// (contagem do menu, /catalogo/menu), para os dois nunca divergirem (#399).

// Regra da Venda Garantida: kit só aparece se os componentes obrigatórios
// estão disponíveis e há opção de laço.
export const isKitAvailable = (
  kit: AssembledKitProduct,
  recipe: KitRecipe,
  allProducts: Product[]
): boolean => {
  if (kit.disabled || recipe.disabled) return false;

  const availableProductIds = new Set(
    allProducts.filter((p) => !p.disabled).map((p) => p.id)
  );

  const allRequiredItemsInStock = recipe.components
    .filter((c) => c.required && (c.type === "BASE" || c.type === "FILLER"))
    .every((comp) => availableProductIds.has(comp.componentId));

  if (!allRequiredItemsInStock) return false;

  return recipe.components.some(
    (c) =>
      c.type === "RIBBON_SERVICE" ||
      (c.type === "LAÇO_PRONTO" && availableProductIds.has(c.componentId))
  );
};

export function customerCatalog(
  productsData: Product[],
  recipes: KitRecipe[]
): { products: Product[]; kits: AssembledKitProduct[] } {
  const kits = productsData.filter(
    (p) => p.type === "ASSEMBLED_KIT"
  ) as AssembledKitProduct[];
  const nonKitProducts = productsData.filter(
    (p) => p.type !== "ASSEMBLED_KIT" && !p.disabled
  );
  const availableKits = kits.filter((kit) => {
    const recipe = recipes.find((r) => r.id === kit.recipeId);
    return !!recipe && isKitAvailable(kit, recipe, productsData);
  });
  return { products: [...nonKitProducts, ...availableKits], kits: availableKits };
}
