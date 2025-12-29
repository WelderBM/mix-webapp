"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
  ChevronDown,
  ChevronUp,
  Trash2,
} from "lucide-react";
import { useKitBuilderStore } from "@/store/kitBuilderStore";
import { useProductStore } from "@/store/productStore";
import { useCartStore } from "@/store/cartStore";
import { Product } from "@/types";
import { cn, formatCurrency } from "@/lib/utils";
import { SafeImage } from "../ui/SafeImage";

// Helper de soma segura para evitar 0.1 + 0.2 = 0.3000004
const safeSum = (a: number, b: number) => Number((a + b).toFixed(2));

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
    resetBuilder,
    closeKitBuilder,
  } = useKitBuilderStore();

  // --- CÁLCULO REATIVO DO PREÇO ---
  // Calcula o total baseado na 'composition' que está na tela agora.
  // Isso garante 100% de sincronia visual.
  const kitTotal = useMemo(() => {
    let total = 0;
    // 1. Itens
    composition.internalItems.forEach((item) => {
      total = safeSum(total, (item.product.price || 0) * item.quantity);
    });
    // 2. Base
    if (composition.baseContainer) {
      total = safeSum(total, composition.baseContainer.price || 0);
    }
    // 3. Wrapper
    if (composition.selectedWrapper) {
      total = safeSum(total, composition.selectedWrapper.price || 0);
    }
    return total;
  }, [composition]); // Recalcula sempre que a composição mudar

  const catalog = useMemo(
    () => ({
      items: allProducts.filter((p) => p.type === "STANDARD_ITEM" && p.inStock),
      bases: allProducts.filter(
        (p) => p.type === "BASE_CONTAINER" && p.inStock
      ),
      wrappers: allProducts.filter((p) => p.type === "WRAPPER" && p.inStock),
    }),
    [allProducts]
  );

  const itemsByCategory = useMemo(() => {
    const groups: Record<string, Product[]> = {};
    catalog.items.forEach((item) => {
      const cat = item.category || "Diversos";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return Object.keys(groups)
      .sort()
      .reduce((obj, key) => {
        obj[key] = groups[key];
        return obj;
      }, {} as Record<string, Product[]>);
  }, [catalog.items]);

  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  useEffect(() => {
    const categories = Object.keys(itemsByCategory);
    if (
      isOpen &&
      currentStep === 1 &&
      categories.length > 0 &&
      expandedCategories.length === 0
    ) {
      setExpandedCategories([categories[0]]);
    }
  }, [isOpen, currentStep, itemsByCategory]);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const progress = (currentStep / 4) * 100;

  const handleAddItem = (p: Product) => {
    const result = addItem(p, 1);
    if (!result.success) toast.error(result.reason);
  };

  const handleFinish = () => {
    addCartItem({
      cartId: crypto.randomUUID(),
      type: "CUSTOM_KIT",
      quantity: 1,
      kitName: `Presente ${
        selectedStyle === "CESTA_VITRINE" ? "na Cesta" : "Personalizado"
      }`,
      kitTotalAmount: kitTotal, // Usa o valor calculado
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

  const getItemQuantity = (productId: string) => {
    return (
      composition.internalItems.find((i) => i.product.id === productId)
        ?.quantity || 0
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeKitBuilder()}>
      <DialogContent
        className="max-w-4xl p-0 h-[90vh] flex flex-col overflow-hidden bg-white"
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* HEADER */}
        <DialogHeader className="p-6 pb-2 border-b shrink-0">
          <div className="flex justify-between items-center mb-4">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Gift className="text-primary" /> Montador de Presentes
            </DialogTitle>
            <span className="text-sm font-bold text-primary">
              {formatCurrency(kitTotal)}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          <div className="flex-1 flex flex-col border-r min-h-0">
            <div className="flex-1 overflow-y-auto p-6 pb-24 custom-scrollbar">
              {/* PASSO 1 */}
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
                  <div className="space-y-3">
                    {Object.entries(itemsByCategory).map(
                      ([category, items]) => {
                        const isExpanded =
                          expandedCategories.includes(category);
                        return (
                          <div
                            key={category}
                            className="border rounded-xl overflow-hidden bg-white shadow-sm"
                          >
                            <button
                              onClick={() => toggleCategory(category)}
                              className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
                            >
                              <span className="font-bold text-slate-800 flex items-center gap-2">
                                {category}
                                <span className="text-xs font-normal text-slate-500 bg-white px-2 py-0.5 rounded-full border">
                                  {items.length}
                                </span>
                              </span>
                              {isExpanded ? (
                                <ChevronUp
                                  className="text-slate-400"
                                  size={20}
                                />
                              ) : (
                                <ChevronDown
                                  className="text-slate-400"
                                  size={20}
                                />
                              )}
                            </button>
                            {isExpanded && (
                              <div className="p-4 bg-white border-t animate-in slide-in-from-top-2 fade-in duration-200">
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                  {items.map((p) => {
                                    const qty = getItemQuantity(p.id);
                                    return (
                                      <div
                                        key={p.id}
                                        className={cn(
                                          "border rounded-xl p-3 flex flex-col gap-2 bg-white transition-all group",
                                          qty > 0
                                            ? "border-primary ring-1 ring-primary/20"
                                            : "hover:border-primary"
                                        )}
                                      >
                                        <div className="relative aspect-square rounded-lg overflow-hidden bg-slate-100">
                                          <SafeImage
                                            src={p.imageUrl}
                                            name={p.type}
                                            alt={p.name}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform"
                                          />
                                          {qty > 0 && (
                                            <div className="absolute top-2 right-2 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                              {qty}x
                                            </div>
                                          )}
                                        </div>
                                        <p
                                          className="text-sm font-bold line-clamp-1"
                                          title={p.name}
                                        >
                                          {p.name}
                                        </p>
                                        <p className="text-xs text-primary font-bold">
                                          {formatCurrency(p.price)}
                                        </p>
                                        <div className="mt-auto pt-1">
                                          {qty === 0 ? (
                                            <Button
                                              size="sm"
                                              onClick={() => handleAddItem(p)}
                                              className="w-full"
                                            >
                                              <Plus className="w-4 h-4 mr-1" />{" "}
                                              Adicionar
                                            </Button>
                                          ) : (
                                            <div className="flex items-center justify-between w-full h-9 bg-slate-50 rounded-md border border-slate-200 overflow-hidden">
                                              <button
                                                onClick={() =>
                                                  updateItemQuantity(
                                                    p.id,
                                                    qty - 1
                                                  )
                                                }
                                                className="h-full px-3 hover:bg-red-50 hover:text-red-600 text-slate-500 transition-colors flex items-center justify-center border-r border-slate-100"
                                              >
                                                {qty === 1 ? (
                                                  <Trash2 size={14} />
                                                ) : (
                                                  <Minus size={14} />
                                                )}
                                              </button>
                                              <span className="text-sm font-bold text-slate-800 flex-1 text-center">
                                                {qty}
                                              </span>
                                              <button
                                                onClick={() => handleAddItem(p)}
                                                className="h-full px-3 hover:bg-primary/10 hover:text-primary text-slate-500 transition-colors flex items-center justify-center border-l border-slate-100"
                                              >
                                                <Plus size={14} />
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              )}

              {/* PASSO 2 */}
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
                    {[
                      {
                        id: "SACO_EXPRESS",
                        label: "Saco de Presente",
                        desc: "Prático, rápido e econômico.",
                        icon: <ShoppingBag />,
                        color: "blue",
                      },
                      {
                        id: "CAIXA_FECHADA",
                        label: "Caixa Surpresa",
                        desc: "Elegante e misterioso com seda.",
                        icon: <Box />,
                        color: "purple",
                      },
                      {
                        id: "CESTA_VITRINE",
                        label: "Cesta Vitrine",
                        desc: "A opção mais premium e visual.",
                        icon: <Gift />,
                        color: "orange",
                      },
                    ].map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setStyle(style.id as any)}
                        className={cn(
                          "flex items-center gap-4 p-4 border-2 rounded-2xl text-left transition-all",
                          selectedStyle === style.id
                            ? "border-primary bg-primary/5"
                            : "hover:border-slate-300"
                        )}
                      >
                        <div
                          className={`p-3 bg-${style.color}-100 rounded-full text-${style.color}-600`}
                        >
                          {style.icon}
                        </div>
                        <div>
                          <p className="font-bold">{style.label}</p>
                          <p className="text-xs text-slate-500">{style.desc}</p>
                        </div>
                        {selectedStyle === style.id && (
                          <Check className="ml-auto text-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* PASSO 3 */}
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
                                src={base.imageUrl}
                                name={base.type}
                                alt={base.name}
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
                          <div className="w-10 h-10 relative bg-slate-100 rounded overflow-hidden">
                            <SafeImage
                              src={w.imageUrl}
                              name={w.type}
                              alt={w.name}
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

              {/* PASSO 4 */}
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
                        <span>Mão de obra</span>
                        <span className="font-bold">Incluído</span>
                      </div>
                      <div className="flex justify-between text-primary font-bold text-lg pt-2 border-t">
                        <span>Total</span>
                        <span>{formatCurrency(kitTotal)}</span>
                      </div>
                    </div>
                  </div>

                  {/* RESUMO MOBILE (Somente no Passo 4) */}
                  <div className="md:hidden space-y-4">
                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                      <List size={16} /> Itens do Kit
                    </h4>
                    <div className="space-y-3">
                      {composition.internalItems.map((item) => (
                        <div
                          key={item.product.id}
                          className="flex gap-3 bg-white p-2 rounded-lg border shadow-sm"
                        >
                          <div className="w-12 h-12 relative rounded overflow-hidden shrink-0 bg-slate-100">
                            <SafeImage
                              src={item.product.imageUrl}
                              name={item.product.type}
                              alt={item.product.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <p className="text-sm font-bold text-slate-800 line-clamp-2">
                                {item.product.name}
                              </p>
                              <p className="text-xs font-bold text-slate-500 whitespace-nowrap ml-2">
                                x{item.quantity}
                              </p>
                            </div>
                            <p className="text-xs text-primary font-bold mt-1">
                              {formatCurrency(item.product.price || 0)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SIDEBAR RESUMO (Desktop) */}
          <div className="hidden md:flex w-80 bg-slate-50 p-6 flex-col gap-4 border-l min-h-0">
            <h4 className="font-bold text-slate-700 flex items-center gap-2 text-sm uppercase tracking-wider shrink-0">
              <List size={14} /> Seu Kit
            </h4>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <div className="space-y-3">
                {composition.internalItems.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex gap-3 bg-white p-2 rounded-lg border shadow-sm group"
                  >
                    <div className="w-10 h-10 relative rounded overflow-hidden shrink-0">
                      <SafeImage
                        src={item.product.imageUrl}
                        name={item.product.type}
                        alt={item.product.name}
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
            </div>
            {composition.baseContainer && (
              <div className="bg-white p-3 rounded-xl border border-primary/20 shrink-0">
                <div className="flex justify-between text-[10px] font-bold mb-1 uppercase text-slate-400">
                  <span>Espaço</span>
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

        {/* FOOTER */}
        <div className="p-6 border-t bg-white flex justify-between items-center shrink-0">
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
                {formatCurrency(kitTotal)}
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
