// src/components/layout/Navbar.tsx (VERSÃO FINAL CONSOLIDADA E CORRIGIDA)

"use client";

import Link from "next/link";
import React, { useState, ElementType } from "react";
import { Sparkles, Gift, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useKitBuilderStore } from "@/store/kitBuilderStore";
// CORRIGIDO: Importa CartSidebar (o painel) e CartIcon (o botão inteligente)
import { CartSidebar, CartIcon } from "@/components/features/CartSidebar";
// Sheet components
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { usePathname } from "next/navigation";

// Links da navegação principal (Estrutura de dados unificada)
interface NavLinkItem {
  href?: string;
  label: string;
  Icon?: ElementType;
  isModal: boolean;
}

const navLinks: NavLinkItem[] = [
  { href: "/", label: "Início", isModal: false },
  { href: "/fitas", label: "Fitas", isModal: false },
  {
    href: "/fitas?aba=laco",
    label: "Personalizar Laço",
    Icon: Sparkles,
    isModal: false,
  },
  { label: "Monte Sua Cesta", Icon: Gift, isModal: true },
];

const Navbar = () => {
  const openKitBuilder = useKitBuilderStore((state) => state.openKitBuilder);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Se a rota começar com "/admin", não renderiza nada
  if (pathname && pathname.startsWith("/admin")) {
    return null;
  }

  // Componente auxiliar para links de navegação interna
  // CORRIGIDO: Removido legacyBehavior.
  const NavButton: React.FC<{
    href: string;
    label: string;
    Icon?: ElementType;
    onClick?: () => void;
  }> = ({ href, label, Icon, onClick }) => (
    <Link href={href} passHref>
      <Button
        variant="ghost"
        className="w-full justify-start text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-purple-600"
        onClick={() => {
          onClick && onClick();
          setIsMobileMenuOpen(false);
        }}
      >
        {Icon && <Icon className="mr-2 h-4 w-4" />}
        {label}
      </Button>
    </Link>
  );

  // Componente auxiliar para botões que abrem modais (não usa Link)
  const ModalButton: React.FC<{
    label: string;
    Icon: ElementType;
    onClick: () => void;
  }> = ({ label, Icon, onClick }) => (
    <Button
      variant="ghost"
      className="w-full justify-start text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-purple-600"
      onClick={() => {
        onClick();
        setIsMobileMenuOpen(false);
      }}
    >
      <Icon className="mr-2 h-4 w-4" />
      {label}
    </Button>
  );

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-sm dark:bg-gray-900">
      {/* REMOVIDO: <StoreHeader /> */}
      <div className="mx-auto flex max-w-7xl items-center justify-between p-4">
        {/* Logo/Nome da Loja */}
        <Link href="/" className="text-xl font-bold text-primary">
          Mix WebApp
        </Link>

        {/* Links Principais (Desktop) */}
        <div className="hidden space-x-2 md:flex">
          {navLinks.map((link) =>
            link.isModal ? (
              <ModalButton
                key={link.label}
                label={link.label}
                Icon={link.Icon!}
                onClick={openKitBuilder}
              />
            ) : (
              <NavButton
                key={link.href}
                href={link.href!}
                label={link.label}
                Icon={link.Icon}
              />
            )
          )}
        </div>

        {/* Ícones de Ação (Carrinho, Mobile Menu) */}
        <div className="flex items-center space-x-2">
          {/* 1. Mobile Hamburger Menu (Toggle) */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* 2. Carrinho: USANDO O ÍCONE INTELIGENTE */}
          <CartIcon />
        </div>
      </div>

      {/* MENU MOBILE (Sheet Component) */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="text-xl font-bold text-primary">
              Navegação
            </SheetTitle>
            <SheetClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
              >
                <X className="h-4 w-4" />
              </Button>
            </SheetClose>
          </SheetHeader>

          <div className="flex flex-col p-4 space-y-1">
            {/* Renderizar todos os links e botões do menu mobile */}
            {navLinks.map((link) =>
              link.isModal ? (
                <ModalButton
                  key={link.label}
                  label={link.label}
                  Icon={link.Icon!}
                  onClick={openKitBuilder}
                />
              ) : (
                <NavButton
                  key={link.href}
                  href={link.href!}
                  label={link.label}
                  Icon={link.Icon}
                />
              )
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Monta o CartSidebar para que o CartIcon possa abri-lo */}
      <CartSidebar />
    </nav>
  );
};

export default Navbar;
