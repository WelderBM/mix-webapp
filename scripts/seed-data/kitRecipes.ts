import { KitRecipe } from "../../src/types/kit";
import { KIT_RECIPE_IDS, PRODUCT_IDS } from "./ids";

// Components apontam pra ids REAIS seedados em products.ts (baseContainer,
// filler, ribbonAbertoComSobra) — nada inventado, pra bater com o produto
// ASSEMBLED_KIT que referencia esta mesma receita (ver products.ts).
export const kitRecipePresenteAniversario: KitRecipe = {
  id: KIT_RECIPE_IDS.PRESENTE_ANIVERSARIO,
  name: "Presente de Aniversário (seed)",
  description: "Cesta com recheio e laço de fita — receita de teste do seed.",
  disabled: false,
  assemblyCost: 10,
  components: [
    {
      componentId: PRODUCT_IDS.BASE_CONTAINER,
      name: "Base cesta (seed)",
      type: "BASE",
      required: true,
      maxQuantity: 1,
      defaultQuantity: 1,
    },
    {
      componentId: PRODUCT_IDS.FILLER,
      name: "Recheio (seed)",
      type: "FILLER",
      required: true,
      maxQuantity: 5,
      defaultQuantity: 2,
    },
    {
      componentId: PRODUCT_IDS.RIBBON_ABERTO_SOBRA,
      name: "Fita aberta com sobra (seed)",
      type: "RIBBON_SERVICE",
      required: false,
      maxQuantity: 1,
      defaultQuantity: 1,
    },
  ],
};

export const kitRecipes: KitRecipe[] = [kitRecipePresenteAniversario];
