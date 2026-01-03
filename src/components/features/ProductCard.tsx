"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Product } from "@/types";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cartStore";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useKitBuilderStore } from "@/store/kitBuilderStore";
// NOVO IMPORT:
import { SafeImage } from "@/components/ui/SafeImage";

interface ProductCardProps {
  product: Product;
  onSelect?: (product: Product) => void;
  actionLabel?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  actionLabel = "Adicionar",
}) => {
  const { addItem, openCart } = useCartStore();
  const openKitBuilder = useKitBuilderStore((state) => state.openKitBuilder);

  const finalPrice = product.price;

  // Removemos todos os useEffects e useStates de imagem daqui.
  // O SafeImage cuida disso agora.

  const handleAction = (e: React.MouseEvent) => {
    e.preventDefault();
    if (product.type === "ASSEMBLED_KIT" && product.id) {
      openKitBuilder();
    } else if (onSelect) {
      onSelect(product);
    } else {
      addItem({
        cartId: crypto.randomUUID(),
        type: "SIMPLE",
        product: product,
        quantity: 1,
        kitTotalAmount: finalPrice,
      });
      toast.success(`${product.name} adicionado!`);
      openCart();
    }
  };

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-xl bg-white shadow-lg transition-all hover:shadow-xl">
      {/* IMAGE SECTION - LINKED */}
      <Link
        href={`/produto/${product.id}`}
        className="relative aspect-square w-full overflow-hidden bg-slate-50 flex items-center justify-center cursor-pointer"
      >
        <SafeImage
          src={product.imageUrl}
          name={product.name}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />

        {product.originalPrice && product.originalPrice > product.price && (
          <div className="absolute left-2 top-2 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white shadow-md z-10">
            Oferta
          </div>
        )}
      </Link>

      {/* CONTENT SECTION */}
      <div className="flex flex-1 flex-col justify-between p-4">
        <Link href={`/produto/${product.id}`} className="block cursor-pointer">
          <h3 className="line-clamp-2 text-base font-semibold text-slate-800 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          <p className="line-clamp-3 text-sm text-slate-500 mt-1">
            {product.description}
          </p>
        </Link>

        <div className="mt-4 flex flex-col gap-3">
          {/* PRICE */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              {product.originalPrice &&
                product.originalPrice > product.price && (
                  <span className="text-xs text-slate-400 line-through">
                    R$ {product.originalPrice.toFixed(2)}
                  </span>
                )}
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-extrabold text-primary whitespace-nowrap">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(finalPrice)}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter shrink-0">
                  / {product.unit || "un"}
                </span>
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          {product.type === "ASSEMBLED_KIT" ? (
            <Button
              onClick={handleAction}
              size="sm"
              className={cn(
                "w-full rounded-xl font-bold shadow-sm transition-all duration-300",
                "bg-purple-600 hover:bg-purple-700 text-white"
              )}
            >
              Montar Kit
            </Button>
          ) : (
            <div className="w-full">
              {/* Lógica de Botão: Se tiver variações (imagens extras com label), obriga a ver detalhes */}
              {product.images && product.images.length > 1 ? (
                <Link href={`/produto/${product.id}`} className="w-full block">
                  <Button
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200 gap-2 font-bold h-10 shadow-sm hover:shadow-md transition-all"
                    variant="ghost"
                  >
                    <ShoppingCart size={16} className="text-slate-500" />
                    Ver Opções
                  </Button>
                </Link>
              ) : (
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white gap-2 font-bold shadow-green-200 shadow-md h-10 transition-all hover:scale-[1.02]"
                  onClick={handleAction}
                >
                  <ShoppingCart size={18} />
                  Adicionar
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
