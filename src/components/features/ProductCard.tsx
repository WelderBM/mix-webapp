"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, ImageOff } from "lucide-react";
import { Product, ProductType } from "@/types"; // Verify path: usually @/lib/types or @/types
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cartStore";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useKitBuilderStore } from "@/store/kitBuilderStore";
import { getProductImage, UNIVERSAL_FALLBACK_SVG } from "@/lib/image-utils";

interface ProductCardProps {
  product: Product;
  onSelect?: (product: Product) => void;
  actionLabel?: string;
}

// Named Export (Fixes the error in page.tsx)
export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  actionLabel = "Adicionar",
}) => {
  const { addItem, openCart } = useCartStore();
  const openKitBuilder = useKitBuilderStore((state) => state.openKitBuilder);

  const finalPrice = product.price;

  const [imgSrc, setImgSrc] = useState(
    getProductImage(product.imageUrl, product.type)
  );

  useEffect(() => {
    setImgSrc(getProductImage(product.imageUrl, product.type));
  }, [product]);

  const handleImageError = () => {
    if (imgSrc !== UNIVERSAL_FALLBACK_SVG) {
      setImgSrc(UNIVERSAL_FALLBACK_SVG);
    }
  };

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

  return (
    <Link href={`/produto/${product.id}`} passHref>
      <div className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-xl bg-white shadow-lg transition-all hover:shadow-xl">
        <div className="relative aspect-square w-full overflow-hidden bg-slate-50 flex items-center justify-center">
          {imgSrc === UNIVERSAL_FALLBACK_SVG ? (
            <div className="flex flex-col items-center justify-center text-slate-300">
              <ImageOff className="w-12 h-12 mb-2 opacity-50" />
              <span className="text-xs font-medium">Sem imagem</span>
            </div>
          ) : (
            <Image
              src={imgSrc}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              onError={handleImageError}
            />
          )}
          {product.originalPrice && product.originalPrice > product.price && (
            <div className="absolute left-2 top-2 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white shadow-md z-10">
              Oferta
            </div>
          )}
        </div>
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

// Default Export (Keeps compatibility with files using default import)
export default ProductCard;
