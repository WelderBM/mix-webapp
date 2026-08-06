// GERADO por scripts/export-production-catalog.ts em 2026-08-04T00:11:20.535Z
// Projeto de origem: mix-webapp
// Não editar à mão — rode o script de novo pra atualizar. Coleção: kit_recipes.

import { KitRecipe } from "../../../src/types/kit";

export const kitRecipes: KitRecipe[] = [
  {
    "id": "KREC001",
    "name": "Receita Essencial Sacola",
    "description": "Sacola + Natura",
    "disabled": false,
    "assemblyCost": 5,
    "components": [
      {
        "componentId": "BASE003",
        "name": "Sacola de Papel",
        "type": "BASE",
        "required": true,
        "maxQuantity": 1,
        "defaultQuantity": 1
      },
      {
        "componentId": "PROD_NAT01",
        "name": "Sabonete TodoDia",
        "type": "FILLER",
        "required": true,
        "maxQuantity": 4,
        "defaultQuantity": 2
      },
      {
        "componentId": "LAÇO_PRONTO01",
        "name": "Laço de Puxar",
        "type": "LAÇO_PRONTO",
        "required": false,
        "maxQuantity": 1,
        "defaultQuantity": 0
      },
      {
        "componentId": "SERVICE-RIBBON",
        "name": "Serviço Laço",
        "type": "RIBBON_SERVICE",
        "required": false,
        "maxQuantity": 1,
        "defaultQuantity": 0
      }
    ]
  },
  {
    "id": "KREC002",
    "name": "Receita Afeto",
    "description": "Cesta Vime + Ursinho",
    "disabled": false,
    "assemblyCost": 10,
    "components": [
      {
        "componentId": "BASE001",
        "name": "Cesta Madeira",
        "type": "BASE",
        "required": true,
        "maxQuantity": 1,
        "defaultQuantity": 1
      },
      {
        "componentId": "PROD_BRINQ01",
        "name": "Ursinho Pelúcia",
        "type": "FILLER",
        "required": true,
        "maxQuantity": 1,
        "defaultQuantity": 1
      },
      {
        "componentId": "PROD_FILLER01",
        "name": "Papel Seda",
        "type": "FILLER",
        "required": false,
        "maxQuantity": 2,
        "defaultQuantity": 1
      },
      {
        "componentId": "LAÇO_PRONTO02",
        "name": "Laço Bola Ouro",
        "type": "LAÇO_PRONTO",
        "required": false,
        "maxQuantity": 1,
        "defaultQuantity": 0
      },
      {
        "componentId": "SERVICE-RIBBON",
        "name": "Serviço Laço",
        "type": "RIBBON_SERVICE",
        "required": false,
        "maxQuantity": 1,
        "defaultQuantity": 0
      }
    ]
  }
] as unknown as KitRecipe[];
