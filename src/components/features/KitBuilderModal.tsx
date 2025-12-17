"use client";

import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Gift,
  Feather,
  ShoppingCart,
  Check,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  List,
  Box,
  PlusCircle,
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
  ProductType,
} from "@/types";
import { cn } from "@/lib/utils";

interface KitBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  assembledKit?: AssembledKitProduct;
}

// Capacidade máxima de slots por gabarito
const MAX_SLOTS: Record<CapacityRef, number> = {
  P: 5,
  M: 10,
  G: 15,
};

// Mapeamento de caminhos das imagens placeholder
const PLACEHOLDER_MAP: Record<ProductType | "DEFAULT", string> = {
  RIBBON: "/assets/placeholders/placeholder_fita_rolo.webp",
  ACCESSORY: "/assets/placeholders/placeholder_fita_rolo.webp",
  BASE_CONTAINER: "/assets/placeholders/placeholder_cesta_base.webp",
  ASSEMBLED_KIT: "/assets/placeholders/placeholder_cesta_base.webp",
  STANDARD_ITEM: "/assets/placeholders/placeholder_produto_padrao.webp",
  FILLER: "/assets/placeholders/placeholder_enchimento.webp",
  WRAPPER: "/assets/placeholders/placeholder_embalagem_saco.webp",
  DEFAULT: "/assets/placeholders/placeholder_produto_padrao.webp",
};

// Função auxiliar que retorna o caminho da imagem
const getPlaceholderUrl = (type: ProductType) => {
  return PLACEHOLDER_MAP[type] || PLACEHOLDER_MAP["DEFAULT"];
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
}) => {
  const imageUrl = product.imageUrl || getPlaceholderUrl(product.type);

  return (
    <div
      className={cn(
        "flex justify-between items-center p-3 border rounded-lg transition-all",
        disabled ? "bg-slate-100 opacity-60" : "bg-white hover:border-green-400"
      )}
    >
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-md bg-slate-200 relative overflow-hidden shrink-0">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover"
          />
        </div>
        <div>
          <p className="font-semibold text-sm line-clamp-1">{product.name}</p>
          <p className="text-xs text-slate-500">
            R$ {product.price.toFixed(2)}
          </p>
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
};

export const KitBuilderModal: React.FC<KitBuilderModalProps> = ({
  isOpen,
  onClose,
  assembledKit,
}) => {
  const router = useRouter();
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

  // Lógica de filtros
  const availableBases = useMemo(
    () =>
      allProductsStore.filter(
        (p): p is Product => p.type === "BASE_CONTAINER" && p.inStock
      ),
    [allProductsStore]
  );

  const availableItems = useMemo(
    () =>
      allProductsStore.filter(
        (p): p is Product =>
          (p.type === "STANDARD_ITEM" || p.type === "FILLER") && p.inStock
      ),
    [allProductsStore]
  );

  const availableAccessories = useMemo(
    () =>
      allProductsStore.filter(
        (p): p is Product => p.type === "ACCESSORY" && p.inStock
      ),
    [allProductsStore]
  );

  // --- Validação ---
  const isStepValid = useMemo(() => {
    switch (currentStep) {
      case 1:
        return !!composition.baseContainer && !!composition.capacityRef;
      case 2:
        return composition.internalItems.length > 0;
      case 3:
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
    if (!isStepValid)
      return toast.error("Por favor, complete todas as etapas.");

    const kitCartItem: CartItem = {
      cartId: crypto.randomUUID(),
      type: "CUSTOM_KIT",
      quantity: 1,
      kitName: composition.baseContainer!.name,
      kitTotalAmount: kitTotal,
      kitComposition: {
        recipeId: assembledKit?.recipeId || "CUSTOM_NATAL",
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
                laçoType: "PUXAR",
              }
            : undefined,
      },
      ribbonDetails:
        composition.ribbonSelection?.type === "CUSTOM"
          ? composition.ribbonSelection.ribbonDetails
          : undefined,
      product: composition.baseContainer ?? undefined,
    };

    addCartItem(kitCartItem);
    toast.success("Cesta personalizada adicionada ao carrinho!");
    closeStore();
    onClose();
    router.push("/carrinho");
  };

  // --- Renderização dos Passos ---
  const renderStep = () => {
    switch (currentStep) {
      case 1: // Base
        return (
          <ScrollArea className="h-full max-h-[500px] p-2">
            <h4 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-700">
              <Box className="w-5 h-5" /> 1. Escolha a Embalagem Base
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {availableBases.map((base: Product) => {
                const isSelected = base.id === composition.baseContainer?.id;
                const imageUrl = base.imageUrl || getPlaceholderUrl(base.type);
                return (
                  <div
                    key={base.id}
                    onClick={() => setBaseContainer(base)}
                    className={cn(
                      "border-2 rounded-xl p-3 cursor-pointer transition-all relative group",
                      isSelected
                        ? "border-green-600 ring-2 ring-green-300 shadow-lg bg-green-50"
                        : "border-slate-200 hover:border-green-300 bg-white"
                    )}
                  >
                    {isSelected && (
                      <Check className="absolute top-2 right-2 text-green-600 w-5 h-5" />
                    )}
                    <div className="w-full h-20 bg-slate-100 rounded-md mb-2 relative overflow-hidden group-hover:scale-105 transition-transform">
                      <Image
                        src={imageUrl}
                        alt={base.name}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <p className="font-bold text-sm line-clamp-2">
                      {base.name}
                    </p>
                    <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
                      {/* Preço oculto ou discreto nesta etapa */}
                      <span>Base</span>
                      {base.capacityRef && (
                        <span
                          className={cn(
                            "font-bold px-2 py-0.5 rounded-full text-white text-[10px]",
                            base.capacityRef === "P"
                              ? "bg-green-500"
                              : base.capacityRef === "M"
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          )}
                        >
                          TAM: {base.capacityRef}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        );

      case 2: // Itens (Com Barra Inteligente)
        const capacityRef = composition.capacityRef as CapacityRef | undefined;
        const maxSlots = capacityRef ? MAX_SLOTS[capacityRef] : 0;
        const currentSlotPercentage = Math.min(
          (composition.currentSlotCount / maxSlots) * 100,
          100
        );
        const isCapacityExceeded = composition.currentSlotCount > maxSlots;

        // Lógica de "Smart Progress"
        let progressColor = "bg-slate-300";
        let progressMessage = "Vamos encher essa cesta?";
        if (isCapacityExceeded) {
          progressColor = "bg-red-500";
          progressMessage = "Ops! Capacidade excedida.";
        } else if (currentSlotPercentage > 80) {
          progressColor = "bg-purple-600";
          progressMessage = "Perfeito! Cesta bem recheada.";
        } else if (currentSlotPercentage > 40) {
          progressColor = "bg-green-500";
          progressMessage = "Está ficando linda! Cabe mais.";
        } else if (currentSlotPercentage > 0) {
          progressColor = "bg-yellow-400";
          progressMessage = "Começando bem...";
        }

        const handleAddItem = (product: Product, quantity: number) => {
          const existing = composition.internalItems.find(
            (item) => item.product.id === product.id
          );
          if (existing) {
            updateItemQuantity(product.id, existing.quantity + quantity);
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
          } else if (item) {
            removeItem(productId);
          }
        };

        return (
          <div className="flex flex-col h-full">
            <div className="mb-4">
              <h4 className="text-lg font-semibold flex items-center gap-2 text-slate-700">
                <List className="w-5 h-5" /> 2. Adicione os Mimos
              </h4>

              {/* BARRA DE PROGRESSO INTELIGENTE */}
              <div className="mt-2 p-3 rounded-lg border bg-slate-50 transition-colors duration-300">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Ocupação da Cesta
                  </span>
                  <span
                    className={cn(
                      "text-sm font-bold",
                      isCapacityExceeded ? "text-red-600" : "text-slate-700"
                    )}
                  >
                    {Math.round(currentSlotPercentage)}%
                  </span>
                </div>

                <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all duration-500 ease-out",
                      progressColor
                    )}
                    style={{ width: `${currentSlotPercentage}%` }}
                  />
                </div>

                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-slate-500 italic">
                    💡 {progressMessage}
                  </span>
                  <span className="text-xs text-slate-400">
                    {composition.currentSlotCount}/{maxSlots} slots
                  </span>
                </div>

                {isCapacityExceeded && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1 font-bold animate-pulse">
                    <AlertTriangle className="w-3 h-3" /> Capacidade excedida!
                    Remova itens.
                  </p>
                )}
              </div>
            </div>

            <ScrollArea className="flex-1 max-h-[400px] p-2">
              <div className="space-y-3">
                {availableItems.map((product: Product) => {
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
                      disabled={isCapacityExceeded && currentQuantity === 0}
                    />
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        );

      case 3: // Laço
        const laçosProntos = availableAccessories.filter(
          (a) => a.laçoType && a.laçoType !== "PUXAR"
        );
        const laçoPuxar = availableAccessories.find(
          (a) => a.laçoType === "PUXAR"
        );

        return (
          <div className="space-y-6 h-full">
            <h4 className="text-lg font-semibold flex items-center gap-2 text-slate-700">
              <Feather className="w-5 h-5" /> 3. Finalização e Laço
            </h4>

            <div className="p-4 rounded-lg border border-purple-300 bg-purple-50 text-sm">
              <p className="font-bold mb-2 text-purple-700">
                Escolha o Acabamento:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    <p className="font-bold">Laço Rápido (Puxar)</p>
                    <p className="text-xs text-slate-500">
                      Simples e prático. (+R$ {laçoPuxar.price.toFixed(2)})
                    </p>
                  </div>
                )}

                <Link href="/laco-builder" passHref>
                  <div className="border-2 p-3 rounded-lg cursor-pointer transition-all border-purple-600 bg-purple-100 hover:bg-purple-200 h-full flex flex-col justify-center">
                    <p className="font-bold text-purple-700 flex items-center gap-2">
                      ✨ Personalizar Laço
                    </p>
                    <p className="text-xs text-purple-600">
                      Escolha cor, modelo (Bola/Borboleta) e fitas.
                    </p>
                  </div>
                </Link>

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
                  <p className="text-xs text-slate-500">Apenas embalado.</p>
                </div>
              </div>
            </div>

            {/* RESUMO TOTAL - APENAS NA ÚLTIMA ETAPA */}
            <div className="pt-6 border-t border-dashed animate-in fade-in slide-in-from-bottom-4">
              <h5 className="font-bold text-xl flex justify-between items-center bg-slate-50 p-4 rounded-lg border">
                <span>Total do Kit:</span>
                <span className="text-green-600 text-2xl">
                  R$ {kitTotal.toFixed(2)}
                </span>
              </h5>
              <p className="text-xs text-center text-slate-400 mt-2">
                Itens: {composition.internalItems.length} | Base:{" "}
                {composition.baseContainer?.name}
              </p>
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
            <Gift className="w-7 h-7 text-primary" /> Monte Sua Cesta
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Personalize cada detalhe do seu presente.
          </DialogDescription>
          <div className="mt-4">
            <Progress value={progressValue} className="w-full h-2" />
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden p-6 pt-4">{renderStep()}</div>

        <div className="flex justify-between items-center p-6 border-t shrink-0 bg-slate-50/50">
          {/* LADO ESQUERDO: Preço (Visível apenas no final para UX) */}
          <div className="text-sm font-semibold">
            {currentStep === 3 ? (
              <span className="text-slate-400">Pronto para finalizar?</span>
            ) : (
              <span className="text-slate-400 italic text-xs">
                Continue montando...
              </span>
            )}
          </div>

          {/* LADO DIREITO: Botões */}
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
                className="bg-primary hover:bg-primary/90"
              >
                Próxima Etapa <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleFinishAssembly}
                disabled={!isStepValid}
                className="bg-green-600 hover:bg-green-700 text-white font-bold shadow-green-200 shadow-lg"
              >
                <ShoppingCart className="w-5 h-5 mr-2" /> Adicionar à Sacola
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
