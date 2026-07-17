"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product, ProductVariant, CartItem } from "@/types";
import { useCartStore } from "@/store/cartStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Check, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { ProductImageGallery } from "@/components/features/ProductImageGallery";
import { BackButton } from "@/components/ui/BackButton";
import { cn } from "@/lib/utils";

export default function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    null
  );
  // Modo "matriz" (dimensões combinadas, ex: Tamanho + Cor) — um valor
  // escolhido por dimensão, em vez de um único id de variação. Ver
  // `isMatrixMode` abaixo.
  const [selectedAttributes, setSelectedAttributes] = useState<
    Record<string, string>
  >({});
  const [showError, setShowError] = useState(false);
  const [animateButton, setAnimateButton] = useState(false);
  const { addItem, openCart } = useCartStore();

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, "products", id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const productData = { id: docSnap.id, ...docSnap.data() } as Product;
          setProduct(productData);

          // Set initial image from images array (Cover)
          // BUT DO NOT AUTO-SELECT LABEL if there are variations
          if (productData.images && productData.images.length > 0) {
            const cover =
              productData.images.find((img) => img.isCover) ||
              productData.images[0];
            setSelectedImage(cover.url);
            setSelectedLabel(null); // Always start with no selection
          } else {
            setSelectedImage(productData.imageUrl || null);
          }

          // A primeira variação da lista é a padrão — exibida antes de
          // qualquer escolha do cliente, em vez de deixar preço/imagem em
          // branco até ele clicar numa opção (feedback: "Selecione uma
          // Variação" ficava travando a compra mesmo com opções óbvias
          // disponíveis; a ordem das variações é controlada pelo admin).
          if (productData.variants?.length) {
            const defaultVariant = productData.variants[0];
            const matrixMode = productData.variants.every(
              (v) => v.attributes && Object.keys(v.attributes).length > 0
            );
            if (matrixMode) {
              setSelectedAttributes(defaultVariant.attributes!);
            } else {
              setSelectedVariantId(defaultVariant.id);
            }
            if (defaultVariant.imageUrl) {
              setSelectedImage(defaultVariant.imageUrl);
            }
          }
        }
      } catch (error) {
        console.error("Erro ao carregar produto", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  // Produto com variações estruturadas (Fatia C do addendum de variações) —
  // sistema novo, independente de imagem. Produto sem `variants` cai no
  // sistema antigo (label na imagem) sem nenhuma mudança de comportamento.
  const hasStructuredVariants = !!product?.variants?.length;

  // Modo "matriz": todas as variações têm `attributes` (dimensões
  // combinadas, ex: Tamanho + Cor). Checado pelo array inteiro, não só
  // `variants[0]` — um array misto (algumas com `attributes`, outras sem)
  // cai pro caminho legado inteiro em vez de esconder silenciosamente as
  // variações sem `attributes`.
  const isMatrixMode =
    !!product?.variants?.length &&
    product.variants.every(
      (v) => v.attributes && Object.keys(v.attributes).length > 0
    );

  // Caminho legado (sem `attributes`): agrupa por `.type`, um único
  // `selectedVariantId` — comportamento inalterado.
  const variantGroups = product?.variants?.reduce<
    Record<string, ProductVariant[]>
  >((acc, v) => {
    (acc[v.type] ||= []).push(v);
    return acc;
  }, {});

  // Caminho matriz: união ordenada (primeira aparição) das dimensões e, por
  // dimensão, os valores distintos disponíveis. A ordem das variações (que o
  // admin já controla via as setas de reordenar) controla a ordem de
  // exibição das dimensões.
  const dimensionKeys: string[] = [];
  const dimensionOptions: Record<string, string[]> = {};
  if (isMatrixMode) {
    product?.variants?.forEach((v) => {
      Object.entries(v.attributes || {}).forEach(([key, value]) => {
        if (!dimensionKeys.includes(key)) {
          dimensionKeys.push(key);
          dimensionOptions[key] = [];
        }
        if (!dimensionOptions[key].includes(value)) {
          dimensionOptions[key].push(value);
        }
      });
    });
  }

  const selectedVariant = hasStructuredVariants
    ? isMatrixMode
      ? product?.variants?.find((v) =>
          dimensionKeys.every((k) => v.attributes?.[k] === selectedAttributes[k])
        )
      : product?.variants?.find((v) => v.id === selectedVariantId)
    : undefined;

  // Determine the cover image consistently (match useEffect logic)
  const coverImage =
    product?.images?.find((img) => img.isCover) || product?.images?.[0];

  // Clique em QUALQUER imagem (thumbnail, seta do carrossel ou tela cheia)
  // passa por aqui — a ligação com variação/rótulo é centralizada nesta
  // função, então navegar pelo carrossel ou clicar numa thumbnail vinculada
  // a uma variação seleciona essa variação, do mesmo jeito que clicar no
  // próprio chip da variação já troca a imagem.
  const handleImageSelect = (url: string) => {
    setSelectedImage(url);
    setShowError(false);

    if (isMatrixMode) {
      // Mais de uma combinação pode compartilhar a mesma foto (ex: uma foto
      // genérica de "GG" usada em GG-Vermelho e GG-Azul). Em vez do primeiro
      // match — que poderia sobrescrever uma dimensão já escolhida pelo
      // cliente — usa a combinação que mais concorda com a seleção atual.
      const candidates =
        product?.variants?.filter((v) => v.imageUrl === url) || [];
      const linkedVariant = candidates.reduce<ProductVariant | undefined>(
        (best, v) => {
          const score = dimensionKeys.filter(
            (k) => v.attributes?.[k] === selectedAttributes[k]
          ).length;
          const bestScore = best
            ? dimensionKeys.filter(
                (k) => best.attributes?.[k] === selectedAttributes[k]
              ).length
            : -1;
          return score > bestScore ? v : best;
        },
        undefined
      );
      if (linkedVariant) {
        setSelectedAttributes(linkedVariant.attributes!);
      }
      return;
    }

    if (hasStructuredVariants) {
      const linkedVariant = product?.variants?.find(
        (v) => v.imageUrl === url
      );
      if (linkedVariant) {
        setSelectedVariantId(linkedVariant.id);
      }
      // Imagem sem variação vinculada (ex: capa): só troca a foto em
      // exibição, não mexe na variação já escolhida.
      return;
    }

    // Sistema antigo (produtos sem `variants`) — comportamento inalterado.
    const img = product?.images?.find((i) => i.url === url);
    const isCover = coverImage && img?.id === coverImage.id;
    if (img && !isCover && img.label) {
      setSelectedLabel(img.label);
    } else {
      setSelectedLabel(null);
    }
  };

  const handleVariantSelect = (variant: ProductVariant) => {
    setSelectedVariantId(variant.id);
    setShowError(false);
    if (variant.imageUrl) {
      setSelectedImage(variant.imageUrl);
    }
  };

  // Escolher um valor de dimensão nunca mexe nas outras dimensões já
  // escolhidas — esse é o fix do bug de "trocar a cor desmarca o tamanho".
  // Resolve o variant sincronamente (não dentro do updater funcional do
  // setState) só pra poder também atualizar a imagem exibida.
  const handleDimensionSelect = (key: string, value: string) => {
    const next = { ...selectedAttributes, [key]: value };
    setSelectedAttributes(next);
    setShowError(false);
    const resolved = product?.variants?.find((v) =>
      dimensionKeys.every((k) => v.attributes?.[k] === next[k])
    );
    if (resolved?.imageUrl) {
      setSelectedImage(resolved.imageUrl);
    }
  };

  // Helper to determine if product has variations (images with labels that are NOT cover)
  // strict check: ignore the determined cover image by ID — só relevante pro
  // sistema antigo, produto com `variants` nunca usa isso.
  const hasVariations =
    !hasStructuredVariants &&
    product?.images?.some((img) => img.id !== coverImage?.id && !!img.label);

  // Falta escolher: modo matriz exige que a combinação escolhida resolva
  // pra uma variação; modo legado exige um id; sistema antigo exige um label.
  const missingSelection = hasStructuredVariants
    ? isMatrixMode
      ? !selectedVariant
      : !selectedVariantId
    : hasVariations && !selectedLabel;

  // Variação escolhida mas esgotada especificamente nessa opção.
  const variantOutOfStock = selectedVariant?.inStock === false;

  const isSelectionMissing = missingSelection || variantOutOfStock;

  const handleAddToCart = () => {
    if (!product) return;

    if (isSelectionMissing) {
      // Trigger Visual Feedback
      setShowError(true);
      setAnimateButton(true);
      setTimeout(() => setAnimateButton(false), 500); // Reset animation class
      return;
    }

    const item: CartItem = {
      cartId: crypto.randomUUID(),
      type: "SIMPLE",
      quantity: 1,
      product: product,
      selectedVariant: selectedVariant,
      selectedImageLabel: !hasStructuredVariants
        ? selectedLabel || undefined
        : undefined,
      selectedImageUrl: selectedImage || undefined,
    };
    addItem(item);
    openCart();
    toast.success("Adicionado ao carrinho!");
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );

  if (!product)
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold text-slate-800">
          Produto não encontrado 😕
        </h1>
        <BackButton variant="outline" />
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <BackButton className="text-slate-500 hover:text-slate-800 mb-6 px-0" />

        <div className="bg-white rounded-3xl shadow-sm border overflow-hidden flex flex-col md:flex-row">
          {/* IMAGEM E GALERIA */}
          <div className="md:w-1/2 bg-slate-100 flex flex-col">
            <ProductImageGallery
              images={product.images || []}
              productName={product.name}
              selectedImageUrl={selectedImage}
              onSelectImage={handleImageSelect}
              coverImageId={coverImage?.id}
              showError={showError && isSelectionMissing}
              imageLabel={selectedLabel}
            />
          </div>

          {/* DETALHES */}
          <div className="md:w-1/2 p-6 md:p-12 flex flex-col justify-center">
            <div className="mb-2">
              <Badge variant="secondary" className="mb-2">
                {product.category || "Geral"}
              </Badge>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight">
                {product.name}
              </h1>
              {selectedLabel && (
                <span className="text-slate-500 text-lg font-medium mt-1 block">
                  {selectedLabel}
                </span>
              )}
            </div>

            <div className="text-3xl font-bold text-purple-600 mt-4">
              R$ {(selectedVariant?.price ?? product.price).toFixed(2)}
              {product.unit !== "un" && (
                <span className="text-sm text-slate-400 font-normal ml-1">
                  /{product.unit}
                </span>
              )}
            </div>

            {hasStructuredVariants && isMatrixMode && (
              <div className="mt-4 space-y-4">
                {dimensionKeys.map((key) => (
                  <div key={key}>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
                      {key}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {dimensionOptions[key].map((value) => {
                        const isSelected = selectedAttributes[key] === value;
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => handleDimensionSelect(key, value)}
                            className={cn(
                              "px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all",
                              isSelected
                                ? "border-purple-600 bg-purple-50 text-purple-700"
                                : "border-slate-200 hover:border-slate-300 text-slate-600"
                            )}
                          >
                            {value}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {hasStructuredVariants && !isMatrixMode && variantGroups && (
              <div className="mt-4 space-y-4">
                {Object.entries(variantGroups).map(([type, options]) => (
                  <div key={type}>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
                      {type}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {options.map((variant) => {
                        const isSelected = selectedVariantId === variant.id;
                        const outOfStock = variant.inStock === false;
                        return (
                          <button
                            key={variant.id}
                            type="button"
                            onClick={() => handleVariantSelect(variant)}
                            className={cn(
                              "px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all",
                              isSelected
                                ? "border-purple-600 bg-purple-50 text-purple-700"
                                : "border-slate-200 hover:border-slate-300 text-slate-600",
                              outOfStock &&
                                "opacity-40 line-through decoration-slate-400"
                            )}
                          >
                            {variant.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {product.description && (
              <p className="text-slate-600 mt-6 leading-relaxed border-t pt-4">
                {product.description}
              </p>
            )}

            <div className="mt-8 space-y-4 relative">
              {" "}
              {/* Relative for absolute alerts */}
              {/* Alert Message */}
              {showError && isSelectionMissing && (
                <div className="absolute -top-12 left-0 w-full z-50 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-medium border border-red-100 flex items-center gap-2 shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    {variantOutOfStock
                      ? "Essa opção está esgotada. Escolha outra."
                      : "Por favor, escolha uma das variações para continuar."}
                  </div>
                  {/* Little arrow down */}
                  <div className="w-3 h-3 bg-red-50 border-r border-b border-red-100 rotate-45 absolute -bottom-1.5 left-8"></div>
                </div>
              )}
              <Button
                key={animateButton ? "shaking" : "idle"}
                onClick={handleAddToCart}
                size="lg"
                className={cn(
                  "w-full h-14 text-lg gap-2 shadow-lg transition-all relative overflow-hidden",
                  // If missing selection: Grey styling but NOT disabled interactive-wise
                  isSelectionMissing
                    ? "bg-slate-100 text-slate-400 hover:bg-slate-200 shadow-none border border-slate-200"
                    : "bg-slate-900 hover:bg-slate-800 text-white shadow-slate-200",
                  animateButton && "animate-shake" // Simple shake animation class
                )}
              >
                <ShoppingCart
                  className={cn(isSelectionMissing ? "opacity-50" : "")}
                />
                {variantOutOfStock
                  ? "Esgotado Nessa Opção"
                  : missingSelection
                  ? "Selecione uma Variação"
                  : "Adicionar ao Carrinho"}
              </Button>
              <div className="flex items-center justify-center gap-6 text-xs text-slate-400 mt-4">
                <span className="flex items-center gap-1">
                  <ShieldCheck size={14} /> Compra Segura
                </span>
                <span className="flex items-center gap-1">
                  <Check size={14} /> Estoque Disponível
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
