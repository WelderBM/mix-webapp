"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Order, OrderStatus } from "@/types/order";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Package,
  Clock,
  CheckCircle2,
  Bike,
  MapPin,
  Search,
  ArrowLeft,
  Store,
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import Link from "next/link";
import { SafeImage } from "@/components/ui/SafeImage";
import { getProductImage } from "@/lib/image-utils";

// Componente para a barra de progresso do status
const StatusTimeline = ({
  status,
  isDelivery,
}: {
  status: OrderStatus;
  isDelivery: boolean;
}) => {
  const steps = [
    { id: "pending", label: "Recebido", icon: Clock },
    { id: "preparing", label: "Preparando", icon: Package },
    {
      id: isDelivery ? "out_for_delivery" : "ready",
      label: isDelivery ? "Saiu p/ Entrega" : "Pronto",
      icon: isDelivery ? Bike : MapPin,
    },
    { id: "delivered", label: "Entregue", icon: CheckCircle2 },
  ];

  // Mapa de progresso: qual índice de 'steps' o status atual representa?
  // Se cancelado, não vamos mostrar nessa timeline ou trataremos diferente.
  const statusMap: Record<string, number> = {
    pending: 0,
    preparing: 1,
    ready: 2,
    out_for_delivery: 2,
    delivered: 3,
    cancelled: -1,
  };

  const currentStepIndex = statusMap[status] ?? 0;
  const isCancelled = status === "cancelled";

  if (isCancelled) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center font-bold border border-red-200">
        Pedido Cancelado
      </div>
    );
  }

  return (
    <div className="relative flex justify-between w-full max-w-sm mx-auto mb-8">
      {/* Barra de fundo */}
      <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -z-10 -translate-y-1/2 rounded-full" />

      {/* Barra de progresso preenchida */}
      <div
        className="absolute top-1/2 left-0 h-1 bg-green-500 -z-10 -translate-y-1/2 rounded-full transition-all duration-500"
        style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
      />

      {steps.map((step, index) => {
        const isActive = index <= currentStepIndex;
        const isCurrent = index === currentStepIndex;
        const Icon = step.icon;

        return (
          <div
            key={step.id}
            className="flex flex-col items-center gap-2 bg-white px-2"
          >
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                isActive
                  ? "bg-green-500 border-green-500 text-white shadow-md scale-110"
                  : "bg-white border-slate-300 text-slate-300"
              )}
            >
              <Icon size={18} />
            </div>
            <span
              className={cn(
                "text-[10px] font-bold uppercase tracking-tight transition-colors",
                isActive ? "text-slate-800" : "text-slate-400"
              )}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Auto-load do ID
  useEffect(() => {
    const savedId = localStorage.getItem("lastOrderId");
    if (savedId) {
      setOrderId(savedId);
      // Busca automática se tiver ID
      fetchOrder(savedId);
    }
  }, []);

  const fetchOrder = (id: string) => {
    if (!id.trim()) return;
    setLoading(true);
    setError("");

    // Usando onSnapshot para atualizações em tempo real!
    const unsub = onSnapshot(
      doc(db, "orders", id),
      (docSnap) => {
        setLoading(false);
        if (docSnap.exists()) {
          const data = docSnap.data() as Order;
          // Adiciona o ID ao objeto, caso não venha no data
          setOrder({ ...data, id: docSnap.id });
        } else {
          setError("Pedido não encontrado.");
          // Se não achou e foi busca automática, limpamos localstorage pra não ficar tentando
          if (localStorage.getItem("lastOrderId") === id) {
            // Opcional: localStorage.removeItem("lastOrderId");
          }
        }
      },
      (err) => {
        console.error(err);
        setLoading(false);
        setError("Erro ao buscar pedido.");
      }
    );

    // Como estamos num useEffect "de facto" aqui, o ideal seria retornar o unsub,
    // mas neste modelo de busca por clique, simplificamos.
    // Em produção real, gerenciaríamos esse listener num useEffect amarrado ao `orderId`.
    return unsub;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderId) {
      fetchOrder(orderId);
      setIsSearching(true);
    }
  };

  const clearTracking = () => {
    setOrder(null);
    setOrderId("");
    localStorage.removeItem("lastOrderId");
    setIsSearching(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-8 px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft size={24} />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-slate-800">Rastrear Pedido</h1>
        </div>

        {/* Search Box (sempre visível se não tiver pedido carregado, ou se quiser mudar) */}
        {!order && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold mb-2">Já fez seu pedido?</h2>
            <p className="text-sm text-slate-500 mb-4">
              Digite o ID do pedido que você recebeu no WhatsApp ou utilize o
              link enviado.
            </p>
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                placeholder="Cole o ID do pedido aqui..."
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="bg-slate-50 font-mono text-sm"
              />
              <Button
                type="submit"
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 w-12 shrink-0 p-0"
              >
                {loading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Search size={18} />
                )}
              </Button>
            </form>
            {error && (
              <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center justify-center">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Order Display */}
        {order && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Status Card */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 overflow-hidden relative">
              {/* ID Badge */}
              <div className="absolute top-4 right-4 bg-slate-100 px-2 py-1 rounded text-[10px] font-mono font-bold text-slate-500">
                #{order.id.slice(0, 8).toUpperCase()}
              </div>

              <div className="mb-8 text-center">
                <h2 className="text-xl font-black text-slate-800 mb-1">
                  Olá, {order.customerName.split(" ")[0]}!
                </h2>
                <p className="text-sm text-slate-500">
                  Acompanhe o status do seu pedido em tempo real.
                </p>
              </div>

              <StatusTimeline
                status={order.status}
                isDelivery={order.deliveryMethod === "delivery"}
              />

              <div className="bg-slate-50 rounded-xl p-4 mt-6 flex justify-between items-center">
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase">
                    Previsão
                  </p>
                  <p className="text-sm font-medium text-slate-700">
                    {order.status === "delivered"
                      ? "Entregue"
                      : order.deliveryMethod === "delivery"
                      ? "Entrega em breve"
                      : "Retirada em breve"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400 font-bold uppercase">
                    Total
                  </p>
                  <p className="text-lg font-black text-green-600">
                    {formatCurrency(order.total)}
                  </p>
                </div>
              </div>
            </div>

            {/* Itens List */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Package size={18} className="text-purple-600" /> Itens do
                Pedido
              </h3>
              <div className="space-y-4">
                {order.items.map((item, idx) => {
                  const imageUrl = getProductImage(
                    item.product?.imageUrl,
                    item.product?.type || "DEFAULT"
                  );
                  return (
                    <div
                      key={idx}
                      className="flex gap-3 items-start border-b border-slate-50 pb-3 last:border-0 last:pb-0"
                    >
                      <div className="relative w-12 h-12 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                        <SafeImage
                          src={imageUrl}
                          name={item.product?.name || "Item"}
                          alt=""
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 line-clamp-2">
                          {item.type === "CUSTOM_BALLOON" && item.balloonDetails
                            ? `${item.balloonDetails.typeName} - ${item.balloonDetails.size}"`
                            : item.type === "CUSTOM_KIT"
                            ? `Kit: ${item.kitName}`
                            : item.product?.name}
                        </p>
                        <div className="flex justify-between items-center mt-1">
                          <p className="text-xs text-slate-500">
                            Qtd: {item.quantity}
                          </p>
                          <p className="text-xs font-bold text-slate-700">
                            {formatCurrency(
                              (item.kitTotalAmount ||
                                item.product?.price ||
                                0) * item.quantity
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Delivery Info */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                {order.deliveryMethod === "delivery" ? (
                  <Bike size={18} className="text-purple-600" />
                ) : (
                  <Store size={18} className="text-purple-600" />
                )}
                {order.deliveryMethod === "delivery" ? "Entrega" : "Retirada"}
              </h3>
              <p className="text-sm text-slate-600">
                {order.deliveryMethod === "delivery"
                  ? order.address
                  : "Retirada na Loja Mix Novidades - Dr. Silvio Botelho."}
              </p>
            </div>

            <Button
              variant="outline"
              onClick={clearTracking}
              className="w-full text-slate-400 hover:text-red-500"
            >
              Não é seu pedido? Rastrear outro
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
