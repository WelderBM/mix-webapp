"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Order } from "@/ltypes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Check,
  Clock,
  Package,
  Truck,
  MessageCircle,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function OrderTrackingPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) return;
      const docRef = doc(db, "orders", id as string);
      const snap = await getDoc(docRef);
      if (snap.exists()) setOrder({ id: snap.id, ...snap.data() } as Order);
      setLoading(false);
    };
    fetchOrder();
  }, [id]);

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
      </div>
    );
  if (!order)
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <h1 className="font-bold text-xl">Pedido não encontrado 😕</h1>
        <Link href="/">
          <Button variant="outline">Ir para Loja</Button>
        </Link>
      </div>
    );

  // Lógica da Timeline
  const steps = [
    { id: "pending", label: "Recebido", icon: Clock },
    { id: "processing", label: "Separando", icon: Package },
    { id: "delivering", label: "Saiu p/ Entrega", icon: Truck },
    { id: "completed", label: "Entregue", icon: Check },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === order.status);
  const isCancelled = order.status === "cancelled";

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-2"
          >
            <ArrowLeft size={16} /> Voltar
          </Link>
          <span className="text-xs font-mono text-slate-400">
            Pedido #{order.id.slice(0, 6)}
          </span>
        </div>

        {/* CARTÃO PRINCIPAL */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 md:p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-1">
              Acompanhe seu Pedido
            </h1>
            <p className="text-sm text-slate-500">
              Olá, {order.customerName.split(" ")[0]}! Veja o progresso.
            </p>
          </div>

          {/* TIMELINE */}
          {isCancelled ? (
            <div className="bg-red-50 p-4 rounded-xl text-center text-red-600 font-bold border border-red-100 mb-8">
              🚫 Pedido Cancelado
            </div>
          ) : (
            <div className="relative flex justify-between mb-10 px-2">
              {/* Linha de Fundo */}
              <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -z-10 -translate-y-1/2" />
              {/* Linha de Progresso */}
              <div
                className="absolute top-1/2 left-0 h-1 bg-green-500 -z-10 -translate-y-1/2 transition-all duration-1000"
                style={{
                  width: `${(currentStepIndex / (steps.length - 1)) * 100}%`,
                }}
              />

              {steps.map((step, index) => {
                const isActive = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;
                return (
                  <div
                    key={step.id}
                    className="flex flex-col items-center gap-2 bg-white px-2"
                  >
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500",
                        isActive
                          ? "bg-green-500 border-green-500 text-white"
                          : "bg-white border-slate-200 text-slate-300",
                        isCurrent && "ring-4 ring-green-100 scale-110"
                      )}
                    >
                      <step.icon size={18} />
                    </div>
                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-wide",
                        isActive ? "text-green-600" : "text-slate-300"
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* ITENS */}
          <div className="border-t pt-6 space-y-4">
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
              Itens do Pedido
            </h3>
            {order.items.map((item, i) => (
              <div
                key={i}
                className="flex justify-between items-center text-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-slate-100 px-2 py-1 rounded text-xs font-bold text-slate-600">
                    {item.quantity}x
                  </div>
                  <span className="text-slate-700">
                    {item.kitName || item.product?.name || "Item sem nome"}
                  </span>
                </div>
                <span className="font-mono text-slate-500">
                  R${" "}
                  {(
                    (item.kitTotalAmount || item.product?.price || 0) *
                    item.quantity
                  ).toFixed(2)}
                </span>
              </div>
            ))}
            <div className="flex justify-between items-center pt-4 border-t mt-4">
              <span className="font-bold text-slate-800">Total</span>
              <span className="font-bold text-xl text-green-600">
                R$ {order.total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* AJUDA */}
        <div className="text-center">
          <Link href="https://wa.me/5595991111111" target="_blank">
            <Button
              variant="outline"
              className="gap-2 text-slate-500 hover:text-green-600"
            >
              <MessageCircle size={16} /> Precisa de ajuda? Fale conosco
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
