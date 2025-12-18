"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
// ... imports (mantenha os mesmos)
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

  // Manipulador ajustado para garantir que o preço do rolo seja usado
  const handleAddRoll = (product: any) => {
    // Se o produto tiver rollPrice, usamos ele como preço base para o item no carrinho
    // Criamos um objeto temporário para garantir que o carrinho pegue o valor certo
    const productToAdd = {
      ...product,
      price: product.rollPrice || product.price, // Força o preço do rolo se existir
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

            {/* ABA ROLOS FECHADOS */}
            <TabsContent
              value="rolls"
              className="p-8 animate-in fade-in slide-in-from-bottom-2 duration-500"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-700">
                  Estoque Lacrado
                </h2>
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
                    // TRUQUE VISUAL: Criamos um objeto clone só para exibição
                    // Trocamos o 'price' pelo 'rollPrice' para o Card mostrar o valor certo (R$ 40,00)
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

            {/* ABA POR METRO */}
            <TabsContent
              value="meter"
              className="p-8 animate-in fade-in slide-in-from-bottom-2 duration-500"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-700 mb-2 flex items-center gap-2">
                      <Unlock className="text-[var(--primary)]" size={20} />{" "}
                      Corte de Fitas Abertas
                    </h2>
                    <p className="text-sm text-slate-500">
                      Apenas fitas abertas podem ser fracionadas.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm font-medium text-slate-700">
                      1. Escolha a Fita (Estoque Aberto)
                    </label>
                    {openRibbons.length === 0 ? (
                      <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg text-sm border border-yellow-100">
                        No momento, não temos fitas disponíveis para venda por
                        metro. Confira a aba de <strong>Rolos Fechados</strong>!
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto p-1 custom-scrollbar">
                        {openRibbons.map((ribbon) => {
                          const imgUrl = getProductImage(
                            ribbon.imageUrl,
                            ribbon.name || "Sem imagem"
                          );
                          return (
                            <div
                              key={ribbon.id}
                              onClick={() => setSelectedRibbonId(ribbon.id)}
                              className={`cursor-pointer rounded-lg border p-2 flex flex-col items-center gap-2 transition-all hover:shadow-md h-full relative ${
                                selectedRibbonId === ribbon.id
                                  ? "border-[var(--primary)] ring-2 ring-[var(--primary)] ring-opacity-20 bg-purple-50 transform scale-105"
                                  : "border-slate-200 bg-white"
                              }`}
                            >
                              <div className="w-12 h-12 rounded-full bg-slate-100 relative overflow-hidden shrink-0">
                                <SafeImage
                                  src={imgUrl}
                                  alt={ribbon.name}
                                  name={ribbon.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <span className="text-[10px] text-center leading-tight line-clamp-2 w-full">
                                {ribbon.name}
                              </span>
                              <span className="text-xs font-bold text-slate-600 mt-auto">
                                R$ {ribbon.price.toFixed(2)}/m
                              </span>
                              {selectedRibbonId === ribbon.id && (
                                <div className="absolute top-1 right-1 text-[var(--primary)] bg-white rounded-full p-0.5 shadow-sm">
                                  <CheckCircle2
                                    size={12}
                                    fill="currentColor"
                                    className="text-white"
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div
                    className={`space-y-4 transition-opacity duration-300 ${
                      selectedRibbonId
                        ? "opacity-100"
                        : "opacity-50 pointer-events-none"
                    }`}
                  >
                    <label className="text-sm font-medium text-slate-700">
                      2. Quantos Metros?
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center border rounded-lg bg-white overflow-hidden shadow-sm w-40">
                        <button
                          onClick={() =>
                            setMeterAmount(Math.max(0.5, meterAmount - 0.5))
                          }
                          className="px-3 py-2 hover:bg-slate-100 text-slate-500"
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
                          className="w-full text-center border-none font-bold text-lg focus:ring-0 outline-none"
                        />
                        <button
                          onClick={() => setMeterAmount(meterAmount + 0.5)}
                          className="px-3 py-2 hover:bg-slate-100 text-slate-500"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-sm text-slate-500">metros</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200 flex flex-col justify-center items-center text-center space-y-6">
                  {selectedRibbonId ? (
                    <div className="animate-in zoom-in duration-300 w-full flex flex-col items-center">
                      <div className="w-32 h-32 bg-white rounded-full shadow-md relative overflow-hidden border-4 border-white mb-4">
                        {(() => {
                          const r = openRibbons.find(
                            (i) => i.id === selectedRibbonId
                          );
                          const imgUrl = getProductImage(
                            r?.imageUrl,
                            r?.name || "Sem imagem"
                          );
                          return (
                            <SafeImage
                              src={imgUrl}
                              name={r?.name}
                              alt={r?.name}
                              fill
                              className="object-cover"
                            />
                          );
                        })()}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-800">
                          {
                            openRibbons.find((i) => i.id === selectedRibbonId)
                              ?.name
                          }
                        </h3>
                        <p className="text-slate-500 text-sm">
                          Corte de {meterAmount} metros
                        </p>
                      </div>
                      <div className="w-full pt-4 border-t border-slate-200 mt-6">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-slate-500">Total Estimado</span>
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
                          className="w-full h-12 text-lg font-bold shadow-lg"
                          style={{
                            backgroundColor: "var(--primary)",
                            color: "var(--primary-contrast)",
                          }}
                        >
                          <ShoppingCart className="mr-2 h-5 w-5" /> Adicionar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-400 flex flex-col items-center">
                      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <Ruler size={32} className="opacity-40" />
                      </div>
                      <p className="font-medium">
                        Selecione uma fita aberta ao lado
                      </p>
                    </div>
                  )}
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
