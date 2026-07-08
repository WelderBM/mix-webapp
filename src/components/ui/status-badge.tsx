import { Badge, type BadgeTone } from "@/components/ui/badge"
import type { OrderStatus } from "@/types/cart"
import type { ProductType } from "@/types/product"

// Fonte única para status de pedido → antes reimplementado de forma
// independente em admin/page.tsx (getOrderStatusBadge) e OrdersTab.tsx.
//
// Nota: @/types/order.ts declara um segundo `OrderStatus` com valores
// diferentes (preparing/ready/out_for_delivery/delivered) que não
// correspondem aos status realmente gravados no Firestore pelo checkout
// (CartSidebar grava "pending", que pertence a este enum, o de @/types/cart).
// Este mapa segue os valores reais em uso; o tipo em @/types/order.ts
// está desalinhado e é candidato a limpeza futura.
export const ORDER_STATUS_META: Record<OrderStatus, { label: string; tone: BadgeTone }> = {
  pending: { label: "Pendente", tone: "warning" },
  processing: { label: "Preparando", tone: "info" },
  delivering: { label: "Enviado", tone: "brand" },
  completed: { label: "Entregue", tone: "success" },
  cancelled: { label: "Cancelado", tone: "danger" },
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
export const PRODUCT_TYPE_META: Record<ProductType, { label: string; tone: BadgeTone }> = {
  BASE_CONTAINER: { label: "Base", tone: "brand" },
  STANDARD_ITEM: { label: "Item", tone: "neutral" },
  FILLER: { label: "Preench.", tone: "info" },
  ACCESSORY: { label: "Acess.", tone: "warning" },
  WRAPPER: { label: "Saco", tone: "accent" },
  RIBBON: { label: "Laço", tone: "pink" },
  ASSEMBLED_KIT: { label: "Kit Montado", tone: "teal" },
}

export function ProductTypeBadge({ type }: { type: ProductType }) {
  const meta = PRODUCT_TYPE_META[type]
  if (!meta) return <Badge tone="neutral">{type}</Badge>
  return <Badge tone={meta.tone}>{meta.label}</Badge>
}
