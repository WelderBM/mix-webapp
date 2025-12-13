"use client";

import { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useProductStore } from "@/store/productStore";
import { useCartStore } from "@/store/cartStore";
import { Product } from "@/lib/types";
import {
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Package,
  Gift,
  Check,
  X,
  Scissors,
  Lightbulb,
  ExternalLink,
  Minus,
  Plus,
  AlertTriangle,
  Box,
  Layers,
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export const openKitBuilder = (template?: Product) => {
  const event = new CustomEvent("open-kit-builder", { detail: template });
  window.dispatchEvent(event);
};

export function KitBuilderModal() {
  const [isOpen, setIsOpen] = useState(false);
  const { allProducts } = useProductStore();
  const { addItem, openCart } = useCartStore();

  const [step, setStep] = useState<number>(1);
  const [selectedBase, setSelectedBase] = useState<Product | null>(null);
  const [selectedItems, setSelectedItems] = useState<
    { product: Product; quantity: number }[]
  >([]);

  // Accordions
  const [isTransparentOpen, setIsTransparentOpen] = useState(true);
  const [isDecoratedOpen, setIsDecoratedOpen] = useState(false);
  const [openBaseCategory, setOpenBaseCategory] = useState<string | null>(null);
  const [openItemCategory, setOpenItemCategory] = useState<string | null>(null); // NOVO: Para itens

  useEffect(() => {
    const handleOpen = (e: any) => {
      const template = e.detail as Product | undefined;
      setIsOpen(true);
      setStep(1);
      setSelectedBase(null);
      setSelectedItems([]);

      if (template) {
        if (template.type === "KIT_TEMPLATE" && template.defaultComponents) {
          const components = allProducts.filter((p) =>
            template.defaultComponents?.includes(p.id)
          );
          const base = components.find((p) => p.type === "BASE_CONTAINER");
          const items = components.filter((p) => p.type !== "BASE_CONTAINER");
          if (base) setSelectedBase(base);
          if (items.length > 0)
            setSelectedItems(items.map((p) => ({ product: p, quantity: 1 })));
          if (base) setStep(2);
          toast.success(`Iniciando com ${template.name}`, { icon: "🎁" });
        } else if (template.type === "BASE_CONTAINER") {
          setSelectedBase(template);
          setStep(2);
        }
      }
    };
    window.addEventListener("open-kit-builder", handleOpen);
    return () => window.removeEventListener("open-kit-builder", handleOpen);
  }, [allProducts]);

  // --- FILTROS ---
  const baseOptions = useMemo(
    () => allProducts.filter((p) => p.type === "BASE_CONTAINER" && p.inStock),
    [allProducts]
  );
  const mainProducts = useMemo(
    () =>
      allProducts.filter(
        (p) => p.type === "STANDARD_ITEM" && p.inStock && (p.itemSize || 0) > 0
      ),
    [allProducts]
  );

  // Agrupamento de Bases
  const baseCategories = useMemo(() => {
    const groups: Record<string, Product[]> = {};
    baseOptions.forEach((base) => {
      const cat = base.category || "Outros";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(base);
    });
    return groups;
  }, [baseOptions]);

  // Agrupamento de Itens (NOVO)
  const itemCategories = useMemo(() => {
    const groups: Record<string, Product[]> = {};
    mainProducts.forEach((item) => {
      const cat = item.category || "Diversos";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [mainProducts]);

  // Abertura automática da primeira categoria
  useEffect(() => {
    if (isOpen) {
      if (
        step === 1 &&
        Object.keys(baseCategories).length > 0 &&
        !openBaseCategory
      )
        setOpenBaseCategory(Object.keys(baseCategories)[0]);
      if (
        step === 2 &&
        Object.keys(itemCategories).length > 0 &&
        !openItemCategory
      )
        setOpenItemCategory(Object.keys(itemCategories)[0]);
    }
  }, [
    isOpen,
    step,
    baseCategories,
    itemCategories,
    openBaseCategory,
    openItemCategory,
  ]);

  const fillerOptions = useMemo(
    () => allProducts.filter((p) => p.type === "FILLER" && p.inStock),
    [allProducts]
  );
  const accessoryOptions = useMemo(
    () => allProducts.filter((p) => p.type === "ACCESSORY" && p.inStock),
    [allProducts]
  );
  const wrapperOptions = useMemo(
    () => allProducts.filter((p) => p.type === "WRAPPER" && p.inStock),
    [allProducts]
  );
  const readyMadeBows = useMemo(
    () =>
      allProducts.filter(
        (p) => p.type === "RIBBON" && p.unit === "un" && p.inStock
      ),
    [allProducts]
  );

  const transparentWrappers = useMemo(
    () =>
      wrapperOptions.filter((p) => {
        const n = p.name.toLowerCase();
        return (
          n.includes("transparente") ||
          n.includes("incolor") ||
          n.includes("cristal")
        );
      }),
    [wrapperOptions]
  );
  const decoratedWrappers = useMemo(
    () =>
      wrapperOptions.filter((p) => {
        const n = p.name.toLowerCase();
        return (
          !n.includes("transparente") &&
          !n.includes("incolor") &&
          !n.includes("cristal")
        );
      }),
    [wrapperOptions]
  );

  const totalPrice = useMemo(
    () =>
      (selectedBase?.price || 0) +
      selectedItems.reduce(
        (acc, item) => acc + item.product.price * item.quantity,
        0
      ),
    [selectedBase, selectedItems]
  );

  // --- AÇÕES ---
  const handleNext = () => {
    let nextStep = step + 1;
    if (nextStep === 4 && accessoryOptions.length === 0) nextStep = 5;
    setStep(nextStep);
  };
  const handleBack = () => {
    let prevStep = step - 1;
    if (prevStep === 4 && accessoryOptions.length === 0) prevStep = 3;
    setStep(prevStep);
  };

  const handleToggleItem = (product: Product, quantityChange: number) => {
    setSelectedItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        const newQty = existing.quantity + quantityChange;
        if (newQty <= 0) return prev.filter((i) => i.product.id !== product.id);
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: newQty } : i
        );
      } else {
        if (quantityChange > 0) return [...prev, { product, quantity: 1 }];
        return prev;
      }
    });
  };

  const handleFinish = () => {
    if (!selectedBase) return;
    addItem({
      cartId: crypto.randomUUID(),
      type: "CUSTOM_KIT",
      quantity: 1,
      kitName: `Kit Personalizado (${selectedBase.name})`,
      kitTotalAmount: totalPrice,
      product: selectedBase,
      kitComponents: selectedItems.map((i) => ({
        ...i.product,
        quantity: i.quantity,
      })),
    });
    setIsOpen(false);
    openCart();
    toast.success("Kit montado com sucesso! 🎁");
  };

  // Renderizadores
  const renderBaseGrid = (products: Product[]) => (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-2">
      {products.map((base) => (
        <div
          key={base.id}
          onClick={() => {
            setSelectedBase(base);
            handleNext();
          }}
          className="bg-white p-4 rounded-xl border-2 border-transparent hover:border-purple-500 cursor-pointer shadow-sm hover:shadow-md transition-all group text-center"
        >
          <div className="relative w-24 h-24 mx-auto mb-3 bg-slate-100 rounded-full overflow-hidden">
            {base.imageUrl ? (
              <Image
                src={base.imageUrl}
                alt={base.name}
                fill
                className="object-cover"
              />
            ) : (
              <Package className="m-auto text-slate-300" />
            )}
          </div>
          <h3 className="font-bold text-slate-800 leading-tight">
            {base.name}
          </h3>
          <p className="text-xs text-slate-500 mt-1">{base.capacity} slots</p>
          <Badge variant="secondary" className="mt-2">
            R$ {base.price.toFixed(2)}
          </Badge>
        </div>
      ))}
    </div>
  );

  const renderGrid = (
    products: Product[],
    type: "normal" | "single_choice" = "normal"
  ) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-1">
      {products.map((p) => {
        const selectedQty =
          selectedItems.find((i) => i.product.id === p.id)?.quantity || 0;
        const isSelected = selectedQty > 0;
        const isWrapper = p.type === "WRAPPER";
        let compatible = true;
        if (isWrapper && selectedBase && p.wrapperConstraints) {
          compatible =
            selectedBase.capacity! >= p.wrapperConstraints.minSlots &&
            selectedBase.capacity! <= p.wrapperConstraints.maxSlots;
        }

        return (
          <div
            key={p.id}
            className={cn(
              "relative border rounded-xl p-2 flex flex-col gap-2 transition-all cursor-pointer bg-white group hover:shadow-md",
              isSelected
                ? "border-purple-500 ring-1 ring-purple-500 shadow-sm bg-purple-50/50"
                : "border-slate-100",
              !compatible && "opacity-60 grayscale-[0.5]"
            )}
            onClick={() => {
              if (!compatible && isWrapper)
                toast("Tamanho pode não ser ideal", {
                  description: "Mas você pode selecionar se preferir.",
                });
              if (type === "single_choice") {
                const others = selectedItems.filter(
                  (i) => !products.find((prod) => prod.id === i.product.id)
                );
                if (!isSelected) {
                  setSelectedItems([...others, { product: p, quantity: 1 }]);
                  if (step !== 1) setTimeout(() => handleNext(), 300);
                }
              } else {
                handleToggleItem(p, 1);
              }
            }}
          >
            <div className="relative aspect-square rounded-lg bg-slate-50 overflow-hidden">
              {p.imageUrl ? (
                <Image
                  src={p.imageUrl}
                  alt={p.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <Package className="m-auto text-slate-300" />
              )}
              {isSelected && (
                <div className="absolute top-1 right-1 bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm animate-in zoom-in z-10">
                  {type === "single_choice" ? <Check size={14} /> : selectedQty}
                </div>
              )}
              {isWrapper && compatible && (
                <div className="absolute bottom-0 left-0 w-full bg-green-500/90 text-white text-[9px] font-bold text-center py-1 uppercase">
                  Ideal
                </div>
              )}
              {isWrapper && !compatible && (
                <div className="absolute bottom-0 left-0 w-full bg-yellow-500/90 text-white text-[9px] font-bold text-center py-1 uppercase flex items-center justify-center gap-1">
                  <AlertTriangle size={8} /> Atenção
                </div>
              )}
            </div>
            <div>
              <p className="text-xs font-medium text-slate-800 line-clamp-2 leading-tight">
                {p.name}
              </p>
              <p className="text-xs text-purple-700 font-bold mt-1">
                R$ {p.price.toFixed(2)}
              </p>
            </div>
            {isSelected && type === "normal" && (
              <div
                className="flex items-center justify-between bg-white border rounded-lg p-1 mt-1 shadow-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => handleToggleItem(p, -1)}
                  className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-red-50 hover:text-red-600 rounded transition-colors"
                >
                  <Minus size={14} />
                </button>
                <span className="text-sm font-bold w-6 text-center">
                  {selectedQty}
                </span>
                <button
                  onClick={() => handleToggleItem(p, 1)}
                  className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-green-50 hover:text-green-600 rounded transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[900px] h-[90vh] flex flex-col bg-slate-50 p-0 gap-0 [&>button]:hidden">
        {/* HEADER */}
        <div className="p-4 border-b flex flex-col gap-4 shrink-0 z-10 shadow-sm relative bg-white border-slate-100">
          <div className="flex justify-between items-start">
            <DialogTitle className="text-xl flex items-center gap-2 text-slate-800">
              <Gift className="text-purple-600" /> Montador de Kits
            </DialogTitle>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                  Total
                </span>
                <span className="text-xl font-bold text-green-600">
                  R$ {totalPrice.toFixed(2)}
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-full hover:bg-black/5 text-slate-400"
              >
                <X size={24} />
              </button>
            </div>
          </div>
        </div>

        {/* CORPO */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-6 custom-scrollbar">
          <div className="max-w-5xl mx-auto pb-4">
            {/* PASSO 1: BASE */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                <div className="text-center md:text-left">
                  <h2 className="text-lg font-bold text-slate-800">
                    1. Escolha a Base
                  </h2>
                  <p className="text-slate-500 text-sm">
                    Onde vamos montar seu presente?
                  </p>
                </div>
                <div className="space-y-3">
                  {Object.entries(baseCategories).map(([category, bases]) => (
                    <div
                      key={category}
                      className="border rounded-xl bg-white overflow-hidden shadow-sm"
                    >
                      <button
                        onClick={() =>
                          setOpenBaseCategory(
                            openBaseCategory === category ? null : category
                          )
                        }
                        className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
                      >
                        <span className="font-bold text-slate-800 flex items-center gap-2">
                          <Box size={16} className="text-purple-500" />{" "}
                          {category} ({bases.length})
                        </span>
                        {openBaseCategory === category ? (
                          <ChevronUp size={18} className="text-slate-400" />
                        ) : (
                          <ChevronDown size={18} className="text-slate-400" />
                        )}
                      </button>
                      {openBaseCategory === category && (
                        <div className="p-2 border-t border-slate-100 bg-slate-50/50">
                          {renderBaseGrid(bases)}
                        </div>
                      )}
                    </div>
                  ))}
                  {Object.keys(baseCategories).length === 0 && (
                    <div className="text-center py-10 text-slate-400">
                      <Package size={40} className="mx-auto mb-2 opacity-20" />
                      <p>Nenhuma base cadastrada.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* PASSO 2: RECHEIO (AGORA COM CATEGORIAS) */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <div className="flex justify-between items-center bg-white p-3 rounded-lg border shadow-sm sticky top-0 z-10">
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">
                      2. Seleção de Itens
                    </h2>
                    <p className="text-slate-500 text-xs">
                      O que vai compor o kit?
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setStep(1)}
                  >
                    Trocar Base
                  </Button>
                </div>

                {/* Lista de Itens Agrupada */}
                <div className="space-y-3">
                  {Object.entries(itemCategories).map(([category, items]) => (
                    <div
                      key={category}
                      className="border rounded-xl bg-white overflow-hidden shadow-sm"
                    >
                      <button
                        onClick={() =>
                          setOpenItemCategory(
                            openItemCategory === category ? null : category
                          )
                        }
                        className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
                      >
                        <span className="font-bold text-slate-800 flex items-center gap-2">
                          <Layers size={16} className="text-blue-500" />{" "}
                          {category} ({items.length})
                        </span>
                        {openItemCategory === category ? (
                          <ChevronUp size={18} className="text-slate-400" />
                        ) : (
                          <ChevronDown size={18} className="text-slate-400" />
                        )}
                      </button>
                      {openItemCategory === category && (
                        <div className="p-2 border-t border-slate-100">
                          {renderGrid(items, "normal")}
                        </div>
                      )}
                    </div>
                  ))}
                  {Object.keys(itemCategories).length === 0 && (
                    <div className="text-center py-10 text-slate-400">
                      <Package size={40} className="mx-auto mb-2 opacity-20" />
                      <p>Nenhum item disponível.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Outros Passos (Mantidos) */}
            {step === 3 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3">
                  <Package className="text-blue-600 shrink-0" size={20} />
                  <div>
                    <h3 className="font-bold text-blue-900 text-sm">
                      Preenchimento
                    </h3>
                    <p className="text-xs text-blue-700">
                      Escolha palha ou seda.
                    </p>
                  </div>
                </div>
                {fillerOptions.length > 0 ? (
                  renderGrid(fillerOptions, "single_choice")
                ) : (
                  <p className="text-center text-slate-400 py-8">Sem opções.</p>
                )}
              </div>
            )}
            {step === 4 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <div className="text-center py-4">
                  <h2 className="text-lg font-bold text-slate-800 flex items-center justify-center gap-2">
                    <Lightbulb className="text-yellow-500 fill-yellow-500" />{" "}
                    Luzes (Opcional)
                  </h2>
                </div>
                {renderGrid(accessoryOptions, "normal")}
                <div className="flex justify-center mt-4">
                  <Button
                    variant="ghost"
                    onClick={handleNext}
                    className="text-slate-400"
                  >
                    Pular
                  </Button>
                </div>
              </div>
            )}
            {step === 5 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="text-center md:text-left">
                  <h2 className="text-lg font-bold text-slate-800">
                    5. Embalagem
                  </h2>
                </div>
                <div className="border rounded-xl bg-white overflow-hidden shadow-sm">
                  <button
                    onClick={() => setIsTransparentOpen(!isTransparentOpen)}
                    className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <span className="font-bold text-slate-800">
                      Transparentes
                    </span>
                    {isTransparentOpen ? (
                      <ChevronUp size={18} />
                    ) : (
                      <ChevronDown size={18} />
                    )}
                  </button>
                  {isTransparentOpen && (
                    <div className="p-4 border-t border-slate-100">
                      {renderGrid(transparentWrappers, "single_choice")}
                    </div>
                  )}
                </div>
                <div className="border rounded-xl bg-white overflow-hidden shadow-sm">
                  <button
                    onClick={() => setIsDecoratedOpen(!isDecoratedOpen)}
                    className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <span className="font-bold text-slate-800">Decorados</span>
                    {isDecoratedOpen ? (
                      <ChevronUp size={18} />
                    ) : (
                      <ChevronDown size={18} />
                    )}
                  </button>
                  {isDecoratedOpen && (
                    <div className="p-4 border-t border-slate-100">
                      {renderGrid(decoratedWrappers, "single_choice")}
                    </div>
                  )}
                </div>
              </div>
            )}
            {step === 6 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="text-center md:text-left">
                  <h2 className="text-lg font-bold text-slate-800">
                    6. Laço Final
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                      <h3 className="font-bold text-purple-900 text-sm">
                        Opção A: Laço Fácil
                      </h3>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto pr-1">
                      {renderGrid(readyMadeBows, "single_choice")}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-pink-50 p-3 rounded-lg border border-pink-100">
                      <h3 className="font-bold text-pink-900 text-sm">
                        Opção B: Laço Bola
                      </h3>
                    </div>
                    <div className="border rounded-xl p-6 flex flex-col items-center justify-center text-center gap-4 h-[250px] bg-white shadow-sm">
                      <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center text-pink-500 mb-2">
                        <Gift size={32} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800">
                          Personalizar Laço Bola
                        </h4>
                      </div>
                      <Link
                        href="/laco-builder"
                        target="_blank"
                        className="w-full"
                      >
                        <Button className="w-full bg-pink-600 hover:bg-pink-700 text-white shadow-md">
                          Ir para Atelier{" "}
                          <ExternalLink size={14} className="ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {step === 7 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <h2 className="text-lg font-bold text-slate-800">
                  7. Resumo do Pedido
                </h2>
                <div className="bg-white p-6 rounded-xl border shadow-sm divide-y">
                  <div className="flex items-center gap-4 pb-4">
                    <div className="w-12 h-12 bg-slate-100 rounded relative overflow-hidden shrink-0">
                      {selectedBase?.imageUrl && (
                        <Image
                          src={selectedBase.imageUrl}
                          alt=""
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase font-bold">
                        Base
                      </p>
                      <h3 className="font-bold text-slate-800">
                        {selectedBase?.name}
                      </h3>
                    </div>
                  </div>
                  <div className="py-4 space-y-2">
                    {selectedItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-0.5 rounded">
                            {item.quantity}x
                          </span>
                          <span className="text-slate-700">
                            {item.product.name}
                          </span>
                        </div>
                        <span className="font-medium text-slate-900">
                          R$ {(item.product.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-4 flex justify-between items-center">
                    <span className="font-bold text-lg text-slate-600">
                      Total Final
                    </span>
                    <span className="font-bold text-2xl text-green-600">
                      R$ {totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t flex justify-between items-center shrink-0 z-10 bg-white">
          {step > 1 ? (
            <Button variant="outline" onClick={handleBack} className="gap-2">
              <ChevronLeft className="h-4 w-4" /> Voltar
            </Button>
          ) : (
            <div />
          )}
          {step < 7 ? (
            <Button
              onClick={handleNext}
              disabled={step === 1 && !selectedBase}
              className="gap-2 px-6 bg-slate-900 text-white hover:bg-slate-800 transition-all"
            >
              Próximo <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleFinish}
              className="bg-green-600 hover:bg-green-700 text-white px-8 gap-2 shadow-lg shadow-green-200"
            >
              <Check className="h-4 w-4" /> Adicionar ao Carrinho
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
