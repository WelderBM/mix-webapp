"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Order, OrderStatus } from "@/lib/types";
import {
  User,
  MapPin,
  CreditCard,
  Box,
  Truck,
  Clock,
  CheckCircle,
  XCircle,
  Bike,
  Package,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface OrderDetailsSheetProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (id: string, status: OrderStatus) => void;
  onCopyDelivery: (order: Order) => void;
}

export function OrderDetailsSheet({
  order,
  isOpen,
  onClose,
  onStatusChange,
  onCopyDelivery,
}: OrderDetailsSheetProps) {
  if (!order) return null;

  const formatMoney = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "processing":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "delivering":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  const getStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return "Pendente";
      case "processing":
        return "Em Separação";
      case "delivering":
        return "Em Trânsito";
      case "completed":
        return "Concluído";
      case "cancelled":
        return "Cancelado";
      default:
        return status;
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-xl w-full p-0 flex flex-col bg-slate-50 h-full">
        {" "}
        {/* h-full aqui */}
        <SheetHeader className="p-6 bg-white border-b shadow-sm space-y-0 text-left flex-shrink-0">
          <div className="flex items-start justify-between mb-2">
            <div>
              <SheetTitle className="text-2xl font-bold text-slate-800">
                Pedido #{order.id.slice(0, 5).toUpperCase()}
              </SheetTitle>
              <SheetDescription className="hidden">
                Detalhes do pedido
              </SheetDescription>
              <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                <Clock size={14} /> {formatDate(order.createdAt)}
              </p>
            </div>
            <Badge
              className={cn("text-sm px-3 py-1", getStatusColor(order.status))}
            >
              {getStatusLabel(order.status)}
            </Badge>
          </div>
        </SheetHeader>
        {/* CORREÇÃO DE SCROLL AQUI TAMBÉM */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-8">
            <section>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Box size={16} className="text-purple-600" /> Itens para
                Separação
              </h3>
              <div className="space-y-4">
                {order.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"
                  >
                    <div className="flex gap-4">
                      <div className="relative w-16 h-16 bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-slate-100">
                        {item.type === "SIMPLE" ? (
                          <Image
                            src={
                              item.selectedVariant?.imageUrl ||
                              item.product?.imageUrl ||
                              ""
                            }
                            alt=""
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-purple-50 text-purple-600">
                            <Package size={24} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-slate-800 text-base">
                            {item.quantity}x{" "}
                            {item.type === "SIMPLE"
                              ? item.product?.name
                              : item.kitName}
                          </h4>
                          <span className="font-semibold text-slate-900">
                            {item.type === "SIMPLE"
                              ? formatMoney(
                                  (item.selectedVariant?.price ||
                                    item.product?.price ||
                                    0) * item.quantity
                                )
                              : formatMoney(item.kitTotalAmount || 0)}
                          </span>
                        </div>
                        {item.type === "SIMPLE" && item.selectedVariant && (
                          <Badge
                            variant="secondary"
                            className="mt-2 text-xs bg-purple-50 text-purple-700 border-purple-100"
                          >
                            Variação: {item.selectedVariant.name}
                          </Badge>
                        )}
                        {item.type === "CUSTOM_KIT" && item.kitComponents && (
                          <div className="mt-3 bg-slate-50 p-3 rounded-lg border border-dashed border-slate-200 text-sm">
                            <p className="text-xs font-bold text-slate-500 mb-2 uppercase">
                              Conteúdo do Kit:
                            </p>
                            <ul className="space-y-1.5">
                              {item.kitComponents.map((comp, i) => (
                                <li
                                  key={i}
                                  className="flex items-center gap-2 text-slate-700"
                                >
                                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                                  <span>{comp.name}</span>
                                  <span className="text-xs text-slate-400 ml-auto">
                                    ({comp.category})
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <Separator />
            <section className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <User size={16} /> Cliente
                </h3>
                <div className="bg-white p-3 rounded-lg border border-slate-200 text-sm">
                  <p className="font-semibold text-slate-800">
                    {order.customerName || "Cliente não identificado"}
                  </p>
                  <p className="text-slate-500">Comprado via Site</p>
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  {order.deliveryMethod === "delivery" ? (
                    <Truck size={16} />
                  ) : (
                    <Box size={16} />
                  )}{" "}
                  Entrega
                </h3>
                <div
                  className={cn(
                    "p-3 rounded-lg border text-sm",
                    order.deliveryMethod === "delivery"
                      ? "bg-blue-50 border-blue-100 text-blue-900"
                      : "bg-orange-50 border-orange-100 text-orange-900"
                  )}
                >
                  <div className="font-bold mb-1">
                    {order.deliveryMethod === "delivery"
                      ? "Entrega via Motoboy"
                      : "Retirada na Loja"}
                  </div>
                  {order.deliveryMethod === "delivery" && (
                    <p className="leading-snug">{order.address}</p>
                  )}
                </div>
              </div>
            </section>
            <section>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                <CreditCard size={16} /> Financeiro
              </h3>
              <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 mb-1">
                    Método de Pagamento
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {order.paymentMethod}
                    </Badge>
                    <Badge
                      variant={
                        order.paymentTiming === "prepaid"
                          ? "default"
                          : "destructive"
                      }
                    >
                      {order.paymentTiming === "prepaid"
                        ? "Pago Antecipado"
                        : "Pagar na Entrega"}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 mb-1">Valor Total</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {formatMoney(order.total)}
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
        <SheetFooter className="p-6 bg-white border-t flex-col sm:flex-row gap-3 sm:gap-2 flex-shrink-0">
          {order.deliveryMethod === "delivery" && (
            <Button
              variant="outline"
              className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-50"
              onClick={() => onCopyDelivery(order)}
            >
              <Bike className="mr-2 h-4 w-4" /> Copiar p/ Motoboy
            </Button>
          )}
          <div className="flex-1 flex gap-2 w-full sm:w-auto">
            {order.status === "pending" && (
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={() => onStatusChange(order.id, "processing")}
              >
                <Clock className="mr-2 h-4 w-4" /> Separar
              </Button>
            )}
            {order.status === "processing" && (
              <Button
                className="flex-1 bg-purple-600 hover:bg-purple-700"
                onClick={() => onStatusChange(order.id, "delivering")}
              >
                <Truck className="mr-2 h-4 w-4" /> Enviar
              </Button>
            )}
            {order.status === "delivering" && (
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => onStatusChange(order.id, "completed")}
              >
                <CheckCircle className="mr-2 h-4 w-4" /> Concluir
              </Button>
            )}
            {["pending", "processing"].includes(order.status) && (
              <Button
                variant="ghost"
                className="text-red-500 hover:bg-red-50 hover:text-red-600"
                onClick={() => onStatusChange(order.id, "cancelled")}
              >
                <XCircle className="h-5 w-5" />
              </Button>
            )}
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
