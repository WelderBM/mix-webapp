"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useCartStore } from "@/store/cartStore";
import { Button } from "@/components/ui/button";
import {
  PartyPopper,
  Minus,
  Plus,
  ShoppingCart,
  Loader2,
  ArrowLeft,
  Check,
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
import { SAO_ROQUE_COLORS } from "@/lib/balloonColors";
import Image from "next/image";

// Gradients especiais para cores metálicas
const SPECIAL_GRADIENTS: Record<string, string> = {
  Ouro: "linear-gradient(135deg, #FFD700 0%, #FDB931 100%)",
  Prata: "linear-gradient(135deg, #E0E0E0 0%, #BDBDBD 100%)",
  "Rose Gold": "linear-gradient(135deg, #E8B6A8 0%, #D48E7E 100%)",
  "Azul Metálico": "linear-gradient(135deg, #448AFF 0%, #2962FF 100%)",
  "Verde Metálico": "linear-gradient(135deg, #69F0AE 0%, #00E676 100%)",
  "Vermelho Metálico": "linear-gradient(135deg, #FF5252 0%, #D50000 100%)",
  "Roxo Metálico": "linear-gradient(135deg, #E040FB 0%, #AA00FF 100%)",
  "Rosa Metálico": "linear-gradient(135deg, #FF4081 0%, #F50057 100%)",
  Cromado: "linear-gradient(135deg, #CFD8DC 0%, #90A4AE 100%)",
  Cristal:
    "radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.2) 100%)",
};

const getBalloonColor = (colorName: string) => {
  const normalized = colorName.toLowerCase().trim();
  const gradientKey = Object.keys(SPECIAL_GRADIENTS).find(
    (k) => k.toLowerCase() === normalized
  );
  if (gradientKey) return SPECIAL_GRADIENTS[gradientKey];
  if (SAO_ROQUE_COLORS[normalized]) return SAO_ROQUE_COLORS[normalized];
  const foundKey = Object.keys(SAO_ROQUE_COLORS).find((k) =>
    k.includes(normalized)
  );
  if (foundKey) return SAO_ROQUE_COLORS[foundKey];
  return "#EEEEEE";
};

// Mapeamento de imagens por tipo
const TYPE_IMAGES: Record<string, string> = {
  "Látex Redondo": "/api/placeholder/200/200", // Será substituído pelas imagens geradas
  Número: "/api/placeholder/200/200",
  Letra: "/api/placeholder/200/200",
  Canudo: "/api/placeholder/200/200",
};

export function BalloonBuilder() {
  const { addItem, openCart } = useCartStore();

  const [balloonConfig, setBalloonConfig] = useState<BalloonConfig>({
    types: [],
    allColors: [],
  });
  const [loading, setLoading] = useState(true);

  // Selection state
  const [step, setStep] = useState(0); // 0=tipo, 1=tamanho, 2=cor, 3=quantidade
  const [selectedTypeId, setSelectedTypeId] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<BalloonSizeConfig | null>(
    null
  );
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);

  const stepRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (stepRef.current) {
      stepRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
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
    [balloonConfig.types, selectedTypeId]
  );

  const availableSizes = useMemo(() => {
    return selectedType?.sizes || [];
  }, [selectedType]);

  const availableColors = useMemo(() => {
    return selectedType?.colors || [];
  }, [selectedType]);

  const currentPrice = useMemo(() => {
    if (!selectedSize) return 0;
    return selectedSize.price * quantity;
  }, [selectedSize, quantity]);

  const handleSelectType = (typeId: string) => {
    setSelectedTypeId(typeId);
    const type = balloonConfig.types.find((t) => t.id === typeId);

    // Se o tipo tem apenas 1 tamanho (ex: canudo), pula para cor
    if (type && type.sizes.length === 1) {
      setSelectedSize(type.sizes[0]);
      setStep(2); // Pula direto para cor
    } else {
      setStep(1); // Vai para seleção de tamanho
    }
  };

  const handleSelectSize = (size: BalloonSizeConfig) => {
    setSelectedSize(size);
    setStep(2);
  };

  const handleSelectColor = (color: string) => {
    setSelectedColor(color);
    setStep(3);
  };

  const handleAddToCart = () => {
    if (!selectedType || !selectedSize || !selectedColor) {
      toast.error("Selecione todas as opções");
      return;
    }

    const colorName = selectedColor.split("|")[0];
    const cartItem = {
      cartId: crypto.randomUUID(),
      type: "CUSTOM_BALLOON" as const,
      quantity,
      kitName: `${selectedType.name} ${selectedSize.size}" - ${colorName}`,
      kitTotalAmount: selectedSize.price,
      balloonDetails: {
        typeId: selectedType.id,
        typeName: selectedType.name,
        size: selectedSize.size,
        color: colorName,
        colorHex: selectedColor.split("|")[1] || "#EEEEEE",
        unitsPerPackage: selectedSize.unitsPerPackage,
      },
    };

    addItem(cartItem);
    openCart();

    // Reset
    setStep(0);
    setSelectedTypeId("");
    setSelectedSize(null);
    setSelectedColor("");
    setQuantity(1);
  };

  const handleBack = () => {
    if (step === 2 && selectedType && selectedType.sizes.length === 1) {
      // Se voltou da cor e o tipo tem tamanho único, volta para tipo
      setStep(0);
      setSelectedTypeId("");
      setSelectedSize(null);
    } else if (step > 0) {
      setStep(step - 1);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="animate-spin text-purple-600" size={40} />
      </div>
    );
  }

  const activeTypes = balloonConfig.types.filter((t) => t.active !== false);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-purple-100 p-4 rounded-full">
            <PartyPopper className="text-purple-600" size={32} />
          </div>
        </div>
        <h2 className="text-3xl font-black text-slate-800 mb-2">
          Monte seu Pacote de Balões
        </h2>
        <p className="text-slate-600">
          Escolha o tipo, tamanho, cor e quantidade
        </p>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center justify-center gap-2">
        {[0, 1, 2, 3].map((s) => {
          // Esconde step 1 se tipo tiver tamanho único
          if (s === 1 && selectedType && selectedType.sizes.length === 1) {
            return null;
          }

          return (
            <div
              key={s}
              className={cn(
                "h-2 rounded-full transition-all",
                s <= step ? "bg-purple-600 w-16" : "bg-slate-200 w-8"
              )}
            />
          );
        })}
      </div>

      <div ref={stepRef}>
        {/* STEP 0: TIPO */}
        {step === 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-xl font-bold text-center mb-6">
              Escolha o Tipo de Balão
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {activeTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleSelectType(type.id)}
                  className="group relative bg-white border-2 border-slate-200 rounded-2xl p-4 hover:border-purple-500 hover:shadow-lg transition-all"
                >
                  <div className="aspect-square bg-slate-50 rounded-xl mb-3 flex items-center justify-center overflow-hidden">
                    {/* Placeholder para imagem */}
                    <div className="w-full h-full bg-linear-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                      <PartyPopper className="text-purple-400" size={48} />
                    </div>
                  </div>
                  <h4 className="font-bold text-sm text-center text-slate-800 group-hover:text-purple-600 transition-colors">
                    {type.name}
                  </h4>
                  <p className="text-xs text-slate-500 text-center mt-1">
                    {type.sizes.length} tamanho
                    {type.sizes.length > 1 ? "s" : ""}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 1: TAMANHO */}
        {step === 1 && selectedType && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="mb-4"
              size="sm"
            >
              <ArrowLeft size={16} className="mr-2" /> Voltar
            </Button>
            <h3 className="text-xl font-bold text-center mb-6">
              Escolha o Tamanho - {selectedType.name}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {availableSizes.map((size) => {
                const sizeNum = parseFloat(size.size);
                const visualSize = Math.min(100, Math.max(40, sizeNum * 6));

                return (
                  <button
                    key={size.size}
                    onClick={() => handleSelectSize(size)}
                    className="bg-white border-2 border-slate-200 rounded-xl p-6 hover:border-purple-500 hover:shadow-lg transition-all group"
                  >
                    <div className="flex justify-center mb-3">
                      <div
                        className="rounded-full bg-linear-to-br from-purple-400 to-purple-600 transition-transform group-hover:scale-110 flex items-center justify-center relative"
                        style={{
                          width: `${visualSize}px`,
                          height: `${visualSize}px`,
                        }}
                      >
                        <span className="text-white font-black text-lg drop-shadow-lg">
                          {size.size}"
                        </span>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-slate-800">
                      {formatCurrency(size.price)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: COR */}
        {step === 2 && selectedType && selectedSize && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="mb-4"
              size="sm"
            >
              <ArrowLeft size={16} className="mr-2" /> Voltar
            </Button>
            <h3 className="text-xl font-bold text-center mb-2">
              Escolha a Cor
            </h3>
            <p className="text-center text-slate-600 mb-6">
              {selectedType.name} {selectedSize.size}" -{" "}
              {formatCurrency(selectedSize.price)}
            </p>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {availableColors.map((color) => {
                const [colorName, colorHex] = color.split("|");
                const bgColor = getBalloonColor(colorName);

                return (
                  <button
                    key={color}
                    onClick={() => handleSelectColor(color)}
                    className="group flex flex-col items-center gap-2"
                  >
                    <div
                      className="w-full aspect-square rounded-xl border-2 border-slate-200 hover:border-purple-500 hover:scale-110 transition-all relative overflow-hidden"
                      style={{
                        background: bgColor,
                      }}
                    >
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    </div>
                    <span className="text-xs font-medium text-slate-700 text-center leading-tight">
                      {colorName}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 3: QUANTIDADE */}
        {step === 3 && selectedType && selectedSize && selectedColor && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="mb-4"
              size="sm"
            >
              <ArrowLeft size={16} className="mr-2" /> Voltar
            </Button>

            <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-purple-200">
              <div className="text-center mb-6">
                <div
                  className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-4"
                  style={{
                    background: getBalloonColor(selectedColor.split("|")[0]),
                    border: "4px solid white",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                />
                <h3 className="text-2xl font-black text-slate-800">
                  {selectedType.name} {selectedSize.size}"
                </h3>
                <p className="text-lg text-slate-600">
                  {selectedColor.split("|")[0]}
                </p>
              </div>

              <div className="flex items-center justify-center gap-4 mb-6">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="h-12 w-12 rounded-full"
                >
                  <Minus size={20} />
                </Button>
                <div className="text-4xl font-black text-purple-600 w-20 text-center">
                  {quantity}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                  className="h-12 w-12 rounded-full"
                >
                  <Plus size={20} />
                </Button>
              </div>

              <div className="text-center mb-6">
                <div className="text-sm text-slate-600 mb-1">Total</div>
                <div className="text-3xl font-black text-slate-800">
                  {formatCurrency(currentPrice)}
                </div>
              </div>

              <Button
                onClick={handleAddToCart}
                className="w-full h-14 px-8 text-lg font-bold bg-purple-600 hover:bg-purple-700 rounded-full"
              >
                <ShoppingCart className="mr-2" size={20} />
                Adicionar ao Carrinho
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
