"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Product } from "@/types";
import { useCartStore } from "@/store/cartStore";
import { Minus, Plus, ShoppingCart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { SafeImage } from "../ui/SafeImage";

interface ProductQuickViewProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProductQuickView({
  product,
  isOpen,
  onClose,
}: ProductQuickViewProps) {
  const { items, addItem, removeItem, updateQuantity } = useCartStore();

  if (!product) return null;

  const cartItem = items.find((i) => i.product?.id === product.id);
  const quantity = cartItem ? cartItem.quantity : 0;

  const handleUpdate = (delta: number) => {
    if (quantity + delta <= 0) {
      if (cartItem) removeItem(cartItem.cartId);
    } else {
      if (cartItem) {
        updateQuantity(cartItem.cartId, quantity + delta);
      } else {
        addItem({
          cartId: crypto.randomUUID(),
          type: "SIMPLE",
          product: product,
          quantity: 1,
        });
        toast.success("Adicionado ao carrinho!");
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-white border-0">
        <div className="relative h-64 w-full bg-slate-100">
          {product.imageUrl ? (
            <SafeImage
              src={product.imageUrl}
              alt={product.name}
              name={product.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-300">
              <ShoppingCart size={48} />
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 bg-white/80 p-2 rounded-full hover:bg-white text-slate-500"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              {product.category}
            </p>
            <h2 className="text-xl font-bold text-slate-800 leading-tight">
              {product.name}
            </h2>
            {product.description && (
              <p className="text-slate-500 text-sm mt-2">
                {product.description}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
            <span className="text-2xl font-bold text-purple-700">
              R$ {product.price.toFixed(2)}
            </span>

            <div className="flex items-center gap-3 bg-slate-50 rounded-full p-1 border border-slate-200">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleUpdate(-1)}
                className="h-8 w-8 rounded-full hover:bg-white hover:text-red-500"
              >
                <Minus size={16} />
              </Button>
              <span className="font-bold text-slate-800 w-4 text-center">
                {quantity}
              </span>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleUpdate(1)}
                className="h-8 w-8 rounded-full hover:bg-white hover:text-green-600"
              >
                <Plus size={16} />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
