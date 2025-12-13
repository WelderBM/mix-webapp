// src/components/features/KitBuilderModal.tsx (VERSÃO FINAL CORRIGIDA)
"use client";

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress"; // Importação assumida
import { ScrollArea } from "@/components/ui/scroll-area"; // Importação assumida
import { toast } from "sonner";
import {
  Package,
  Gift,
  Feather,
  ShoppingCart,
  Check,
  ChevronRight,
  ChevronLeft,
  XCircle,
  AlertTriangle,
  Ruler,
  List,
  Box,
  PlusCircle, // CORREÇÃO: Adicionado PlusCircle
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Stores e Tipos
import { useKitBuilderStore } from "@/store/kitBuilderStore";
import { useProductStore } from "@/store/productStore";
import { useCartStore } from "@/store/cartStore";
import {
  AssembledKitProduct,
  Product,
  CapacityRef,
  CartItem,
} from "@/lib/types";
import { cn } from "@/lib/utils"; // Importação assumida
import { LACO_STYLES_OPTIONS } from "@/lib/ribbon_config";

interface KitBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  assembledKit?: AssembledKitProduct;
}

// Capacidade máxima de slots por gabarito (Duplicado aqui para referência de UI)
const MAX_SLOTS: Record<CapacityRef, number> = {
  P: 5,
  M: 10,
  G: 15,
};

// --- Sub-componente de Item (Para seleção de produtos) ---
interface ItemSelectorProps {
  product: Product;
  onAdd: (product: Product, quantity: number) => void;
  onRemove: (productId: string) => void;
  currentQuantity: number;
  disabled?: boolean;
}

const ItemSelector: React.FC<ItemSelectorProps> = ({
  product,
  onAdd,
  onRemove,
  currentQuantity,
  disabled,
}) => (
  <div
    className={cn(
      "flex justify-between items-center p-3 border rounded-lg transition-all",
      disabled ? "bg-slate-100 opacity-60" : "bg-white hover:border-green-400"
    )}
  >
    <div className="flex items-center space-x-3">
      <div className="w-10 h-10 rounded-md bg-slate-200 relative overflow-hidden shrink-0">
        {product.imageUrl && (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover"
          />
        )}
      </div>
      <div>
        <p className="font-semibold text-sm line-clamp-1">{product.name}</p>
        <p className="text-xs text-slate-500">R$ {product.price.toFixed(2)}</p>
      </div>
    </div>

    <div className="flex items-center space-x-2">
      {currentQuantity > 0 && (
        <Button
          variant="outline"
          size="icon"
          onClick={() => onRemove(product.id)}
          disabled={disabled}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
      )}
      {currentQuantity > 0 && (
        <span className="w-6 text-center text-sm font-bold">
          {currentQuantity}
        </span>
      )}
      <Button
        variant="default"
        size="icon"
        onClick={() => onAdd(product, 1)}
        disabled={disabled}
      >
        <PlusCircle className="w-4 h-4" />
      </Button>
    </div>
  </div>
);

export const KitBuilderModal: React.FC<KitBuilderModalProps> = ({
  isOpen,
  onClose,
  assembledKit,
}) => {
  const router = useRouter();
  // CORREÇÃO: Renomear 'products' para 'allProductsStore'
  const { allProducts: allProductsStore } = useProductStore();
  const { addItem: addCartItem } = useCartStore();

  const {
    currentStep,
    composition,
    setStep,
    setBaseContainer,
    addItem,
    updateItemQuantity,
    removeItem,
    setRibbonSelection,
    calculateKitTotal,
    closeKitBuilder: closeStore,
  } = useKitBuilderStore();

  const kitTotal = calculateKitTotal();
  const progressValue = (currentStep / 3) * 100;

  // Lógica de filtro e memorização
  const availableBases = useMemo(
    () =>
      // CORREÇÃO: Adicionar tipagem explícita 'p is Product'
      allProductsStore.filter(
        (p): p is Product => p.type === "BASE_CONTAINER" && p.inStock
      ),
    [allProductsStore]
  );

  const availableItems = useMemo(
    () =>
      // CORREÇÃO: Adicionar tipagem explícita 'p is Product'
      allProductsStore.filter(
        (p): p is Product =>
          (p.type === "STANDARD_ITEM" || p.type === "FILLER") && p.inStock
      ),
    [allProductsStore]
  );

  const availableAccessories = useMemo(
    () =>
      // CORREÇÃO: Adicionar tipagem explícita 'p is Product'
      allProductsStore.filter(
        (p): p is Product => p.type === "ACCESSORY" && p.inStock
      ),
    [allProductsStore]
  );

  // --- Funções de Navegação e Validação ---

  const isStepValid = useMemo(() => {
    switch (currentStep) {
      case 1:
        // Deve ter uma base selecionada
        return !!composition.baseContainer && !!composition.capacityRef;
      case 2:
        // Deve ter pelo menos um item interno
        return composition.internalItems.length > 0;
      case 3:
        // Deve ter uma seleção de laço
        return !!composition.ribbonSelection;
      default:
        return false;
    }
  }, [currentStep, composition]);

  const nextStep = () => {
    if (isStepValid && currentStep < 3) {
      setStep((currentStep + 1) as 1 | 2 | 3);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setStep((currentStep - 1) as 1 | 2 | 3);
    }
  };

  const handleFinishAssembly = () => {
    if (!isStepValid) {
      return toast.error("Por favor, complete todas as etapas.");
    }

    // 1. Montar o item final do carrinho
    const kitCartItem: CartItem = {
      cartId: crypto.randomUUID(),
      type: "CUSTOM_KIT",
      quantity: 1, // Sempre 1 kit
      kitName: composition.baseContainer!.name,
      kitTotalAmount: kitTotal,
      kitComposition: {
        recipeId: assembledKit?.recipeId || "CUSTOM_NATAL", // ID da receita base ou custom
        baseProductId: composition.baseContainer!.id,
        items: composition.internalItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        finalRibbonDetails:
          composition.ribbonSelection?.type === "CUSTOM"
            ? {
                laçoType: composition.ribbonSelection.ribbonDetails!.modelo,
                fitaId:
                  composition.ribbonSelection.ribbonDetails!.fitaPrincipalId,
              }
            : composition.ribbonSelection?.type === "PRONTO"
            ? {
                accessoryId: composition.ribbonSelection.accessoryId,
                laçoType: "PUXAR", // Usado como placeholder para laço pronto
              }
            : undefined,
      },
      ribbonDetails:
        composition.ribbonSelection?.type === "CUSTOM"
          ? composition.ribbonSelection.ribbonDetails
          : undefined,
      product: composition.baseContainer,
    };

    // 2. Adicionar ao carrinho
    addCartItem(kitCartItem);
    toast.success("Cesta personalizada adicionada ao carrinho!");

    // 3. Fechar e resetar
    closeStore();
    onClose();
    router.push("/carrinho"); // Ou apenas abrir o CartSidebar
  };

  // --- Renderização dos Passos ---

  const renderStep = () => {
    switch (currentStep) {
      case 1: // Escolha da Embalagem Base
        return (
          <ScrollArea className="h-full max-h-[500px] p-2">
            <h4 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-700">
              <Box className="w-5 h-5" /> 1. Escolha a Embalagem Base (Caixa,
              Cesta ou Saco)
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {availableBases.map((base: Product) => {
                // CORREÇÃO: Tipagem explícita
                const isSelected = base.id === composition.baseContainer?.id;
                return (
                  <div
                    key={base.id}
                    onClick={() => setBaseContainer(base)}
                    className={cn(
                      "border-2 rounded-xl p-3 cursor-pointer transition-all relative",
                      base.capacityRef
                        ? `border-dashed border-${
                            base.capacityRef === "P"
                              ? "green"
                              : base.capacityRef === "M"
                              ? "yellow"
                              : "red"
                          }-400`
                        : "",
                      isSelected
                        ? "border-green-600 ring-2 ring-green-300 shadow-lg bg-green-50"
                        : "border-slate-200 hover:border-green-300 bg-white"
                    )}
                  >
                    {isSelected && (
                      <Check className="absolute top-2 right-2 text-green-600 w-5 h-5" />
                    )}
                    <div className="w-full h-20 bg-slate-100 rounded-md mb-2 relative overflow-hidden">
                      {base.imageUrl && (
                        <Image
                          src={base.imageUrl}
                          alt={base.name}
                          fill
                          className="object-contain"
                        />
                      )}
                    </div>
                    <p className="font-bold text-sm line-clamp-2">
                      {base.name}
                    </p>
                    <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
                      <span>R$ {base.price.toFixed(2)}</span>
                      {base.capacityRef && (
                        <span
                          className={cn(
                            "font-bold px-2 py-0.5 rounded-full text-white",
                            base.capacityRef === "P"
                              ? "bg-green-500"
                              : base.capacityRef === "M"
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          )}
                        >
                          {base.capacityRef}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        );

      case 2: // Adição de Itens
        const capacityRef = composition.capacityRef;
        const maxSlots = capacityRef ? MAX_SLOTS[capacityRef] : 0;
        const currentSlotPercentage =
          (composition.currentSlotCount / maxSlots) * 100;
        const isCapacityExceeded = composition.currentSlotCount > maxSlots;

        const handleAddItem = (product: Product, quantity: number) => {
          if (
            composition.internalItems.find(
              (item) => item.product.id === product.id
            )
          ) {
            updateItemQuantity(
              product.id,
              composition.internalItems.find(
                (item) => item.product.id === product.id
              )!.quantity + quantity
            );
          } else {
            addItem(product, quantity);
          }
        };

        const handleRemoveItem = (productId: string) => {
          const item = composition.internalItems.find(
            (item) => item.product.id === productId
          );
          if (item && item.quantity > 1) {
            updateItemQuantity(productId, item.quantity - 1);
          } else if (item && item.quantity === 1) {
            removeItem(productId);
          }
        };

        return (
          <div className="flex flex-col h-full">
            <div className="mb-4">
              <h4 className="text-lg font-semibold flex items-center gap-2 text-slate-700">
                <List className="w-5 h-5" /> 2. Adicione os Itens Internos
              </h4>
              <div className="text-sm mt-2 p-3 rounded-lg border bg-slate-50">
                <p className="font-medium text-slate-600 flex justify-between items-center">
                  <span>Capacidade ({capacityRef}):</span>
                  <span
                    className={
                      isCapacityExceeded
                        ? "text-red-500 font-bold"
                        : "text-slate-800"
                    }
                  >
                    {composition.currentSlotCount} / {maxSlots} slots
                  </span>
                </p>
                {/* CORREÇÃO: Substituir 'indicatorColor' por className */}
                <Progress
                  value={currentSlotPercentage}
                  className={cn(
                    "mt-1",
                    isCapacityExceeded ? "bg-red-500" : "bg-green-500"
                  )}
                />
                {isCapacityExceeded && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Remova itens para
                    continuar.
                  </p>
                )}
              </div>
            </div>

            <ScrollArea className="flex-1 max-h-[400px] p-2">
              <div className="space-y-3">
                {availableItems.map((product: Product) => {
                  // CORREÇÃO: Tipagem explícita
                  const currentQuantity =
                    composition.internalItems.find(
                      (item) => item.product.id === product.id
                    )?.quantity || 0;
                  return (
                    <ItemSelector
                      key={product.id}
                      product={product}
                      onAdd={handleAddItem}
                      onRemove={handleRemoveItem}
                      currentQuantity={currentQuantity}
                      // Se a capacidade estiver excedida, desabilita a adição
                      disabled={isCapacityExceeded}
                    />
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        );

      case 3: // Escolha do Laço e Finalização
        // CORREÇÃO: Tipagem explícita
        const laçosProntos = availableAccessories.filter(
          (a: Product) => a.laçoType && a.laçoType !== "PUXAR"
        );
        // CORREÇÃO: Tipagem explícita
        const laçoPuxar = availableAccessories.find(
          (a: Product) => a.laçoType === "PUXAR"
        );

        return (
          <div className="space-y-6 h-full">
            <h4 className="text-lg font-semibold flex items-center gap-2 text-slate-700">
              <Feather className="w-5 h-5" /> 3. Finalização e Laço
            </h4>

            {/* RESUMO DO LAÇO ESCOLHIDO */}
            <div className="p-4 rounded-lg border border-purple-300 bg-purple-50 text-sm">
              <p className="font-bold mb-2 text-purple-700">Opções de Laço:</p>
              <div className="grid grid-cols-2 gap-4">
                {/* Opção 1: Laço de Puxar Rápido */}
                {laçoPuxar && (
                  <div
                    onClick={() =>
                      setRibbonSelection({
                        type: "PUXAR",
                        accessoryId: laçoPuxar.id,
                      })
                    }
                    className={cn(
                      "border-2 p-3 rounded-lg cursor-pointer transition-all",
                      composition.ribbonSelection?.type === "PUXAR"
                        ? "border-green-600 bg-green-50"
                        : "hover:border-purple-500 bg-white"
                    )}
                  >
                    <p className="font-bold">Laço de Puxar (Rápido)</p>
                    <p className="text-xs text-slate-500">
                      Adicione um laço pronto simples. R${" "}
                      {laçoPuxar.price.toFixed(2)}.
                    </p>
                  </div>
                )}

                {/* Opção 2: Laço Pronto de Estoque */}
                {laçosProntos.length > 0 &&
                  laçosProntos.map(
                    (
                      laco: Product // CORREÇÃO: Tipagem explícita
                    ) => (
                      <div
                        key={laco.id}
                        onClick={() =>
                          setRibbonSelection({
                            type: "PRONTO",
                            accessoryId: laco.id,
                          })
                        }
                        className={cn(
                          "border-2 p-3 rounded-lg cursor-pointer transition-all",
                          composition.ribbonSelection?.type === "PRONTO" &&
                            composition.ribbonSelection.accessoryId === laco.id
                            ? "border-green-600 bg-green-50"
                            : "hover:border-purple-500 bg-white"
                        )}
                      >
                        <p className="font-bold">Laço Pronto {laco.name}</p>
                        <p className="text-xs text-slate-500">
                          Temos este laço confeccionado. R${" "}
                          {laco.price.toFixed(2)}.
                        </p>
                      </div>
                    )
                  )}

                {/* Opção 3: Laço Customizado (Redireciona) */}
                <Link href="/laco-builder" passHref>
                  <div
                    className={cn(
                      "border-2 p-3 rounded-lg cursor-pointer transition-all border-purple-600 bg-purple-100 hover:bg-purple-200"
                    )}
                    onClick={() => {
                      closeStore();
                      onClose();
                    }} // Fecha o modal e navega
                  >
                    <p className="font-bold text-purple-700">
                      Personalizar Laço
                    </p>
                    <p className="text-xs text-purple-600">
                      Crie um laço com modelos Bola ou Borboleta (R$ 2/3/5).
                    </p>
                  </div>
                </Link>

                {/* Opção 4: Sem Laço */}
                <div
                  onClick={() => setRibbonSelection({ type: "NENHUM" })}
                  className={cn(
                    "border-2 p-3 rounded-lg cursor-pointer transition-all",
                    composition.ribbonSelection?.type === "NENHUM"
                      ? "border-green-600 bg-green-50"
                      : "hover:border-slate-500 bg-white"
                  )}
                >
                  <p className="font-bold">Sem Laço</p>
                  <p className="text-xs text-slate-500">
                    Finalizar sem laço decorativo.
                  </p>
                </div>
              </div>
            </div>

            {/* RESUMO TOTAL */}
            <div className="pt-4 border-t border-dashed">
              <h5 className="font-bold text-xl flex justify-between items-center">
                <span>Total da Cesta:</span>
                <span className="text-green-600">R$ {kitTotal.toFixed(2)}</span>
              </h5>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl p-0 h-[80vh] flex flex-col">
        <DialogHeader className="p-6 pb-0 shrink-0">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-slate-900">
            <Gift className="w-7 h-7 text-primary" /> Monte Sua Cesta de
            Presente
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Siga as etapas para criar sua cesta personalizada para o Natal.
          </DialogDescription>

          <div className="mt-4">
            <Progress value={progressValue} className="w-full h-2" />
            <p className="text-xs text-slate-500 mt-1">
              Etapa {currentStep} de 3
            </p>
          </div>
        </DialogHeader>

        {/* BODY DOS PASSOS */}
        <div className="flex-1 overflow-hidden p-6 pt-4">{renderStep()}</div>

        {/* FOOTER DE NAVEGAÇÃO E TOTAL */}
        <div className="flex justify-between items-center p-6 border-t shrink-0">
          <div className="text-sm font-semibold">
            Total Parcial:{" "}
            <span className="text-xl font-bold text-green-600">
              R$ {kitTotal.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-2" /> Anterior
            </Button>

            {currentStep < 3 ? (
              <Button
                onClick={nextStep}
                disabled={!isStepValid}
                style={{ backgroundColor: "var(--primary)" }}
              >
                Próxima Etapa <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleFinishAssembly}
                disabled={!isStepValid}
                className="bg-green-600 hover:bg-green-700 text-white font-bold text-lg h-10"
              >
                <ShoppingCart className="w-5 h-5 mr-2" /> Finalizar Pedido
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
