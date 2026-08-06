// GERADO por scripts/export-production-catalog.ts em 2026-08-04T00:11:20.887Z
// Projeto de origem: mix-webapp
// Não editar à mão — rode o script de novo pra atualizar. Coleção: settings (todos os docs — general, balloons, natura, ...).

import { StoreSettings } from "../../../src/types/store";
import { BalloonConfig } from "../../../src/types/balloon";

// Chaveado pelo id do doc em settings/<id> — spread o que precisar.
export const settingsById: Record<string, unknown> = {
  "balloons": {
    "allColors": [],
    "types": [
      {
        "colors": [
          "Amarelo",
          "Amarelo Citrino",
          "Azul Baby",
          "Azul Celeste",
          "Azul Cobalto",
          "Azul Mandalin",
          "Azul Royal",
          "Azul Turquesa",
          "Branco",
          "Cafe Brasil",
          "Cinza",
          "Laranja",
          "Laranja Mandalin",
          "Lilas Baby",
          "Marfim",
          "Marrom",
          "Mostarda",
          "Nude",
          "Pink",
          "Preto",
          "Rosa Baby",
          "Rosa Choque",
          "Rosa Tutti Frutti",
          "Rose",
          "Roxo",
          "Salmao",
          "Terra Cota",
          "Verde Agua",
          "Verde Bandeira",
          "Verde Folha",
          "Verde Limao",
          "Verde Maca",
          "Verde Militar",
          "Vermelho",
          "Vermelho Quente",
          "Vermelho Rubi",
          "Vinho"
        ],
        "sizes": [
          {
            "unitsPerPackage": 50,
            "size": "5",
            "price": 11
          },
          {
            "size": "6.5",
            "price": 7.5,
            "unitsPerPackage": 50
          },
          {
            "unitsPerPackage": 50,
            "size": "7",
            "price": 10
          },
          {
            "unitsPerPackage": 50,
            "price": 13,
            "size": "8"
          },
          {
            "unitsPerPackage": 50,
            "size": "9",
            "price": 16
          },
          {
            "size": "16",
            "price": 20,
            "unitsPerPackage": 20
          }
        ],
        "id": "simples",
        "name": "Balão Simples (Liso)",
        "imageUrl": "data:image/jpeg;base64,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"
      },
      {
        "colors": [
          "Amarelo Perolado",
          "Azul Perolado",
          "Branco Perolado",
          "Champagne",
          "Cobre",
          "Dourado",
          "Laranja Perolado",
          "Lilas Perolado",
          "Ouro",
          "Prata",
          "Preto Perolado",
          "Rosa Perolado",
          "Rose Gold",
          "Verde Perolado",
          "Vermelho Perolado"
        ],
        "sizes": [
          {
            "unitsPerPackage": 25,
            "price": 17.5,
            "size": "5"
          },
          {
            "price": 27,
            "size": "9",
            "unitsPerPackage": 25
          },
          {
            "unitsPerPackage": 10,
            "size": "16",
            "price": 38
          }
        ],
        "name": "Metálico",
        "id": "metalico",
        "imageUrl": "data:image/jpeg;base64,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"
      },
      {
        "colors": [
          "Amarelo Candy",
          "Azul Candy",
          "Lilas Candy",
          "Rosa Candy",
          "Verde Candy"
        ],
        "sizes": [
          {
            "unitsPerPackage": 25,
            "size": "5",
            "price": 6.5
          },
          {
            "unitsPerPackage": 25,
            "price": 10,
            "size": "9"
          },
          {
            "price": 20,
            "size": "16",
            "unitsPerPackage": 10
          }
        ],
        "id": "candy",
        "name": "Candy Colors",
        "imageUrl": "data:image/jpeg;base64,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"
      },
      {
        "sizes": [
          {
            "unitsPerPackage": 50,
            "size": "7",
            "price": 17.5
          },
          {
            "price": 10,
            "size": "8",
            "unitsPerPackage": 25
          },
          {
            "unitsPerPackage": 25,
            "size": "9",
            "price": 13
          }
        ],
        "colors": [
          "Amarelo Perolado",
          "Azul Perolado",
          "Branco Perolado",
          "Champagne",
          "Cobre",
          "Dourado",
          "Laranja Perolado",
          "Lilas Perolado",
          "Ouro",
          "Prata",
          "Rosa Perolado",
          "Rose Gold",
          "Verde Perolado"
        ],
        "id": "cintilante",
        "name": "Cintilante",
        "imageUrl": "data:image/jpeg;base64,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"
      },
      {
        "sizes": [
          {
            "unitsPerPackage": 50,
            "size": "260",
            "price": 15
          }
        ],
        "colors": [
          "Sortido",
          "Branco",
          "Preto",
          "Vermelho",
          "Azul",
          "Amarelo"
        ],
        "id": "canudo",
        "name": "Canudo / 260",
        "imageUrl": "data:image/jpeg;base64,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"
      },
      {
        "colors": [
          "Areia",
          "Azul Ardosia",
          "Azul Chuva",
          "Azul Navy",
          "Bege",
          "Blush",
          "Cacau",
          "Camurca",
          "Caramelo",
          "Creme",
          "Eucalipto",
          "Framboesa",
          "Jade",
          "Lavanda",
          "Marsala",
          "Menta",
          "Mostarda Uniq",
          "Oliva",
          "Papaya",
          "Pessego",
          "Rosa Antigo",
          "Rosa Cha",
          "Rosa Chiclete",
          "Rosa Seco",
          "Terracota",
          "Tiffany",
          "Uva",
          "Verde Floresta",
          "Verde Musgo",
          "Vermelho Cereja"
        ],
        "sizes": [
          {
            "size": "9",
            "price": 22,
            "unitsPerPackage": 50
          },
          {
            "unitsPerPackage": 50,
            "price": 25,
            "size": "11"
          },
          {
            "size": "16",
            "price": 35,
            "unitsPerPackage": 15
          }
        ],
        "name": "Linha Uniq",
        "id": "uniq",
        "imageUrl": "https://images.tcdn.com.br/img/img_prod/771079/baloes_sao_roque_azul_navy_uniq_16_pol_pc_10un_146406_8315_1_70111eda838140c92643f27814607df9.jpg"
      },
      {
        "colors": [
          "Dourado",
          "Prata",
          "Rose Gold",
          "Vermelho",
          "Azul",
          "Pink"
        ],
        "sizes": [
          {
            "price": 12,
            "size": "40cm",
            "unitsPerPackage": 1
          },
          {
            "size": "75cm",
            "price": 25,
            "unitsPerPackage": 1
          }
        ],
        "name": "Números & Letras (Foil)",
        "id": "foil_numeros",
        "imageUrl": "data:image/jpeg;base64,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"
      }
    ]
  },
  "general": {
    "storeName": "Mix Novidades (Em teste)",
    "whatsappNumber": "95991341586",
    "homeSections": [
      {
        "productIds": [],
        "isActive": true,
        "title": "Banner Natura",
        "type": "banner_natura",
        "width": "full",
        "id": "c6550195-0dbc-4ae2-91a8-d44695c93f21"
      },
      {
        "width": "full",
        "id": "a50c8b8d-616f-4abe-9892-9f28333e67f2",
        "isActive": true,
        "productIds": [
          "aDvtYvGkRr8p41UvqorH",
          "5IdXb8EryrtLKDjAfbR2",
          "1ymbjPI3TABjtRYlkbjp",
          "yLZ2easGiMYPYmbsxhiH",
          "6dT4xNoCxanXuWVcjlvc",
          "gHEx1EswxhnX3AYKNCDl",
          "igy2meZmnB88uduDlIYe",
          "vEbdK34e4LiNxz3gk7OA"
        ],
        "title": "Preços imbatíeveis em Natura!",
        "type": "product_shelf"
      },
      {
        "id": "a146c143-03c7-43e2-9e8d-d06f786c9ca7",
        "width": "full",
        "title": "Pelúcia!",
        "type": "product_shelf",
        "productIds": [
          "5tzssSnifJuZcVh72IYt",
          "zD6ka3AadcKMUhj4tzNa"
        ],
        "isActive": true
      },
      {
        "type": "banner_kit",
        "title": "Banner Kit Teste",
        "isActive": true,
        "productIds": [],
        "id": "47e1c550-fac7-4372-bb73-39bc33d8647b",
        "width": "full"
      },
      {
        "id": "efda81dc-b7d9-47cf-a273-0f19abc947bc",
        "width": "full",
        "type": "product_shelf",
        "title": "Deixa o embalo com a gente!",
        "isActive": true,
        "productIds": [
          "V5p5hKkwoyP0rSc76sG2",
          "lvtVEW5nMhtcurCPGJD9",
          "TOyQrkxUXqfyNo0WoPW3",
          "KMt39QeCkhEAFXC0WEcR",
          "5Qj3ZEBpzOvPwEnb2m0u",
          "erTxhrfK8gDuc49XYiYF",
          "E7ccxek1sktnTEBLzwNW",
          "YnufSispSbdfkk8nkpF6",
          "ySqPUSaY2GxjXG7zLdjs"
        ]
      },
      {
        "title": "Banner Fitas",
        "type": "banner_ribbon",
        "isActive": true,
        "productIds": [],
        "id": "ce33749d-14a1-460f-86d4-35de3cecfa74",
        "width": "full"
      },
      {
        "productIds": [
          "rLQoEuzlIPkdmhG55eCc",
          "vXkyE9BIw7btJYjXUDpD",
          "LwcbELFfrC8vbOktN1Y5",
          "rQVlDMWRUEBCcsUmjhnh",
          "EaNESZieRZ8NkR6fJ5C4"
        ],
        "isActive": true,
        "type": "product_shelf",
        "title": "Fitas Albano A melhor qualidade!",
        "width": "full",
        "id": "42873bc6-e5e7-42c4-a2bf-d7319f6b75d0"
      },
      {
        "width": "full",
        "id": "727261b9-75d0-4d02-9df9-47ed4055d86b",
        "isActive": true,
        "productIds": [],
        "type": "banner_balloon",
        "title": "Banner Balão"
      }
    ],
    "bowModels": [
      {
        "id": "d6e05cce-d55e-4ba8-884a-394be99c2317",
        "name": "Laço borboleta",
        "subtitle": "Simples e versátil",
        "imageUrl": "data:image/jpeg;base64,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"
      },
      {
        "id": "71687045-049c-43ca-b928-91fa62cc93fc",
        "name": "Laço bola",
        "subtitle": "Clássico e elegante, plano.",
        "imageUrl": "data:image/jpeg;base64,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"
      }
    ],
    "id": "general",
    "theme": {
      "activeTheme": "default"
    },
    "filters": {
      "categoryOrder": [
        "Fitas",
        "Bases",
        "Natura",
        "Acessórios"
      ],
      "activeCategories": [
        "Fitas",
        "Bases",
        "Natura",
        "Acessórios"
      ]
    },
    "bowSizes": [
      {
        "id": "fb3b5467-e6e0-4033-a92f-29e3f3030f9b",
        "name": "padrão",
        "price": 5
      }
    ]
  }
};

export const generalSettings = settingsById["general"] as StoreSettings | undefined;
export const balloonConfig = settingsById["balloons"] as BalloonConfig | undefined;
