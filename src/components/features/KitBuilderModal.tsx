"use client";

import { useState } from "react";
import { useKitStore } from "@/store/kitStore";
import { useProductStore } from "@/store/productStore";
import { useCartStore } from "@/store/cartStore";
import { Product, CartItem } from "@/lib/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  ChevronRight,
  ChevronLeft,
  ShoppingBag,
  X,
  ThumbsUp,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ProductCard } from "./ProductCard";

export function KitBuilderModal() {
  const {
    isOpen,
    closeBuilder,
    currentStep,
    setStep,
    narrative,
    selectedBase,
    selectedItems,
    selectedFiller,
    selectedRibbon,
    currentCapacityUsage,
    selectBase,
    addItem,
    removeItem,
    selectFiller,
    selectRibbon,
    resetKit,
  } = useKitStore();

  const { allProducts } = useProductStore();
  const products = allProducts;

  const { addItem: addCartItem, openCart } = useCartStore();

  const [shake, setShake] = useState(false);

  const baseProducts = products.filter((p) => p.type === "BASE_CONTAINER");
  const standardProducts = products.filter((p) => p.type === "STANDARD_ITEM");
  const fillerProducts = products.filter((p) => p.type === "FILLER");
  const ribbonProducts = products.filter((p) => p.type === "RIBBON");

  const formatMoney = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const calculateTotal = () => {
    let total = 0;
    if (selectedBase) total += selectedBase.price;
    selectedItems.forEach((i) => (total += i.price));
    if (selectedFiller) total += selectedFiller.price;
    if (selectedRibbon) total += selectedRibbon.price;
    return total;
  };

  const maxCapacity = selectedBase?.capacity || 10;
  const isFull = currentCapacityUsage >= maxCapacity;
  const capacityPercentage = Math.min(
    (currentCapacityUsage / maxCapacity) * 100,
    100
  );

  const handleAddItem = (product: Product) => {
    const itemSize = product.itemSize || 1;
    if (currentCapacityUsage + itemSize > maxCapacity) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    addItem(product);
  };

  const handleNext = () => {
    if (currentStep === 1 && !selectedBase)
      return alert("Escolha uma caixa primeiro!");
    if (currentStep < 3) {
      setStep(currentStep + 1);
    } else {
      handleFinishKit();
    }
  };

  const handleFinishKit = () => {
    if (!selectedBase) return;

    const components = [
      selectedBase,
      ...selectedItems,
      ...(selectedFiller ? [selectedFiller] : []),
      ...(selectedRibbon ? [selectedRibbon] : []),
    ];

    const kitItem: CartItem = {
      cartId: crypto.randomUUID(),
      type: "CUSTOM_KIT",
      kitName: `Kit Personalizado ${selectedBase.name}`,
      kitComponents: components,
      kitTotalAmount: calculateTotal(),
      quantity: 1,
    };

    addCartItem(kitItem);
    closeBuilder();
    resetKit();
    setTimeout(() => {
      openCart();
    }, 300);
  };

  const handleBack = () => {
    if (currentStep > 1) setStep(currentStep - 1);
  };

  const renderProductGrid = (
    items: Product[],
    onSelect: (p: Product) => void,
    isSelected: (p: Product) => boolean,
    onRemove?: (p: Product) => void
  ) => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-4">
      {items.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          isSelected={isSelected(product)}
          onSelect={() => onSelect(product)}
          onRemove={onRemove ? () => onRemove(product) : undefined}
          actionLabel="Selecionar"
          disabled={
            currentStep === 2 &&
            isFull &&
            !isSelected(product) &&
            product.type === "STANDARD_ITEM"
          }
        />
      ))}
    </div>
  );

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeBuilder()}>
      <SheetContent
        side="bottom"
        className="h-[90vh] rounded-t-3xl p-0 flex flex-col bg-slate-50 border-t-0 shadow-2xl"
      >
        <div className="bg-white border-b flex-none rounded-t-3xl shadow-sm w-full z-20">
          <div className="max-w-4xl mx-auto p-4 md:p-6">
            <SheetHeader className="mb-4">
              <SheetTitle className="flex items-center justify-between">
                <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Montando seu Kit
                </span>
                <Badge
                  variant="outline"
                  className="text-slate-500 border-slate-300"
                >
                  Etapa {currentStep} de 3
                </Badge>
              </SheetTitle>
            </SheetHeader>

            <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 relative overflow-hidden transition-all">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <ShoppingBag size={48} className="text-purple-500" />
              </div>
              <p className="text-sm text-purple-800 italic font-medium relative z-10 pr-8 mb-2 line-clamp-2">
                "{narrative}"
              </p>

              {currentStep === 2 && selectedBase && (
                <div
                  className={cn(
                    "relative z-10 mt-2 transition-transform duration-200",
                    shake && "translate-x-1"
                  )}
                >
                  <div className="flex justify-between text-xs mb-1 font-semibold transition-colors duration-300">
                    <span
                      className={cn(
                        shake
                          ? "text-red-600"
                          : isFull
                          ? "text-green-700"
                          : "text-purple-700"
                      )}
                    >
                      {isFull ? "Caixa Completa!" : "Espaço na caixa"}
                    </span>
                    <span
                      className={cn(
                        shake
                          ? "text-red-600"
                          : isFull
                          ? "text-green-700"
                          : "text-purple-700"
                      )}
                    >
                      {currentCapacityUsage} / {maxCapacity} slots
                    </span>
                  </div>
                  <div
                    className={cn(
                      "w-full h-3 rounded-full overflow-hidden border transition-colors duration-300",
                      shake
                        ? "bg-red-50 border-red-200"
                        : isFull
                        ? "bg-green-100 border-green-200"
                        : "bg-purple-100 border-purple-200"
                    )}
                  >
                    <div
                      className={cn(
                        "h-full transition-all duration-500 ease-out",
                        shake
                          ? "bg-red-500"
                          : isFull
                          ? "bg-green-500"
                          : "bg-purple-500"
                      )}
                      style={{ width: `${capacityPercentage}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto w-full">
          <div className="max-w-4xl mx-auto px-4 md:px-6 py-6">
            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-700 text-lg">
                  Escolha a Base
                </h3>
                {renderProductGrid(
                  baseProducts,
                  selectBase,
                  (p) => selectedBase?.id === p.id,
                  (p) => selectBase(null as any) // Allows deselecting
                )}
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-slate-700 text-lg mb-4">
                    Recheio do Kit
                  </h3>

                  {selectedItems.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide snap-x">
                      {/* FIX: Using index as key to allow duplicates without error */}
                      {selectedItems.map((item, index) => (
                        <div
                          key={index}
                          className="flex-shrink-0 bg-white p-2 rounded-lg border shadow-sm flex items-center gap-2 pr-3 animate-in fade-in zoom-in duration-300 snap-center min-w-[140px]"
                        >
                          <div className="relative w-10 h-10 rounded bg-slate-100 overflow-hidden">
                            <Image
                              src={item.imageUrl}
                              alt={`Componente para kit personalizado: ${item.name}`}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="text-xs font-medium truncate w-full">
                              {item.name}
                            </span>
                            <span className="text-xs text-slate-500">
                              {formatMoney(item.price)}
                            </span>
                          </div>
                          <button
                            onClick={() => removeItem(index)}
                            className="text-slate-400 hover:text-red-500 transition-colors p-1"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div
                    className={cn(
                      "transition-all duration-300",
                      isFull && "opacity-90"
                    )}
                  >
                    {renderProductGrid(
                      standardProducts,
                      handleAddItem,
                      (p) => false // Fillers don't get 'selected' state in grid
                    )}
                  </div>

                  {isFull && (
                    <div className="flex items-center justify-center gap-2 p-4 bg-green-50 text-green-700 rounded-lg mt-4 border border-green-200 animate-in slide-in-from-bottom-2">
                      <ThumbsUp size={18} />
                      <span className="font-medium">
                        Sua caixa está completa! Clique em "Próximo".
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-8">
                <div>
                  <h3 className="font-semibold text-slate-700 text-lg mb-3">
                    Fundo (Opcional)
                  </h3>
                  {renderProductGrid(
                    fillerProducts,
                    selectFiller,
                    (p) => selectedFiller?.id === p.id,
                    (p) => selectFiller(null) // Allows deselecting
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-700 text-lg mb-3">
                    Laço & Fita
                  </h3>
                  {renderProductGrid(
                    ribbonProducts,
                    selectRibbon,
                    (p) => selectedRibbon?.id === p.id,
                    (p) => selectRibbon(null) // Allows deselecting
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border-t flex-none mt-auto w-full z-20">
          <div className="max-w-4xl mx-auto p-4 md:p-6">
            <div className="w-full space-y-4">
              <div className="flex items-center justify-between text-lg font-bold text-slate-800">
                <span>Total Estimado</span>
                <span className="text-purple-600">
                  {formatMoney(calculateTotal())}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 1}
                  className="h-12 text-base"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>
                <Button
                  className={cn(
                    "h-12 text-base shadow-lg hover:shadow-xl transition-all duration-500",
                    isFull
                      ? "bg-green-600 hover:bg-green-700 text-white ring-2 ring-green-200 ring-offset-1"
                      : "bg-slate-900 hover:bg-slate-800"
                  )}
                  onClick={handleNext}
                  disabled={currentStep === 2 && selectedItems.length === 0}
                >
                  {currentStep === 3 ? (
                    <>
                      Finalizar Kit <Check className="ml-2 h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Próximo <ChevronRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
