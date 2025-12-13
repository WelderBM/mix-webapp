// src/components/features/KitBuilderModal.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { create } from "zustand";
import {
  AssembledKitProduct,
  KitRecipe,
  KitComponentType,
  Product,
  LacoModelType,
  CartItem,
} from "@/lib/types";
import { useKitStore } from "@/store/kitStore";
import { useProductStore } from "@/store/productStore";
import { useCartStore } from "@/store/cartStore";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ArrowRight,
  Package,
  Gift,
  ShoppingCart,
  Minus,
  Plus,
  Scissors,
  CheckCircle2,
} from "lucide-react";
import Image from "next/image";

// =================================================================
// Estado Local do Builder
// =================================================================

interface BuilderState {
  baseProduct?: Product;
  fillerQuantities: Record<string, number>; // {productId: quantity}
  selectedLaco: {
    type: KitComponentType | null;
    id: string | null; // ID da Fita (para serviço) ou ID do ACCESSORY (para pronto)
    model: LacoModelType | null; // Modelo para laço customizado
    size: "P" | "M" | "G" | null;
  };
}

const useBuilderLocalState = create(
  () =>
    ({
      baseProduct: undefined,
      fillerQuantities: {},
      selectedLaco: {
        type: null,
        id: null,
        model: null,
        size: null,
      },
    } as BuilderState)
);

// --- CORREÇÕES DE TIPAGEM E CUSTO AQUI ---

// Tipo auxiliar para os laços que possuem custo de mão de obra (serviço)
type CustomServiceLacoModel = Exclude<LacoModelType, "PUXAR">;

const LACO_METRAGEM_BASE = { P: 2.0, M: 3.5, G: 5.0 }; // Metragem de fita gasta
// Agora LACO_MENSAL_COST está tipado corretamente
const LACO_MENSAL_COST: Record<CustomServiceLacoModel, number> = {
  BOLA: 2.0,
  COMUM_CHANEL: 4.0,
}; // Mão de obra do laço (CUSTOM_RIBBON)

const calculateLacoCost = (
  lacoDetails: BuilderState["selectedLaco"],
  allProducts: Product[]
): { cost: number; name: string } => {
  if (lacoDetails.type === "LAÇO_PRONTO" && lacoDetails.id) {
    const accessory = allProducts.find((p) => p.id === lacoDetails.id);
    return {
      cost: accessory?.price || 0,
      name: accessory?.name || "Laço Pronto",
    };
  }

  if (
    lacoDetails.type === "RIBBON_SERVICE" &&
    lacoDetails.id &&
    lacoDetails.model &&
    lacoDetails.size
  ) {
    const ribbon = allProducts.find((p) => p.id === lacoDetails.id);
    const meterPrice = ribbon?.price || 0;
    const metragem = LACO_METRAGEM_BASE[lacoDetails.size];

    // Casting seguro, pois sabemos que o modelo será BOLA ou COMUM_CHANEL no serviço
    const customModel = lacoDetails.model as CustomServiceLacoModel;
    const assemblyCost = LACO_MENSAL_COST[customModel];

    const totalCost = meterPrice * metragem + assemblyCost;
    return {
      cost: totalCost,
      name: `Laço ${customModel} (${lacoDetails.size})`,
    };
  }

  return { cost: 0, name: "Nenhum Laço" };
};

// =================================================================
// COMPONENTE PRINCIPAL (restante do código)
// =================================================================

interface KitBuilderModalProps {
  assembledKit: AssembledKitProduct;
  isOpen: boolean;
  onClose: () => void;
}

export function KitBuilderModal({
  assembledKit,
  isOpen,
  onClose,
}: KitBuilderModalProps) {
  const [step, setStep] = useState(1);
  const { allProducts } = useProductStore();
  const { getRecipeById } = useKitStore();
  const { addItem } = useCartStore();
  const localState = useBuilderLocalState();
  const setLocalState = useBuilderLocalState.setState;

  const recipe = useMemo(
    () => getRecipeById(assembledKit.recipeId),
    [assembledKit.recipeId, getRecipeById]
  );

  // Filtros de produtos disponíveis
  const availableFillers = useMemo(() => {
    return allProducts.filter(
      (p) =>
        p.type !== "BASE_CONTAINER" &&
        p.type !== "ASSEMBLED_KIT" &&
        p.type !== "RIBBON" &&
        !p.disabled
    );
  }, [allProducts]);

  const availableRibbons = useMemo(() => {
    return allProducts.filter(
      (p) => p.type === "RIBBON" && !p.disabled && p.canBeSoldAsRoll
    );
  }, [allProducts]);

  const availableReadyLaços = useMemo(() => {
    return allProducts.filter(
      (p) => p.type === "ACCESSORY" && p.laçoType && !p.disabled
    );
  }, [allProducts]);

  // Efeito para inicializar a Base e os Fillers Padrão
  useEffect(() => {
    if (recipe && isOpen) {
      const baseComponent = recipe.components.find((c) => c.type === "BASE");
      const baseProduct = allProducts.find(
        (p) => p.id === baseComponent?.componentId
      );

      // 1. Inicializa a Base
      if (baseProduct) {
        setLocalState({ baseProduct: baseProduct });
      }

      // 2. Inicializa os Fillers Padrão
      const newFillerQuantities: Record<string, number> = {};
      recipe.components
        .filter((c) => c.type === "FILLER")
        .forEach((c) => {
          // Só adiciona se o produto estiver ativo
          if (!allProducts.find((p) => p.id === c.componentId)?.disabled) {
            newFillerQuantities[c.componentId] = c.defaultQuantity;
          }
        });
      setLocalState({ fillerQuantities: newFillerQuantities });

      // 3. Reseta o laço (para uma nova montagem)
      setLocalState({
        selectedLaco: { type: null, id: null, model: null, size: null },
      });
    } else if (!isOpen) {
      // Limpa o estado local ao fechar o modal
      useBuilderLocalState.setState({
        baseProduct: undefined,
        fillerQuantities: {},
        selectedLaco: { type: null, id: null, model: null, size: null },
      });
    }
  }, [recipe, allProducts, isOpen, setLocalState]);

  // =================================================================
  // CÁLCULOS E VALIDAÇÕES GERAIS
  // =================================================================

  // Custo dos Recheios
  const fillersCost = useMemo(() => {
    return Object.entries(localState.fillerQuantities).reduce(
      (total, [id, qty]) => {
        const product = allProducts.find((p) => p.id === id);
        return total + (product?.price || 0) * qty;
      },
      0
    );
  }, [localState.fillerQuantities, allProducts]);

  // Custo do Laço (Customizado ou Pronto)
  const { cost: lacoCost, name: lacoName } = useMemo(() => {
    return calculateLacoCost(localState.selectedLaco, allProducts);
  }, [localState.selectedLaco, allProducts]);

  // Custo Total do Kit
  const kitTotal = useMemo(() => {
    // KitBasePrice = Preço do AssembledKitProduct + AssemblyCost da Receita
    const basePrice = assembledKit.kitBasePrice + (recipe?.assemblyCost || 0);
    return basePrice + fillersCost + lacoCost;
  }, [assembledKit.kitBasePrice, recipe?.assemblyCost, fillersCost, lacoCost]);

  // Slots Ocupados
  const occupiedSlots = useMemo(() => {
    return Object.entries(localState.fillerQuantities).reduce(
      (total, [id, qty]) => {
        const product = allProducts.find((p) => p.id === id);
        return total + (product?.itemSize || 0) * qty;
      },
      0
    );
  }, [localState.fillerQuantities, allProducts]);

  const baseCapacity = localState.baseProduct?.capacity || 0;
  const isBaseFull = occupiedSlots >= baseCapacity;

  // =================================================================
  // AÇÕES
  // =================================================================

  const handleAddFiller = (id: string, maxQty: number) => {
    const currentQty = localState.fillerQuantities[id] || 0;
    const product = allProducts.find((p) => p.id === id);
    if (!product) return;

    // 1. Validação de Capacidade (Slots)
    if (isBaseFull && product.itemSize && product.itemSize > 0) {
      toast.error("Opa! A base está cheia.", {
        description: "Remova alguns itens para adicionar este.",
      });
      return;
    }

    // 2. Validação de Quantidade Máxima da Receita
    if (currentQty >= maxQty) return;

    // 3. Atualiza
    setLocalState({
      fillerQuantities: {
        ...localState.fillerQuantities,
        [id]: currentQty + 1,
      },
    });
  };

  const handleRemoveFiller = (id: string) => {
    const currentQty = localState.fillerQuantities[id] || 0;

    // Não permite remover se for um item obrigatório (defaultQuantity > 0 na receita)
    const recipeComponent = recipe?.components.find(
      (c) => c.componentId === id
    );
    if (recipeComponent && currentQty <= recipeComponent.defaultQuantity) {
      if (recipeComponent.defaultQuantity > 0 && recipeComponent.required) {
        toast.error("Este item é obrigatório na Receita.", {
          description: "Não pode ser removido abaixo da quantidade padrão.",
        });
        return;
      }
    }

    if (currentQty <= 1) {
      const newFillers = { ...localState.fillerQuantities };
      delete newFillers[id];
      setLocalState({ fillerQuantities: newFillers });
    } else {
      setLocalState({
        fillerQuantities: {
          ...localState.fillerQuantities,
          [id]: currentQty - 1,
        },
      });
    }
  };

  const handleAddToCart = () => {
    if (
      step !== 3 ||
      !localState.baseProduct ||
      !localState.selectedLaco.type
    ) {
      toast.error("Complete todos os passos antes de finalizar.");
      return;
    }

    const fillerItems = Object.entries(localState.fillerQuantities).map(
      ([productId, quantity]) => ({ productId, quantity })
    );

    // Montar o CartItem
    const finalCartItem: CartItem = {
      cartId: crypto.randomUUID(),
      type: "CUSTOM_KIT",
      quantity: 1, // Sempre 1 kit
      product: assembledKit, // Referência ao meta-produto
      kitTotalAmount: kitTotal,
      kitName: assembledKit.name,
      kitComposition: {
        recipeId: assembledKit.recipeId,
        // É garantido que baseProduct não é undefined devido ao 'if' acima e ao 'if' no final
        baseProductId: localState.baseProduct!.id,
        items: fillerItems,
        finalRibbonDetails: {
          laçoType:
            localState.selectedLaco.model ||
            (localState.selectedLaco.type as LacoModelType),
          // CORREÇÃO DE NULL VS UNDEFINED:
          fitaId:
            localState.selectedLaco.type === "RIBBON_SERVICE"
              ? localState.selectedLaco.id || undefined
              : undefined,
          accessoryId:
            localState.selectedLaco.type === "LAÇO_PRONTO"
              ? localState.selectedLaco.id || undefined
              : undefined,
        },
      },
    };

    addItem(finalCartItem);
    toast.success("Kit Personalizado adicionado ao carrinho!");
    onClose();
  };

  // Se recipe ou baseProduct não existirem, não renderiza
  if (!recipe || !localState.baseProduct) return null;

  // =================================================================
  // RENDERIZAÇÃO DOS PASSOS
  // =================================================================

  const renderStep1 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
        <Package className="h-5 w-5 text-[var(--primary)]" /> Passo 1: Base e
        Recheios
      </h3>

      {/* Visualização da Base */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
        <p className="font-semibold mb-2">Base do Kit (Obrigatório)</p>
        <div className="flex items-center gap-4">
          <Image
            src={localState.baseProduct!.imageUrl || "/placeholder.webp"}
            alt={localState.baseProduct!.name}
            width={60}
            height={60}
            className="rounded-lg object-cover"
          />
          <div>
            <p className="font-medium">{localState.baseProduct!.name}</p>
            <p className="text-sm text-slate-500">
              Capacidade: {baseCapacity} slots
            </p>
          </div>
        </div>
        <Separator className="my-3" />
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Slots Ocupados:</span>
          <span
            className={`font-bold ${
              isBaseFull ? "text-red-500" : "text-slate-800"
            }`}
          >
            {occupiedSlots.toFixed(1)} / {baseCapacity.toFixed(1)}
          </span>
        </div>
        <div className="w-full h-2 bg-slate-200 rounded-full mt-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isBaseFull ? "bg-red-500" : "bg-[var(--primary)]"
            }`}
            style={{
              width: `${Math.min(100, (occupiedSlots / baseCapacity) * 100)}%`,
            }}
          />
        </div>
      </div>

      {/* Opções de Recheios */}
      <p className="font-semibold text-slate-800 mt-6">
        Adicione Recheios (Fillers)
      </p>
      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
        {recipe.components
          .filter((c) => c.type === "FILLER")
          .map((comp) => {
            const product = availableFillers.find(
              (p) => p.id === comp.componentId
            );
            const currentQty =
              localState.fillerQuantities[comp.componentId] || 0;
            const maxQty = comp.maxQuantity;

            if (!product) return null;
            if (product.disabled) return null;

            const isDisabled = isBaseFull && (product.itemSize || 0) > 0;
            const isMaxed = currentQty >= maxQty;

            return (
              <div
                key={product.id}
                className={`flex items-center justify-between p-3 border rounded-lg ${
                  currentQty > 0
                    ? "border-[var(--primary)] bg-purple-50"
                    : "bg-white"
                }`}
              >
                <div className="flex items-center gap-3 w-1/2">
                  <Image
                    src={product.imageUrl || "/placeholder.webp"}
                    alt={product.name}
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                  />
                  <div className="truncate">
                    <p className="text-sm font-medium truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      R$ {product.price.toFixed(2)} | Slots: {product.itemSize}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-7 w-7"
                    onClick={() => handleRemoveFiller(product.id)}
                    disabled={currentQty === 0}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="font-bold w-4 text-center">
                    {currentQty}
                  </span>
                  <Button
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleAddFiller(product.id, maxQty)}
                    disabled={isDisabled || isMaxed}
                    style={{
                      backgroundColor:
                        isDisabled || isMaxed ? undefined : "var(--primary)",
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
        <Gift className="h-5 w-5 text-[var(--primary)]" /> Passo 2: Laço e
        Acabamento
      </h3>

      {/* --- Opções de Laço --- */}
      <div className="space-y-4">
        <p className="font-semibold text-slate-700">
          Escolha o Serviço de Laço:
        </p>

        {/* Opções de Laços Prontos (ACCESSORY) */}
        {recipe.components.filter((c) => c.type === "LAÇO_PRONTO").length >
          0 && (
          <div className="bg-slate-50 p-4 rounded-xl">
            <h4 className="font-medium mb-3 flex items-center gap-2 text-slate-700">
              <CheckCircle2 className="h-4 w-4 text-green-600" /> Laços Prontos
              em Estoque / Puxar
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {recipe.components
                .filter((c) => c.type === "LAÇO_PRONTO")
                .map((comp) => {
                  const lacoPronto = availableReadyLaços.find(
                    (p) => p.id === comp.componentId
                  );
                  if (!lacoPronto) return null;

                  const isSelected =
                    localState.selectedLaco.type === "LAÇO_PRONTO" &&
                    localState.selectedLaco.id === lacoPronto.id;

                  return (
                    <div
                      key={lacoPronto.id}
                      onClick={() =>
                        setLocalState({
                          selectedLaco: {
                            type: "LAÇO_PRONTO",
                            id: lacoPronto.id,
                            model: lacoPronto.laçoType || null,
                            size: null,
                          },
                        })
                      }
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? "border-[var(--primary)] ring-2 ring-[var(--primary)] ring-opacity-20"
                          : "bg-white hover:border-slate-300"
                      }`}
                    >
                      <p className="text-sm font-medium">{lacoPronto.name}</p>
                      <p className="text-xs text-slate-500">
                        R$ {lacoPronto.price.toFixed(2)} (
                        {lacoPronto.laçoType === "PUXAR" ? "Pacote" : "Unid."})
                      </p>
                      {isSelected && (
                        <Badge
                          variant="secondary"
                          className="mt-1 bg-green-500 text-white"
                        >
                          Selecionado
                        </Badge>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Serviço de Laço Customizado (RIBBON_SERVICE) */}
        {recipe.components.some((c) => c.type === "RIBBON_SERVICE") && (
          <div className="bg-slate-50 p-4 rounded-xl">
            <h4 className="font-medium mb-3 flex items-center gap-2 text-slate-700">
              <Scissors className="h-4 w-4 text-purple-600" /> Criar Laço
              Customizado (Serviço)
            </h4>

            <div className="space-y-4">
              {/* 2.1. Escolha da Fita */}
              <p className="text-sm font-medium">1. Escolha a Fita:</p>
              <div className="grid grid-cols-3 gap-3 max-h-[150px] overflow-y-auto p-1 custom-scrollbar border rounded-lg">
                {availableRibbons.map((ribbon) => {
                  const isSelected =
                    localState.selectedLaco.type === "RIBBON_SERVICE" &&
                    localState.selectedLaco.id === ribbon.id;
                  return (
                    <div
                      key={ribbon.id}
                      onClick={() =>
                        setLocalState((prev) => ({
                          selectedLaco: {
                            ...prev.selectedLaco,
                            type: "RIBBON_SERVICE",
                            id: ribbon.id,
                          },
                        }))
                      }
                      className={`p-2 border rounded-lg cursor-pointer text-center transition-all ${
                        isSelected
                          ? "border-[var(--primary)] ring-2 ring-[var(--primary)] ring-opacity-20"
                          : "bg-white hover:border-slate-300"
                      }`}
                    >
                      <Image
                        src={ribbon.imageUrl || "/placeholder.webp"}
                        alt={ribbon.name}
                        width={30}
                        height={30}
                        className="mx-auto rounded-full object-cover mb-1"
                      />
                      <p className="text-[10px] truncate">{ribbon.name}</p>
                    </div>
                  );
                })}
              </div>

              {/* 2.2. Escolha do Modelo e Tamanho */}
              {localState.selectedLaco.id &&
                localState.selectedLaco.type === "RIBBON_SERVICE" && (
                  <div className="space-y-4 pt-3">
                    <p className="text-sm font-medium">
                      2. Escolha o Modelo e Tamanho:
                    </p>

                    {/* Modelos */}
                    <div className="flex gap-4">
                      {["BOLA", "COMUM_CHANEL"].map((model) => (
                        <Button
                          key={model}
                          variant={
                            localState.selectedLaco.model === model
                              ? "default"
                              : "outline"
                          }
                          onClick={() =>
                            setLocalState((prev) => ({
                              selectedLaco: {
                                ...prev.selectedLaco,
                                model: model as LacoModelType,
                              },
                            }))
                          }
                          style={{
                            backgroundColor:
                              localState.selectedLaco.model === model
                                ? "var(--primary)"
                                : undefined,
                          }}
                        >
                          Laço {model === "BOLA" ? "Bola" : "Comum"}
                        </Button>
                      ))}
                    </div>

                    {/* Tamanhos */}
                    <div className="flex gap-2">
                      {["P", "M", "G"].map((size) => (
                        <Button
                          key={size}
                          variant={
                            localState.selectedLaco.size === size
                              ? "default"
                              : "secondary"
                          }
                          onClick={() =>
                            setLocalState((prev) => ({
                              selectedLaco: {
                                ...prev.selectedLaco,
                                size: size as "P" | "M" | "G",
                              },
                            }))
                          }
                          style={{
                            backgroundColor:
                              localState.selectedLaco.size === size
                                ? "var(--primary)"
                                : undefined,
                          }}
                        >
                          {size}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
        <ShoppingCart className="h-5 w-5 text-[var(--primary)]" /> Passo 3:
        Resumo e Checkout
      </h3>

      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-4">
        <h4 className="font-semibold text-lg text-slate-700">
          Detalhes do Kit: {assembledKit.name}
        </h4>
        <Separator />

        {/* Custo Base */}
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">
            Base ({localState.baseProduct!.name}) + Montagem Kit
          </span>
          <span className="font-medium">
            R$ {assembledKit.kitBasePrice.toFixed(2)}
          </span>
        </div>

        {/* Recheios */}
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">
            Itens Adicionais ({Object.keys(localState.fillerQuantities).length}{" "}
            tipos)
          </span>
          <span className="font-medium">R$ {fillersCost.toFixed(2)}</span>
        </div>

        {/* Laço */}
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Serviço de Laço: {lacoName}</span>
          <span className="font-medium">R$ {lacoCost.toFixed(2)}</span>
        </div>

        <Separator className="my-4" />

        {/* Total */}
        <div className="flex justify-between items-center">
          <span className="text-xl font-bold text-slate-800">TOTAL FINAL</span>
          <span className="text-3xl font-bold text-[var(--primary)]">
            R$ {kitTotal.toFixed(2)}
          </span>
        </div>
      </div>

      <Button
        onClick={handleAddToCart}
        className="w-full h-12 text-lg font-bold shadow-lg hover:scale-[1.01] transition-transform"
        style={{
          backgroundColor: "var(--primary)",
          color: "var(--primary-contrast)",
        }}
        disabled={!localState.selectedLaco.type}
      >
        <ShoppingCart className="mr-2 h-5 w-5" /> Adicionar Kit Personalizado
        (R$ {kitTotal.toFixed(2)})
      </Button>
    </div>
  );

  // =================================================================
  // RENDERIZAÇÃO DO MODAL
  // =================================================================

  const isStep2Valid =
    localState.selectedLaco.type &&
    (localState.selectedLaco.type === "LAÇO_PRONTO" ||
      (localState.selectedLaco.id &&
        localState.selectedLaco.model &&
        localState.selectedLaco.size));
  const isStep1Valid = true; // A base e fillers obrigatórios já são validados na seed/inicialização.

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-xl flex flex-col">
        <SheetHeader>
          <SheetTitle>Montar Kit: {assembledKit.name}</SheetTitle>
          <p className="text-sm text-slate-500">
            Siga os 3 passos para montar o seu presente.
          </p>
        </SheetHeader>

        <div className="flex-grow overflow-y-auto py-4">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>

        {/* CONTROLES DE NAVEGAÇÃO */}
        <div className="mt-auto border-t pt-4 flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => setStep(step - 1)}
            disabled={step === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
          </Button>

          <div className="text-sm font-medium text-slate-600">
            Passo {step} de 3
          </div>

          {step < 3 && (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={step === 2 && !isStep2Valid}
              style={{
                backgroundColor:
                  step === 2 && !isStep2Valid ? undefined : "var(--primary)",
              }}
            >
              Próximo <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}

          {step === 3 && (
            <Button
              onClick={handleAddToCart}
              style={{ backgroundColor: "var(--primary)" }}
            >
              Finalizar (R$ {kitTotal.toFixed(2)})
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
