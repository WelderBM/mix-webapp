"use client";

import { useState } from "react";
import { Product } from "@/lib/types";
import { Plus, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { ProductQuickView } from "./ProductQuickView";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  const formatPrice = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  return (
    <>
      <div className="group relative bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all overflow-hidden flex flex-col h-full">
        <div className="relative aspect-square w-full bg-slate-100 overflow-hidden">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {product.originalPrice && (
            <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full z-10">
              OFERTA
            </span>
          )}

          <button
            onClick={() => setIsQuickViewOpen(true)}
            className="absolute top-2 right-2 bg-white/90 hover:bg-white text-slate-700 p-2 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-2 group-hover:translate-y-0"
            title="Ver detalhes"
          >
            <Eye size={16} />
          </button>
        </div>

        <div className="p-4 flex flex-col flex-1 gap-2">
          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
            {product.category}
          </div>

          <h3
            className="font-medium text-slate-800 line-clamp-2 min-h-[2.5rem] cursor-pointer hover:text-purple-600 transition-colors"
            onClick={() => setIsQuickViewOpen(true)}
          >
            {product.name}
          </h3>

          <div className="mt-auto pt-2">
            {product.originalPrice && (
              <span className="text-xs text-slate-400 line-through block">
                {formatPrice(product.originalPrice)}
              </span>
            )}
            <div className="flex items-end gap-1 flex-wrap">
              <span className="text-lg font-bold text-slate-900">
                {formatPrice(product.price)}
              </span>
              <span className="text-xs text-slate-500 mb-1">
                /{product.unit}
              </span>
            </div>
          </div>

          <Button
            className="w-full mt-3 gap-2 bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200 shadow-sm"
            onClick={() => setIsQuickViewOpen(true)}
          >
            <Plus size={16} />
            Ver Detalhes
          </Button>
        </div>
      </div>

      <ProductQuickView
        product={product}
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
      />
    </>
  );
}
