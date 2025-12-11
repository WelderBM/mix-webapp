"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/lib/types";
import { Box } from "lucide-react";
import Image from "next/image";

interface ProductQuickViewProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onAction?: () => void; // A função de adicionar (pode vir do Carrinho ou do Kit)
  actionLabel?: string;
  isFull?: boolean; // Para saber se bloqueia a adição (Capacidade)
  currentUsage?: number;
  maxCapacity?: number;
}

export function ProductQuickView({
  product,
  isOpen,
  onClose,
  onAction,
  actionLabel = "Adicionar",
  isFull = false,
  currentUsage = 0,
  maxCapacity = 0,
}: ProductQuickViewProps) {
  const handleAddToCart = () => {
    if (onAction) {
      onAction();
      onClose();
    }
  };

  const formatMoney = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const itemSize = product.itemSize || 1;
  const futureUsage = currentUsage + itemSize;
  const usagePercentage =
    maxCapacity > 0 ? Math.min((futureUsage / maxCapacity) * 100, 100) : 0;

  // Só mostra barra de capacidade se estivermos no contexto de Kit (maxCapacity > 0)
  const showCapacity = maxCapacity > 0 && product.type === "NATURA_ITEM";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-white rounded-2xl gap-0 border-0 shadow-2xl">
        <div className="grid md:grid-cols-2 h-full">
          <div className="relative h-64 md:h-full bg-slate-100 min-h-[300px]">
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover"
            />
            {product.originalPrice && (
              <Badge className="absolute top-4 left-4 bg-red-500 hover:bg-red-600 border-0">
                Oferta
              </Badge>
            )}
          </div>

          <div className="p-6 flex flex-col h-full">
            <DialogHeader className="mb-4 text-left">
              <Badge
                variant="outline"
                className="w-fit mb-2 text-slate-500 border-slate-200"
              >
                {product.category}
              </Badge>
              <DialogTitle className="text-xl font-bold text-slate-800 leading-tight">
                {product.name}
              </DialogTitle>
              <DialogDescription className="text-slate-500 mt-2">
                {product.description ||
                  "Descrição detalhada do produto, notas olfativas, benefícios e modo de uso."}
              </DialogDescription>
            </DialogHeader>

            {showCapacity && (
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-6">
                <div className="flex items-center gap-2 text-sm text-slate-700 font-semibold mb-2">
                  <Box size={16} className="text-purple-600" />
                  Ocupação na Caixa
                </div>

                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Tamanho: {itemSize} slots</span>
                  <span className={isFull ? "text-red-500 font-bold" : ""}>
                    {isFull
                      ? "Não cabe!"
                      : `${futureUsage} / ${maxCapacity} slots`}
                  </span>
                </div>

                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      isFull ? "bg-red-500" : "bg-purple-600"
                    }`}
                    style={{ width: `${isFull ? 100 : usagePercentage}%` }}
                  />
                </div>
                {isFull && (
                  <p className="text-[10px] text-red-500 mt-1">
                    Você precisará de uma caixa maior ou remover itens.
                  </p>
                )}
              </div>
            )}

            <div className="mt-auto pt-4 border-t flex items-center justify-between gap-4">
              <div>
                {product.originalPrice && (
                  <span className="text-sm text-slate-400 line-through block">
                    {formatMoney(product.originalPrice)}
                  </span>
                )}
                <span className="text-2xl font-bold text-slate-900">
                  {formatMoney(product.price)}
                </span>
                <span className="text-xs text-slate-500 ml-1">
                  /{product.unit}
                </span>
              </div>

              {onAction && (
                <Button
                  onClick={handleAddToCart}
                  disabled={showCapacity && isFull}
                  className="bg-slate-900 hover:bg-slate-800 px-6 font-semibold"
                >
                  {showCapacity && isFull ? "Sem Espaço" : actionLabel}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
