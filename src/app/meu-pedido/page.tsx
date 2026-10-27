"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { doc, getDoc, onSnapshot, Unsubscribe } from "firebase/firestore";
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
  Copy,
  PartyPopper,
  PackageSearch,
} from "lucide-react";
import { toast } from "sonner";
import { GroupInvite } from "@/components/features/GroupInvite";
import { forgetOrder } from "@/lib/orderTracking";
import { formatCurrency, cn } from "@/lib/utils";
import { balloonItemLabel } from "@/lib/balloonFoil";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { SafeImage } from "@/components/ui/SafeImage";
import { getProductImage } from "@/lib/image-utils";
import { getCartItemTotalOrNull } from "@/lib/cart-pricing";

// Componente para a barra de progresso do status
const StatusTimeline = ({
  status,
  isDelivery,
}: {
  status: OrderStatus;
  isDelivery: boolean;
}) => {
  const steps = isDelivery
    ? [
        { id: "pending", label: "Recebido", icon: Clock },
        { id: "preparing", label: "Preparando", icon: Package },
        { id: "ready", label: "Pronto p/ Entrega", icon: MapPin },
        { id: "out_for_delivery", label: "Saiu p/ Entrega", icon: Bike },
        { id: "delivered", label: "Entregue", icon: CheckCircle2 },
      ]
    : [
        { id: "pending", label: "Recebido", icon: Clock },
        { id: "preparing", label: "Preparando", icon: Package },
        { id: "ready", label: "Pronto", icon: MapPin },
        { id: "delivered", label: "Entregue", icon: CheckCircle2 },
      ];

  // Mapa de progresso: qual índice de 'steps' o status atual representa?
  // Se cancelado, não vamos mostrar nessa timeline ou trataremos diferente.
  const statusMap: Record<string, number> = isDelivery
    ? {
        pending: 0,
        preparing: 1,
        ready: 2,
        out_for_delivery: 3,
        delivered: 4,
        cancelled: -1,
      }
    : {
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
    <div className="w-full overflow-x-auto mb-8">
      <div className="relative flex justify-between w-full max-w-sm mx-auto min-w-[360px] px-1">
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
              className="flex flex-col items-center gap-2 bg-white px-2 shrink-0"
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
                  "text-[10px] font-bold uppercase tracking-tight text-center whitespace-nowrap transition-colors",
                  isActive ? "text-slate-800" : "text-slate-400"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

function OrderCode({ id }: { id: string }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(id);
      toast.success("Código copiado!");
    } catch {
      toast.error("Não deu para copiar. Selecione o código e copie.");
    }
  };
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 py-1 pl-3 pr-1">
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase text-slate-500">Código do pedido</p>
        <p className="select-all break-all font-mono text-sm font-bold text-slate-800">{id}</p>
      </div>
      <Button type="button" variant="ghost" onClick={copy} className="h-11 shrink-0 gap-1 text-purple-700">
        <Copy size={16} aria-hidden="true" /> Copiar
      </Button>
    </div>
  );
}

export function TrackOrderContent() {
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const subscriptionRef = useRef<Unsubscribe | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();
  // Acabou de comprar (checkout manda ?novo=1): boas-vindas, código em
  // destaque e, depois de uns segundos, o convite do grupo.
  const isNew = searchParams.get("novo") === "1";

  // Auto-load do ID
  useEffect(() => {
    // Prioridade: URL > LocalStorage
    const urlId = searchParams.get("id");
    const savedId = localStorage.getItem("lastOrderId");

    const idToLoad = urlId || savedId;

    if (idToLoad) {
      setOrderId(idToLoad);
      // Busca automática se tiver ID
      fetchOrder(idToLoad);
    }
  }, [searchParams]);

  const fetchOrder = (id: string) => {
    if (!id.trim()) return;
    setLoading(true);
    setError("");

    // Limpa listener anterior
    if (subscriptionRef.current) {
      subscriptionRef.current();
    }

    // Usando onSnapshot para atualizações em tempo real!
    const unsub = onSnapshot(
      doc(db, "orders", id),
      (docSnap) => {
        setLoading(false);
        if (docSnap.exists()) {
          const data = docSnap.data() as Order;
          // Adiciona o ID ao objeto, caso não venha no data
          setOrder({ ...data, id: docSnap.id });

          // Confirma que o ID é válido e atualiza a URL sem recarregar a página
          // Apenas se o ID na URL for diferente do atual para evitar loops ou redundância
          const currentUrlId = searchParams.get("id");
          if (currentUrlId !== id) {
            const newParams = new URLSearchParams(searchParams.toString());
            newParams.set("id", id);
            router.replace(`/meu-pedido?${newParams.toString()}`, {
              scroll: false,
            });
          }
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

    subscriptionRef.current = unsub;
    return unsub;
  };

  // Cleanup no unmount
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current();
      }
    };
  }, []);

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
    forgetOrder();
    setIsSearching(false);

    // Limpa URL
    router.replace("/meu-pedido");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-8 px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="size-11 rounded-full"
          >
            <Link href="/" aria-label="Voltar para a loja">
              <ArrowLeft size={24} />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-slate-800">Rastrear Pedido</h1>
        </div>

        {/* Search Box (sempre visível se não tiver pedido carregado, ou se quiser mudar) */}
        {!order && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold mb-2">Já fez seu pedido?</h2>
            <p className="text-sm text-slate-500 mb-4">
              Digite o código do pedido que mandamos no seu WhatsApp, ou abra o
              link da mensagem.
            </p>
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                placeholder="Cole o código do pedido aqui..."
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                aria-label="Código do pedido"
                className="h-11 bg-slate-50 font-mono text-sm"
              />
              <Button
                type="submit"
                disabled={loading}
                aria-label="Buscar pedido"
                className="bg-purple-600 hover:bg-purple-700 h-11 w-12 shrink-0 p-0"
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
            {isNew && (
              <div className="rounded-2xl border border-green-200 bg-green-50 p-5 text-center shadow-sm animate-in zoom-in-95 fade-in duration-700 motion-reduce:animate-none">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 animate-bounce motion-reduce:animate-none [animation-iteration-count:2]">
                  <PartyPopper className="text-green-700" size={28} aria-hidden="true" />
                </div>
                <h2 className="text-xl font-black text-green-900">Pedido recebido!</h2>
                <p className="mt-1 text-sm text-green-900">
                  A Mix Novidades vai te chamar no WhatsApp para confirmar. Guarde o código
                  abaixo: é com ele que você acompanha o pedido.
                </p>
                <p className="mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-green-800">
                  <PackageSearch size={16} aria-hidden="true" />
                  Para voltar aqui, toque em &quot;Meu pedido&quot;, ao lado do carrinho.
                </p>
              </div>
            )}
            {/* Status Card */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 overflow-hidden relative">
              <div className="mb-8 text-center">
                <h2 className="text-xl font-black text-slate-800 mb-1">
                  Olá, {order.customerName.split(" ")[0]}!
                </h2>
                <p className="text-sm text-slate-500">
                  Acompanhe o status do seu pedido em tempo real.
                </p>
              </div>

              <div className="mb-6">
                <OrderCode id={order.id} />
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
                    item.selectedVariant?.imageUrl ||
                      item.selectedImageUrl ||
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
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 line-clamp-2">
                          {item.type === "CUSTOM_BALLOON" && item.balloonDetails
                            ? balloonItemLabel(item.balloonDetails)
                            : item.type === "CUSTOM_KIT"
                            ? `Kit: ${item.kitName}`
                            : item.product?.name}
                        </p>
                        <div className="flex justify-between items-center mt-1">
                          <p className="text-xs text-slate-500">
                            Qtd: {item.quantity}
                          </p>
                          <p className="text-xs font-bold text-slate-700">
                            {(() => {
                              const total = getCartItemTotalOrNull(item);
                              return total == null ? "—" : formatCurrency(total);
                            })()}
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
              {order.deliveryMethod === "delivery" &&
                order.addressDetails?.reference != null && (
                  <p className="text-xs text-slate-500 mt-2">
                    <span className="font-bold">Ponto de referência:</span>{" "}
                    {order.addressDetails.reference}
                  </p>
                )}
            </div>

            {order.paymentMethod === "cash" && order.changeFor != null && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                  Troco
                </h3>
                <p className="text-sm text-slate-600">
                  Troco para R$ {order.changeFor}
                </p>
              </div>
            )}

            <Button
              variant="outline"
              onClick={clearTracking}
              className="w-full text-slate-400 hover:text-red-500"
            >
              Não é seu pedido? Rastrear outro
            </Button>
          </div>
        )}
        {order && isNew && <GroupInvite />}
      </div>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense>
      <TrackOrderContent />
    </Suspense>
  );
}
