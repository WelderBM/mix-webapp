"use client";

import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Gift,
  ShoppingBag,
  Box,
  ChevronRight,
  Plus,
  Minus,
  Check,
  Info,
  List,
} from "lucide-react";
import { useKitBuilderStore } from "@/store/kitBuilderStore";
import { useProductStore } from "@/store/productStore";
import { useCartStore } from "@/store/cartStore";
import { Product } from "@/types";
import { cn, formatCurrency } from "@/lib/utils";
import { getProductImage } from "@/lib/image-utils";
import { SafeImage } from "../ui/SafeImage";

export function KitBuilderModal() {
  const { allProducts } = useProductStore();
  const { addItem: addCartItem, openCart: openGlobalCart } = useCartStore();

  const {
    isOpen,
    currentStep,
    composition,
    selectedStyle,
    setStep,
    setStyle,
    addItem,
    updateItemQuantity,
    setBaseContainer,
    setWrapper,
    getValidWrappers,
    calculateKitTotal,
    resetBuilder,
    closeKitBuilder,
  } = useKitBuilderStore();

  // Filtragem de produtos por tipo
  const catalog = useMemo(
    () => ({
      items: allProducts.filter((p) => p.type === "STANDARD_ITEM" && p.inStock),
      bases: allProducts.filter(
        (p) => p.type === "BASE_CONTAINER" && p.inStock
      ),
      wrappers: allProducts.filter((p) => p.type === "WRAPPER" && p.inStock),
      fillers: allProducts.filter((p) => p.type === "FILLER" && p.inStock),
    }),
    [allProducts]
  );

  const progress = (currentStep / 4) * 100;

  // --- Handlers ---
  const handleAddItem = (p: Product) => {
    const result = addItem(p, 1);
    if (!result.success) toast.error(result.reason);
  };

  const handleFinish = () => {
    const total = calculateKitTotal();
    addCartItem({
      cartId: crypto.randomUUID(),
      type: "CUSTOM_KIT",
      quantity: 1,
      kitName: `Presente ${
        selectedStyle === "CESTA_VITRINE" ? "na Cesta" : "Personalizado"
      }`,
      kitTotalAmount: total,
      product: composition.baseContainer || undefined,
      kitComposition: {
        baseProductId: composition.baseContainer?.id || "",
        wrapperProductId: composition.selectedWrapper?.id,
        items: composition.internalItems.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
        })),
      },
    });
    toast.success("Presente montado com sucesso!");
    closeKitBuilder();
    resetBuilder();
    openGlobalCart();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeKitBuilder()}>
      <DialogContent className="max-w-4xl p-0 h-[90vh] flex flex-col overflow-hidden">
        {/* HEADER COM PROGRESSO */}
        <DialogHeader className="p-6 pb-2 border-b">
          <div className="flex justify-between items-center mb-4">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Gift className="text-primary" /> Montador de Presentes
            </DialogTitle>
            <span className="text-sm font-bold text-primary">
              R$ {calculateKitTotal().toFixed(2)}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </DialogHeader>

        {/* ÁREA DE CONTEÚDO DINÂMICO */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          <div className="flex-1 flex flex-col border-r">
            <ScrollArea className="flex-1 p-6">
              {/* PASSO 1: ESCOLHA DOS ITENS (O CONTEÚDO) */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <header>
                    <h3 className="text-lg font-bold">
                      1. O que vamos presentear?
                    </h3>
                    <p className="text-sm text-slate-500">
                      Escolha os produtos que irão dentro do presente.
                    </p>
                  </header>
                  <div className="grid grid-cols-2 gap-4">
                    {catalog.items.map((p) => (
                      <div
                        key={p.id}
                        className="border rounded-xl p-3 flex flex-col gap-2 bg-white hover:border-primary transition-colors"
                      >
                        <div className="relative aspect-square rounded-lg overflow-hidden bg-slate-100">
                          <SafeImage
                            src={getProductImage(p.imageUrl, p.type)}
                            alt={p.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <p className="text-sm font-bold line-clamp-1">
                          {p.name}
                        </p>
                        <p className="text-xs text-primary font-bold">
                          {formatCurrency(p.price)}
                        </p>
                        <Button
                          size="sm"
                          onClick={() => handleAddItem(p)}
                          className="w-full"
                        >
                          <Plus className="w-4 h-4 mr-1" /> Adicionar
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PASSO 2: ESTILO DO PRESENTE */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <header>
                    <h3 className="text-lg font-bold">
                      2. Como deseja embalar?
                    </h3>
                    <p className="text-sm text-slate-500">
                      Escolha o formato da apresentação.
                    </p>
                  </header>
                  <div className="grid grid-cols-1 gap-4">
                    <button
                      onClick={() => setStyle("SACO_EXPRESS")}
                      className={cn(
                        "flex items-center gap-4 p-4 border-2 rounded-2xl text-left transition-all",
                        selectedStyle === "SACO_EXPRESS"
                          ? "border-primary bg-primary/5"
                          : "hover:border-slate-300"
                      )}
                    >
                      <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                        <ShoppingBag />
                      </div>
                      <div>
                        <p className="font-bold">Saco de Presente</p>
                        <p className="text-xs text-slate-500">
                          Prático, rápido e econômico.
                        </p>
                      </div>
                      {selectedStyle === "SACO_EXPRESS" && (
                        <Check className="ml-auto text-primary" />
                      )}
                    </button>

                    <button
                      onClick={() => setStyle("CAIXA_FECHADA")}
                      className={cn(
                        "flex items-center gap-4 p-4 border-2 rounded-2xl text-left transition-all",
                        selectedStyle === "CAIXA_FECHADA"
                          ? "border-primary bg-primary/5"
                          : "hover:border-slate-300"
                      )}
                    >
                      <div className="p-3 bg-purple-100 rounded-full text-purple-600">
                        <Box />
                      </div>
                      <div>
                        <p className="font-bold">Caixa Surpresa</p>
                        <p className="text-xs text-slate-500">
                          Elegante e misterioso com seda.
                        </p>
                      </div>
                      {selectedStyle === "CAIXA_FECHADA" && (
                        <Check className="ml-auto text-primary" />
                      )}
                    </button>

                    <button
                      onClick={() => setStyle("CESTA_VITRINE")}
                      className={cn(
                        "flex items-center gap-4 p-4 border-2 rounded-2xl text-left transition-all",
                        selectedStyle === "CESTA_VITRINE"
                          ? "border-primary bg-primary/5"
                          : "hover:border-slate-300"
                      )}
                    >
                      <div className="p-3 bg-orange-100 rounded-full text-orange-600">
                        <Gift />
                      </div>
                      <div>
                        <p className="font-bold">Cesta Vitrine</p>
                        <p className="text-xs text-slate-500">
                          A opção mais premium e visual.
                        </p>
                      </div>
                      {selectedStyle === "CESTA_VITRINE" && (
                        <Check className="ml-auto text-primary" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* PASSO 3: ESCOLHA DA BASE/SACO (FILTRADO) */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <header>
                    <h3 className="text-lg font-bold">
                      3. Escolha a Embalagem
                    </h3>
                    <p className="text-sm text-slate-500">
                      Mostrando apenas opções que comportam seus itens.
                    </p>
                  </header>

                  {/* Se for Cesta ou Caixa, escolhe a base primeiro */}
                  {(selectedStyle === "CESTA_VITRINE" ||
                    selectedStyle === "CAIXA_FECHADA") && (
                    <div className="grid grid-cols-2 gap-4">
                      {catalog.bases
                        .filter((b) => b.kitStyle === selectedStyle)
                        .map((base) => (
                          <div
                            key={base.id}
                            onClick={() => setBaseContainer(base)}
                            className={cn(
                              "cursor-pointer border-2 p-3 rounded-xl transition-all",
                              composition.baseContainer?.id === base.id
                                ? "border-primary bg-primary/5"
                                : "border-slate-100"
                            )}
                          >
                            <div className="relative aspect-video mb-2">
                              <SafeImage
                                src={getProductImage(base.imageUrl, base.type)}
                                alt=""
                                fill
                                className="object-contain"
                              />
                            </div>
                            <p className="text-xs font-bold text-center">
                              {base.name}
                            </p>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Se for Saco Express ou após escolher a base da cesta, escolhe o saco/fechamento */}
                  <div className="mt-8">
                    <h4 className="text-sm font-bold mb-3">
                      Escolha o Saco/Estampa:
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {getValidWrappers(catalog.wrappers).map((w) => (
                        <div
                          key={w.id}
                          onClick={() => setWrapper(w)}
                          className={cn(
                            "cursor-pointer border p-2 rounded-lg flex items-center gap-2",
                            composition.selectedWrapper?.id === w.id
                              ? "border-primary bg-primary/5"
                              : "border-slate-100"
                          )}
                        >
                          <div className="w-10 h-10 relative bg-slate-100 rounded">
                            <SafeImage
                              src={getProductImage(w.imageUrl, w.type)}
                              alt=""
                              fill
                              className="object-cover"
                            />
                          </div>
                          <span className="text-[10px] font-medium leading-tight">
                            {w.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* PASSO 4: RESUMO E FINALIZAÇÃO */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <header>
                    <h3 className="text-lg font-bold">4. Quase pronto!</h3>
                    <p className="text-sm text-slate-500">
                      Confira se está tudo como você deseja.
                    </p>
                  </header>
                  <div className="bg-slate-50 p-4 rounded-2xl border-2 border-dashed border-slate-200">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm">
                        <Check size={32} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">
                          Tudo verificado!
                        </p>
                        <p className="text-xs text-slate-500">
                          Itens cabem perfeitamente na embalagem.
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Mão de obra (Montagem)</span>
                        <span className="font-bold">Incluído</span>
                      </div>
                      <div className="flex justify-between text-primary font-bold text-lg pt-2 border-t">
                        <span>Total</span>
                        <span>{formatCurrency(calculateKitTotal())}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </ScrollArea>
          </div>

          {/* SIDEBAR DE RESUMO (DIREITA) */}
          <div className="w-full md:w-80 bg-slate-50 p-6 flex flex-col gap-4">
            <h4 className="font-bold text-slate-700 flex items-center gap-2 text-sm uppercase tracking-wider">
              <List size={14} /> Seu Kit
            </h4>

            <ScrollArea className="flex-1 pr-2">
              <div className="space-y-3">
                {composition.internalItems.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex gap-3 bg-white p-2 rounded-lg border shadow-sm group"
                  >
                    <div className="w-10 h-10 relative rounded overflow-hidden flex-shrink-0">
                      <SafeImage
                        src={getProductImage(
                          item.product.imageUrl,
                          item.product.type
                        )}
                        alt=""
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate">
                        {item.product.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <button
                          onClick={() =>
                            updateItemQuantity(
                              item.product.id,
                              item.quantity - 1
                            )
                          }
                          className="p-0.5 bg-slate-100 rounded-full hover:bg-slate-200"
                        >
                          <Minus size={10} />
                        </button>
                        <span className="text-xs font-bold">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateItemQuantity(
                              item.product.id,
                              item.quantity + 1
                            )
                          }
                          className="p-0.5 bg-slate-100 rounded-full hover:bg-slate-200"
                        >
                          <Plus size={10} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {composition.internalItems.length === 0 && (
                  <div className="text-center py-10 opacity-40">
                    <Info className="mx-auto mb-2" />
                    <p className="text-xs">Nenhum item adicionado</p>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* STATUS DE CAPACIDADE */}
            {composition.baseContainer && (
              <div className="bg-white p-3 rounded-xl border border-primary/20">
                <div className="flex justify-between text-[10px] font-bold mb-1 uppercase text-slate-400">
                  <span>Espaço Ocupado</span>
                  <span>{composition.currentSlotCount} slots</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{
                      width: `${
                        (composition.currentSlotCount /
                          (composition.baseContainer.capacity || 10)) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER - NAVEGAÇÃO */}
        <div className="p-6 border-t bg-white flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={
              currentStep === 1
                ? closeKitBuilder
                : () => setStep(currentStep - 1)
            }
          >
            {currentStep === 1 ? "Cancelar" : "Voltar"}
          </Button>

          <div className="flex items-center gap-3">
            <div className="hidden md:block text-right">
              <p className="text-[10px] text-slate-400 font-bold uppercase">
                Total Estimado
              </p>
              <p className="font-bold text-primary">
                {formatCurrency(calculateKitTotal())}
              </p>
            </div>

            {currentStep < 4 ? (
              <Button
                onClick={() => setStep(currentStep + 1)}
                disabled={
                  (currentStep === 1 &&
                    composition.internalItems.length === 0) ||
                  (currentStep === 2 && !selectedStyle) ||
                  (currentStep === 3 && !composition.selectedWrapper)
                }
                className="gap-2"
              >
                Próximo <ChevronRight size={16} />
              </Button>
            ) : (
              <Button
                onClick={handleFinish}
                className="bg-green-600 hover:bg-green-700 text-white font-bold gap-2"
              >
                <Check size={18} /> Finalizar e Comprar
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
