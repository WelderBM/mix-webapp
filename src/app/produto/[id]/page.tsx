"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product, ProductVariant, CartItem } from "@/types";
import { useCartStore } from "@/store/cartStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, ArrowLeft, Check, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { ProductImageGallery } from "@/components/features/ProductImageGallery";
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

  const variantGroups = product?.variants?.reduce<
    Record<string, ProductVariant[]>
  >((acc, v) => {
    (acc[v.type] ||= []).push(v);
    return acc;
  }, {});

  const selectedVariant = hasStructuredVariants
    ? product?.variants?.find((v) => v.id === selectedVariantId)
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

  // Helper to determine if product has variations (images with labels that are NOT cover)
  // strict check: ignore the determined cover image by ID — só relevante pro
  // sistema antigo, produto com `variants` nunca usa isso.
  const hasVariations =
    !hasStructuredVariants &&
    product?.images?.some((img) => img.id !== coverImage?.id && !!img.label);

  // Falta escolher: sistema novo exige uma variação; sistema antigo exige um label.
  const missingSelection = hasStructuredVariants
    ? !selectedVariantId
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
        <Link href="/">
          <Button variant="outline">Voltar para a Loja</Button>
        </Link>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center text-slate-500 hover:text-slate-800 mb-6 transition-colors"
        >
          <ArrowLeft size={18} className="mr-2" /> Voltar para a Loja
        </Link>

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

            {hasStructuredVariants && variantGroups && (
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
