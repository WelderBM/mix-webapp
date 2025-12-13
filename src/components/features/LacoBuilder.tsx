"use client";

import { useState, useMemo } from "react";
import { useProductStore } from "@/store/productStore";
import { useCartStore } from "@/store/cartStore";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ShoppingCart, Info } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

// Definição dos modelos de laço
const BOW_STYLES = [
  {
    id: "chanel",
    name: "Chanel",
    priceData: 5.0,
    image: "/placeholder-chanel.png",
    desc: "Clássico e elegante, plano.",
  },
  {
    id: "gravata",
    name: "Gravata",
    priceData: 4.0,
    image: "/placeholder-gravata.png",
    desc: "Simples e versátil.",
  },
  {
    id: "boutique",
    name: "Boutique",
    priceData: 8.0,
    image: "/placeholder-boutique.png",
    desc: "Volumoso e sofisticado.",
  },
];

const SIZES = [
  { id: "P", name: "Pequeno (5-6cm)", multiplier: 1 },
  { id: "M", name: "Médio (8-10cm)", multiplier: 1.5 },
  { id: "G", name: "Grande (12-14cm)", multiplier: 2 },
];

export function LacoBuilder() {
  const { allProducts } = useProductStore();
  const { addItem, openCart } = useCartStore();

  const [step, setStep] = useState(1);
  const [selectedRibbonId, setSelectedRibbonId] = useState<string>("");
  const [selectedStyleId, setSelectedStyleId] = useState<string>("");
  const [selectedSizeId, setSelectedSizeId] = useState<string>("");

  // Filtra apenas fitas
  const ribbons = useMemo(
    () => allProducts.filter((p) => p.type === "RIBBON"),
    [allProducts]
  );

  const selectedRibbon = ribbons.find((r) => r.id === selectedRibbonId);
  const selectedStyle = BOW_STYLES.find((s) => s.id === selectedStyleId);
  const selectedSize = SIZES.find((s) => s.id === selectedSizeId);

  // Cálculo do Preço: (Preço da Fita * Multiplicador) + Mão de Obra do Modelo
  const finalPrice = useMemo(() => {
    if (!selectedRibbon || !selectedStyle || !selectedSize) return 0;
    const ribbonCost = selectedRibbon.price * selectedSize.multiplier; // Custo estimado da fita gasta
    return ribbonCost + selectedStyle.priceData; // + Mão de obra
  }, [selectedRibbon, selectedStyle, selectedSize]);

  const handleAddToCart = () => {
    if (!selectedRibbon || !selectedStyle || !selectedSize) return;

    addItem({
      cartId: crypto.randomUUID(),
      type: "CUSTOM_RIBBON",
      product: {
        ...selectedRibbon,
        name: `Laço ${selectedStyle.name} - ${selectedRibbon.name}`,
      },
      quantity: 1,
      kitTotalAmount: finalPrice,
      customizations: {
        style: selectedStyle.name,
        size: selectedSize.name,
      },
    });

    openCart();
    toast.success("Laço personalizado adicionado!");

    // Reset
    setStep(1);
    setSelectedRibbonId("");
    setSelectedStyleId("");
    setSelectedSizeId("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* COLUNA ESQUERDA: CONTROLES */}
      <div className="lg:col-span-2 space-y-8">
        {/* PASSO 1: FITA */}
        <section>
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="bg-slate-800 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">
              1
            </span>
            Escolha a Fita
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-[300px] overflow-y-auto p-1 custom-scrollbar">
            {ribbons.map((ribbon) => (
              <div
                key={ribbon.id}
                onClick={() => setSelectedRibbonId(ribbon.id)}
                className={`cursor-pointer rounded-lg border p-2 flex flex-col items-center gap-2 transition-all hover:shadow-md relative
                  ${
                    selectedRibbonId === ribbon.id
                      ? "border-[var(--primary)] ring-2 ring-[var(--primary)] ring-opacity-20 bg-purple-50"
                      : "border-slate-200 bg-white"
                  }`}
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 relative overflow-hidden shrink-0">
                  {ribbon.imageUrl && (
                    <Image
                      src={ribbon.imageUrl}
                      alt={ribbon.name}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
                <span className="text-[10px] text-center line-clamp-2 leading-tight">
                  {ribbon.name}
                </span>
                {selectedRibbonId === ribbon.id && (
                  <CheckCircle2 className="absolute top-1 right-1 text-[var(--primary)] w-4 h-4" />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* PASSO 2: MODELO */}
        <section
          className={!selectedRibbonId ? "opacity-50 pointer-events-none" : ""}
        >
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="bg-slate-800 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">
              2
            </span>
            Modelo do Laço
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {BOW_STYLES.map((style) => (
              <div
                key={style.id}
                onClick={() => setSelectedStyleId(style.id)}
                className={`cursor-pointer rounded-xl border p-4 flex flex-col items-center gap-3 transition-all
                  ${
                    selectedStyleId === style.id
                      ? "border-[var(--primary)] bg-purple-50 ring-1 ring-[var(--primary)]"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
              >
                {/* Placeholder para icone do laço */}
                <div className="w-16 h-16 bg-slate-200 rounded-md flex items-center justify-center text-slate-400">
                  <span className="text-xs">IMG</span>
                </div>
                <div className="text-center">
                  <p className="font-bold text-slate-700">{style.name}</p>
                  <p className="text-xs text-slate-500">{style.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* PASSO 3: TAMANHO */}
        <section
          className={!selectedStyleId ? "opacity-50 pointer-events-none" : ""}
        >
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="bg-slate-800 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">
              3
            </span>
            Tamanho
          </h3>
          <div className="flex flex-wrap gap-3">
            {SIZES.map((size) => (
              <button
                key={size.id}
                onClick={() => setSelectedSizeId(size.id)}
                className={`px-6 py-3 rounded-full border text-sm font-medium transition-all
                  ${
                    selectedSizeId === size.id
                      ? "bg-slate-800 text-white border-slate-800 shadow-lg transform scale-105"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
              >
                {size.name}
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* COLUNA DIREITA: RESUMO */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 sticky top-24">
          <h3 className="text-xl font-bold text-slate-800 mb-6 text-center">
            Resumo do Laço
          </h3>

          <div className="space-y-6">
            {/* PREVIEW VISUAL */}
            <div className="w-full aspect-square bg-slate-50 rounded-xl border border-dashed border-slate-300 flex items-center justify-center relative overflow-hidden">
              {selectedRibbon && selectedStyle ? (
                <div className="text-center">
                  <div className="relative w-24 h-24 mx-auto mb-2 rounded-full overflow-hidden border-2 border-white shadow-sm">
                    {selectedRibbon.imageUrl && (
                      <Image
                        src={selectedRibbon.imageUrl}
                        alt=""
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>
                  <p className="text-sm font-bold text-[var(--primary)]">
                    {selectedStyle.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {selectedSize?.name || "Tamanho..."}
                  </p>
                </div>
              ) : (
                <p className="text-slate-400 text-sm">Selecione as opções</p>
              )}
            </div>

            {/* LISTA DE ESCOLHAS */}
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Fita</span>
                <span className="font-medium text-slate-800 text-right max-w-[150px] truncate">
                  {selectedRibbon?.name || "-"}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Modelo</span>
                <span className="font-medium text-slate-800">
                  {selectedStyle?.name || "-"}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Tamanho</span>
                <span className="font-medium text-slate-800">
                  {selectedSize?.name || "-"}
                </span>
              </div>
            </div>

            {/* TOTAL E AÇÃO */}
            <div className="pt-4">
              <div className="flex justify-between items-end mb-4">
                <span className="text-slate-500 font-medium">Valor Total</span>
                <span className="text-3xl font-bold text-[var(--primary)]">
                  R$ {finalPrice.toFixed(2)}
                </span>
              </div>

              <Button
                onClick={handleAddToCart}
                disabled={!selectedRibbon || !selectedStyle || !selectedSize}
                className="w-full h-12 text-lg font-bold shadow-md"
                style={{
                  backgroundColor:
                    selectedRibbon && selectedStyle && selectedSize
                      ? "var(--primary)"
                      : undefined,
                }}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Adicionar Laço
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
