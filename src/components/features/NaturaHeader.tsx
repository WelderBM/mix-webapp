"use client";

import Image from "next/image";
import Link from "next/link";
import { Search, ShoppingCart, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cartStore";

export function NaturaHeader() {
  const { items, isCartOpen, openCart, closeCart } = useCartStore();
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const toggleCart = () => {
    if (isCartOpen) closeCart();
    else openCart();
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-green-100">
      <div className="bg-green-600 text-white text-xs py-1 text-center font-medium">
        🌿 Produtos Originais Natura | Entrega Rápida em Boa Vista
      </div>

      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        {/* LOGO AREA */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative w-10 h-10 bg-green-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
            <Leaf className="text-green-600 fill-green-600" size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black text-slate-800 leading-none group-hover:text-green-700 transition-colors">
              Mix Novidades
            </span>
            <span className="text-xs font-bold text-green-600 uppercase tracking-widest">
              Consultoria Natura
            </span>
          </div>
        </Link>

        {/* ACTIONS */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Cart Button */}
          <Button
            onClick={toggleCart}
            className="relative bg-orange-500 hover:bg-orange-600 text-white rounded-full h-12 w-12 p-0 shadow-lg shadow-orange-200 transition-all hover:scale-105"
          >
            <ShoppingCart size={22} />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold border-2 border-white">
                {itemCount}
              </span>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
