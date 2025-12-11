"use client";

import { useCartStore } from "@/store/cartStore";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export function Navbar() {
  const { openCart, items } = useCartStore();

  return (
    <header className="bg-white/90 p-4 shadow-sm sticky top-0 z-50 backdrop-blur-md transition-all border-b border-slate-100">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link href="/">
          <h1 className="text-xl font-bold text-slate-800 tracking-tight cursor-pointer hover:text-purple-700 transition-colors">
            Mix WebApp
          </h1>
        </Link>

        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-slate-100"
          onClick={openCart}
        >
          <ShoppingCart className="text-slate-700" />
          {items.length > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-[10px] animate-in zoom-in">
              {items.length}
            </Badge>
          )}
        </Button>
      </div>
    </header>
  );
}
