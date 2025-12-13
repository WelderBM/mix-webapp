"use client";

import { useEffect, useState, useMemo } from "react";
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
  ArrowLeft,
} from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";
import { hexToRgb, getContrastColor } from "@/lib/utils";

export default function FitasPage() {
  const { allProducts, fetchProducts } = useProductStore();
  const { addItem, openCart, items } = useCartStore(); // Pegamos 'items' para contar o badge
  const { settings, fetchSettings } = useSettingsStore();

  // Estado para a Calculadora de Metro
  const [selectedRibbonId, setSelectedRibbonId] = useState<string>("");
  const [meterAmount, setMeterAmount] = useState<number>(1);

  // Calcula itens no carrinho para o Badge
  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    fetchProducts();
    fetchSettings();
  }, [fetchProducts, fetchSettings]);

  const themeStyles = useMemo(() => {
    const primary = settings.theme?.primaryColor || "#7c3aed";
    return {
      "--primary": primary,
      "--primary-rgb": hexToRgb(primary),
      "--primary-contrast": getContrastColor(primary),
    } as React.CSSProperties;
  }, [settings]);

  // FILTRAGEM
  const ribbonProducts = useMemo(
    () => allProducts.filter((p) => p.type === "RIBBON"),
    [allProducts]
  );
  const fullRolls = useMemo(
    () => ribbonProducts.filter((p) => p.canBeSoldAsRoll),
    [ribbonProducts]
  );
  const cutRibbons = useMemo(() => ribbonProducts, [ribbonProducts]);

  // Ações
  const handleAddRoll = (product: any) => {
    addItem({
      cartId: crypto.randomUUID(),
      type: "SIMPLE",
      product: product,
      quantity: 1,
      kitTotalAmount: 0,
    });
    openCart();
  };

  const handleAddMeter = () => {
    const product = cutRibbons.find((p) => p.id === selectedRibbonId);
    if (!product) return;

    const totalPrice = product.price * meterAmount;

    // Adiciona ao carrinho
    addItem({
      cartId: crypto.randomUUID(),
      type: "SIMPLE",
      product: product,
      quantity: meterAmount,
      kitTotalAmount: totalPrice,
    });

    // Feedback visual
    toast.success(
      <div className="flex flex-col">
        <span className="font-bold">Adicionado!</span>
        <span className="text-xs">
          {meterAmount}m de {product.name}
        </span>
      </div>
    );

    // Reset de fluxo
    setSelectedRibbonId("");
    setMeterAmount(1);
  };

  return (
    <main className="min-h-screen bg-slate-50 pb-20" style={themeStyles}>
      {/* HEADER DECORATIVO (FACHADA) */}
      <StoreHeader />

      {/* BARRA DE NAVEGAÇÃO FLUTUANTE (NOVO!) */}
      <div className="sticky top-4 z-50 px-4 mb-4 flex justify-between items-center max-w-6xl mx-auto pointer-events-none">
        {/* Botão Voltar (Pointer Events Auto para ser clicável) */}
        <Link href="/" className="pointer-events-auto">
          <Button
            variant="secondary"
            className="shadow-lg backdrop-blur-md bg-white/90 hover:bg-white text-slate-700 font-bold border border-white/20"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Início
          </Button>
        </Link>

        {/* Botão Carrinho (Pointer Events Auto) */}
        <Button
          onClick={openCart}
          className="pointer-events-auto shadow-lg bg-slate-900 text-white hover:bg-slate-800 relative font-bold"
        >
          <ShoppingCart size={20} className="mr-2" />
          <span className="hidden md:inline">Meu Carrinho</span>

          {/* Badge Contador */}
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full shadow-sm border-2 border-slate-50">
              {Math.round(cartCount)}
            </span>
          )}
        </Button>
      </div>

      {/* ÁREA DE CONTEÚDO */}
      <div className="max-w-6xl mx-auto px-4 -mt-4 relative z-10">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden min-h-[600px]">
          <div className="p-8 border-b bg-gradient-to-r from-slate-50 to-white">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">
              Central de Fitas & Laços
            </h1>
            <p className="text-slate-500">
              Escolha entre levar o rolo fechado, comprar por metro ou
              encomendar o laço pronto.
            </p>
          </div>

          <Tabs defaultValue="rolls" className="w-full">
            <div className="px-8 pt-6">
              <TabsList className="w-full md:w-auto grid grid-cols-3 h-auto p-1 bg-slate-100 rounded-xl">
                <TabsTrigger
                  value="rolls"
                  className="py-3 gap-2 data-[state=active]:bg-white data-[state=active]:text-[var(--primary)] data-[state=active]:shadow-sm transition-all"
                >
                  <Package size={18} />{" "}
                  <span className="hidden md:inline">Rolos Fechados</span>
                </TabsTrigger>
                <TabsTrigger
                  value="meter"
                  className="py-3 gap-2 data-[state=active]:bg-white data-[state=active]:text-[var(--primary)] data-[state=active]:shadow-sm transition-all"
                >
                  <Scissors size={18} />{" "}
                  <span className="hidden md:inline">Por Metro</span>
                </TabsTrigger>
                <TabsTrigger
                  value="service"
                  className="py-3 gap-2 data-[state=active]:bg-white data-[state=active]:text-[var(--primary)] data-[state=active]:shadow-sm transition-all"
                >
                  <Gift size={18} />{" "}
                  <span className="hidden md:inline">Laço Pronto</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* ABA 1: ROLOS FECHADOS */}
            <TabsContent
              value="rolls"
              className="p-8 animate-in fade-in slide-in-from-bottom-2 duration-500"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-700">
                  Estoque de Rolos Lacrados
                </h2>
                <span className="text-sm text-slate-400">
                  {fullRolls.length} opções disponíveis
                </span>
              </div>

              {fullRolls.length === 0 ? (
                <div className="text-center py-20 text-slate-400 bg-slate-50 rounded-xl border-2 border-dashed">
                  <Package size={48} className="mx-auto mb-4 opacity-20" />
                  <p>Nenhum rolo fechado disponível no momento.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {fullRolls.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onSelect={() => handleAddRoll(product)}
                      actionLabel="Adicionar Rolo"
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ABA 2: COMPRAR POR METRO */}
            <TabsContent
              value="meter"
              className="p-8 animate-in fade-in slide-in-from-bottom-2 duration-500"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Lado Esquerdo: Seleção */}
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-700 mb-2 flex items-center gap-2">
                      <Scissors className="text-[var(--primary)]" /> Monte seu
                      Corte
                    </h2>
                    <p className="text-sm text-slate-500">
                      Escolha a fita e diga quantos metros precisa. Nós cortamos
                      para você.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm font-medium text-slate-700">
                      1. Escolha a Fita
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto p-1 custom-scrollbar">
                      {cutRibbons.map((ribbon) => (
                        <div
                          key={ribbon.id}
                          onClick={() => setSelectedRibbonId(ribbon.id)}
                          className={`
                                                cursor-pointer rounded-lg border p-2 flex flex-col items-center gap-2 transition-all hover:shadow-md h-full relative
                                                ${
                                                  selectedRibbonId === ribbon.id
                                                    ? "border-[var(--primary)] ring-2 ring-[var(--primary)] ring-opacity-20 bg-purple-50 transform scale-105"
                                                    : "border-slate-200 bg-white hover:border-slate-300"
                                                }
                                            `}
                        >
                          <div className="w-12 h-12 rounded-full bg-slate-100 relative overflow-hidden shrink-0">
                            {ribbon.imageUrl && (
                              <Image
                                src={ribbon.imageUrl}
                                alt={ribbon.name}
                                fill
                                className="object-cover"
                              />
                            )}
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
                      ))}
                    </div>
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

                {/* Lado Direito: Resumo */}
                <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200 flex flex-col justify-center items-center text-center space-y-6 transition-all">
                  {selectedRibbonId ? (
                    <div className="animate-in zoom-in duration-300 w-full flex flex-col items-center">
                      <div className="w-32 h-32 bg-white rounded-full shadow-md relative overflow-hidden border-4 border-white mb-4">
                        {(() => {
                          const r = cutRibbons.find(
                            (i) => i.id === selectedRibbonId
                          );
                          return r?.imageUrl ? (
                            <Image
                              src={r.imageUrl}
                              alt=""
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <Package className="m-auto text-slate-300" />
                          );
                        })()}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-800">
                          {
                            cutRibbons.find((i) => i.id === selectedRibbonId)
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
                              (cutRibbons.find((i) => i.id === selectedRibbonId)
                                ?.price || 0) * meterAmount
                            ).toFixed(2)}
                          </span>
                        </div>
                        <Button
                          onClick={handleAddMeter}
                          className="w-full h-12 text-lg font-bold shadow-lg hover:scale-105 transition-transform active:scale-95"
                          style={{
                            backgroundColor: "var(--primary)",
                            color: "var(--primary-contrast)",
                          }}
                        >
                          <ShoppingCart className="mr-2 h-5 w-5" /> Adicionar e
                          Continuar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-400 flex flex-col items-center">
                      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <Ruler size={32} className="opacity-40" />
                      </div>
                      <p className="font-medium">Selecione uma fita ao lado</p>
                      <p className="text-xs max-w-[200px] mt-1">
                        O resumo do seu corte aparecerá aqui.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* ABA 3: SERVIÇO DE LAÇO PRONTO */}
            <TabsContent
              value="service"
              className="p-8 animate-in fade-in slide-in-from-bottom-2 duration-500"
            >
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
                <div className="bg-purple-100 p-6 rounded-full text-purple-600 mb-2">
                  <Gift size={48} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800">
                  Quer o Laço já Montado?
                </h2>
                <p className="text-slate-500 max-w-md">
                  Acesse nosso montador exclusivo. Você escolhe a fita, o modelo
                  (Chanel, Duplo, Simples) e o tamanho, e nós entregamos pronto
                  para colar no presente.
                </p>
                <Button
                  className="bg-slate-900 text-white h-14 px-8 rounded-full text-lg shadow-xl hover:bg-slate-800 transition-all hover:scale-105"
                  onClick={() => (window.location.href = "/laco-builder")}
                >
                  Ir para o Montador de Laços{" "}
                  <Scissors className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  );
}
