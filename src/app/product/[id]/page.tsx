"use client";

import { useEffect, useState } from "react";
import { useProductStore } from "@/store/productStore";
import { useCartStore } from "@/store/cartStore";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ShoppingCart, Check, Share2 } from "lucide-react";
import { Product } from "@/lib/types";

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const { allProducts, fetchProducts, isLoading } = useProductStore();
  const { addItem, openCart } = useCartStore();
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    // Garante que temos dados
    if (allProducts.length === 0) {
      fetchProducts();
    } else {
      // Busca o produto na memória
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
    if (navigator.share) {
      navigator.share({
        title: product?.name,
        text: `Olha que incrível esse ${product?.name} na Mix WebApp!`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copiado!");
    }
  };

  if (isLoading)
    return (
      <div className="h-screen flex items-center justify-center">
        Carregando...
      </div>
    );
  if (!product)
    return (
      <div className="h-screen flex items-center justify-center">
        Produto não encontrado.
      </div>
    );

  const formatMoney = (val: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Navbar Simplificada */}
      <header className="bg-white p-4 shadow-sm sticky top-0 z-40 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
          <ChevronLeft />
        </Button>
        <span className="font-semibold text-slate-800">
          Detalhes do Produto
        </span>
        <Button variant="ghost" size="icon" onClick={handleShare}>
          <Share2 size={20} />
        </Button>
      </header>

      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
        <div className="grid md:grid-cols-2 gap-8 bg-white rounded-2xl p-6 shadow-sm">
          {/* Imagem */}
          <div className="relative aspect-square bg-slate-100 rounded-xl overflow-hidden">
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover"
            />
            {product.originalPrice && (
              <Badge className="absolute top-4 left-4 bg-red-500 text-lg px-3 py-1">
                Oferta
              </Badge>
            )}
          </div>

          {/* Infos */}
          <div className="flex flex-col gap-4">
            <div>
              <Badge variant="outline" className="mb-2">
                {product.category}
              </Badge>
              <h1 className="text-3xl font-bold text-slate-900 leading-tight">
                {product.name}
              </h1>
            </div>

            <div className="flex items-end gap-3 pb-4 border-b">
              {product.originalPrice && (
                <span className="text-lg text-slate-400 line-through">
                  {formatMoney(product.originalPrice)}
                </span>
              )}
              <span className="text-4xl font-bold text-purple-700">
                {formatMoney(product.price)}
              </span>
              <span className="text-sm text-slate-500 mb-1">
                /{product.unit}
              </span>
            </div>

            <p className="text-slate-600 leading-relaxed text-lg">
              {product.description || "Sem descrição detalhada."}
            </p>

            <div className="mt-auto pt-6 space-y-3">
              <Button
                size="lg"
                className="w-full h-14 text-lg bg-slate-900 hover:bg-slate-800"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="mr-2" /> Adicionar ao Carrinho
              </Button>

              <div className="flex items-center gap-2 text-sm text-slate-500 justify-center">
                <Check size={16} className="text-green-500" /> Em estoque •
                Entrega imediata
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
