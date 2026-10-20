"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Product } from "@/types";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cartStore";
import { toast } from "sonner";
import { cn, formatCurrency } from "@/lib/utils";
import { getEffectiveUnitPrice, getEffectiveUnitLabel } from "@/lib/ribbon-pricing";
import { useKitBuilderStore } from "@/store/kitBuilderStore";
// NOVO IMPORT:
import { SafeImage } from "@/components/ui/SafeImage";

interface ProductCardProps {
  product: Product;
  onSelect?: (product: Product) => void;
  actionLabel?: string;
  // A Central de Fitas (`/fitas`) reusa este card pra listar as próprias
  // fitas — sem isso, o link de RIBBON aponta de volta pra `/fitas`,
  // causando um loop de navegação nela mesma (issue #140).
  disableRibbonRedirect?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  actionLabel = "Adicionar",
  disableRibbonRedirect = false,
}) => {
  const { addItem, openCart } = useCartStore();
  const openKitBuilder = useKitBuilderStore((state) => state.openKitBuilder);

  const finalPrice = getEffectiveUnitPrice(product);
  // `null` = não dá pra vender agora (fita sem preço configurado pro
  // estado atual) — nunca tratado como grátis. Kits não dependem disso:
  // o preço deles é calculado ao vivo no KitBuilderModal, não em product.price.
  const priceUnavailable = finalPrice == null && product.type !== "ASSEMBLED_KIT";

  // Fitas não têm PDP standalone como destino "natural" a partir da vitrine:
  // levam pra Central de Fitas (/fitas) já com a fita em questão selecionada,
  // pra o cliente ver as outras fitas e a opção de cortar/criar laço.
  // /produto/[id] continua funcionando via URL direta (issue #117).
  const isRibbonRedirectDisabled =
    disableRibbonRedirect && product.type === "RIBBON";

  const productHref =
    product.type === "RIBBON"
      ? `/fitas?fita=${product.id}&aba=${
          product.ribbonInventory?.status === "FECHADO" ? "fechados" : "abertas"
        }`
      : `/produto/${product.id}`;

  // Removemos todos os useEffects e useStates de imagem daqui.
  // O SafeImage cuida disso agora.

  const handleAction = (e: React.MouseEvent) => {
    e.preventDefault();
    if (product.type === "ASSEMBLED_KIT" && product.id) {
      openKitBuilder();
    } else if (onSelect) {
      onSelect(product);
    } else {
      if (priceUnavailable) return;
      addItem({
        cartId: crypto.randomUUID(),
        type: "SIMPLE",
        product: product,
        quantity: 1,
        kitTotalAmount: finalPrice ?? 0,
      });
      toast.success(`${product.name} adicionado!`);
      openCart();
    }
  };

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-xl bg-white shadow-lg transition-all hover:shadow-xl">
      {/* IMAGE SECTION - LINKED */}
      {isRibbonRedirectDisabled ? (
        <div className="relative aspect-square w-full overflow-hidden bg-slate-50 flex items-center justify-center">
          <SafeImage
            src={product.imageUrl}
            name={product.name}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />

          {product.originalPrice != null &&
            finalPrice != null &&
            product.originalPrice > finalPrice && (
              <div className="absolute left-2 top-2 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white shadow-md z-10">
                Oferta
              </div>
            )}
        </div>
      ) : (
        <Link
          href={productHref}
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

          {product.originalPrice != null &&
            finalPrice != null &&
            product.originalPrice > finalPrice && (
              <div className="absolute left-2 top-2 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white shadow-md z-10">
                Oferta
              </div>
            )}
        </Link>
      )}

      {/* CONTENT SECTION */}
      <div className="flex flex-1 flex-col justify-between p-4">
        {isRibbonRedirectDisabled ? (
          <div className="block">
            <h3 className="line-clamp-2 text-base font-semibold text-slate-800 transition-colors">
              {product.name}
            </h3>
            <p className="line-clamp-3 text-sm text-slate-500 mt-1">
              {product.description}
            </p>
          </div>
        ) : (
          <Link href={productHref} className="block cursor-pointer">
            <h3 className="line-clamp-2 text-base font-semibold text-slate-800 group-hover:text-primary transition-colors">
              {product.name}
            </h3>
            <p className="line-clamp-3 text-sm text-slate-500 mt-1">
              {product.description}
            </p>
          </Link>
        )}

        <div className="mt-4 flex flex-col gap-3">
          {/* PRICE */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              {product.originalPrice != null &&
                finalPrice != null &&
                product.originalPrice > finalPrice && (
                  <span className="text-xs text-slate-400 line-through">
                    R$ {product.originalPrice.toFixed(2)}
                  </span>
                )}
              {finalPrice != null ? (
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-extrabold text-primary whitespace-nowrap">
                    {formatCurrency(finalPrice)}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter shrink-0">
                    / {getEffectiveUnitLabel(product)}
                  </span>
                </div>
              ) : (
                <span className="text-sm font-bold text-slate-400">
                  Preço indisponível
                </span>
              )}
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
              {/* Lógica de Botão: Se tiver variações (imagens extras com label), obriga a ver detalhes.
                  Sem redirect (fita dentro da própria Central), o clique sempre fica no onSelect. */}
              {!isRibbonRedirectDisabled &&
              product.images &&
              product.images.length > 1 ? (
                <Link href={productHref} className="w-full block">
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
                  className="w-full bg-green-600 hover:bg-green-700 text-white gap-2 font-bold shadow-green-200 shadow-md h-10 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                  onClick={handleAction}
                  disabled={priceUnavailable}
                >
                  <ShoppingCart size={18} />
                  {priceUnavailable ? "Indisponível" : "Adicionar"}
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
