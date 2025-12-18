"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useProductStore } from "@/store/productStore";
import { useSettingsStore } from "@/store/settingsStore";
import { StoreHeader } from "@/components/layout/StoreHeader";
import { ProductCard } from "@/components/features/ProductCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Scissors,
  Package,
  Gift,
  ShoppingCart,
  Ruler,
  CheckCircle2,
  Lock,
  Unlock,
  AlertCircle,
} from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { toast } from "sonner";
import { hexToRgb, getContrastColor } from "@/lib/utils";
import { LacoBuilder } from "@/components/features/LacoBuilder";
import { getProductImage } from "@/lib/image-utils";
import { SafeImage } from "@/components/ui/SafeImage";

function FitasContent() {
  const { allProducts, fetchProducts } = useProductStore();
  const { addItem } = useCartStore();
  const { settings, fetchSettings } = useSettingsStore();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState("rolls");
  const [selectedRibbonId, setSelectedRibbonId] = useState<string>("");
  const [meterAmount, setMeterAmount] = useState<number>(1);

  useEffect(() => {
    fetchProducts();
    fetchSettings();
  }, [fetchProducts, fetchSettings]);

  useEffect(() => {
    const tabParam = searchParams.get("aba");
    if (
      tabParam === "montador" ||
      tabParam === "laco" ||
      tabParam === "service"
    ) {
      setActiveTab("service");
    }
  }, [searchParams]);

  const themeStyles = useMemo(() => {
    const primary = settings.theme?.primaryColor || "#7c3aed";
    return {
      "--primary": primary,
      "--primary-rgb": hexToRgb(primary),
      "--primary-contrast": getContrastColor(primary),
    } as React.CSSProperties;
  }, [settings]);

  const ribbonProducts = useMemo(
    () => allProducts.filter((p) => p.type === "RIBBON"),
    [allProducts]
  );

  const closedRolls = useMemo(
    () =>
      ribbonProducts.filter(
        (p) => p.canBeSoldAsRoll && p.ribbonInventory?.status === "FECHADO"
      ),
    [ribbonProducts]
  );

  const openRibbons = useMemo(
    () => ribbonProducts.filter((p) => p.ribbonInventory?.status === "ABERTO"),
    [ribbonProducts]
  );

  const handleAddRoll = (product: any) => {
    const productToAdd = {
      ...product,
      price: product.rollPrice || product.price,
      name: `${product.name} (Rolo Fechado)`,
    };

    addItem({
      cartId: crypto.randomUUID(),
      type: "SIMPLE",
      product: productToAdd,
      quantity: 1,
      kitTotalAmount: product.rollPrice || product.price,
    });
    toast.success("Rolo fechado adicionado ao carrinho!");
  };

  const handleAddMeter = () => {
    const product = openRibbons.find((p) => p.id === selectedRibbonId);
    if (!product) return;
    const totalPrice = product.price * meterAmount;
    addItem({
      cartId: crypto.randomUUID(),
      type: "SIMPLE",
      product: product,
      quantity: meterAmount,
      kitTotalAmount: totalPrice,
    });
    toast.success(
      <div className="flex flex-col">
        <span className="font-bold">Adicionado!</span>
        <span className="text-xs">
          {meterAmount}m de {product.name}
        </span>
      </div>
    );
    setSelectedRibbonId("");
    setMeterAmount(1);
  };

  return (
    <main className="min-h-screen bg-slate-50 pb-20" style={themeStyles}>
      <StoreHeader />
      <div className="max-w-6xl mx-auto px-4 -mt-4 relative z-10">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden min-h-[600px]">
          <div className="p-8 border-b bg-gradient-to-r from-slate-50 to-white">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">
              Central de Fitas & Laços
            </h1>
            <p className="text-slate-500">
              Gerencie seu estoque: Rolo Fechado para atacado, Aberto para corte
              e laços.
            </p>
          </div>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <div className="px-8 pt-6">
              <TabsList className="w-full md:w-auto grid grid-cols-3 h-auto p-1 bg-slate-100 rounded-xl">
                <TabsTrigger
                  value="rolls"
                  className="py-3 gap-2 data-[state=active]:bg-white data-[state=active]:text-[var(--primary)] data-[state=active]:shadow-sm transition-all"
                >
                  <Lock size={16} />{" "}
                  <span className="hidden md:inline">Rolos Fechados</span>
                </TabsTrigger>
                <TabsTrigger
                  value="meter"
                  className="py-3 gap-2 data-[state=active]:bg-white data-[state=active]:text-[var(--primary)] data-[state=active]:shadow-sm transition-all"
                >
                  <Scissors size={16} />{" "}
                  <span className="hidden md:inline">Por Metro (Abertos)</span>
                </TabsTrigger>
                <TabsTrigger
                  value="service"
                  className="py-3 gap-2 data-[state=active]:bg-white data-[state=active]:text-[var(--primary)] data-[state=active]:shadow-sm transition-all"
                >
                  <Gift size={16} />{" "}
                  <span className="hidden md:inline">Criar Laço</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* CONTEÚDO: ROLOS FECHADOS */}
            <TabsContent
              value="rolls"
              className="p-8 animate-in fade-in slide-in-from-bottom-2 duration-500"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Lock size={20} className="text-[var(--primary)]" /> Estoque
                  Lacrado
                </h3>
                <span className="text-sm text-slate-400">
                  {closedRolls.length} opções disponíveis
                </span>
              </div>
              {closedRolls.length === 0 ? (
                <div className="text-center py-20 text-slate-400 bg-slate-50 rounded-xl border-2 border-dashed">
                  <Package size={48} className="mx-auto mb-4 opacity-20" />
                  <p>Nenhum rolo fechado disponível.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {closedRolls.map((product) => {
                    const displayProduct = {
                      ...product,
                      price: product.rollPrice || product.price,
                    };

                    return (
                      <div key={product.id} className="relative">
                        <ProductCard
                          product={displayProduct}
                          onSelect={() => handleAddRoll(product)}
                          actionLabel="Comprar Rolo"
                        />
                        <div className="absolute top-2 right-2 bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm z-10">
                          <Lock size={10} /> LACRADO
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* CONTEÚDO: POR METRO (APENAS ABERTOS) */}
            <TabsContent
              value="meter"
              className="p-8 animate-in fade-in slide-in-from-bottom-2 duration-500"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  {/* SEÇÃO 1: ESCOLHA DA FITA (ESTILO BUILDER) */}
                  <section>
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <span className="bg-slate-800 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">
                        1
                      </span>{" "}
                      Escolha a Fita (Estoque Aberto)
                    </h3>

                    {openRibbons.length === 0 ? (
                      <div className="p-6 bg-yellow-50 text-yellow-800 rounded-xl border border-yellow-100 flex items-center gap-3 text-sm">
                        <AlertCircle size={20} className="shrink-0" />
                        <div>
                          No momento, não temos fitas disponíveis para venda por
                          metro.
                          <br />
                          Confira a aba de <strong>Rolos Fechados</strong>!
                        </div>
                      </div>
                    ) : (
                      // GRID PADRONIZADO COM LACO BUILDER
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-[400px] overflow-y-auto p-1 custom-scrollbar">
                        {openRibbons.map((ribbon) => {
                          const imgUrl = getProductImage(
                            ribbon.imageUrl,
                            ribbon.type
                          );
                          return (
                            <div
                              key={ribbon.id}
                              onClick={() => setSelectedRibbonId(ribbon.id)}
                              className={`cursor-pointer rounded-lg border p-2 flex flex-col items-center gap-2 transition-all hover:shadow-md relative ${
                                selectedRibbonId === ribbon.id
                                  ? "border-[var(--primary)] ring-2 ring-[var(--primary)] ring-opacity-20 bg-purple-50"
                                  : "border-slate-200 bg-white"
                              }`}
                            >
                              <div className="w-10 h-10 rounded-full bg-slate-100 relative overflow-hidden shrink-0">
                                <SafeImage
                                  src={imgUrl}
                                  alt={ribbon.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <span className="text-[10px] text-center line-clamp-2 leading-tight">
                                {ribbon.name}
                              </span>
                              <span className="text-[10px] font-bold text-slate-500 mt-auto">
                                R$ {ribbon.price.toFixed(2)}/m
                              </span>
                              {selectedRibbonId === ribbon.id && (
                                <div className="absolute top-1 right-1 text-[var(--primary)]">
                                  <CheckCircle2 size={16} />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>

                  {/* SEÇÃO 2: QUANTIDADE (ESTILO BUILDER) */}
                  <section
                    className={`transition-opacity duration-300 ${
                      selectedRibbonId
                        ? "opacity-100"
                        : "opacity-50 pointer-events-none"
                    }`}
                  >
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <span className="bg-slate-800 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">
                        2
                      </span>{" "}
                      Quantos Metros?
                    </h3>
                    <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 w-fit">
                      <div className="flex items-center border rounded-lg bg-white overflow-hidden shadow-sm">
                        <button
                          onClick={() =>
                            setMeterAmount(Math.max(0.5, meterAmount - 0.5))
                          }
                          className="px-3 py-2 hover:bg-slate-100 text-slate-500 border-r"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          step="0.1"
                          value={meterAmount}
                          onChange={(e) =>
                            setMeterAmount(parseFloat(e.target.value))
                          }
                          className="w-20 text-center border-none font-bold text-lg focus:ring-0 outline-none"
                        />
                        <button
                          onClick={() => setMeterAmount(meterAmount + 0.5)}
                          className="px-3 py-2 hover:bg-slate-100 text-slate-500 border-l"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-sm font-medium text-slate-600">
                        metros
                      </span>
                    </div>
                  </section>
                </div>

                {/* PAINEL DIREITO (Resumo - Igual ao Builder) */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 sticky top-24">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 text-center">
                      Resumo do Corte
                    </h3>
                    <div className="space-y-6">
                      <div className="w-full aspect-square bg-slate-50 rounded-xl border border-dashed border-slate-300 flex items-center justify-center relative overflow-hidden">
                        {selectedRibbonId ? (
                          <div className="text-center animate-in zoom-in duration-300">
                            <div className="relative w-24 h-24 mx-auto mb-2 rounded-full overflow-hidden border-2 border-white shadow-sm">
                              {(() => {
                                const r = openRibbons.find(
                                  (i) => i.id === selectedRibbonId
                                );
                                const imgUrl = getProductImage(
                                  r?.imageUrl,
                                  r?.type || "RIBBON"
                                );
                                return (
                                  <SafeImage
                                    src={imgUrl}
                                    alt=""
                                    fill
                                    className="object-cover"
                                  />
                                );
                              })()}
                            </div>
                            <p className="text-sm font-bold text-[var(--primary)] px-2">
                              {
                                openRibbons.find(
                                  (i) => i.id === selectedRibbonId
                                )?.name
                              }
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                              {meterAmount} metros
                            </p>
                          </div>
                        ) : (
                          <div className="text-slate-400 flex flex-col items-center">
                            <Ruler size={32} className="opacity-40 mb-2" />
                            <p className="text-sm">Selecione uma fita</p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between py-2 border-b border-slate-100">
                          <span className="text-slate-500">Item</span>
                          <span className="font-medium text-slate-800 text-right max-w-[150px] truncate">
                            {openRibbons.find((i) => i.id === selectedRibbonId)
                              ?.name || "-"}
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-100">
                          <span className="text-slate-500">Quantidade</span>
                          <span className="font-medium text-slate-800">
                            {meterAmount}m
                          </span>
                        </div>
                      </div>

                      <div className="pt-4">
                        <div className="flex justify-between items-end mb-4">
                          <span className="text-slate-500 font-medium">
                            Valor Total
                          </span>
                          <span className="text-3xl font-bold text-[var(--primary)]">
                            R${" "}
                            {(
                              (openRibbons.find(
                                (i) => i.id === selectedRibbonId
                              )?.price || 0) * meterAmount
                            ).toFixed(2)}
                          </span>
                        </div>
                        <Button
                          onClick={handleAddMeter}
                          disabled={!selectedRibbonId}
                          className="w-full h-12 text-lg font-bold shadow-md"
                          style={{
                            backgroundColor: selectedRibbonId
                              ? "var(--primary)"
                              : undefined,
                            color: "var(--primary-contrast)",
                          }}
                        >
                          <ShoppingCart className="mr-2 h-5 w-5" /> Adicionar
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent
              value="service"
              className="p-8 animate-in fade-in slide-in-from-bottom-2 duration-500"
            >
              <LacoBuilder />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  );
}

export default function FitasPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50"></div>}>
      <FitasContent />
    </Suspense>
  );
}
