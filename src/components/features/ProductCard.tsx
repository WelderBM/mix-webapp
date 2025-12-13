// src/components/features/ProductCard.tsx (VERSÃO FINAL CONSOLIDADA E CORRIGIDA)

"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ShoppingCart,
  DollarSign,
  Package,
  Gift,
  Feather,
  Box,
  SquareStack,
  ShoppingBag,
} from "lucide-react";
import { Product, ProductType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cartStore";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useKitBuilderStore } from "@/store/kitBuilderStore";

interface ProductCardProps {
  product: Product;
  onSelect?: (product: Product) => void;
  actionLabel?: string;
}

// Mapeamento de caminhos das imagens placeholder consolidadas
const PLACEHOLDER_MAP: Record<ProductType | "DEFAULT", string> = {
  // Fitas e Acessórios de Laço
  RIBBON: "/assets/placeholders/placeholder_fita_rolo.webp",
  ACCESSORY: "/assets/placeholders/placeholder_fita_rolo.webp",

  // Bases e Kits Montados (Cestas)
  BASE_CONTAINER: "/assets/placeholders/placeholder_cesta_base.webp",
  ASSEMBLED_KIT: "/assets/placeholders/placeholder_cesta_base.webp",

  // Itens e outros
  STANDARD_ITEM: "/assets/placeholders/placeholder_produto_padrao.webp",
  FILLER: "/assets/placeholders/placeholder_enchimento.webp",
  WRAPPER: "/assets/placeholders/placeholder_embalagem_saco.webp",

  DEFAULT: "/assets/placeholders/placeholder_produto_padrao.webp", // Fallback
};

// Funçao auxiliar que retorna o caminho
const getPlaceholderUrl = (type: ProductType) => {
  return PLACEHOLDER_MAP[type] || PLACEHOLDER_MAP["DEFAULT"];
};

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  actionLabel = "Adicionar",
}) => {
  const { addItem, openCart } = useCartStore();
  const openKitBuilder = useKitBuilderStore((state) => state.openKitBuilder);

  const finalPrice = product.price;

  const handleAction = (e: React.MouseEvent) => {
    e.preventDefault();

    if (product.type === "ASSEMBLED_KIT" && product.id) {
      openKitBuilder(product.id);
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

  const imageUrl = product.imageUrl || getPlaceholderUrl(product.type);

  return (
    <Link href={`/produto/${product.id}`} passHref>
      <div className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-xl bg-white shadow-lg transition-all hover:shadow-xl">
        {/* Imagem / Placeholder */}
        <div className="relative aspect-square w-full overflow-hidden bg-slate-50">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />

          {/* Badge de Oferta (Opcional) */}
          {product.originalPrice && product.originalPrice > product.price && (
            <div className="absolute left-2 top-2 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white shadow-md">
              Oferta
            </div>
          )}
        </div>

        {/* Detalhes do Produto */}
        <div className="flex flex-1 flex-col justify-between p-4">
          <h3 className="line-clamp-2 text-base font-semibold text-slate-800">
            {product.name}
          </h3>
          <p className="line-clamp-3 text-sm text-slate-500">
            {product.description}
          </p>

          <div className="mt-3 flex items-center justify-between">
            <div className="flex flex-col">
              {product.originalPrice &&
                product.originalPrice > product.price && (
                  <span className="text-xs text-slate-400 line-through">
                    R$ {product.originalPrice.toFixed(2)}
                  </span>
                )}
              <span className="text-xl font-extrabold text-primary">
                R$ {finalPrice.toFixed(2)}
              </span>
            </div>

            <Button
              onClick={handleAction}
              size="sm"
              className={cn(
                "rounded-lg transition-all duration-300",
                product.type === "ASSEMBLED_KIT"
                  ? "bg-purple-600 hover:bg-purple-700"
                  : "bg-green-600 hover:bg-green-700"
              )}
            >
              {actionLabel === "Adicionar" ? (
                <ShoppingCart className="h-4 w-4" />
              ) : (
                actionLabel
              )}
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
