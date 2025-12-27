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

    // Scroll top no mobile para facilitar nova escolha
    if (window.innerWidth < 1024) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const selectedMeterProduct = openRibbons.find(
    (p) => p.id === selectedRibbonId
  );
  const meterTotalPrice = selectedMeterProduct
    ? selectedMeterProduct.price * meterAmount
    : 0;

  return (
    <main
      className="min-h-screen bg-slate-50 pb-32 lg:pb-20 transition-colors"
      style={themeStyles}
    >
      <StoreHeader />

      {/* Container Principal */}
      <div className="max-w-6xl mx-auto px-0 sm:px-4 -mt-4 relative z-10">
        <div className="bg-white sm:rounded-3xl shadow-sm border-t sm:border border-slate-100 overflow-hidden min-h-[600px]">
          {/* Header da Página */}
          <div className="p-6 sm:p-8 border-b bg-gradient-to-r from-slate-50 to-white">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">
              Central de Fitas
            </h1>
            <p className="text-sm sm:text-base text-slate-500">
              Gerencie seu estoque: Rolo Fechado para atacado, Aberto para corte
              e laços personalizados.
            </p>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            {/* Lista de Abas Sticky Mobile */}
            <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-100 px-4 sm:px-8 py-3 sm:py-6 shadow-sm sm:shadow-none sm:static">
              <TabsList className="w-full md:w-auto grid grid-cols-3 h-auto p-1 bg-slate-100 rounded-xl">
                <TabsTrigger
                  value="rolls"
                  className="py-2.5 sm:py-3 gap-2 data-[state=active]:bg-white data-[state=active]:text-[var(--primary)] data-[state=active]:shadow-sm transition-all text-xs sm:text-sm font-medium"
                >
                  <Lock className="w-4 h-4" />{" "}
                  <span className="md:inline">
                    Rolos <span className="hidden sm:inline">Fechados</span>
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="meter"
                  className="py-2.5 sm:py-3 gap-2 data-[state=active]:bg-white data-[state=active]:text-[var(--primary)] data-[state=active]:shadow-sm transition-all text-xs sm:text-sm font-medium"
                >
                  <Scissors className="w-4 h-4" />{" "}
                  <span className="md:inline">Por Metro</span>
                </TabsTrigger>
                <TabsTrigger
                  value="service"
                  className="py-2.5 sm:py-3 gap-2 data-[state=active]:bg-white data-[state=active]:text-[var(--primary)] data-[state=active]:shadow-sm transition-all text-xs sm:text-sm font-medium"
                >
                  <Gift className="w-4 h-4" />{" "}
                  <span className="md:inline">Criar Laço</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* CONTEÚDO: ROLOS FECHADOS */}
            <TabsContent
              value="rolls"
              className="p-4 sm:p-8 animate-in fade-in slide-in-from-bottom-2 duration-500 m-0"
            >
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Lock size={20} className="text-[var(--primary)]" /> Estoque
                  Lacrado
                </h3>
                <span className="text-xs sm:text-sm text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                  {closedRolls.length} opções
                </span>
              </div>

              {closedRolls.length === 0 ? (
                <div className="text-center py-20 text-slate-400 bg-slate-50 rounded-xl border-2 border-dashed mx-4 sm:mx-0">
                  <Package size={48} className="mx-auto mb-4 opacity-20" />
                  <p>Nenhum rolo fechado disponível.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
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
                          actionLabel="Comprar"
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
              className="p-4 sm:p-8 animate-in fade-in slide-in-from-bottom-2 duration-500 m-0"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6 sm:space-y-8">
                  {/* SEÇÃO 1: ESCOLHA DA FITA */}
                  <section>
                    <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <span className="bg-slate-800 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0">
                        1
                      </span>{" "}
                      Escolha a Fita
                    </h3>

                    {openRibbons.length === 0 ? (
                      <div className="p-6 bg-yellow-50 text-yellow-800 rounded-xl border border-yellow-100 flex items-center gap-3 text-sm">
                        <AlertCircle size={20} className="shrink-0" />
                        <div>
                          Sem fitas abertas no momento.
                          <br />
                          Confira os <strong>Rolos Fechados</strong>!
                        </div>
                      </div>
                    ) : (
                      // Grid responsivo ajustado para mobile e desktop
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-[50vh] sm:max-h-[400px] overflow-y-auto p-1 custom-scrollbar">
                        {openRibbons.map((ribbon) => {
                          const imgUrl = getProductImage(
                            ribbon.imageUrl,
                            ribbon.type
                          );
                          return (
                            <div
                              key={ribbon.id}
                              onClick={() => setSelectedRibbonId(ribbon.id)}
                              className={`cursor-pointer rounded-lg border p-2 flex flex-col items-center gap-2 transition-all hover:shadow-md relative group ${
                                selectedRibbonId === ribbon.id
                                  ? "border-[var(--primary)] ring-2 ring-[var(--primary)] ring-opacity-20 bg-purple-50"
                                  : "border-slate-200 bg-white hover:border-[var(--primary)]/50"
                              }`}
                            >
                              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-100 relative overflow-hidden shrink-0">
                                <SafeImage
                                  src={imgUrl}
                                  alt={ribbon.name}
                                  name={ribbon.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <span className="text-[10px] sm:text-xs text-center line-clamp-2 leading-tight font-medium text-slate-600 group-hover:text-slate-900">
                                {ribbon.name}
                              </span>
                              <span className="text-[10px] font-bold text-slate-500 mt-auto">
                                R$ {ribbon.price.toFixed(2)}/m
                              </span>
                              {selectedRibbonId === ribbon.id && (
                                <div className="absolute top-1 right-1 bg-white rounded-full p-0.5 shadow-sm">
                                  <CheckCircle2 className="text-[var(--primary)] w-3 h-3 sm:w-4 sm:h-4" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>

                  {/* SEÇÃO 2: QUANTIDADE */}
                  <section
                    className={`transition-opacity duration-300 ${
                      selectedRibbonId
                        ? "opacity-100"
                        : "opacity-40 pointer-events-none grayscale"
                    }`}
                  >
                    <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <span className="bg-slate-800 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0">
                        2
                      </span>{" "}
                      Quantos Metros?
                    </h3>

                    <div className="bg-slate-50 p-4 sm:p-6 rounded-xl border border-slate-100 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                      <div className="flex items-center border rounded-xl bg-white overflow-hidden shadow-sm h-12 sm:h-14">
                        <button
                          onClick={() =>
                            setMeterAmount(Math.max(0.5, meterAmount - 0.5))
                          }
                          className="w-12 sm:w-14 h-full hover:bg-slate-50 text-slate-500 border-r text-xl flex items-center justify-center active:bg-slate-100 touch-manipulation"
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
                          className="w-20 sm:w-24 text-center border-none font-bold text-lg sm:text-xl focus:ring-0 outline-none text-slate-800"
                        />
                        <button
                          onClick={() => setMeterAmount(meterAmount + 0.5)}
                          className="w-12 sm:w-14 h-full hover:bg-slate-50 text-slate-500 border-l text-xl flex items-center justify-center active:bg-slate-100 touch-manipulation"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-sm font-medium text-slate-500 uppercase tracking-wide">
                        metros lineares
                      </span>
                    </div>
                  </section>
                </div>

                {/* PAINEL LATERAL (DESKTOP SOMENTE) */}
                <div className="lg:col-span-1 hidden lg:block">
                  <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 sticky top-24">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 text-center">
                      Resumo do Corte
                    </h3>
                    <div className="space-y-6">
                      <div className="w-full aspect-square bg-slate-50 rounded-xl border border-dashed border-slate-300 flex items-center justify-center relative overflow-hidden">
                        {selectedRibbonId ? (
                          <div className="text-center animate-in zoom-in duration-300 w-full p-4">
                            <div className="relative w-24 h-24 mx-auto mb-3 rounded-full overflow-hidden border-4 border-white shadow-md">
                              <SafeImage
                                src={getProductImage(
                                  selectedMeterProduct?.imageUrl,
                                  selectedMeterProduct?.type
                                )}
                                alt={selectedMeterProduct?.name || ""}
                                name={selectedMeterProduct?.name || ""}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <p className="text-sm font-bold text-[var(--primary)] line-clamp-2 leading-tight px-2">
                              {selectedMeterProduct?.name}
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
                          <span className="text-slate-500">Valor Unit.</span>
                          <span className="font-medium text-slate-800">
                            R${" "}
                            {selectedMeterProduct?.price.toFixed(2) || "0.00"}/m
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-100">
                          <span className="text-slate-500">Quantidade</span>
                          <span className="font-medium text-slate-800">
                            {meterAmount}m
                          </span>
                        </div>
                      </div>

                      <div className="pt-2">
                        <div className="flex justify-between items-end mb-4">
                          <span className="text-slate-500 font-medium">
                            Total
                          </span>
                          <span className="text-3xl font-bold text-[var(--primary)]">
                            R$ {meterTotalPrice.toFixed(2)}
                          </span>
                        </div>
                        <Button
                          onClick={handleAddMeter}
                          disabled={!selectedRibbonId}
                          className="w-full h-12 text-lg font-bold shadow-md transition-transform hover:scale-[1.02]"
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

                {/* BARRA FIXA MOBILE (Para aba "Por Metro") */}
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50 lg:hidden flex items-center justify-between gap-4 safe-area-pb">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 font-medium">
                      Total ({meterAmount}m)
                    </span>
                    <span className="text-xl font-bold text-[var(--primary)]">
                      R$ {meterTotalPrice.toFixed(2)}
                    </span>
                  </div>
                  <Button
                    onClick={handleAddMeter}
                    disabled={!selectedRibbonId}
                    className="flex-1 h-12 text-base font-bold rounded-xl shadow-sm"
                    style={{
                      backgroundColor: selectedRibbonId
                        ? "var(--primary)"
                        : undefined,
                    }}
                  >
                    {selectedRibbonId ? (
                      <>
                        <ShoppingCart className="mr-2 h-5 w-5" /> Adicionar
                      </>
                    ) : (
                      "Selecione..."
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* CONTEÚDO: MONTADOR DE LAÇO */}
            <TabsContent
              value="service"
              className="p-4 sm:p-8 animate-in fade-in slide-in-from-bottom-2 duration-500 m-0"
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
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-[var(--primary)] rounded-full animate-spin"></div>
        </div>
      }
    >
      <FitasContent />
    </Suspense>
  );
}
