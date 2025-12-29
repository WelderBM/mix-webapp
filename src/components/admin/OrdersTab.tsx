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

  // Filtros e Paginação
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

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
    const text = `🛵 *PEDIDO DE ENTREGA - MIX NOVIDADES*
    
📍 *RETIRADA (Nossa Loja):*
Rua Pedro Aldemar Bantim, 945
Bairro Doutor Sílvio Botelho

⬇️ *LEVAR PARA (Cliente):*
👤 ${order.customerName}
📍 ${order.address || "Endereço não informado"}
📞 ${order.customerPhone}

💰 *VALORES:*
Valor do Pedido: ${formatCurrency(order.total)}
Forma de Pagto: ${
      order.paymentMethod === "pix"
        ? "PIX (Já pago)"
        : order.paymentMethod === "cash"
        ? "Dinheiro (Cobrar)"
        : "Cartão (Levar Maquininha)"
    }

⚠️ *Obs:* Cuidado com os produtos frágeis!`;
    navigator.clipboard.writeText(text);
    toast.success("Texto copiado! Pronto para enviar.");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-red-100 text-red-700 border-red-200 hover:bg-red-200";
      case "preparing":
        return "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200";
      case "ready":
        return "bg-green-100 text-green-700 border-green-200 hover:bg-green-200";
      case "out_for_delivery":
        return "bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200";
      case "delivered":
        return "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200";
      case "cancelled":
        return "bg-gray-100 text-gray-500 border-gray-200 decoration-line-through";
      default:
        return "bg-white border-slate-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendente";
      case "preparing":
        return "Preparando";
      case "ready":
        return "Pronto";
      case "out_for_delivery":
        return "Em Rota";
      case "delivered":
        return "Entregue";
      case "cancelled":
        return "Cancelado";
      default:
        return status;
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

  // --- LÓGICA DE FILTRO E PAGINAÇÃO ---
  const filteredOrders = orders.filter((order) => {
    if (statusFilter === "all") return true;
    return order.status === statusFilter;
  });

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Resetar página quando mudar filtro
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  const FilterButton = ({
    label,
    value,
    count,
  }: {
    label: string;
    value: string;
    count?: number;
  }) => (
    <button
      onClick={() => setStatusFilter(value)}
      className={cn(
        "px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border",
        statusFilter === value
          ? "bg-slate-800 text-white border-slate-800"
          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
      )}
    >
      {label} {count !== undefined && `(${count})`}
    </button>
  );

  return (
    <div className="space-y-6">
      {/* HEADER & FILTROS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Pedidos</h2>
          <Badge variant="secondary" className="text-sm">
            Total: {orders.length}
          </Badge>
        </div>

        {/* Navigation / Filters Scrollable */}
        {/* Navigation / Filters Scrollable - Native Scroll for Mobile Touch Fix */}
        <div className="w-full overflow-x-auto pb-2 touch-pan-x">
          <div className="flex gap-2 min-w-max px-1">
            <FilterButton label="Todos" value="all" count={orders.length} />
            <FilterButton
              label="Pendentes"
              value="pending"
              count={orders.filter((o) => o.status === "pending").length}
            />
            <FilterButton
              label="Preparando"
              value="preparing"
              count={orders.filter((o) => o.status === "preparing").length}
            />
            <FilterButton
              label="Pronto p/ Entrega"
              value="ready"
              count={orders.filter((o) => o.status === "ready").length}
            />
            <FilterButton
              label="Saiu p/ Entrega"
              value="out_for_delivery"
              count={
                orders.filter((o) => o.status === "out_for_delivery").length
              }
            />
            <FilterButton
              label="Entregues"
              value="delivered"
              count={orders.filter((o) => o.status === "delivered").length}
            />
          </div>
        </div>
      </div>

      {/* DESKTOP VIEW (Table) */}
      <div className="hidden md:block border rounded-xl bg-white shadow-sm overflow-hidden">
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
            {paginatedOrders.map((order) => (
              <>
                <TableRow
                  key={order.id}
                  className="cursor-pointer hover:bg-slate-50 transition-colors"
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
                      <span className="font-bold" suppressHydrationWarning>
                        {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                      </span>
                      <span
                        suppressHydrationWarning
                        className="text-[10px] text-slate-500"
                      >
                        {new Date(order.createdAt).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
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
                        <SelectTrigger
                          className={cn(
                            "h-7 w-[140px] text-xs font-bold border rounded-md shadow-sm focus:ring-0 transition-colors pl-3 pr-4",
                            getStatusColor(order.status)
                          )}
                        >
                          <SelectValue>
                            {getStatusLabel(order.status)}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="preparing">Preparando</SelectItem>
                          <SelectItem value="ready">Pronto</SelectItem>
                          <SelectItem value="out_for_delivery">
                            Saiu p/ Entrega
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
                        <Copy size={12} /> Moto
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
                {expandedOrders[order.id] && (
                  <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                    <TableCell colSpan={7} className="p-0">
                      <div className="p-4 border-b">
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <h4 className="text-sm font-bold flex items-center gap-2 text-slate-700">
                              <Package size={16} /> Itens
                            </h4>
                            <div className="space-y-2">
                              {order.items.map((item: any, idx) => (
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
                                    {item.type === "CUSTOM_BALLOON" &&
                                      item.balloonDetails && (
                                        <p className="text-xs text-slate-500">
                                          {item.balloonDetails.typeName} -{" "}
                                          {item.balloonDetails.size}"
                                        </p>
                                      )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-3">
                            <h4 className="text-sm font-bold flex items-center gap-2 text-slate-700">
                              <MapPin size={16} /> Entrega
                            </h4>
                            <p className="text-sm text-slate-700 bg-white p-3 rounded border">
                              {order.deliveryMethod === "delivery"
                                ? order.address
                                : "Retirada na Loja"}
                            </p>
                            <Button
                              variant="secondary"
                              className="w-full gap-2 text-xs"
                              onClick={() => {
                                const text = `Olá ${
                                  order.customerName
                                }, sobre seu pedido #${order.id.slice(
                                  0,
                                  5
                                )}...`;
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
                                size={14}
                                className="text-green-600"
                              />{" "}
                              WhatsApp Cliente
                            </Button>
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

      {/* MOBILE VIEW (Cards) */}
      <div className="md:hidden space-y-4">
        {paginatedOrders.map((order) => (
          <div
            key={order.id}
            className="bg-white border rounded-xl shadow-sm overflow-hidden"
          >
            {/* Header do Card */}
            <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
              <div className="flex flex-col">
                <span className="font-bold text-sm">{order.customerName}</span>
                <span
                  className="text-xs text-slate-500 flex items-center gap-1"
                  suppressHydrationWarning
                >
                  <Clock size={10} />
                  {(() => {
                    const diff =
                      Date.now() - (new Date(order.createdAt).getTime() || 0);
                    const mins = Math.floor(diff / 60000);
                    if (mins < 60) return `${mins} min atrás`;
                    const hours = Math.floor(mins / 60);
                    if (hours < 24) return `${hours}h atrás`;
                    return new Date(order.createdAt).toLocaleDateString(
                      "pt-BR"
                    );
                  })()}
                </span>
              </div>
              <div>
                <Select
                  defaultValue={order.status}
                  onValueChange={(v) =>
                    updateStatus(order.id, v as OrderStatus)
                  }
                >
                  <SelectTrigger
                    className={cn(
                      "h-8 w-[140px] text-xs font-bold border rounded-md shadow-sm pl-3 pr-4",
                      getStatusColor(order.status)
                    )}
                  >
                    <SelectValue>{getStatusLabel(order.status)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="preparing">Preparando</SelectItem>
                    <SelectItem value="ready">Pronto p/ Entrega</SelectItem>
                    <SelectItem value="out_for_delivery">Em Rota</SelectItem>
                    <SelectItem value="delivered">Entregue</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Corpo do Card */}
            <div
              className="p-4 space-y-3"
              onClick={() => toggleExpand(order.id)}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="bg-slate-100 p-2 rounded-lg text-green-600">
                    {getPaymentIcon(order.paymentMethod)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase">
                      {order.paymentMethod === "pix"
                        ? "PIX"
                        : order.paymentMethod === "cash"
                        ? "Dinheiro"
                        : "Cartão"}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {order.deliveryMethod === "delivery"
                        ? "Entrega"
                        : "Retirada"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Total</p>
                  <p className="text-lg font-bold text-green-700">
                    {formatCurrency(order.total)}
                  </p>
                </div>
              </div>

              {/* Área Expandida Mobile */}
              {expandedOrders[order.id] && (
                <div className="pt-3 border-t mt-3 animate-in slide-in-from-top-2">
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                        Itens
                      </h4>
                      {order.items.map((item: any, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between text-sm py-1 border-b border-dashed border-slate-100 last:border-0"
                        >
                          <span className="text-slate-700">
                            {item.quantity}x{" "}
                            {item.product?.name || item.kitName}
                          </span>
                        </div>
                      ))}
                    </div>

                    {order.deliveryMethod === "delivery" && (
                      <div className="bg-slate-50 p-3 rounded border text-xs text-slate-600">
                        <p className="font-bold mb-1">📍 Endereço Entrega:</p>
                        {order.address}
                      </div>
                    )}

                    {/* BOTÕES LADO A LADO - OCUPANDO 100% */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      {order.deliveryMethod === "delivery" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full gap-2 bg-white border-slate-300 text-slate-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyDeliveryInfo(order);
                          }}
                        >
                          <Copy size={14} /> Copiar Info
                        </Button>
                      ) : (
                        // Placeholder vazio caso não seja entrega, ou botão alternativo
                        <div className="hidden"></div>
                      )}

                      <Button
                        className={cn(
                          "w-full gap-2",
                          order.deliveryMethod !== "delivery"
                            ? "col-span-2"
                            : ""
                        )}
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          const text = `Olá ${
                            order.customerName
                          }, sobre seu pedido #${order.id.slice(0, 5)}...`;
                          window.open(
                            `https://wa.me/55${order.customerPhone?.replace(
                              /\D/g,
                              ""
                            )}?text=${encodeURIComponent(text)}`,
                            "_blank"
                          );
                        }}
                      >
                        <MessageCircle size={16} className="text-green-600" />{" "}
                        WhatsApp
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {!expandedOrders[order.id] && (
              <div
                className="bg-slate-50 p-2 text-center"
                onClick={() => toggleExpand(order.id)}
              >
                <ChevronDown className="mx-auto text-slate-400" size={16} />
              </div>
            )}
          </div>
        ))}

        {paginatedOrders.length === 0 && (
          <div className="text-center py-10 text-slate-500">
            Nenhum pedido encontrado com este filtro.
          </div>
        )}
      </div>

      {/* PAGINATION CONTROLS */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 py-6">
          <Button
            variant="outline"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            Anterior
          </Button>
          <span className="text-sm font-medium text-slate-600">
            Pág {currentPage} de {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            Próximo
          </Button>
        </div>
      )}
    </div>
  );
}
