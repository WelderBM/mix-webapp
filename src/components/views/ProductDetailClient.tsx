"use client";

import { Product, CartItem } from "@/lib/types";
import { useCartStore } from "@/store/cartStore";
import { useSettingsStore } from "@/store/settingsStore";
import { StoreHeader } from "@/components/layout/StoreHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart,
  ArrowLeft,
  Truck,
  ShieldCheck,
  Share2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ProductCard } from "@/components/features/ProductCard";
import { cn, hexToRgb, getContrastColor } from "@/lib/utils";
import { useEffect, useMemo } from "react";

interface ProductDetailProps {
  product: Product;
  relatedProducts: Product[];
}

export default function ProductDetailClient({
  product,
  relatedProducts,
}: ProductDetailProps) {
  const { addItem, openCart } = useCartStore();
  const { settings, fetchSettings } = useSettingsStore();
  const router = useRouter();

  useEffect(() => {
    fetchSettings();
  }, []);

  // Estilos Dinâmicos (Mesma lógica da Home)
  const themeStyles = useMemo(() => {
    const primary = settings.theme.primaryColor || "#7c3aed";
    const secondary = settings.theme.secondaryColor || "#16a34a";
    return {
      "--primary": primary,
      "--primary-contrast": getContrastColor(primary),
      "--secondary": secondary,
      "--secondary-contrast": getContrastColor(secondary),
    } as React.CSSProperties;
  }, [settings]);

  const handleAddToCart = () => {
    addItem({
      cartId: crypto.randomUUID(),
      type: "SIMPLE",
      product: product,
      quantity: 1,
      kitTotalAmount: 0,
    });
    openCart();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: product.name, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copiado!");
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 pb-12" style={themeStyles}>
      <StoreHeader />

      <div className="max-w-6xl mx-auto px-4 -mt-12 relative z-10">
        {/* Botão Voltar */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4 bg-white/80 backdrop-blur hover:bg-white text-slate-700"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
          {/* Coluna 1: Imagem */}
          <div className="relative aspect-square md:aspect-[4/3] bg-slate-50 rounded-2xl overflow-hidden border border-slate-100">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-contain hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-300">
                Sem Imagem
              </div>
            )}
            {!product.inStock && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                <span className="bg-red-500 text-white px-4 py-2 rounded-full font-bold shadow-lg">
                  Esgotado
                </span>
              </div>
            )}
          </div>

          {/* Coluna 2: Informações */}
          <div className="flex flex-col">
            <div className="mb-auto">
              <div className="flex justify-between items-start">
                <Badge
                  variant="outline"
                  className="mb-2 border-purple-200 text-purple-700"
                >
                  {product.category}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleShare}
                  className="text-slate-400 hover:text-purple-600"
                >
                  <Share2 size={20} />
                </Button>
              </div>

              <h1 className="text-2xl md:text-4xl font-extrabold text-slate-800 mb-2">
                {product.name}
              </h1>

              <div className="text-3xl font-bold text-slate-900 mb-6 flex items-baseline gap-2">
                <span style={{ color: "var(--primary)" }}>
                  {product.price.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </span>
                <span className="text-sm font-normal text-slate-400">
                  / {product.unit}
                </span>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                  <Truck className="text-green-600" size={20} />
                  <span>
                    Entrega em Boa Vista ou <strong>Retirada na Loja</strong>
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                  <ShieldCheck className="text-blue-600" size={20} />
                  <span>
                    Garantia de qualidade <strong>Mix Novidades</strong>
                  </span>
                </div>
              </div>

              {product.description && (
                <div className="prose prose-sm text-slate-500 mb-8">
                  <h3 className="text-slate-900 font-semibold mb-1">
                    Descrição
                  </h3>
                  <p>{product.description}</p>
                </div>
              )}
            </div>

            <Button
              size="lg"
              className="w-full text-lg h-14 font-bold shadow-lg transition-transform active:scale-95"
              onClick={handleAddToCart}
              disabled={!product.inStock}
              style={{
                backgroundColor: "var(--secondary)",
                color: "var(--secondary-contrast)",
              }}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              {product.inStock ? "Adicionar ao Carrinho" : "Indisponível"}
            </Button>
          </div>
        </div>

        {/* Produtos Relacionados */}
        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold text-slate-800 mb-6">
              Você também pode gostar
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map((rel) => (
                <ProductCard
                  key={rel.id}
                  product={rel}
                  actionLabel="Adicionar"
                  onSelect={() => {
                    addItem({
                      cartId: crypto.randomUUID(),
                      type: "SIMPLE",
                      product: rel,
                      quantity: 1,
                      kitTotalAmount: 0,
                    });
                    openCart();
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
