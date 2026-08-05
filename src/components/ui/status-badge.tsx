import { Badge, type BadgeTone } from "@/components/ui/badge"
import type { OrderStatus } from "@/types/order"
import type { ProductType } from "@/types/product"

// Fonte única para status de pedido. Segue @/types/order.ts — é o enum que
// OrdersTab.tsx realmente grava no Firestore (updateStatus) e que
// meu-pedido/page.tsx (rastreamento do cliente, rota realmente linkada)
// já consome corretamente.
//
// @/types/cart.ts declara um segundo `OrderStatus` (pending/processing/
// delivering/completed/cancelled) que NÃO corresponde ao que é gravado.
// Ele só é referenciado por código morto: a função getOrderStatusBadge em
// admin/page.tsx (nunca chamada) e a rota meu-pedido/[id]/page.tsx (nenhum
// link no app aponta pra ela). Corrigido aqui após uma versão anterior
// deste arquivo seguir por engano o enum de @/types/cart.
//
// `cancelled` usa o tom `accent` em vez do cinza+tachado que OrdersTab.tsx
// usa no controle interativo — Badge não tem modificador de tachado, e
// reaproveitar `neutral` colidiria visualmente com `delivered`.
export const ORDER_STATUS_META: Record<OrderStatus, { label: string; tone: BadgeTone }> = {
  pending: { label: "Recebido", tone: "danger" },
  preparing: { label: "Preparando", tone: "info" },
  ready: { label: "Pronto", tone: "success" },
  out_for_delivery: { label: "Saiu p/ Entrega", tone: "brand" },
  delivered: { label: "Entregue", tone: "neutral" },
  cancelled: { label: "Cancelado", tone: "accent" },
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const meta = ORDER_STATUS_META[status]
  if (!meta) return <Badge tone="neutral">{status}</Badge>
  return <Badge tone={meta.tone}>{meta.label}</Badge>
}

// Fonte única para tipo de produto → antes reimplementado em
// admin/page.tsx (getProductTypeLabel). O switch original também tratava um
// caso "KIT_TEMPLATE" que não existe em ProductType (@/types/product.ts);
// omitido aqui por não corresponder a nenhum valor real do tipo.
//
// `label` é o texto curto usado em badges (espaço restrito em linha de
// tabela); `filterLabel` é a versão mais descritiva usada em <Select> de
// filtro/criação, onde há espaço de sobra. Antes do agora, o wizard de
// criação e o filtro de estoque cada um reimplementava sua própria lista
// de rótulos pro mesmo enum, com textos divergentes entre si.
export const PRODUCT_TYPE_META: Record<
  ProductType,
  { label: string; filterLabel: string; tone: BadgeTone }
> = {
  BASE_CONTAINER: { label: "Base", filterLabel: "Base/Cesta", tone: "brand" },
  STANDARD_ITEM: {
    label: "Item",
    filterLabel: "Recheio/Item",
    tone: "neutral",
  },
  FILLER: { label: "Preench.", filterLabel: "Preenchimento", tone: "info" },
  ACCESSORY: { label: "Acess.", filterLabel: "Acessório", tone: "warning" },
  WRAPPER: { label: "Saco", filterLabel: "Saco/Embalagem", tone: "accent" },
  RIBBON: { label: "Fita", filterLabel: "Fita", tone: "pink" },
  ASSEMBLED_KIT: {
    label: "Kit Montado",
    filterLabel: "Kit Montado",
    tone: "teal",
  },
}

export function ProductTypeBadge({ type }: { type: ProductType }) {
  const meta = PRODUCT_TYPE_META[type]
  if (!meta) return <Badge tone="neutral">{type}</Badge>
  return <Badge tone={meta.tone}>{meta.label}</Badge>
}

// Tipos que só existem pra montagem de kit (`kit_recipes`/`KitComponent`,
// issue #98) — sem CRUD de receita implementado e com o builder desligado
// por padrão (`StoreSettings.features.customKitEnabled`, issue #108), esses
// 4 tipos não têm função nenhuma fora de uma receita que ainda não existe.
// Confirmado em produção (issue #165, comentário) que o vendedor já criou 6
// produtos reais desses tipos por engano, sem saber que eram exclusivos de
// kit — ruído puro na lista de CRIAÇÃO/filtro enquanto a flag estiver off.
//
// `ASSEMBLED_KIT` fica de fora desta lista de propósito: cada consumidor já
// trata esse tipo à parte (ex: `ProductFormDialog` nunca oferece
// "Kit Montado" como opção de criação, kit nunca nasce por este form; em
// `SectionsTab`, a visibilidade de `ASSEMBLED_KIT` no filtro "vitrinável"
// segue a MESMA flag mas é decidida no próprio componente, não aqui) — não
// existe hoje nenhum caminho no código que crie um `Product` desse tipo.
const KIT_ONLY_PRODUCT_TYPES: readonly ProductType[] = [
  "BASE_CONTAINER",
  "FILLER",
  "ACCESSORY",
  "WRAPPER",
]

// Fonte única pros 3 seletores de tipo do admin (`ProductFormDialog`,
// `ProductsTab`, `SectionsTab`) — antes cada um filtrava (ou não) o próprio
// `Object.entries(PRODUCT_TYPE_META)`, e só o `SectionsTab` filtrava
// parcialmente (issue #165). `customKitEnabled` desligado (padrão de
// produção) esconde os 4 tipos exclusivos de kit da lista de opções; ligar
// a flag devolve a lista completa (exceto `ASSEMBLED_KIT`, sempre tratado à
// parte por quem consome). Produto EXISTENTE desses tipos nunca é afetado
// por este helper — ele só define a lista de OPÇÕES pra criação/filtro
// novo, nunca valida ou trava o valor já salvo de um produto.
export function getVisibleProductTypes(
  customKitEnabled: boolean
): ProductType[] {
  const allTypes = (Object.keys(PRODUCT_TYPE_META) as ProductType[]).filter(
    (type) => type !== "ASSEMBLED_KIT"
  )
  if (customKitEnabled) return allTypes
  return allTypes.filter((type) => !KIT_ONLY_PRODUCT_TYPES.includes(type))
}
