import { Product } from "@/lib/types";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const formatPrice = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  return (
    <div className="group relative bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all overflow-hidden flex flex-col">
      <div className="relative aspect-square w-full bg-slate-100 overflow-hidden">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {product.originalPrice && (
          <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            Oferta
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1 gap-2">
        <div className="text-xs text-slate-500 uppercase font-semibold tracking-wider">
          {product.category}
        </div>

        <h3 className="font-medium text-slate-800 line-clamp-2 min-h-[3rem]">
          {product.name}
        </h3>

        <div className="mt-auto">
          {product.originalPrice && (
            <span className="text-sm text-slate-400 line-through block">
              {formatPrice(product.originalPrice)}
            </span>
          )}
          <div className="flex items-end gap-1">
            <span className="text-lg font-bold text-slate-900">
              {formatPrice(product.price)}
            </span>
            <span className="text-xs text-slate-500 mb-1">/{product.unit}</span>
          </div>
        </div>

        <Button className="w-full mt-3 gap-2 bg-slate-900 hover:bg-slate-800">
          <Plus size={16} />
          Adicionar
        </Button>
      </div>
    </div>
  );
}
