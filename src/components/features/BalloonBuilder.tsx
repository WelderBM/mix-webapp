"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useCartStore } from "@/store/cartStore";
import { Button } from "@/components/ui/button";
import {
  PartyPopper,
  Minus,
  Plus,
  ShoppingCart,
  Palette,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn, formatCurrency } from "@/lib/utils";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  BalloonConfig,
  BalloonTypeConfig,
  BalloonSizeConfig,
} from "@/types/balloon";

// Mapeamento de cores aproximadas para Balões São Roque
const BALLOON_COLORS: Record<string, string> = {
  // Cores Lisas / Standard
  Amarelo: "#FFD700",
  "Amarelo Citrino": "#FFEB3B",
  Azul: "#2196F3",
  "Azul Cobalto": "#1565C0",
  "Azul Baby": "#BBDEFB",
  "Azul Celeste": "#4FC3F7",
  Branco: "#FFFFFF",
  "Branco Polar": "#FAFAFA",
  Laranja: "#FF9800",
  "Laranja Mandarim": "#FF6F00",
  Lilás: "#E1BEE7",
  "Lilás Baby": "#F3E5F5",
  Rosa: "#E91E63",
  "Rosa Baby": "#F8BBD0",
  "Rosa Tutti Frutti": "#FF80AB",
  "Rosa Shock": "#FF4081",
  Roxo: "#9C27B0",
  "Roxo Ametista": "#7B1FA2",
  Verde: "#4CAF50",
  "Verde Folha": "#2E7D32",
  "Verde Limão": "#CDDC39",
  "Verde Bandeira": "#00C853",
  Vermelho: "#F44336",
  "Vermelho Quente": "#D50000",
  Preto: "#000000",
  "Preto Ébano": "#212121",
  Marrom: "#795548",
  "Marrom Chocolate": "#5D4037",
  Cinza: "#9E9E9E",
  "Cinza Chumbo": "#616161",
  Bege: "#F5F5DC",
  Pele: "#FFCCBC",

  // Cores Metálicas / Cromadas / Uniq
  Ouro: "linear-gradient(135deg, #FFD700 0%, #FDB931 100%)",
  Prata: "linear-gradient(135deg, #E0E0E0 0%, #BDBDBD 100%)",
  "Rose Gold": "linear-gradient(135deg, #E8B6A8 0%, #D48E7E 100%)",
  "Azul Metálico": "linear-gradient(135deg, #448AFF 0%, #2962FF 100%)",
  "Verde Metálico": "linear-gradient(135deg, #69F0AE 0%, #00E676 100%)",
  "Vermelho Metálico": "linear-gradient(135deg, #FF5252 0%, #D50000 100%)",
  "Roxo Metálico": "linear-gradient(135deg, #E040FB 0%, #AA00FF 100%)",
  "Rosa Metálico": "linear-gradient(135deg, #FF4081 0%, #F50057 100%)",
  Cromado: "linear-gradient(135deg, #CFD8DC 0%, #90A4AE 100%)", // Genérico
  Cristal:
    "radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.2) 100%)", // Transparente
};

// Helper para pegar a cor ou um fallback
const getBalloonColor = (colorName: string) => {
  // Tenta encontrar a cor exata
  if (BALLOON_COLORS[colorName]) return BALLOON_COLORS[colorName];

  // Tenta encontrar por palavras chave se não achar exato
  const lowerName = colorName.toLowerCase();
  for (const [key, value] of Object.entries(BALLOON_COLORS)) {
    if (lowerName.includes(key.toLowerCase())) {
      return value;
    }
  }

  return "#EEEEEE"; // Fallback cinza claro
};

// Helper para saber se a cor é escura (para mudar a cor do texto)
const isDarkColor = (color: string) => {
  if (color.includes("gradient")) return false; // Assume gradient como "brilhante/claro" ou usa sombra
  if (
    color === "#000000" ||
    color === "#212121" ||
    color === "#5D4037" ||
    color === "#1565C0" ||
    color === "#2E7D32" ||
    color === "#7B1FA2" ||
    color === "#D50000"
  )
    return true;
  return false;
};

// Escala visual relativa para os tamanhos (baseado em pixels)
const SIZE_SCALE: Record<string, number> = {
  "5": 40,
  "6.5": 50,
  "7": 55,
  "8": 60,
  "9": 70,
  "10": 75,
  "11": 80,
  "16": 100,
  "35": 140, // Gigante
};

export function BalloonBuilder() {
  const { addItem, openCart } = useCartStore();

  const [balloonConfig, setBalloonConfig] = useState<BalloonConfig>({
    types: [],
    allColors: [],
  });
  const [loading, setLoading] = useState(true);

  // Selection state
  const [selectedTypeId, setSelectedTypeId] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<BalloonSizeConfig | null>(
    null
  );
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [step, setStep] = useState(1);
  const step2Ref = useRef<HTMLDivElement>(null);

  // Efeito para scrollar quando mudar para o passo 2
  useEffect(() => {
    if (step === 2 && step2Ref.current) {
      // Pequeno delay para garantir que a animação de entrada começou/renderizou
      setTimeout(() => {
        step2Ref.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);
    }
  }, [step]);

  useEffect(() => {
    let isMounted = true;
    const unsub = onSnapshot(
      doc(db, "settings", "balloons"),
      (s) => {
        if (!isMounted) return;
        if (s.exists()) {
          setBalloonConfig(s.data() as BalloonConfig);
        }
        setLoading(false);
      },
      (error) => {
        if (!isMounted) return;
        console.error("Erro ao carregar configurações de balões:", error);
        setLoading(false);
      }
    );
    return () => {
      isMounted = false;
      unsub();
    };
  }, []);

  const selectedType = useMemo(
    () => balloonConfig.types.find((t) => t.id === selectedTypeId),
    [selectedTypeId, balloonConfig]
  );

  const currentPrice = selectedSize ? selectedSize.price : 0;
  const totalPrice = currentPrice * quantity;

  const isStep1Complete = selectedTypeId && selectedSize;
  const isComplete = isStep1Complete && selectedColor;

  const handleAddToBundle = () => {
    if (!isComplete || !selectedType || !selectedSize) {
      toast.error("Por favor, preencha todas as opções.");
      return;
    }

    const productName = `Balão ${selectedType.name} - ${selectedSize.size}`;
    const description = `Cor: ${selectedColor} (${selectedSize.unitsPerPackage} unidades p/ pacote)`;

    addItem({
      cartId: crypto.randomUUID(),
      type: "CUSTOM_BALLOON",
      quantity: quantity,
      product: {
        id: `balloon-${selectedTypeId}-${selectedSize.size}-${selectedColor}`,
        name: productName,
        price: currentPrice,
        type: "Standard" as any,
        description: description,
        imageUrl: "/balloons-placeholder.webp",
      } as any,
      kitTotalAmount: currentPrice, // Passando o valor UNITÁRIO agora
      kitName: productName,
      balloonDetails: {
        typeId: selectedTypeId,
        typeName: selectedType.name,
        size: selectedSize.size,
        color: selectedColor,
        unitsPerPackage: selectedSize.unitsPerPackage,
      },
    });

    toast.success(`${quantity}x Pacote ${selectedColor} adicionado!`);

    // OTIMIZAÇÃO: Ao invés de voltar pro passo 1, ficamos no passo 2
    // para a pessoa poder escolher outras cores do mesmo tamanho rapidamente
    setSelectedColor("");
    setQuantity(1); // Resetamos a quantidade para 1 como pedido
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-32">
      {/* STEPS INDICATOR */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <div
          className={cn(
            "h-2 w-16 rounded-full transition-all duration-300",
            step === 1 ? "bg-purple-600 w-24" : "bg-purple-200"
          )}
        />
        <div
          className={cn(
            "h-2 w-16 rounded-full transition-all duration-300",
            step === 2 ? "bg-purple-600 w-24" : "bg-purple-200"
          )}
        />
      </div>

      <div className="bg-white rounded-4xl shadow-xl border border-slate-100 p-6 md:p-8 overflow-hidden">
        {step === 1 ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
            <section>
              <h3 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3">
                <span className="bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">
                  1
                </span>
                Escolha o Tipo e Tamanho
              </h3>

              <div className="space-y-10">
                {balloonConfig.types
                  .filter((type) => type.active !== false)
                  .map((type) => (
                    <div key={type.id} className="space-y-5">
                      <h4 className="font-black text-slate-400 uppercase tracking-widest text-xs flex items-center gap-2">
                        <div className="h-px bg-slate-200 flex-1" />
                        {type.name}
                        <div className="h-px bg-slate-200 flex-1" />
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {type.sizes.map((size, sIdx) => {
                          const isSelected =
                            selectedTypeId === type.id &&
                            selectedSize?.size === size.size;
                          return (
                            <button
                              key={`${type.id}-${sIdx}`}
                              onClick={() => {
                                setSelectedTypeId(type.id);
                                setSelectedSize(size);
                              }}
                              className={cn(
                                "flex flex-col items-center justify-center p-5 rounded-3xl border-2 transition-all group relative overflow-hidden",
                                isSelected
                                  ? "border-purple-600 bg-purple-50 shadow-lg shadow-purple-100 scale-105"
                                  : "border-slate-100 bg-white hover:border-purple-200 hover:scale-[1.02]"
                              )}
                            >
                              {/* Balloon Bubble Effect - Agora com escala visual */}
                              <div
                                className={cn(
                                  "absolute w-full h-full inset-0 transition-opacity",
                                  isSelected ? "opacity-100" : "opacity-0"
                                )}
                              >
                                <div className="absolute top-2 right-2 w-3 h-3 bg-purple-500 rounded-full animate-bounce" />
                              </div>

                              {/* Preview Visual do Tamanho */}
                              <div className="relative mb-3 flex items-center justify-center h-28 w-full">
                                <div
                                  className={cn(
                                    "rounded-full shadow-inner transition-all duration-500",
                                    isSelected
                                      ? "bg-purple-600 shadow-purple-400"
                                      : "bg-slate-200"
                                  )}
                                  style={{
                                    width: `${SIZE_SCALE[size.size] || 60}px`,
                                    height: `${
                                      (SIZE_SCALE[size.size] || 60) * 1.1
                                    }px`, // Levemente oval
                                  }}
                                >
                                  {/* Brilho no balão */}
                                  <div className="absolute top-[20%] left-[25%] w-[20%] h-[15%] bg-white/40 rounded-full -rotate-45" />
                                </div>
                              </div>

                              <span className="text-xl font-black text-slate-800 group-hover:scale-110 transition-transform">
                                {size.size}"
                              </span>
                              <span className="text-sm font-bold text-purple-600 mt-1">
                                {formatCurrency(size.price)}
                              </span>
                              <div className="mt-3 px-3 py-1 bg-white border border-slate-100 rounded-full text-[10px] text-slate-500 font-bold shadow-sm">
                                {size.unitsPerPackage} unidades
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                {balloonConfig.types.length === 0 && (
                  <div className="text-center py-12 text-slate-400 flex flex-col items-center gap-4">
                    <PartyPopper size={48} className="opacity-20" />
                    <p className="font-medium text-lg">
                      Nenhum balão disponível no momento.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>
        ) : (
          <div
            ref={step2Ref}
            className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500"
          >
            <section>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                  <span className="bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">
                    2
                  </span>
                  Escolha a Cor
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep(1)}
                  className="text-purple-600 font-bold hover:bg-purple-50 rounded-full relative group/back"
                >
                  <span className="flex items-center gap-2">
                    Mudar Tamanho
                    <div className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                    </div>
                  </span>

                  {/* Tooltip/Alert pequeno visual */}
                  <div className="absolute -bottom-10 right-0 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover/back:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl z-10 font-bold">
                    Clique aqui para trocar o modelo!
                  </div>
                </Button>
              </div>

              <div className="bg-linear-to-br from-purple-600 to-indigo-700 p-5 rounded-3xl mb-6 flex flex-col md:flex-row items-center justify-between text-white shadow-xl shadow-purple-200 gap-4 text-center md:text-left">
                <div className="w-full md:w-auto">
                  <p className="text-[10px] opacity-70 uppercase font-black tracking-widest mb-1">
                    Modelo Escolhido
                  </p>
                  <p className="font-black text-lg sm:text-xl leading-tight text-balance">
                    {selectedType?.name}{" "}
                    <span className="opacity-50 mx-1 hidden sm:inline">|</span>{" "}
                    <br className="sm:hidden" /> {selectedSize?.size}"
                  </p>
                  <p className="text-xs opacity-80 font-medium mt-1">
                    {selectedSize?.unitsPerPackage} unidades p/ pacote
                  </p>
                </div>

                {/* Preview Animado */}
                <div className="hidden md:flex items-center justify-center">
                  <div
                    className="rounded-full shadow-2xl transition-all duration-500 relative"
                    style={{
                      width: "60px",
                      height: "70px",
                      background: selectedColor
                        ? getBalloonColor(selectedColor)
                        : "#FFF",
                      transform: "rotate(-5deg)",
                    }}
                  >
                    <div className="absolute top-[20%] left-[25%] w-[20%] h-[15%] bg-white/40 rounded-full -rotate-45" />
                    {/* Cordãozinho simulado */}
                    <div className="absolute -bottom-4 left-1/2 w-0.5 h-6 bg-white/50 -translate-x-1/2" />
                  </div>
                </div>

                <div className="flex items-center justify-between md:block w-full md:w-auto bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/10">
                  <p className="text-[10px] opacity-70 uppercase font-black tracking-widest text-left md:text-right">
                    Preço
                  </p>
                  <p className="font-black text-2xl md:text-2xl leading-none">
                    {formatCurrency(selectedSize?.price || 0)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {selectedType?.colors.map((color) => {
                  const isSelected = selectedColor === color;
                  const bgStyle = getBalloonColor(color);
                  const isDark = isDarkColor(bgStyle);

                  return (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={cn(
                        "p-4 rounded-2xl border-4 font-black transition-all text-sm relative group overflow-hidden flex flex-col items-center gap-2 h-32 justify-end shadow-sm hover:shadow-md",
                        isSelected
                          ? "border-purple-600 ring-2 ring-purple-300 scale-105 z-10"
                          : "border-transparent ring-1 ring-slate-100 hover:scale-[1.02]"
                      )}
                      style={{
                        background: isSelected ? "#FFF" : "#FFF", // Fundo do botão branco
                      }}
                    >
                      {/* A cor real do balão como "preview" ocupando o fundo ou uma bolha grande */}
                      <div
                        className="absolute inset-0 z-0 transition-transform duration-500"
                        style={{
                          background: bgStyle,
                          opacity: isSelected ? 0.1 : 0.15, // Fundo suave com a cor
                        }}
                      />

                      {/* O Balão em si */}
                      <div
                        className={cn(
                          "absolute top-4 w-12 h-14 rounded-full shadow-lg transition-all duration-300 group-hover:scale-110",
                          isSelected ? "scale-125 top-3" : ""
                        )}
                        style={{
                          background: bgStyle,
                        }}
                      >
                        <div className="absolute top-[20%] left-[25%] w-[20%] h-[15%] bg-white/40 rounded-full -rotate-45" />
                      </div>

                      <span
                        className={cn(
                          "relative z-10 text-center leading-tight transition-colors",
                          "text-slate-700"
                        )}
                      >
                        {color}
                      </span>

                      {isSelected && (
                        <div className="absolute top-2 right-2 text-purple-600 bg-white rounded-full p-0.5 shadow-sm z-20">
                          <CheckCircle
                            size={14}
                            fill="currentColor"
                            className="text-white"
                          />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        )}
      </div>

      {/* STICKY FOOTER */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-4xl bg-white/95 backdrop-blur-xl rounded-4xl border border-slate-200/50 shadow-[0_8px_30px_rgba(0,0,0,0.12)] p-4 md:p-6 transition-all duration-500 ring-1 ring-slate-100">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 md:gap-6">
          {/* Escondemos a quantidade no Passo 1 para simplificar, como solicitado */}
          {step === 2 ? (
            <div className="flex items-center justify-between gap-4 w-full md:w-auto p-1">
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 h-10 p-1">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-full flex items-center justify-center text-slate-400 hover:text-purple-600 hover:bg-white rounded-lg transition-all"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="min-w-8 text-center font-black text-lg text-slate-700">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-full flex items-center justify-center text-slate-400 hover:text-purple-600 hover:bg-white rounded-lg transition-all"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">
                  Quant.
                </p>
              </div>

              <div className="text-right">
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">
                  Total
                </p>
                <p className="text-xl font-black text-purple-600 leading-none">
                  {formatCurrency(totalPrice)}
                </p>
              </div>
            </div>
          ) : (
            <div className="hidden md:flex flex-col">
              <p className="text-sm font-bold text-slate-400 italic">
                Selecione as opções acima para continuar
              </p>
            </div>
          )}

          {step === 1 ? (
            <Button
              onClick={() => setStep(2)}
              disabled={!isStep1Complete}
              className={cn(
                "w-full md:w-auto h-14 md:h-16 text-base md:text-lg font-black rounded-xl md:rounded-2xl shadow-lg transition-all",
                isStep1Complete
                  ? "bg-purple-600 hover:bg-purple-700 text-white hover:scale-[1.02] active:scale-95 shadow-purple-200"
                  : "bg-slate-100 text-slate-300"
              )}
            >
              Escolher Cor
            </Button>
          ) : (
            <div className="flex gap-2 w-full md:w-auto h-12 md:h-16">
              <Button
                onClick={() => {
                  handleAddToBundle();
                  // Ficamos no passo 2 para "Quick add" mas resetamos cor
                }}
                disabled={!isComplete}
                className={cn(
                  "flex-1 md:flex-none h-full px-4 md:px-10 text-sm md:text-lg font-black rounded-xl md:rounded-2xl shadow-lg transition-all",
                  isComplete
                    ? "bg-purple-600 hover:bg-purple-700 text-white hover:scale-[1.02] active:scale-95 shadow-purple-200"
                    : "bg-slate-100 text-slate-400 border border-slate-200"
                )}
              >
                <ShoppingCart className="mr-2 h-4 w-4 md:h-6 md:w-6" />
                <span className="truncate">Adicionar</span>
              </Button>
              <Button
                onClick={() => {
                  if (isComplete) {
                    handleAddToBundle();
                    openCart();
                  }
                }}
                disabled={!isComplete}
                variant="outline"
                className="h-full w-14 md:w-16 p-0 rounded-xl md:rounded-2xl border-2 border-slate-200 text-slate-400 hover:border-purple-600 hover:text-purple-600 transition-all shrink-0"
              >
                <CheckCircle className="h-6 w-6 md:h-8 md:w-8" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
