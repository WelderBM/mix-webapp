"use client";

import { useCartStore } from "@/store/cartStore";
import { ShoppingCart, Menu, Scissors, Package, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Navbar() {
  const { openCart, items } = useCartStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white/90 p-4 shadow-sm sticky top-0 z-50 backdrop-blur-md transition-all border-b border-slate-100">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Lado Esquerdo: Logo e Menu Desktop */}
        <div className="flex items-center gap-6">
          <Link href="/">
            <h1 className="text-xl font-bold text-slate-800 tracking-tight cursor-pointer hover:text-purple-700 transition-colors">
              Mix WebApp
            </h1>
          </Link>

          {/* Menu Desktop */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link
              href="/"
              className="hover:text-purple-600 flex items-center gap-1"
            >
              <Home size={16} /> Início
            </Link>
            <Link
              href="/fitas"
              className="hover:text-purple-600 flex items-center gap-1"
            >
              <Scissors size={16} /> Fitas & Laços
            </Link>
            <button
              onClick={() => {
                const id = prompt("Digite o ID do pedido para rastrear:");
                if (id) window.location.href = `/meu-pedido/${id}`;
              }}
              className="hover:text-purple-600 flex items-center gap-1"
            >
              <Package size={16} /> Rastrear
            </button>
          </nav>
        </div>

        {/* Lado Direito: Carrinho e Menu Mobile */}
        <div className="flex items-center gap-2">
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

          {/* Menu Mobile */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <div className="flex flex-col gap-6 mt-8">
                <Link
                  href="/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 text-lg font-bold text-slate-800"
                >
                  <Home /> Início
                </Link>
                <Link
                  href="/fitas"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 text-lg font-bold text-slate-800"
                >
                  <Scissors /> Fitas e Laços
                </Link>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    const id = prompt("Digite o ID do pedido:");
                    if (id) window.location.href = `/meu-pedido/${id}`;
                  }}
                  className="flex items-center gap-3 text-lg font-bold text-slate-800 text-left"
                >
                  <Package /> Rastrear Pedido
                </button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
