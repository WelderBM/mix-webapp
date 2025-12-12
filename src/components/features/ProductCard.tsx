"use client";

import { Product, ProductVariant } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Plus, ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface ProductCardProps {
  product: Product;
  onSelect: (variant?: ProductVariant) => void;
  actionLabel?: string;
}

export function ProductCard({
  product,
  onSelect,
  actionLabel = "Adicionar",
}: ProductCardProps) {
  // Se o produto tiver variantes (ex: Atacado/Varejo), mostramos o menor preço com "a partir de"
  const displayPrice =
    product.variants && product.variants.length > 0
      ? Math.min(...product.variants.map((v) => v.price))
      : product.price;

  return (
    <div className="group bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col h-full overflow-hidden relative">
      {/* LINK PRINCIPAL: Envolve a Imagem e o Texto.
          Leva para a página de detalhes: /produto/ID
      */}
      <Link
        href={`/produto/${product.id}`}
        className="flex-1 flex flex-col cursor-pointer"
      >
        {/* Área da Imagem */}
        <div className="relative w-full aspect-square bg-slate-50 overflow-hidden">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              // SEO Inteligente: Nome + Categoria + Local
              alt={`Comprar ${product.name} - ${product.category} na Mix Novidades`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-300 bg-slate-50">
              <ShoppingCart size={24} opacity={0.2} />
            </div>
          )}

          {/* Badge de Esgotado */}
          {!product.inStock && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10">
              <span className="bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded uppercase shadow-sm">
                Esgotado
              </span>
            </div>
          )}
        </div>

        {/* Área de Conteúdo */}
        <div className="p-3 flex flex-col flex-1">
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-1 line-clamp-1">
            {product.category}
          </span>
          <h3 className="font-semibold text-slate-800 text-sm leading-tight line-clamp-2 mb-2 group-hover:text-purple-700 transition-colors">
            {product.name}
          </h3>

          <div className="mt-auto pt-2 flex items-baseline gap-1">
            {product.variants && product.variants.length > 0 && (
              <span className="text-[10px] text-slate-500">a partir de</span>
            )}
            <span className="font-bold text-lg text-slate-900">
              {displayPrice.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </span>
            {/* Mostra a unidade (un, m, kg) apenas se não tiver variantes, para não confundir */}
            {(!product.variants || product.variants.length === 0) && (
              <span className="text-xs text-slate-400 font-normal">
                /{product.unit}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* BOTÃO DE AÇÃO: Fora do Link para evitar conflito.
          Adiciona direto ao carrinho.
      */}
      <div className="p-3 pt-0 mt-auto">
        <Button
          onClick={(e) => {
            e.preventDefault(); // Impede o link de abrir
            e.stopPropagation(); // Impede o evento de subir para o pai
            onSelect();
          }}
          disabled={!product.inStock}
          className="w-full text-white font-bold h-9 text-xs shadow-sm active:scale-95 transition-transform border-none"
          // Usa a variável CSS global --secondary definida na Home/Layout
          style={{ backgroundColor: "var(--secondary, #16a34a)" }}
        >
          {actionLabel} <Plus size={14} className="ml-1" />
        </Button>
      </div>
    </div>
  );
}
