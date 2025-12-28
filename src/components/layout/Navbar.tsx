// src/components/layout/Navbar.tsx (VERSÃO FINAL CONSOLIDADA E CORRIGIDA)

"use client";

import Link from "next/link";
import React, { useState, ElementType } from "react";
import {
  Sparkles,
  Gift,
  Menu,
  X,
  PartyPopper,
  ChevronRight,
} from "lucide-react";
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
// Links da navegação principal (Estrutura de dados unificada)
interface NavLinkItem {
  href?: string;
  label: string;
  Icon?: ElementType;
  isModal: boolean;
  image?: string; // NOVO: Imagem para o menu visual móvel
  description?: string; // NOVO: Descrição curta
}

const navLinks: NavLinkItem[] = [
  {
    href: "/",
    label: "Início",
    isModal: false,
    image: "/nav-home.webp", // Placeholder, use SafeImage/placeholders in logic if file missing layout
    description: "Voltar para a loja principal",
  },
  {
    href: "/fitas",
    label: "Central de Fitas",
    isModal: false,
    image: "/nav-fitas.webp",
    description: "Rolos fechados e fitas por metro",
  },
  {
    href: "/fitas?aba=service", // Ajustado para ir direto para o criador
    label: "Personalizar Laço",
    Icon: Sparkles,
    isModal: false,
    image: "/nav-laco.webp",
    description: "Crie laços perfeitos para presentes",
  },
  {
    href: "/baloes",
    label: "Orçamento de Balões",
    Icon: PartyPopper, // Importar PartyPopper
    isModal: false,
    image: "/nav-baloes.webp",
    description: "Montar kit de balões personalizados",
  },
  {
    label: "Monte Sua Cesta",
    Icon: Gift,
    isModal: true,
    image: "/nav-cesta.webp",
    description: "Crie presentes únicos passo a passo",
  },
];

const Navbar = () => {
  const openKitBuilder = useKitBuilderStore((state) => state.openKitBuilder);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Se a rota começar com "/admin", não renderiza nada
  if (pathname && pathname.startsWith("/admin")) {
    return null;
  }

  // Componente auxiliar para links de navegação interna (Desktop Simples)
  const NavButton: React.FC<{
    href: string;
    label: string;
    Icon?: ElementType;
    onClick?: () => void;
  }> = ({ href, label, Icon, onClick }) => (
    <Link href={href} passHref>
      <Button
        variant="ghost"
        className="text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-purple-600"
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

  // Componente auxiliar para botões que abrem modais (Desktop Simples)
  const ModalButton: React.FC<{
    label: string;
    Icon: ElementType;
    onClick: () => void;
  }> = ({ label, Icon, onClick }) => (
    <Button
      variant="ghost"
      className="text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-purple-600"
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
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-100/50">
      <div className="mx-auto flex max-w-7xl items-center justify-between p-4">
        {/* Logo/Nome da Loja */}
        <Link
          href="/"
          className="text-xl font-bold bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
        >
          Mix WebApp
        </Link>

        {/* Links Principais (Desktop) */}
        <div className="hidden items-center space-x-1 md:flex">
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
          {/* 2. Carrinho: USANDO O ÍCONE INTELIGENTE */}
          <CartIcon />

          {/* 1. Mobile Hamburger Menu (Toggle) */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden text-slate-700"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* MENU MOBILE (Sheet Component) */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent
          side="left"
          className="w-[85vw] sm:w-[350px] p-0 flex flex-col bg-slate-50"
        >
          <SheetHeader className="p-6 border-b bg-white text-left">
            <SheetTitle className="text-2xl font-bold text-slate-800">
              Menu
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto py-6 px-4 space-y-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">
              Navegação Principal
            </p>

            {/* Renderizar todos os links como CARDS visuais */}
            {navLinks.map((link) => {
              // Render logic for content inside the card
              const content = (
                <>
                  {/* Coluna da Imagem (Simulada com Div ou Img) */}
                  <div className="w-16 h-16 rounded-lg bg-slate-200 shrink-0 overflow-hidden relative border border-slate-100">
                    {/* Caso não tenha imagem real, usamos um gradiente ou ícone fallback */}
                    {link.image ? (
                      <img
                        src={`https://placehold.co/100x100/f3f4f6/a855f7?text=${link.label
                          .substring(0, 2)
                          .toUpperCase()}`}
                        alt={link.label}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-purple-100 text-purple-600">
                        {link.Icon ? (
                          <link.Icon size={24} />
                        ) : (
                          <span className="font-bold">?</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 text-left">
                    <h4 className="font-bold text-slate-800 text-base">
                      {link.label}
                    </h4>
                    {link.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 mt-0.5 leading-tight">
                        {link.description}
                      </p>
                    )}
                  </div>

                  <div className="text-slate-300">
                    <ChevronRight size={16} />
                  </div>
                </>
              );

              if (link.isModal) {
                return (
                  <button
                    key={link.label}
                    onClick={() => {
                      openKitBuilder();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-4 p-3 rounded-2xl bg-white border border-slate-100 shadow-sm transition-all active:scale-95 active:shadow-none"
                  >
                    {content}
                  </button>
                );
              }

              return (
                <Link
                  key={link.href}
                  href={link.href!}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full flex items-center gap-4 p-3 rounded-2xl bg-white border border-slate-100 shadow-sm transition-all active:scale-95 active:shadow-none"
                >
                  {content}
                </Link>
              );
            })}
          </div>

          <div className="p-6 bg-white border-t text-center text-xs text-slate-400">
            <p>Mix WebApp © 2024</p>
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
};

export default Navbar;
