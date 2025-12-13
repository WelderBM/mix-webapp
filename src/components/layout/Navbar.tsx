// src/components/layout/Navbar.tsx (VERSÃO FINAL CONSOLIDADA E CORRIGIDA)

"use client";

import Link from "next/link";
import { ShoppingCart, Heart, User, Sparkles, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { useKitBuilderStore } from "@/store/kitBuilderStore";
// CORREÇÃO: Usando named imports { CartSidebar } e { StoreHeader }
import { CartSidebar } from "@/components/features/CartSidebar";
import { StoreHeader } from "@/components/layout/StoreHeader";

// ... (Restante dos imports)

const Navbar = () => {
  const cartItemCount = useCartStore((state) => state.items.length);
  // Assumindo que useAuthStore existe e retorna 'user'
  const { user } = useAuthStore();
  const openKitBuilder = useKitBuilderStore((state) => state.openKitBuilder);

  // Links da navegação principal (pode ser ajustado conforme seu layout)
  const navLinks = [
    { href: "/", label: "Início" },
    { href: "/fitas", label: "Fitas" },
    // { href: '/produtos', label: 'Produtos' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-sm dark:bg-gray-900">
      <div className="mx-auto flex max-w-7xl items-center justify-between p-4">
        {/* Logo/Nome da Loja */}
        <Link href="/" className="text-xl font-bold text-primary">
          Mix WebApp
        </Link>

        {/* Links Principais */}
        <div className="hidden space-x-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}

          {/* TRIGGER: Construtor de Laços */}
          <Link href="/laco-builder" passHref>
            <Button
              variant="ghost"
              className="text-sm font-medium text-purple-600 hover:bg-purple-50"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Personalizar Laço
            </Button>
          </Link>

          {/* TRIGGER: Montador de Cestas (Abre o Modal) */}
          <Button
            variant="default"
            className="text-sm font-medium bg-green-500 hover:bg-green-600 text-white"
            onClick={() => openKitBuilder()}
          >
            <Gift className="mr-2 h-4 w-4" />
            Monte Sua Cesta
          </Button>
        </div>

        {/* Ícones de Ação (Carrinho, Login) */}
        <div className="flex items-center space-x-4">
          {/* Link de Perfil */}
          <Link href="/perfil" passHref>
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
          </Link>

          {/* Carrinho */}
          <CartSidebar />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
