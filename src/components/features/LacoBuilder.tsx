"use client";

import { useState, useMemo } from "react";
import { useProductStore } from "@/store/productStore";
import { useCartStore } from "@/store/cartStore";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ShoppingCart, AlertCircle, Package } from "lucide-react";
import { toast } from "sonner";
import { getProductImage } from "@/lib/image-utils";
import { SafeImage } from "../ui/SafeImage";

// NOTA: No futuro, esses modelos podem vir do banco de dados (Firebase)
const BOW_STYLES = [
  {
    id: "bola",
    name: "Bola",
    image: "https://placehold.co/400x400/png?text=Laco+Bola",
    desc: "Clássico e elegante, plano.",
  },
  {
    id: "borboleta",
    name: "Borboleta",
    image: "https://placehold.co/400x400/png?text=Laco+Borboleta",
    desc: "Simples e versátil.",
  },
];

const SIZES = [
  { id: "P", name: "Pequeno", price: 3 },
  { id: "M", name: "Médio", price: 4 },
  { id: "G", name: "Grande", price: 5 },
];

export function LacoBuilder() {
  const { allProducts } = useProductStore();
  const { addItem, openCart } = useCartStore();

  const [selectedRibbonId, setSelectedRibbonId] = useState<string>("");
  const [selectedStyleId, setSelectedStyleId] = useState<string>("");
  const [selectedSizeId, setSelectedSizeId] = useState<string>("");

  const ribbons = useMemo(
    () =>
      allProducts.filter(
        (p) => p.type === "RIBBON" && p.ribbonInventory?.status === "ABERTO"
      ),
    [allProducts]
  );

  const selectedRibbon = ribbons.find((r) => r.id === selectedRibbonId);
  const selectedStyle = BOW_STYLES.find((s) => s.id === selectedStyleId);
  const selectedSize = SIZES.find((s) => s.id === selectedSizeId);

  const finalPrice = useMemo(() => {
    if (!selectedSize) return 0;
    return selectedSize.price;
  }, [selectedSize]);

  const isFormComplete = selectedRibbon && selectedStyle && selectedSize;

  const handleAddToCart = () => {
    if (!isFormComplete) {
      toast.error("Selecione todas as opções para continuar");
      return;
    }

    const safeId =
      Date.now().toString(36) + Math.random().toString(36).substr(2);

    addItem({
      cartId: safeId,
      type: "CUSTOM_RIBBON",
      product: {
        ...selectedRibbon,
        name: `Laço ${selectedStyle.name} - ${selectedRibbon.name}`,
      },
      quantity: 1,
      kitTotalAmount: finalPrice,
      customizations: { style: selectedStyle.name, size: selectedSize.name },
    });

    openCart();
    toast.success("Laço personalizado adicionado!");

    // Opcional: Resetar campos após adicionar
    setSelectedRibbonId("");
    setSelectedStyleId("");
    setSelectedSizeId("");

    // Scroll para o topo em mobile pode ser útil
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    // Adicionei pb-32 para dar espaço para a barra fixa no mobile
    <div className="relative pb-32 lg:pb-0">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ÁREA DE SELEÇÃO (Colunas 1 e 2 no Desktop) */}
        <div className="lg:col-span-2 space-y-8">
          {/* SEÇÃO 1: ESCOLHA DA FITA */}
          <section>
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 sticky top-0 bg-white/95 backdrop-blur py-2 z-10 lg:static lg:bg-transparent">
              <span className="bg-slate-800 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0">
                1
              </span>{" "}
              Escolha a Fita
            </h3>

            {ribbons.length === 0 ? (
              <div className="p-6 bg-yellow-50 border border-yellow-100 rounded-xl flex items-center gap-3 text-yellow-800">
                <AlertCircle className="shrink-0" />
                <p className="text-sm">
                  Não há fitas abertas disponíveis. Verifique os Rolos Fechados.
                </p>
              </div>
            ) : (
              // Grid responsivo ajustado: 3 colunas no mobile muito pequeno, 4 no sm, 5 no md
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-[350px] overflow-y-auto p-1 custom-scrollbar">
                {ribbons.map((ribbon) => {
                  const imgUrl = getProductImage(ribbon.imageUrl, ribbon.type);
                  return (
                    <div
                      key={ribbon.id}
                      onClick={() => setSelectedRibbonId(ribbon.id)}
                      className={`cursor-pointer rounded-lg border p-2 flex flex-col items-center gap-2 transition-all hover:shadow-md relative group ${
                        selectedRibbonId === ribbon.id
                          ? "border-primary ring-2 ring-primary ring-opacity-20 bg-purple-50"
                          : "border-slate-200 bg-white hover:border-primary hover:border-opacity-50"
                      }`}
                    >
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-slate-100 relative overflow-hidden shrink-0 shadow-sm">
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
                      {selectedRibbonId === ribbon.id && (
                        <div className="absolute top-1 right-1 bg-white rounded-full p-0.5 shadow-sm">
                          <CheckCircle2 className="text-primary w-4 h-4 fill-white" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* SEÇÃO 2: MODELO */}
          <section
            className={`transition-opacity duration-300 ${
              !selectedRibbonId
                ? "opacity-40 pointer-events-none grayscale"
                : ""
            }`}
          >
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="bg-slate-800 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0">
                2
              </span>{" "}
              Modelo do Laço
            </h3>
            {/* Grid ajustado: 2 colunas no mobile para economizar espaço vertical */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {BOW_STYLES.map((style) => (
                <div
                  key={style.id}
                  onClick={() => setSelectedStyleId(style.id)}
                  className={`cursor-pointer rounded-xl border p-4 flex flex-col items-center gap-3 transition-all relative ${
                    selectedStyleId === style.id
                      ? "border-primary bg-purple-50 ring-1 ring-primary shadow-md"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                  }`}
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 relative overflow-hidden">
                    <SafeImage
                      src={style.image}
                      alt={style.name}
                      name={style.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="text-center w-full">
                    <p className="font-bold text-slate-700 text-sm sm:text-base">
                      {style.name}
                    </p>
                    <p className="text-[10px] sm:text-xs text-slate-500 line-clamp-2 leading-tight mt-1">
                      {style.desc}
                    </p>
                  </div>
                  {selectedStyleId === style.id && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle2 className="text-primary w-5 h-5 fill-purple-50" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* SEÇÃO 3: TAMANHO */}
          <section
            className={`transition-opacity duration-300 ${
              !selectedStyleId ? "opacity-40 pointer-events-none grayscale" : ""
            }`}
          >
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="bg-slate-800 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0">
                3
              </span>{" "}
              Tamanho
            </h3>
            <div className="flex flex-wrap gap-3">
              {SIZES.map((size) => (
                <button
                  key={size.id}
                  onClick={() => setSelectedSizeId(size.id)}
                  className={`flex-1 sm:flex-none px-4 py-3 sm:px-8 rounded-full border text-sm font-medium transition-all ${
                    selectedSizeId === size.id
                      ? "bg-slate-800 text-white border-slate-800 shadow-lg scale-105"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <span className="block text-base">{size.name}</span>
                  <span className="block text-xs opacity-80 font-normal">
                    R$ {size.price.toFixed(2)}
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* PAINEL LATERAL DE RESUMO (DESKTOP) & RESUMO FINAL (MOBILE) */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 lg:sticky lg:top-24">
            <h3 className="text-xl font-bold text-slate-800 mb-6 text-center flex items-center justify-center gap-2">
              <Package className="w-5 h-5" />
              Resumo
            </h3>

            <div className="space-y-6">
              {/* Preview Image Box */}
              <div className="w-full aspect-square bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center relative overflow-hidden group transition-all hover:border-primary">
                {selectedRibbon && selectedStyle ? (
                  <div className="text-center w-full h-full p-4 flex flex-col items-center justify-center">
                    <div className="relative w-32 h-32 sm:w-40 sm:h-40 mx-auto mb-3 rounded-full overflow-hidden border-4 border-white shadow-md transition-transform group-hover:scale-105">
                      <SafeImage
                        src={selectedRibbon.imageUrl}
                        alt={selectedRibbon.name}
                        name={selectedRibbon.name}
                        fill
                        className="object-cover"
                      />
                      {/* Overlay simulando o estilo - visualmente interessante */}
                      <div className="absolute inset-0 bg-black/5" />
                    </div>
                    <p className="text-base font-bold text-primary">
                      {selectedStyle.name}
                    </p>
                    <p className="text-xs text-slate-500 max-w-[200px] truncate">
                      {selectedRibbon.name}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-slate-400 gap-2">
                    <Package className="w-10 h-10 opacity-20" />
                    <p className="text-sm">Selecione as opções</p>
                  </div>
                )}
              </div>

              {/* Detalhes Textuais */}
              <div className="space-y-3 text-sm bg-slate-50 p-4 rounded-lg">
                <div className="flex justify-between items-center py-1 border-b border-slate-200/50 last:border-0">
                  <span className="text-slate-500">Fita</span>
                  <span className="font-medium text-slate-800 text-right max-w-[120px] truncate">
                    {selectedRibbon?.name || "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/50 last:border-0">
                  <span className="text-slate-500">Modelo</span>
                  <span className="font-medium text-slate-800">
                    {selectedStyle?.name || "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">Tamanho</span>
                  <span className="font-medium text-slate-800">
                    {selectedSize?.name || "—"}
                  </span>
                </div>
              </div>

              {/* Botão Desktop (Hidden on Mobile se preferir usar só a barra fixa, ou manter ambos) */}
              <div className="pt-2 hidden lg:block">
                <div className="flex justify-between items-end mb-4">
                  <span className="text-slate-500 font-medium">Total</span>
                  <span className="text-3xl font-bold text-primary">
                    R$ {finalPrice.toFixed(2)}
                  </span>
                </div>
                <Button
                  onClick={handleAddToCart}
                  disabled={!isFormComplete}
                  className="w-full h-12 text-lg font-bold shadow-md transition-all hover:scale-[1.02]"
                  style={{
                    backgroundColor: isFormComplete
                      ? "var(--primary)"
                      : undefined,
                  }}
                >
                  <ShoppingCart className="mr-2 h-5 w-5" /> Adicionar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BARRA FIXA MOBILE (Floating Action Bar) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50 lg:hidden flex items-center justify-between gap-4 safe-area-pb">
        <div className="flex flex-col">
          <span className="text-xs text-slate-500 font-medium">
            Valor Total
          </span>
          <span className="text-xl font-bold text-primary">
            R$ {finalPrice.toFixed(2)}
          </span>
        </div>
        <Button
          onClick={handleAddToCart}
          disabled={!isFormComplete}
          className="flex-1 h-12 text-base font-bold rounded-xl shadow-sm"
          style={{
            backgroundColor: isFormComplete ? "var(--primary)" : undefined,
          }}
        >
          {isFormComplete ? (
            <>
              <ShoppingCart className="mr-2 h-5 w-5" /> Adicionar
            </>
          ) : (
            "Selecione..."
          )}
        </Button>
      </div>
    </div>
  );
}
