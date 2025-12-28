"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Order, OrderStatus } from "@/types/order";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Loader2,
  ChevronDown,
  ChevronUp,
  MapPin,
  Phone,
  User,
  CreditCard,
  Banknote,
  Truck,
  Store,
  Copy,
  Clock,
  CheckCircle2,
  XCircle,
  Package,
  MessageCircle,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

export function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>(
    {}
  );

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ords: Order[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Order[];
      setOrders(ords);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const toggleExpand = (orderId: string) => {
    setExpandedOrders((prev) => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const updateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateDoc(doc(db, "orders", orderId), { status: newStatus });
      toast.success("Status atualizado!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao atualizar status");
    }
  };

  const copyDeliveryInfo = (order: Order) => {
    const text = `🛵 *ENTREGA MOTO TÁXI*
    
👤 *Cliente:* ${order.customerName}
📞 *Contato:* ${order.customerPhone}
📍 *Endereço:* ${order.address || "N/A"}
💰 *Valor:* ${formatCurrency(order.total)}
💳 *Pagamento:* ${
      order.paymentMethod === "pix"
        ? "PIX"
        : order.paymentMethod === "cash"
        ? "Dinheiro"
        : "Cartão"
    }

*Retirar em:* Loja Natura/Papelaria`;
    navigator.clipboard.writeText(text);
    toast.success("Texto de entrega copiado!");
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
            Pendente
          </Badge>
        );
      case "preparing":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
            Preparando
          </Badge>
        );
      case "ready":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
            Pronto
          </Badge>
        );
      case "out_for_delivery":
        return (
          <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">
            Saiu p/ Entrega
          </Badge>
        );
      case "delivered":
        return (
          <Badge className="bg-slate-100 text-slate-800 hover:bg-slate-200">
            Entregue
          </Badge>
        );
      case "cancelled":
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentIcon = (method: string) => {
    if (method === "pix")
      return (
        <div className="flex items-center gap-1 text-green-600">
          <span className="font-bold text-xs">PIX</span>
        </div>
      );
    if (method === "cash")
      return <Banknote size={14} className="text-green-600" />;
    return <CreditCard size={14} className="text-blue-600" />;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Pedidos</h2>
        <Badge variant="secondary" className="text-sm">
          {orders.length} pedidos encontrados
        </Badge>
      </div>

      <div className="border rounded-xl bg-white shadow-sm overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead>Total</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <>
                <TableRow
                  key={order.id}
                  className="cursor-pointer hover:bg-slate-50"
                  onClick={() => toggleExpand(order.id)}
                >
                  <TableCell>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      {expandedOrders[order.id] ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="font-medium text-xs">
                    <div className="flex flex-col">
                      <span className="font-bold">
                        {formatDate(order.createdAt)}
                      </span>
                      <span className="text-slate-500">
                        {formatTime(order.createdAt)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800">
                        {order.customerName}
                      </span>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500">
                        <Phone size={10} />
                        {order.customerPhone || "N/A"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div onClick={(e) => e.stopPropagation()}>
                      <Select
                        defaultValue={order.status}
                        onValueChange={(v) =>
                          updateStatus(order.id, v as OrderStatus)
                        }
                      >
                        <SelectTrigger className="h-7 w-[130px] text-xs border-none shadow-none bg-transparent p-0 focus:ring-0">
                          {getStatusBadge(order.status)}
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="preparing">Preparando</SelectItem>
                          <SelectItem value="ready">Pronto</SelectItem>
                          <SelectItem value="out_for_delivery">
                            Em Rota
                          </SelectItem>
                          <SelectItem value="delivered">Entregue</SelectItem>
                          <SelectItem value="cancelled">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-xs font-medium">
                        {getPaymentIcon(order.paymentMethod)}
                        <span className="uppercase">
                          {order.paymentMethod === "credit_card"
                            ? "Crédito"
                            : order.paymentMethod === "debit_card"
                            ? "Débito"
                            : order.paymentMethod === "cash"
                            ? "Dinheiro"
                            : "PIX"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500">
                        {order.deliveryMethod === "delivery" ? (
                          <Truck size={10} />
                        ) : (
                          <Store size={10} />
                        )}
                        {order.deliveryMethod === "delivery"
                          ? "Entrega"
                          : "Retirada"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-bold text-green-700">
                    {formatCurrency(order.total)}
                  </TableCell>
                  <TableCell className="text-right">
                    {order.deliveryMethod === "delivery" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyDeliveryInfo(order);
                        }}
                      >
                        <Copy size={12} />
                        Info Moto
                      </Button>
                    )}
                  </TableCell>
                </TableRow>

                {/* Expanded Details */}
                {expandedOrders[order.id] && (
                  <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                    <TableCell colSpan={7} className="p-0">
                      <div className="p-4 border-b">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Items List */}
                          <div className="space-y-3">
                            <h4 className="text-sm font-bold flex items-center gap-2 text-slate-700">
                              <Package size={16} /> Itens do Pedido
                            </h4>
                            <div className="space-y-2">
                              {order.items.map((item: any, idx) => {
                                // Calcular subtotal se possível ou estimar
                                const estimatedTotal =
                                  item.kitTotalAmount ||
                                  (item.product?.price || 0) * item.quantity;
                                return (
                                  <div
                                    key={idx}
                                    className="flex justify-between items-start text-sm border-b border-slate-100 pb-2 last:border-0 text-slate-700"
                                  >
                                    <div>
                                      <span className="font-medium text-slate-800">
                                        {item.quantity}x{" "}
                                        {item.product?.name ||
                                          item.kitName ||
                                          "Produto"}
                                      </span>
                                      {/* Detalhes extras se houver (Balloon config, etc) */}
                                      {item.type === "CUSTOM_BALLOON" &&
                                        item.balloonDetails && (
                                          <p className="text-xs text-slate-500">
                                            {item.balloonDetails.typeName} -{" "}
                                            {item.balloonDetails.size}" (
                                            {item.balloonDetails.color})
                                          </p>
                                        )}
                                    </div>
                                    <span className="font-semibold text-slate-600">
                                      {formatCurrency(estimatedTotal)}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Delivery & Customer Info */}
                          <div className="space-y-3">
                            <h4 className="text-sm font-bold flex items-center gap-2 text-slate-700">
                              <MapPin size={16} /> Endereço de Entrega
                            </h4>
                            <div className="bg-white p-3 rounded-lg border border-slate-200 text-sm">
                              {order.deliveryMethod === "delivery" ? (
                                <p className="text-slate-700 leading-relaxed">
                                  {order.address}
                                </p>
                              ) : (
                                <p className="text-slate-500 italic">
                                  Retirada na Loja
                                </p>
                              )}
                            </div>
                            <div className="pt-2">
                              <Button
                                variant="secondary"
                                className="w-full gap-2"
                                onClick={() => {
                                  const text = `Olá ${
                                    order.customerName
                                  }, tudo bem? Sobre seu pedido *#${order.id.slice(
                                    0,
                                    5
                                  )}*...`;
                                  window.open(
                                    `https://wa.me/55${order.customerPhone?.replace(
                                      /\D/g,
                                      ""
                                    )}?text=${encodeURIComponent(text)}`,
                                    "_blank"
                                  );
                                }}
                              >
                                <MessageCircle
                                  size={16}
                                  className="text-green-600"
                                />
                                Falar com Cliente no WhatsApp
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
