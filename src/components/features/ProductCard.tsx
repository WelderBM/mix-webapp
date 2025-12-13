"use client";

import { Product } from "@/lib/types";
import { useCartStore } from "@/store/cartStore";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ProductQuickView } from "./ProductQuickView"; // Importando o modal novo

interface ProductCardProps {
  product: Product;
  onSelect?: () => void;
  actionLabel?: string;
}

export function ProductCard({
  product,
  onSelect,
  actionLabel = "Adicionar",
}: ProductCardProps) {
  const { items, addItem, removeItem, updateQuantity } = useCartStore();
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  // Verifica se já está no carrinho
  const cartItem = items.find((i) => i.product?.id === product.id);
  const quantity = cartItem ? cartItem.quantity : 0;

  // Lógica de Adicionar/Remover
  const handleUpdate = (e: React.MouseEvent, delta: number) => {
    e.stopPropagation(); // Não abrir o modal

    if (onSelect) {
      onSelect();
      return;
    }

    if (quantity + delta <= 0) {
      if (cartItem) removeItem(cartItem.cartId);
    } else {
      if (cartItem) {
        updateQuantity(cartItem.cartId, quantity + delta);
      } else {
        addItem({
          cartId: crypto.randomUUID(),
          type: "SIMPLE",
          quantity: 1,
          product: product,
        });
        // Removi o openCart() daqui como você pediu
      }
    }
  };

  return (
    <>
      <div
        onClick={() => setIsQuickViewOpen(true)}
        className="group bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col h-full overflow-hidden relative cursor-pointer"
      >
        <div className="relative w-full aspect-square bg-slate-50 overflow-hidden">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-300 bg-slate-50">
              <ShoppingCart size={24} opacity={0.2} />
            </div>
          )}
          {!product.inStock && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10">
              <span className="bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded uppercase shadow-sm">
                Esgotado
              </span>
            </div>
          )}
        </div>

        <div className="p-3 flex flex-col flex-1">
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-1 line-clamp-1">
            {product.category}
          </span>
          <h3 className="font-semibold text-slate-800 text-sm leading-tight line-clamp-2 mb-2 group-hover:text-purple-700 transition-colors">
            {product.name}
          </h3>

          <div className="mt-auto pt-2 flex items-center justify-between">
            <div className="flex flex-col">
              {product.variants && product.variants.length > 0 && (
                <span className="text-[10px] text-slate-500">a partir de</span>
              )}
              <span className="font-bold text-lg text-slate-900">
                R$ {product.price.toFixed(2)}
              </span>
            </div>

            {/* CONTROLE DE QUANTIDADE INTEGRADO */}
            {quantity > 0 ? (
              <div
                className="flex items-center gap-2 bg-slate-100 rounded-full p-1 h-8 shadow-inner"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={(e) => handleUpdate(e, -1)}
                  className="w-6 h-6 flex items-center justify-center bg-white rounded-full text-slate-600 shadow-sm hover:text-red-500"
                >
                  <Minus size={12} />
                </button>
                <span className="text-xs font-bold w-4 text-center">
                  {quantity}
                </span>
                <button
                  onClick={(e) => handleUpdate(e, 1)}
                  className="w-6 h-6 flex items-center justify-center bg-white rounded-full text-slate-600 shadow-sm hover:text-green-600"
                >
                  <Plus size={12} />
                </button>
              </div>
            ) : (
              <Button
                size="sm"
                disabled={!product.inStock}
                onClick={(e) => handleUpdate(e, 1)}
                className="h-8 w-8 rounded-full p-0 bg-green-600 hover:bg-green-700 text-white shadow-sm shrink-0"
              >
                <Plus size={16} />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* MODAL DE VISUALIZAÇÃO RÁPIDA */}
      <ProductQuickView
        product={product}
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
      />
    </>
  );
}
