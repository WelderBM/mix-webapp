"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Product, ProductVariant } from "@/lib/types";
import { Box, Check } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ProductQuickViewProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onAction?: (variant?: ProductVariant) => void;
  actionLabel?: string;
  isFull?: boolean;
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
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    null
  );

  useEffect(() => {
    if (isOpen) setSelectedVariant(null);
  }, [isOpen, product]);

  const hasVariants = product.variants && product.variants.length > 0;

  const handleAddToCart = () => {
    if (onAction) {
      if (hasVariants && !selectedVariant) return;
      onAction(selectedVariant || undefined);
      onClose();
    }
  };

  const formatMoney = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const activeImage = selectedVariant?.imageUrl || product.imageUrl;
  const activePrice = selectedVariant?.price || product.price;
  const itemSize = product.itemSize || 1;
  const futureUsage = currentUsage + itemSize;
  const usagePercentage =
    maxCapacity > 0 ? Math.min((futureUsage / maxCapacity) * 100, 100) : 0;
  const showCapacity = maxCapacity > 0 && product.type === "STANDARD_ITEM";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden bg-white rounded-2xl gap-0 border-0 shadow-2xl">
        <div className="grid md:grid-cols-2 h-full">
          <div className="relative h-64 md:h-full bg-slate-50 min-h-[300px] transition-all duration-300">
            <Image
              src={activeImage}
              alt={product.name}
              fill
              className="object-contain p-4"
            />
            {product.originalPrice && (
              <Badge className="absolute top-4 left-4 bg-red-500 hover:bg-red-600 border-0">
                Oferta
              </Badge>
            )}
          </div>

          <div className="p-6 flex flex-col h-full max-h-[80vh] overflow-y-auto">
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
              {selectedVariant && (
                <p className="text-purple-600 font-medium text-sm mt-1">
                  Selecionado: {selectedVariant.name}
                </p>
              )}
            </DialogHeader>

            {hasVariants && (
              <div className="mb-6 space-y-3">
                <span className="text-sm font-semibold text-slate-700">
                  Escolha a opção:
                </span>
                <div className="flex flex-wrap gap-2">
                  {product.variants?.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      className={cn(
                        "px-3 py-2 rounded-lg text-xs font-medium border transition-all flex items-center gap-2",
                        selectedVariant?.id === variant.id
                          ? "border-purple-600 bg-purple-50 text-purple-700 ring-1 ring-purple-600"
                          : "border-slate-200 bg-white text-slate-600 hover:border-purple-300"
                      )}
                    >
                      {variant.name}
                      {selectedVariant?.id === variant.id && (
                        <Check size={12} />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {showCapacity && (
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-6">
                <div className="flex items-center gap-2 text-sm text-slate-700 font-semibold mb-2">
                  <Box size={16} className="text-purple-600" /> Ocupação na
                  Caixa
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
                  {formatMoney(activePrice)}
                </span>
              </div>
              {onAction && (
                <Button
                  onClick={handleAddToCart}
                  disabled={(hasVariants && !selectedVariant) || isFull}
                  className={cn(
                    "px-6 font-bold transition-all",
                    hasVariants && !selectedVariant
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                      : "bg-slate-900 hover:bg-slate-800 text-white"
                  )}
                >
                  {isFull
                    ? "Sem Espaço"
                    : hasVariants && !selectedVariant
                    ? "Escolha uma opção"
                    : actionLabel}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
