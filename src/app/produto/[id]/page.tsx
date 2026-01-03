"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product, CartItem } from "@/types";
import { useCartStore } from "@/store/cartStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart,
  ArrowLeft,
  Package,
  Check,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { SafeImage } from "@/components/ui/SafeImage";
import { cn } from "@/lib/utils";

export default function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
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

  const handleImageSelect = (url: string, label?: string) => {
    setSelectedImage(url);
    setShowError(false);
    if (label) {
      setSelectedLabel(label);
    } else {
      // If clicking cover (no label), we go back to 'overview' mode
      // This invalidates the selection for purchase
      setSelectedLabel(null);
    }
  };

  // Determine the cover image consistently (match useEffect logic)
  const coverImage =
    product?.images?.find((img) => img.isCover) || product?.images?.[0];

  // Helper to determine if product has variations (images with labels that are NOT cover)
  // strict check: ignore the determined cover image by ID
  const hasVariations = product?.images?.some(
    (img) => img.id !== coverImage?.id && !!img.label
  );

  // Selection is missing if variations exist but no label is selected
  const isSelectionMissing = hasVariations && !selectedLabel;

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
      selectedImageLabel: selectedLabel || undefined,
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
            <div className="relative min-h-[400px] flex-1">
              {selectedImage ? (
                <SafeImage
                  src={selectedImage}
                  alt={selectedLabel || product.name}
                  name={product.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-slate-300">
                  <Package size={80} />
                </div>
              )}

              {/* Image Label Overlay if present */}
              {selectedLabel && (
                <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
                  {selectedLabel}
                </div>
              )}
            </div>

            {/* THUMBNAILS GALLERY */}
            {product.images && product.images.length > 1 && (
              <div
                className={cn(
                  "flex gap-2 p-4 overflow-x-auto border-t items-center transition-all duration-300",
                  showError && isSelectionMissing
                    ? "bg-red-50 border-red-200 animate-pulse ring-2 ring-red-100 ring-inset"
                    : "bg-white"
                )}
              >
                {product.images.map((img, index) => {
                  // Identify cover by ID match if possible
                  const isCover = coverImage && img.id === coverImage.id;
                  // Logic to render divider if this is the first item after cover(s) or just separate cover

                  return (
                    <div key={img.id} className="flex items-center">
                      <button
                        onClick={() =>
                          handleImageSelect(
                            img.url,
                            isCover ? undefined : img.label
                          )
                        }
                        className={cn(
                          "relative w-20 h-20 shrink-0 rounded-lg overflow-hidden border-2 transition-all",
                          selectedImage === img.url
                            ? "border-purple-600 ring-2 ring-purple-100 scale-105 z-10"
                            : "border-slate-100 opacity-70 hover:opacity-100",
                          isCover && "grayscale-[0.3]" // Slight visual distinction for cover
                        )}
                      >
                        {/* ... image ... */}
                        <SafeImage
                          src={img.url}
                          alt={img.label || product.name}
                          fill
                          className="object-cover"
                        />
                        {/* Icon indicating it's just a view/cover */}
                        {isCover && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                            <span className="text-[10px] bg-black/60 text-white px-1 rounded-sm backdrop-blur-sm">
                              Capa
                            </span>
                          </div>
                        )}
                      </button>
                      {/* Visual Separator after Cover */}
                      {isCover && index === 0 && (
                        <div className="w-px h-12 bg-slate-200 mx-2 shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
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
              R$ {product.price.toFixed(2)}
              {product.unit !== "un" && (
                <span className="text-sm text-slate-400 font-normal ml-1">
                  /{product.unit}
                </span>
              )}
            </div>

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
                    Por favor, escolha uma das variações para continuar.
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
                {isSelectionMissing
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
