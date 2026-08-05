// src/components/layout/Navbar.tsx (VERSÃO FINAL CONSOLIDADA E CORRIGIDA)

"use client";

import Link from "next/link";
import React, { useEffect, useState, ElementType } from "react";
import {
  Sparkles,
  Gift,
  Menu,
  X,
  PartyPopper,
  ChevronRight,
  ChevronDown,
  Scissors,
  Tag,
  MapPin,
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
import { useSettingsStore } from "@/store/settingsStore";
import { useCategoryStore } from "@/store/categoryStore";
import { useProductStore } from "@/store/productStore";
import { getVisibleCategories } from "@/lib/categories";

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
  const storeName = useSettingsStore((state) => state.settings.storeName);

  // Categorias (menu "Loja", issue #70): listener em tempo real, reflete
  // criar/renomear/reordenar categoria no admin sem precisar de deploy.
  const categories = useCategoryStore((state) => state.categories);
  const subscribeToCategories = useCategoryStore((state) => state.subscribe);
  // Produtos: a Navbar fica montada no layout raiz (persiste entre
  // navegações), então só dispara fetchProducts se nenhuma outra página já
  // tiver carregado o catálogo — evita duplicar a query em toda troca de
  // rota (não é por-categoria, é a mesma coleção que as páginas já buscam).
  const allProducts = useProductStore((state) => state.allProducts);

  useEffect(() => {
    subscribeToCategories();
  }, [subscribeToCategories]);

  useEffect(() => {
    // Adiado pra um microtask: a Navbar fica no layout raiz e roda ANTES de
    // `children` no mesmo commit (ex: HomeClient/useStoreHydration, que
    // hidrata o catálogo via SSR de forma síncrona). `fetchProducts()` só
    // marca `isLoading: true` depois de um `await` interno (fetchRecipes),
    // então checar `allProducts`/`isLoading` de forma síncrona aqui correria
    // na frente da hidratação da página e disparava uma 2ª leitura
    // redundante do Firestore (a store acabava sendo populada duas vezes na
    // Home). Um microtask roda só depois que todos os effects deste commit
    // (incluindo o da página) já terminaram de rodar de forma síncrona.
    queueMicrotask(() => {
      const state = useProductStore.getState();
      if (state.allProducts.length === 0 && state.isLoading) {
        state.fetchProducts();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Guarda-corpo: só categoria ativa com >=1 produto vendável entra no
  // mega-menu (ver src/lib/categories.ts).
  const visibleCategories = getVisibleCategories(categories, allProducts);

  // Se a rota começar com "/admin", não renderiza nada
  if (pathname && pathname.startsWith("/admin")) {
    return null;
  }

  // Definição estruturada das Categorias e Sub-itens
  const navCategories = [
    {
      label: "Início",
      href: "/",
      type: "link",
    },
    {
      label: "Fitas & Laços",
      type: "group",
      children: [
        {
          label: "Central de Fitas",
          href: "/fitas",
          description: "Rolos fechados e metro",
          Icon: Scissors,
        },
        {
          label: "Criar Laço",
          href: "/fitas?aba=service",
          description: "Personalize seu laço",
          Icon: Sparkles,
        },
      ],
    },
    {
      label: "Balões & Presentes",
      type: "group",
      children: [
        {
          label: "Orçamento de Balões",
          href: "/baloes",
          description: "Monte seu arranjo",
          Icon: PartyPopper,
        },
        {
          label: "Monte Sua Cesta",
          href: null,
          isModal: true,
          description: "Presente perfeito",
          Icon: Gift,
        },
      ],
    },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-100/50">
      {/* Badge de área de atendimento (issue #159): faixa fina, própria,
          visível em toda página (mobile e desktop) sem competir com os CTAs
          principais da linha de baixo (Loja, carrinho, Kit Builder). Só
          informativo — não é link, não precisa de alvo de toque. */}
      <div className="bg-purple-50/80 border-b border-purple-100/60">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-1 px-4 py-1 text-[11px] font-medium text-purple-700 whitespace-nowrap">
          <MapPin size={12} className="shrink-0" aria-hidden="true" />
          <span>Entregamos em Boa Vista - RR</span>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl items-center justify-between p-4">
        {/* Logo */}
        <Link
          href="/"
          className="text-xl font-bold bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
        >
          {storeName}
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          {navCategories.map((cat) => (
            <div key={cat.label} className="relative group">
              {cat.type === "link" ? (
                <Link
                  href={cat.href!}
                  className="text-sm font-medium text-slate-700 hover:text-purple-600 transition-colors"
                >
                  {cat.label}
                </Link>
              ) : (
                <>
                  <button className="flex items-center gap-1 text-sm font-medium text-slate-700 hover:text-purple-600 transition-colors group-hover:text-purple-600 py-2">
                    {cat.label}
                    <ChevronDown
                      size={14}
                      className="group-hover:rotate-180 transition-transform"
                    />
                  </button>

                  {/* Dropdown Menu (Hover CSS) */}
                  <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 w-64 z-50">
                    <div className="bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden p-2">
                      {cat.children?.map((child) => {
                        const ItemIcon = child.Icon!;
                        const content = (
                          <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                            <div className="bg-purple-50 text-purple-600 p-2 rounded-md shrink-0">
                              <ItemIcon size={18} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-700">
                                {child.label}
                              </p>
                              <p className="text-xs text-slate-400">
                                {child.description}
                              </p>
                            </div>
                          </div>
                        );

                        if (child.isModal) {
                          return (
                            <button
                              key={child.label}
                              onClick={openKitBuilder}
                              className="w-full text-left"
                            >
                              {content}
                            </button>
                          );
                        }
                        return (
                          <Link
                            key={child.label}
                            href={child.href!}
                            className="block"
                          >
                            {content}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}

          {/* Loja: mega-menu dinâmico de categorias (issue #70) — só
              renderiza se houver pelo menos 1 categoria ativa com produto
              em estoque (guarda-corpo em getVisibleCategories). */}
          {visibleCategories.length > 0 && (
            <div className="relative group">
              <button
                data-testid="loja-menu-trigger"
                className="flex items-center gap-1 text-sm font-medium text-slate-700 hover:text-purple-600 transition-colors group-hover:text-purple-600 py-2"
              >
                Loja
                <ChevronDown
                  size={14}
                  className="group-hover:rotate-180 transition-transform"
                />
              </button>

              {/* Dropdown Mega-Menu (Hover CSS) */}
              <div className="absolute top-full right-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 w-80 z-50">
                <div className="bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden p-2 max-h-[70vh] overflow-y-auto">
                  {visibleCategories.map((category) => (
                    <div key={category.id} className="p-1">
                      <Link
                        href={`/categoria/${category.id}`}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <div className="bg-purple-50 text-purple-600 p-2 rounded-md shrink-0">
                          <Tag size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-700">
                            {category.name}
                          </p>
                          <p className="text-xs text-slate-400">
                            {category.productCount}{" "}
                            {category.productCount === 1
                              ? "produto"
                              : "produtos"}
                          </p>
                        </div>
                      </Link>

                      {category.visibleSubcategories.length > 0 && (
                        <div className="ml-11 mt-1 mb-2 flex flex-wrap gap-1.5">
                          {category.visibleSubcategories.map((sub) => (
                            <Link
                              key={sub.id}
                              href={`/categoria/${category.id}?sub=${sub.id}`}
                              className="text-xs font-medium text-slate-500 hover:text-purple-600 bg-slate-50 hover:bg-purple-50 rounded-full px-2.5 py-1 transition-colors"
                            >
                              {sub.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <CartIcon />
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

      {/* Mobile Menu */}
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

          <div className="flex-1 overflow-y-auto py-6 px-4 space-y-6">
            {navCategories.map((cat) => (
              <div key={cat.label} className="space-y-3">
                {cat.type === "link" ? (
                  <Link
                    href={cat.href!}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block font-bold text-lg text-slate-800"
                  >
                    {cat.label}
                  </Link>
                ) : (
                  <>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {cat.label}
                    </h4>
                    <div className="grid gap-3">
                      {cat.children?.map((child) => {
                        const ItemIcon = child.Icon!;
                        const content = (
                          <>
                            <div className="w-10 h-10 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-purple-600 shrink-0">
                              <ItemIcon size={20} />
                            </div>
                            <div className="flex-1 text-left">
                              <h5 className="font-bold text-slate-800">
                                {child.label}
                              </h5>
                              <p className="text-xs text-slate-500">
                                {child.description}
                              </p>
                            </div>
                            <ChevronRight
                              size={16}
                              className="text-slate-300"
                            />
                          </>
                        );

                        if (child.isModal) {
                          return (
                            <button
                              key={child.label}
                              onClick={() => {
                                openKitBuilder();
                                setIsMobileMenuOpen(false);
                              }}
                              className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm active:scale-95 transition-transform"
                            >
                              {content}
                            </button>
                          );
                        }
                        return (
                          <Link
                            key={child.label}
                            href={child.href!}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm active:scale-95 transition-transform"
                          >
                            {content}
                          </Link>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            ))}

            {/* Loja: mesmo dado dinâmico do mega-menu desktop (issue #70) */}
            {visibleCategories.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Loja
                </h4>
                <div className="space-y-3">
                  {visibleCategories.map((category) => (
                    <div key={category.id} className="space-y-2">
                      <Link
                        href={`/categoria/${category.id}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 p-3 min-h-11 bg-white rounded-xl border border-slate-100 shadow-sm active:scale-95 transition-transform"
                      >
                        <div className="w-10 h-10 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-purple-600 shrink-0">
                          <Tag size={20} />
                        </div>
                        <div className="flex-1 text-left">
                          <h5 className="font-bold text-slate-800">
                            {category.name}
                          </h5>
                          <p className="text-xs text-slate-500">
                            {category.productCount}{" "}
                            {category.productCount === 1
                              ? "produto"
                              : "produtos"}
                          </p>
                        </div>
                        <ChevronRight size={16} className="text-slate-300" />
                      </Link>

                      {category.visibleSubcategories.length > 0 && (
                        <div className="flex flex-wrap gap-2 pl-2">
                          {category.visibleSubcategories.map((sub) => (
                            <Link
                              key={sub.id}
                              href={`/categoria/${category.id}?sub=${sub.id}`}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="min-h-11 min-w-11 flex items-center justify-center text-xs font-medium text-slate-600 bg-white border border-slate-100 rounded-full px-3 py-2 active:scale-95 transition-transform"
                            >
                              {sub.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
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
