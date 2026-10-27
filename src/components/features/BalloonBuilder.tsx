"use client";

import { useEffect, useState, useMemo, useRef, type SyntheticEvent } from "react";
import { useCartStore } from "@/store/cartStore";
import { Button } from "@/components/ui/button";
import {
  PartyPopper,
  Minus,
  Plus,
  ShoppingCart,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { cn, formatCurrency } from "@/lib/utils";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  BalloonConfig,
  BalloonTypeConfig,
  BalloonSizeConfig,
} from "@/types/balloon";
import { RAINBOW_HEXES, suggestHexColor } from "@/lib/balloonColors";
import {
  balloonColorImage,
  balloonSizeHint,
  balloonSizeImage,
  balloonSizeLabel,
  balloonTypeImage,
  balloonVisualPx,
} from "@/lib/balloonTypeArt";
import {
  BRANDLESS_TYPES,
  baseTypeId,
  foilCharStock,
  foilShortage,
  isSoldOut,
} from "@/lib/intake/balloonCatalog";
import { FOIL_TYPE_ID, foilCharacters, foilPieces, foilWords } from "@/lib/balloonFoil";
import { BalloonSizeScale, FoilTextScale } from "@/components/features/BalloonSizeScale";
import type { BalloonStock, BalloonStockDoc, FoilCharStock } from "@/types/balloon";

// Teclado do foil: a ordem em que os caracteres aparecem.
const FOIL_KEYS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789&?".split("");
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
  // Degradê de cima para baixo, como o balão de verdade (#343).
  "Arco Iris": `linear-gradient(180deg, ${RAINBOW_HEXES.join(", ")})`,
};

const getBalloonColor = (colorName: string) => {
  const normalized = colorName.toLowerCase().trim();
  const flat = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");
  const gradientKey = Object.keys(SPECIAL_GRADIENTS).find(
    (k) => flat(k) === flat(normalized)
  );
  if (gradientKey) return SPECIAL_GRADIENTS[gradientKey];
  return suggestHexColor(colorName) ?? "#EEEEEE";
};

// Cores da arte do balão (#321): as do degradê especial (metálico,
// arco-íris) ou a cor sugerida pelo nome.
const balloonHexes = (colorName: string): string[] => {
  const css = getBalloonColor(colorName);
  if (!css.includes("gradient")) return [css];
  const hexes = css.match(/#[0-9a-fA-F]{6}/g);
  return hexes?.length ? hexes : ["#E5E7EB"]; // Cristal: transparente claro
};

// Marca mais pedida pelos clientes: vem primeiro, com destaque.
const PREFERRED_BRAND = "São Roque";

interface BrandGroup {
  brand: string; // "" = tipos sem marca registrada
  label: string;
  preferred: boolean;
  types: BalloonTypeConfig[];
}

// Marca digitada à mão no admin ("Sao Roque", "são roque") é a mesma.
const brandKey = (b: string | undefined) =>
  (b ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");

// Primeiro passo do montador (dono, 23/10): um cartão por marca, São Roque
// (a mais pedida) na frente, com o logo da marca quando cadastrado. Os
// tipos em que a marca não importa (foil de letras e números) ficam à
// parte, com cartão próprio, no fim.
// Catálogo sem marca nenhuma (antes do Montar pelo Noturno): um grupo só.
function groupByBrand(types: BalloonTypeConfig[]): BrandGroup[] {
  const brandless = (t: BalloonTypeConfig) => BRANDLESS_TYPES.has(baseTypeId(t.id));
  if (!types.some((t) => t.brand && !brandless(t))) {
    return [{ brand: "", label: "", preferred: false, types }];
  }
  const preferred = brandKey(PREFERRED_BRAND);
  const groups = new Map<string, BrandGroup>();
  for (const t of types) {
    const k = brandKey(t.brand);
    const g = brandless(t)
      ? { brand: `tipo:${t.id}`, label: t.name, preferred: false }
      : { brand: k, label: t.brand || "Outros balões", preferred: k === preferred };
    const cur = groups.get(g.brand) ?? { ...g, types: [] };
    cur.types.push(t);
    groups.set(g.brand, cur);
  }
  const order = (g: BrandGroup) => (g.preferred ? 0 : g.brand.startsWith("tipo:") ? 2 : 1);
  return [...groups.values()].sort(
    (a, b) => order(a) - order(b) || b.types.length - a.types.length
  );
}

// Foto do cartão da marca: a do Liso dela, se tiver; senão a primeira.
// Foto salva no admin que não carrega mais (link antigo) cai na arte
// desenhada do tipo em vez de mostrar imagem quebrada — #282.
function fallbackOnError(fallback: string) {
  return (e: SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.dataset.fallback) return;
    img.dataset.fallback = "1";
    img.src = fallback;
  };
}

function groupPhoto(g: BrandGroup): string | undefined {
  const withPhoto = g.types.filter((t) => t.imageUrl);
  return (withPhoto.find((t) => baseTypeId(t.id) === "simples") ?? withPhoto[0])?.imageUrl;
}

export function BalloonBuilder() {
  const { addItem, openCart } = useCartStore();

  const [balloonConfig, setBalloonConfig] = useState<BalloonConfig>({
    types: [],
    allColors: [],
  });
  const [loading, setLoading] = useState(true);
  const [balloonStock, setBalloonStock] = useState<BalloonStock | null>(null);
  // Foil: estoque de cada letra/número por cor (mesmo documento).
  const [foilChars, setFoilChars] = useState<FoilCharStock | null>(null);
  const [foilBlocked, setFoilBlocked] = useState("");

  // Selection state
  const [step, setStep] = useState(0); // 0=tipo, 1=tamanho, 2=cor, 3=quantidade
  // Marca escolhida no primeiro passo ("" = tipos sem marca registrada).
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedTypeId, setSelectedTypeId] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<BalloonSizeConfig | null>(
    null
  );
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  // Foil de letras e números: o que o cliente quer escrever ("ANA").
  const [characters, setCharacters] = useState("");

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

  // Estoque por tipo/tamanho/cor (`settings/balloonStock`, gravado pelo
  // importador do Noturno). Leitura única: muda a cada ~2 dias.
  useEffect(() => {
    let isMounted = true;
    getDoc(doc(db, "settings", "balloonStock"))
      .then((s) => {
        if (isMounted && s.exists()) {
          setBalloonStock((s.data() as BalloonStockDoc).stock ?? null);
          setFoilChars((s.data() as BalloonStockDoc).chars ?? null);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const selectedType = useMemo(
    () => balloonConfig.types.find((t) => t.id === selectedTypeId),
    [balloonConfig.types, selectedTypeId]
  );

  // Tamanho sem nenhuma cor em estoque no Noturno não aparece, nem tamanho
  // sem preço (nunca vender por R$ 0, #318).
  const sizesInStock = (type: BalloonTypeConfig) =>
    type.sizes.filter(
      (s) =>
        s.price > 0 &&
        type.colors.some((c) => !isSoldOut(balloonStock, type.id, s.size, c))
    );
  const availableSizes = useMemo(
    () => (selectedType ? sizesInStock(selectedType) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedType, balloonStock]
  );

  // A cor só aparece no tamanho em que o Noturno tem unidade (estoque
  // atualizado a cada importação). Sem estoque importado, mostra tudo.
  const availableColors = useMemo(() => {
    const colors = selectedType?.colors || [];
    if (!selectedType || !selectedSize) return colors;
    return colors.filter(
      (c) => !isSoldOut(balloonStock, selectedType.id, selectedSize.size, c)
    );
  }, [selectedType, selectedSize, balloonStock]);

  const isFoil = baseTypeId(selectedTypeId) === FOIL_TYPE_ID;
  // Foil: um balão por caractere; a quantidade conta conjuntos ("ANA" × 2).
  // Espaço separa palavras e não é balão (#342).
  const foilText = characters.trim();
  const pieces = foilPieces(characters);
  const piecesPerSet = isFoil ? pieces.length : 1;
  // Letras e números que a cor escolhida tem (null = sem informação).
  const foilAvailable =
    isFoil && selectedSize && selectedColor
      ? foilCharStock(foilChars, selectedSize.size, selectedColor)
      : null;
  const foilShort = isFoil ? foilShortage(pieces, quantity, foilAvailable) : [];
  // Digitado: caractere que a cor não tem não entra, e o cliente vê o porquê.
  const typeFoil = (raw: string) => {
    const clean = foilCharacters(raw);
    if (!foilAvailable) {
      setCharacters(clean);
      return;
    }
    const missing = [...new Set(foilPieces(clean).split("").filter((c) => !(foilAvailable[c] > 0)))];
    setFoilBlocked(missing.join(" "));
    setCharacters(
      foilCharacters(clean.split("").filter((c) => c === " " || foilAvailable[c] > 0).join(""))
    );
  };
  const currentPrice = useMemo(() => {
    if (!selectedSize) return 0;
    return selectedSize.price * piecesPerSet * quantity;
  }, [selectedSize, quantity, piecesPerSet]);

  const handleSelectType = (typeId: string) => {
    setSelectedTypeId(typeId);
    // Sempre passa pela etapa do tamanho, mesmo com um tamanho só: o
    // cliente vê as mesmas 4 etapas em todo tipo (relatório 27/10).
    setStep(1);
  };

  const handleSelectSize = (size: BalloonSizeConfig) => {
    setSelectedSize(size);
    setStep(2);
  };

  const handleSelectColor = (color: string) => {
    // Aviso de "sem estoque" era da cor anterior.
    setFoilBlocked("");
    setSelectedColor(color);
    setStep(3);
  };

  const handleAddToCart = () => {
    if (!selectedType || !selectedSize || !selectedColor) {
      toast.error("Selecione todas as opções");
      return;
    }
    if (isFoil && !pieces) {
      toast.error("Digite as letras ou números que você quer.");
      return;
    }
    if (foilShort.length > 0) {
      toast.error(`Não temos ${foilShort.join(", ")} suficiente(s) nessa cor.`);
      return;
    }

    const colorName = selectedColor.split("|")[0];
    // Marca no nome do item: a atendente pega o pacote da marca certa.
    // Foil: a marca não importa (e pode ter "Gate" salvo de antes).
    const brand = BRANDLESS_TYPES.has(baseTypeId(selectedType.id)) ? undefined : selectedType.brand;
    const typeLabel =
      brand && !selectedType.name.includes(brand) ? `${selectedType.name} ${brand}` : selectedType.name;
    const cartItem = {
      cartId: crypto.randomUUID(),
      type: "CUSTOM_BALLOON" as const,
      quantity,
      kitName: `${typeLabel} ${balloonSizeLabel(selectedType.id, selectedSize.size)}${isFoil ? `: ${foilWords(foilText).join(" / ")}` : ""} - ${colorName}`,
      kitTotalAmount: selectedSize.price * piecesPerSet,
      balloonDetails: {
        typeId: selectedType.id,
        typeName: selectedType.name,
        ...(brand ? { brand } : {}),
        size: selectedSize.size,
        color: colorName,
        colorHex: selectedColor.split("|")[1] || "#EEEEEE",
        unitsPerPackage: selectedSize.unitsPerPackage,
        ...(isFoil ? { characters: foilText } : {}),
      },
    };

    addItem(cartItem);
    openCart();

    // Reset
    setStep(0);
    setSelectedBrand(null);
    setSelectedTypeId("");
    setSelectedSize(null);
    setSelectedColor("");
    setQuantity(1);
    setCharacters("");
    setFoilBlocked("");
  };

  const handleBack = () => {
    if (step === 1) {
      // Volta para o tipo (ou para a marca, se o grupo só tem um tipo)
      backToStart();
    } else if (step > 0) {
      setStep(step - 1);
    } else if (selectedBrand != null) {
      setSelectedBrand(null); // volta para a escolha da marca
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="animate-spin text-purple-600" size={40} />
      </div>
    );
  }

  // Tipo sem nenhum tamanho em estoque não aparece.
  const activeTypes = balloonConfig.types.filter(
    (t) => t.active !== false && sizesInStock(t).length > 0
  );
  // Marca primeiro (decisão do dono, 23/10): São Roque é a mais pedida e
  // vem na frente; depois as outras, pela quantidade de tipos. Uma marca
  // só (ou catálogo sem marca): pula direto para os tipos.
  const brandGroups = groupByBrand(activeTypes);
  const askBrand = brandGroups.length > 1 && selectedBrand == null;
  const shownTypes =
    brandGroups.length > 1 && selectedBrand != null
      ? brandGroups.find((g) => g.brand === selectedBrand)?.types ?? activeTypes
      : activeTypes;
  // Grupo de um tipo só (ex.: Números & Letras): voltar ao passo 0 volta
  // direto para a escolha da marca.
  const backToStart = () => {
    setStep(0);
    setSelectedTypeId("");
    setSelectedSize(null);
    if (shownTypes.length === 1) setSelectedBrand(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-6 space-y-6">
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
        {[0, 1, 2, 3].map((s) => (
          <div
            key={s}
            className={cn(
              "h-2 rounded-full transition-all",
              s <= step ? "bg-purple-600 w-16" : "bg-slate-200 w-8"
            )}
          />
        ))}
      </div>

      <div ref={stepRef}>
        {/* STEP 0a: MARCA */}
        {step === 0 && askBrand && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-xl font-bold text-center mb-6">
              Escolha a Marca
            </h3>
            {/* flex + justify-center: poucas marcas ficam centradas sob o
                título no desktop, em vez de coladas à esquerda (#284). */}
            <div className="flex flex-wrap justify-center gap-4">
              {brandGroups.map((g) => (
                <button
                  key={g.brand}
                  onClick={() => {
                    setSelectedBrand(g.brand);
                    // Um tipo só no cartão: vai direto para ele.
                    if (g.types.length === 1) handleSelectType(g.types[0].id);
                  }}
                  className={cn(
                    "group relative w-[calc(50%-0.5rem)] md:w-48 bg-white border-2 rounded-2xl p-4 hover:border-purple-500 hover:shadow-lg transition-all",
                    g.preferred ? "border-purple-300" : "border-slate-200"
                  )}
                >
                  {g.preferred && (
                    <span className="absolute top-2 left-2 z-10 rounded-full bg-purple-600 px-2 py-0.5 text-[11px] font-bold text-white">
                      ★ Mais pedida
                    </span>
                  )}
                  <div className="aspect-square bg-white rounded-xl mb-3 flex items-center justify-center overflow-hidden">
                    {/* Foto do pacote do tipo principal da marca (admin › Balões ›
                        Fotos dos pacotes); sem foto, a arte do tipo. */}
                    {groupPhoto(g) ? (
                      <img
                        src={groupPhoto(g)}
                        alt={`Pacote ${g.label}`}
                        loading="lazy"
                        onError={fallbackOnError(balloonTypeImage(g.types[0].id))}
                        className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <img
                        src={balloonTypeImage(g.types[0].id)}
                        alt=""
                        className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-500"
                      />
                    )}
                  </div>
                  <h4 className="font-bold text-sm text-center text-slate-800 group-hover:text-purple-600 transition-colors">
                    {g.label}
                  </h4>
                  <p className="text-xs text-slate-500 text-center mt-1 line-clamp-2">
                    {/* Marca com muitos tipos: a contagem cabe; a lista cortava (#284). */}
                    {g.types.length > 2
                      ? `${g.types.length} tipos`
                      : g.types.map((t) => t.name.replace(g.label, "").trim() || t.name).join(" · ")}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 0b: TIPO */}
        {step === 0 && !askBrand && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {brandGroups.length > 1 && (
              <Button variant="ghost" onClick={handleBack} className="mb-4 min-h-11" size="sm">
                <ArrowLeft size={16} className="mr-2" /> Trocar marca
              </Button>
            )}
            <h3 className="text-xl font-bold text-center mb-6">
              Escolha o Tipo de Balão
              {brandGroups.length > 1 && selectedBrand != null ? ` — ${brandGroups.find((g) => g.brand === selectedBrand)?.label ?? ""}` : ""}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {shownTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleSelectType(type.id)}
                  className="group relative bg-white border-2 border-slate-200 rounded-2xl p-4 hover:border-purple-500 hover:shadow-lg transition-all"
                >
                  <div className="aspect-square bg-slate-50 rounded-xl mb-3 flex items-center justify-center overflow-hidden relative">
                    {/* Prioridade: Imagem específica do tipo > Placeholder global > Ícone padrão */}
                    {type.imageUrl ? (
                      <img 
                        src={type.imageUrl}
                        alt={type.name}
                        onError={fallbackOnError(balloonTypeImage(type.id))}
                        className="w-full h-full object-contain bg-white p-2 group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : balloonConfig.placeholderUrl ? (
                      <img
                        src={balloonConfig.placeholderUrl}
                        alt={type.name}
                        onError={fallbackOnError(balloonTypeImage(type.id))}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-50"
                      />
                    ) : (
                      // Arte do material do tipo (metálico brilha, candy é
                      // pastel…), desenhada no navegador — #259.
                      <img
                        src={balloonTypeImage(type.id)}
                        alt=""
                        className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-500"
                      />
                    )}
                  </div>
                  <h4 className="font-bold text-sm text-center text-slate-800 group-hover:text-purple-600 transition-colors">
                    {type.name}
                  </h4>
                  <p className="text-xs text-slate-500 text-center mt-1">
                    {sizesInStock(type).length} tamanho
                    {sizesInStock(type).length > 1 ? "s" : ""}
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
              className="mb-4 min-h-11"
              size="sm"
            >
              <ArrowLeft size={16} className="mr-2" /> Voltar
            </Button>
            <h3 className="text-xl font-bold text-center mb-6">
              Escolha o Tamanho - {selectedType.name}
            </h3>
            {/* Pessoa de 1,70 m ao lado dos balões, na mesma escala (#322). */}
            <BalloonSizeScale
              typeId={selectedType.id}
              sizes={availableSizes.map((s) => s.size)}
            />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {availableSizes.map((size) => {
                // Proporcional às polegadas (40 cm ≈ 16"); canudo, fixo.
                const visualSize = balloonVisualPx(selectedType.id, size.size);

                return (
                  <button
                    key={size.size}
                    onClick={() => handleSelectSize(size)}
                    className="bg-white border-2 border-slate-200 rounded-xl p-6 hover:border-purple-500 hover:shadow-lg transition-all group"
                  >
                    <div className="mb-3 flex h-28 items-end justify-center">
                      <img
                        src={balloonSizeImage(selectedType.id)}
                        alt=""
                        width={visualSize}
                        height={visualSize}
                        className="transition-transform group-hover:scale-105"
                        style={{ width: `${visualSize}px`, height: `${visualSize}px` }}
                      />
                    </div>
                    <div className="text-sm font-black text-slate-700">
                      {balloonSizeLabel(selectedType.id, size.size)}
                    </div>
                    {balloonSizeHint(selectedType.id) && (
                      <div className="text-xs text-slate-500">
                        {balloonSizeHint(selectedType.id)}
                      </div>
                    )}
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
              className="mb-4 min-h-11"
              size="sm"
            >
              <ArrowLeft size={16} className="mr-2" /> Voltar
            </Button>
            <h3 className="text-xl font-bold text-center mb-2">
              Escolha a Cor
            </h3>
            <p className="text-center text-slate-600 mb-6">
              {selectedType.name} {balloonSizeLabel(selectedType.id, selectedSize.size)} -{" "}
              {formatCurrency(selectedSize.price)}
            </p>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {availableColors.map((color) => {
                const [colorName] = color.split("|");

                return (
                  <button
                    key={color}
                    onClick={() => handleSelectColor(color)}
                    className="group flex flex-col items-center gap-2"
                  >
                    {/* O balão na cor (no foil, a letra), não só um quadrado (#321). */}
                    <div className="w-full aspect-square rounded-xl border-2 border-slate-200 bg-slate-50 group-hover:border-purple-500 transition-colors relative overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element -- SVG gerado no navegador */}
                      <img
                        src={balloonColorImage(selectedType.id, balloonHexes(colorName), isFoil ? "A" : undefined)}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="absolute inset-0 h-full w-full object-contain p-1 transition-transform group-hover:scale-105"
                      />
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
              className="mb-4 min-h-11"
              size="sm"
            >
              <ArrowLeft size={16} className="mr-2" /> Voltar
            </Button>

            <div className="bg-white rounded-2xl p-4 sm:p-8 shadow-lg border-2 border-purple-200">
              <div className="text-center mb-6">
                {/* Prévia: o balão na cor; no foil, o que a cliente digitou (#321). */}
                {/* Foil: uma linha por palavra, como fica montado na festa (#342). */}
                <div className="mb-4 flex flex-col items-center gap-2" aria-hidden="true">
                  {(isFoil ? (foilWords(characters).length ? foilWords(characters) : ["A"]) : [""]).map((word, w, words) => {
                    const longest = Math.max(...words.map((x) => x.length));
                    const size = !isFoil
                      ? "h-24 w-24"
                      : longest > 12
                        ? "h-6 w-6"
                        : longest > 8
                          ? "h-8 w-8"
                          : longest > 5
                            ? "h-11 w-11"
                            : "h-16 w-16";
                    return (
                      <div key={`${word}-${w}`} className="flex flex-wrap items-end justify-center gap-1">
                        {(isFoil ? word.split("") : [""]).map((ch, i) => (
                          // eslint-disable-next-line @next/next/no-img-element -- SVG gerado no navegador
                          <img
                            key={`${ch}-${i}`}
                            src={balloonColorImage(
                              selectedType.id,
                              balloonHexes(selectedColor.split("|")[0]),
                              isFoil ? ch : undefined,
                            )}
                            alt=""
                            className={size}
                          />
                        ))}
                      </div>
                    );
                  })}
                </div>
                <h3 className="text-2xl font-black text-slate-800">
                  {selectedType.name} {balloonSizeLabel(selectedType.id, selectedSize.size)}
                </h3>
                <p className="text-lg text-slate-600">
                  {selectedColor.split("|")[0]}
                </p>
              </div>

              {isFoil && (
                <label className="mb-6 block">
                  <span className="mb-1 block text-sm font-bold text-slate-700">
                    Quais letras ou números?
                  </span>
                  <input
                    value={characters}
                    onChange={(e) => typeFoil(e.target.value)}
                    autoCapitalize="characters"
                    autoComplete="off"
                    placeholder="Ex.: ANA ou FELIZ 15 ANOS"
                    className={cn(
                      "h-12 w-full rounded-xl border-2 border-slate-200 px-4 text-center font-black outline-none focus:border-purple-500",
                      // A fonte diminui para o texto inteiro caber no campo.
                      characters.length > 24
                        ? "text-sm tracking-normal"
                        : characters.length > 16
                          ? "text-base tracking-wide"
                          : characters.length > 10
                            ? "text-xl tracking-wider"
                            : "text-2xl tracking-widest"
                    )}
                  />
                  <span className="mt-1 block text-xs text-slate-500">
                    {pieces
                      ? `${pieces.length} balão(ões)${
                          foilWords(characters).length > 1
                            ? ` em ${foilWords(characters).length} palavras`
                            : ""
                        }. Espaço separa as palavras e não é balão.`
                      : "Cada letra ou número é um balão. Use espaço para separar palavras."}
                  </span>
                  {foilBlocked && (
                    <span role="alert" className="mt-1 block text-sm font-medium text-red-600">
                      Sem estoque nesta cor: {foilBlocked}
                    </span>
                  )}
                </label>
              )}

              {/* Teclado do foil: o que a cor tem; o que falta fica apagado. */}
              {isFoil && foilAvailable && (
                <div className="mb-6">
                  {/* 5 colunas no celular: tecla com 44 px ou mais (alvo de toque). */}
                  <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-10">
                    {FOIL_KEYS.map((ch) => {
                      const left = (foilAvailable[ch] ?? 0) - characters.split("").filter((c) => c === ch).length * quantity;
                      const has = (foilAvailable[ch] ?? 0) > 0;
                      return (
                        <button
                          key={ch}
                          type="button"
                          disabled={!has || left < quantity}
                          onClick={() => {
                            setFoilBlocked("");
                            setCharacters((t) => t + ch);
                          }}
                          aria-label={!has ? `${ch}: sem estoque` : left < quantity ? `${ch}: já usado todo o estoque` : `Adicionar ${ch}`}
                          title={!has ? "Sem estoque nesta cor" : left < quantity ? "Você já usou todos desta cor" : undefined}
                          className={cn(
                            "h-11 min-w-11 rounded-lg border text-lg font-black transition-colors",
                            has
                              ? "border-slate-200 bg-white text-slate-800 hover:border-purple-500 disabled:opacity-40"
                              : "border-slate-100 bg-slate-50 text-slate-300 line-through"
                          )}
                        >
                          {ch}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    disabled={!pieces || characters.endsWith(" ")}
                    onClick={() => setCharacters((t) => foilCharacters(t + " "))}
                    className="mt-1.5 h-11 w-full rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:border-purple-500 disabled:opacity-40"
                  >
                    Espaço (nova palavra)
                  </button>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                    <span>Riscado: sem estoque nesta cor.</span>
                    {characters && (
                      <button
                        type="button"
                        onClick={() => {
                          setFoilBlocked("");
                          setCharacters((t) => t.slice(0, -1));
                        }}
                        className="min-h-11 px-3 font-bold text-purple-700"
                      >
                        Apagar último
                      </button>
                    )}
                  </div>
                  {foilShort.length > 0 && (
                    <p role="alert" className="mt-2 text-sm font-medium text-red-600">
                      Não temos {foilShort.join(", ")} suficiente(s) para {quantity} conjunto(s).
                    </p>
                  )}
                </div>
              )}

              {/* Letras no tamanho real ao lado da pessoa (#344). */}
              {isFoil && characters.trim() && (
                <FoilTextScale
                  typeId={selectedType.id}
                  size={selectedSize.size}
                  text={characters}
                  hexes={balloonHexes(selectedColor.split("|")[0])}
                />
              )}

              {isFoil && (
                <p className="mb-2 text-center text-sm text-slate-600">
                  Quantos conjuntos?
                </p>
              )}
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
                disabled={isFoil && (!characters || foilShort.length > 0)}
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
