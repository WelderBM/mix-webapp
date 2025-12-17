"use client";

import { useKitBuilderStore } from "@/store/kitBuilderStore";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Product } from "@/types"; // Importe os tipos necessários

export const KitFillMeter = () => {
  // CORREÇÃO 1: Acessando a estrutura correta da Store (composition)
  const { composition } = useKitBuilderStore();
  const { baseContainer, internalItems } = composition;

  const { percentage, status, message, colorClass } = useMemo(() => {
    if (!baseContainer || !baseContainer.capacity) {
      return {
        percentage: 0,
        status: "empty",
        message: "Escolha uma base para começar",
        colorClass: "bg-slate-200",
      };
    }

    // CORREÇÃO 2: Tipagem explícita no reduce
    const currentSize = internalItems.reduce(
      (acc: number, item: { product: Product; quantity: number }) => {
        // Se o item não tiver tamanho definido, assumimos 1 slot
        return acc + (item.product.itemSize || 1) * item.quantity;
      },
      0
    );

    const pct = Math.min((currentSize / baseContainer.capacity) * 100, 100);

    let msg = "";
    let color = "";
    let stat = "";

    if (pct === 0) {
      msg = "Sua cesta está vazia. Vamos enchê-la de mimos?";
      color = "bg-slate-300";
      stat = "empty";
    } else if (pct < 50) {
      msg = "Ainda cabe muita coisa! Que tal adicionar chocolates?";
      color = "bg-yellow-400";
      stat = "low";
    } else if (pct < 90) {
      msg = "Está ficando linda! Cabe mais um item especial.";
      color = "bg-green-500";
      stat = "good";
    } else {
      msg = "Perfeita! Sua cesta está super recheada e exuberante.";
      color = "bg-purple-600";
      stat = "full";
    }

    return { percentage: pct, status: stat, message: msg, colorClass: color };
  }, [baseContainer, internalItems]);

  if (!baseContainer) return null;

  return (
    <div className="w-full space-y-2 py-2 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex justify-between text-xs font-medium text-slate-600">
        <span>Ocupação da Cesta</span>
        <span
          className={cn(
            "font-bold",
            status === "full" ? "text-purple-600" : "text-slate-600"
          )}
        >
          {Math.round(percentage)}%
        </span>
      </div>

      <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
        <div
          className={cn(
            "h-full transition-all duration-700 ease-out rounded-r-full",
            colorClass
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <p className="text-xs text-center text-slate-500 italic">💡 {message}</p>
    </div>
  );
};
