"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useProductStore } from "@/store/productStore";
import { useCartStore } from "@/store/cartStore";
import { Product } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ShoppingCart,
  Check,
  Share2,
  Box,
  Truck,
} from "lucide-react";

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const { allProducts, fetchProducts, isLoading } = useProductStore();
  const { addItem, openCart } = useCartStore();
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (allProducts.length === 0) fetchProducts();
    else {
      const found = allProducts.find((p) => p.id === params.id);
      setProduct(found || null);
    }
  }, [allProducts, params.id, fetchProducts]);

  const handleAddToCart = () => {
    if (product) {
      addItem({
        cartId: crypto.randomUUID(),
        type: "SIMPLE",
        product: product,
        quantity: 1,
        kitTotalAmount: 0,
      });
      openCart();
    }
  };

  const handleShare = () => {
    if (navigator.share)
      navigator.share({
        title: product?.name,
        text: `Olha esse ${product?.name} que achei na Mix Novidades!`,
        url: window.location.href,
      });
    else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copiado!");
    }
  };

  if (isLoading)
    return (
      <div className="h-[60vh] flex items-center justify-center text-slate-400 animate-pulse">
        Carregando detalhes...
      </div>
    );
  if (!product)
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-slate-500">
        <p>Produto não encontrado.</p>
        <Button variant="outline" onClick={() => router.push("/")}>
          Voltar para a Loja
        </Button>
      </div>
    );

  const formatMoney = (val: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);

  return (
    <div className="bg-white min-h-screen pb-32 md:pb-20">
      <div className="max-w-6xl mx-auto px-4 pt-6 hidden md:block">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="text-slate-500 hover:text-purple-700 pl-0"
        >
          <ChevronLeft className="mr-1 h-4 w-4" /> Voltar para a loja
        </Button>
      </div>
      <div className="fixed top-4 left-4 z-20 md:hidden">
        <Button
          size="icon"
          variant="secondary"
          className="rounded-full shadow-lg bg-white/80 backdrop-blur-md"
          onClick={() => router.back()}
        >
          <ChevronLeft className="h-5 w-5 text-slate-800" />
        </Button>
      </div>
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="grid md:grid-cols-2 gap-8 md:gap-16">
          <div className="relative aspect-square md:aspect-[4/3] bg-slate-50 rounded-3xl overflow-hidden shadow-sm border border-slate-100">
            <Image
              src={product.imageUrl}
              alt={`Foto detalhada de ${product.name} - Melhor preço em Boa Vista`}
              fill
              className="object-contain p-8 hover:scale-105 transition-transform duration-700"
              priority
            />
            {product.originalPrice && (
              <Badge className="absolute top-4 left-4 bg-red-500 text-sm md:text-base px-3 py-1 shadow-md">
                {Math.round(
                  ((product.originalPrice - product.price) /
                    product.originalPrice) *
                    100
                )}
                % OFF
              </Badge>
            )}
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-4 right-4 rounded-full shadow-md bg-white/90 hover:bg-white text-slate-700"
              onClick={handleShare}
            >
              <Share2 size={18} />
            </Button>
          </div>
          <div className="flex flex-col gap-6 pt-2">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="outline"
                  className="border-purple-200 text-purple-700 uppercase tracking-wider text-[10px]"
                >
                  {product.category}
                </Badge>
                {product.itemSize && (
                  <Badge
                    variant="secondary"
                    className="text-slate-500 bg-slate-100 gap-1 text-[10px]"
                  >
                    <Box size={10} /> Ocupa {product.itemSize} slots
                  </Badge>
                )}
                {product.capacity && (
                  <Badge
                    variant="secondary"
                    className="text-slate-500 bg-slate-100 gap-1 text-[10px]"
                  >
                    <Box size={10} /> Capacidade: {product.capacity} itens
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl md:text-4xl font-bold text-slate-900 leading-tight">
                {product.name}
              </h1>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
              <div>
                {product.originalPrice && (
                  <span className="text-sm text-slate-400 line-through block">
                    De {formatMoney(product.originalPrice)}
                  </span>
                )}
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-slate-900">
                    {formatMoney(product.price)}
                  </span>
                  <span className="text-sm text-slate-500 font-medium">
                    /{product.unit}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full mb-1">
                  <Check size={12} /> Em Estoque
                </div>
                <span className="text-[10px] text-slate-400 block">
                  Envio Imediato
                </span>
              </div>
            </div>
            <div className="prose prose-slate prose-sm text-slate-600 leading-relaxed">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">
                Detalhes
              </h3>
              <p>
                {product.description ||
                  `Um excelente produto da categoria ${product.category}, selecionado especialmente para você.`}
              </p>
            </div>
            <div className="flex items-center gap-3 p-4 border border-slate-100 rounded-xl text-sm text-slate-600">
              <div className="bg-purple-50 p-2 rounded-full text-purple-600">
                <Truck size={20} />
              </div>
              <div>
                <p className="font-semibold text-slate-900">
                  Entrega em Boa Vista
                </p>
                <p className="text-xs">
                  Receba no conforto da sua casa via Motoboy.
                </p>
              </div>
            </div>
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 md:relative md:p-0 md:border-0 md:bg-transparent z-20">
              <div className="max-w-6xl mx-auto flex gap-4">
                <Button
                  size="lg"
                  className="w-full h-14 text-base font-bold bg-slate-900 hover:bg-slate-800 shadow-xl hover:shadow-2xl transition-all"
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="mr-2 h-5 w-5" /> Adicionar{" "}
                  {formatMoney(product.price)}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
