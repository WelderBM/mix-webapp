"use client";

import { useState } from "react";
import { Product } from "@/lib/types";
import { Plus, Eye, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { ProductQuickView } from "./ProductQuickView";
import { cn } from "@/lib/utils";
import { useKitStore } from "@/store/kitStore";

interface ProductCardProps {
  product: Product;
  isSelected?: boolean;
  onSelect?: () => void;
  actionLabel?: string;
  disabled?: boolean;
}

export function ProductCard({
  product,
  isSelected,
  onSelect,
  actionLabel,
  disabled,
}: ProductCardProps) {
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  // Acessamos a store apenas para verificar capacidade (se estiver no modo kit)
  const { currentCapacityUsage, selectedBase } = useKitStore();

  const formatPrice = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const handleCardClick = () => {
    setIsQuickViewOpen(true);
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Impede que abra o modal ao clicar no botão
    if (onSelect && !disabled) {
      onSelect();
    }
  };

  const maxCapacity = selectedBase?.capacity || 0;
  const itemSize = product.itemSize || 1;
  // Verifica se está cheio APENAS se estivermos num contexto de kit (tem base selecionada e é item de recheio)
  const isFull =
    currentCapacityUsage + itemSize > maxCapacity &&
    product.type === "STANDARD_ITEM" &&
    !!selectedBase;

  return (
    <>
      <div
        className={cn(
          "group relative bg-white rounded-xl shadow-sm border transition-all overflow-hidden flex flex-col h-full",
          isSelected
            ? "border-purple-600 bg-purple-50 ring-1 ring-purple-600 shadow-md"
            : "border-slate-100 hover:shadow-md hover:border-slate-200",
          disabled && "opacity-60 grayscale cursor-not-allowed"
        )}
        onClick={!disabled ? handleCardClick : undefined}
      >
        {isSelected && (
          <div className="absolute top-2 right-2 bg-purple-600 text-white rounded-full p-1 z-20 shadow-sm animate-in zoom-in">
            <Check size={14} />
          </div>
        )}

        <div className="relative aspect-square w-full bg-slate-100 overflow-hidden cursor-pointer">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {product.originalPrice && !isSelected && (
            <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full z-10">
              OFERTA
            </span>
          )}

          <div className="absolute top-2 right-2 bg-white/90 text-slate-700 p-2 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 z-10">
            <Eye size={16} />
          </div>
        </div>

        <div className="p-3 flex flex-col flex-1 gap-2">
          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider truncate">
            {product.category}
          </div>

          <h3
            className={cn(
              "font-medium text-sm line-clamp-2 min-h-[2.5rem] transition-colors",
              isSelected
                ? "text-purple-900 font-semibold"
                : "text-slate-800 group-hover:text-purple-600"
            )}
          >
            {product.name}
          </h3>

          <div className="mt-auto pt-1">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <div className="flex items-end gap-1">
                <span
                  className={cn(
                    "text-lg font-bold",
                    isSelected ? "text-purple-700" : "text-slate-900"
                  )}
                >
                  {formatPrice(product.price)}
                </span>
                <span className="text-xs text-slate-500 mb-1">
                  /{product.unit}
                </span>
              </div>
            </div>
          </div>

          <Button
            variant={isSelected ? "default" : "outline"}
            size="sm"
            disabled={disabled}
            className={cn(
              "w-full mt-2 gap-2 shadow-none transition-all z-20 relative",
              isSelected
                ? "bg-purple-600 hover:bg-purple-700 text-white border-transparent"
                : "bg-white hover:bg-slate-50 text-slate-900 border-slate-200"
            )}
            onClick={handleButtonClick}
          >
            {isSelected ? (
              <>
                {" "}
                <Check size={14} /> Selecionado{" "}
              </>
            ) : (
              <>
                {" "}
                <Plus size={14} /> {actionLabel || "Adicionar"}{" "}
              </>
            )}
          </Button>
        </div>
      </div>

      <ProductQuickView
        product={product}
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
        onAction={onSelect}
        actionLabel={actionLabel}
        isFull={isFull}
        currentUsage={currentCapacityUsage}
        maxCapacity={maxCapacity}
      />
    </>
  );
}
