"use client";

import { useEffect, useMemo, useState } from "react";
import { Product, ProductVariant, ProductImage, CartItem } from "@/types";
import { useCartStore } from "@/store/cartStore";
import { useProductStore } from "@/store/productStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Check, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { ProductImageGallery } from "@/components/features/ProductImageGallery";
import { ProductCard } from "@/components/features/ProductCard";
import { BackButton } from "@/components/ui/BackButton";
import { cn } from "@/lib/utils";
import { getEffectiveUnitPrice, getEffectiveUnitLabel } from "@/lib/ribbon-pricing";
import { filterProductsByCategory } from "@/lib/categories";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { resolveRecentlyViewedProducts } from "@/lib/recentlyViewed";

// Cap de exibição das duas vitrines novas (issue #168) — mesma ordem de
// grandeza de MAX_RECENTLY_VIEWED (useRecentlyViewed.ts), o bastante pra
// preencher 2 fileiras de grid sem virar uma lista longa abaixo do CTA
// principal.
const RELATED_PRODUCTS_LIMIT = 8;

// Uma dimensão "casa" só quando o valor existe dos dois lados e é igual —
// `variantAttrs?.[k] === selection[k]` sozinho deixaria `undefined ===
// undefined` passar como match (variação sem essa dimensão "combinando" com
// o cliente ainda não ter escolhido nada), permitindo considerar a seleção
// completa sem o cliente ter escolhido todas as dimensões visíveis.
function attributesMatch(
  variantAttrs: Record<string, string> | undefined,
  selection: Record<string, string>,
  keys: string[]
): boolean {
  return keys.every(
    (k) => variantAttrs?.[k] !== undefined && variantAttrs[k] === selection[k]
  );
}

function countMatchingAttributes(
  variantAttrs: Record<string, string> | undefined,
  selection: Record<string, string>,
  keys: string[]
): number {
  return keys.filter(
    (k) => variantAttrs?.[k] !== undefined && variantAttrs[k] === selection[k]
  ).length;
}

// Um valor de dimensão só aparece como opção se existir alguma variação com
// esse valor QUE TAMBÉM bata com as outras dimensões já escolhidas (a própria
// dimensão sendo avaliada não entra nessa checagem — é o candidato, não uma
// restrição). Ex: se "Azul" já está escolhido em Cor e não existe nenhuma
// variação "Tamanho: M, Cor: Azul", "M" não aparece em Tamanho.
function isOptionAvailable(
  variants: ProductVariant[],
  key: string,
  value: string,
  selection: Record<string, string>
): boolean {
  return variants.some(
    (v) =>
      v.attributes?.[key] === value &&
      Object.entries(selection).every(
        ([k, val]) => k === key || v.attributes?.[k] === val
      )
  );
}

// Mesma ideia aplicada às miniaturas: uma imagem vinculada a uma variação só
// aparece se essa variação (ou alguma outra que use a mesma foto) bater com
// tudo que já foi escolhido. Imagem sem variação nenhuma vinculada (foto
// genérica do produto) não é afetada, sempre aparece.
function isImageRelevant(
  image: ProductImage,
  variants: ProductVariant[],
  selection: Record<string, string>
): boolean {
  const linkedVariants = variants.filter((v) => v.imageUrl === image.url);
  if (linkedVariants.length === 0) return true;
  return linkedVariants.some((v) =>
    Object.entries(selection).every(([k, val]) => v.attributes?.[k] === val)
  );
}

interface ProductPageClientProps {
  product: Product;
}

export default function ProductPageClient({ product }: ProductPageClientProps) {
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

  // Catálogo completo pras duas vitrines novas (issue #168). Esta rota é
  // Server Component desde a #111 e busca só o produto atual — não hidrata
  // `useProductStore` (diferente de HomeClient, que recebe `initialProducts`
  // via useStoreHydration). Mesmo padrão de /categoria/[slug]/page.tsx:
  // busca sob demanda se a store ainda estiver vazia (visitante chegou
  // direto por link, sem passar pela home antes).
  const allProducts = useProductStore((state) => state.allProducts);
  const productsLoading = useProductStore((state) => state.isLoading);
  const fetchProducts = useProductStore((state) => state.fetchProducts);

  useEffect(() => {
    if (allProducts.length === 0 && productsLoading) {
      fetchProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Item 1 — "vistos recentemente" (client-side puro, localStorage, sem
  // conta/login — ver useRecentlyViewed.ts). Registra a visita ATUAL a cada
  // troca de produto (navegação client-side entre duas páginas de produto
  // reaproveita esta mesma instância do componente, então depende de
  // `product.id`, não só do mount).
  const { recentIds, recordVisit } = useRecentlyViewed();

  useEffect(() => {
    recordVisit(product.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  // Exclui o produto atual da lista exibida — ele acabou de entrar em
  // `recentIds` pela chamada acima, mas "vistos recentemente" aqui significa
  // os OUTROS produtos que o visitante já viu, não o que ele está vendo
  // agora.
  const recentlyViewedProducts = useMemo(
    () => resolveRecentlyViewedProducts(recentIds, allProducts, product.id),
    [recentIds, allProducts, product.id]
  );

  // Item 2 — "relacionados" por categoria/subcategoria (independente do
  // item 1, funciona pra visitante novo sem histórico nenhum). Reaproveita
  // `filterProductsByCategory` (mesma função de /categoria/[slug]), exclui
  // o próprio produto da lista.
  const relatedProducts = useMemo(() => {
    if (!product.category) return [];
    return filterProductsByCategory(
      allProducts,
      product.category,
      product.subcategory
    )
      .filter((p) => p.id !== product.id)
      .slice(0, RELATED_PRODUCTS_LIMIT);
  }, [allProducts, product]);

  // Deriva a seleção inicial a partir do produto já resolvido no servidor.
  // Mantém as dependências em `product.id` (equivalente ao antigo `[id]` do
  // useEffect de fetch) — navegação client-side entre dois produtos reaproveita
  // a mesma instância do componente, então precisa resetar a seleção quando o
  // produto muda, não só na primeira montagem.
  useEffect(() => {
    // Set initial image from images array (Cover)
    // BUT DO NOT AUTO-SELECT LABEL if there are variations
    if (product.images && product.images.length > 0) {
      const cover =
        product.images.find((img) => img.isCover) || product.images[0];
      setSelectedImage(cover.url);
      setSelectedLabel(null); // Always start with no selection
    } else {
      setSelectedImage(product.imageUrl || null);
    }

    // A variação padrão é a que bate com a capa escolhida pelo admin
    // (sinal mais forte de "isso é o que deve aparecer primeiro") —
    // sem cover correspondente, cai pra primeira variação da lista,
    // exibida antes de qualquer escolha do cliente, em vez de deixar
    // preço/imagem em branco até ele clicar numa opção (feedback:
    // "Selecione uma Variação" ficava travando a compra mesmo com
    // opções óbvias disponíveis; a ordem das variações é controlada
    // pelo admin).
    if (product.variants?.length) {
      const cover = product.images?.find((img) => img.isCover);
      const defaultVariant =
        (cover && product.variants.find((v) => v.imageUrl === cover.url)) ||
        product.variants[0];
      const matrixMode = product.variants.every(
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
    } else {
      setSelectedAttributes({});
      setSelectedVariantId(null);
    }
  }, [product]);

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
          attributesMatch(v.attributes, selectedAttributes, dimensionKeys)
        )
      : product?.variants?.find((v) => v.id === selectedVariantId)
    : undefined;

  // Determine the cover image consistently (match useEffect logic)
  const coverImage =
    product?.images?.find((img) => img.isCover) || product?.images?.[0];

  // Miniaturas seguem a mesma regra dos chips de dimensão: uma foto
  // vinculada a uma variação incompatível com a seleção atual (ex: "M" numa
  // foto de Cor Vermelho enquanto Cor Azul já está escolhido) não aparece.
  const galleryImages = isMatrixMode
    ? (product?.images || []).filter((img) =>
        isImageRelevant(img, product?.variants || [], selectedAttributes)
      )
    : product?.images || [];

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
          const score = countMatchingAttributes(
            v.attributes,
            selectedAttributes,
            dimensionKeys
          );
          const bestScore = best
            ? countMatchingAttributes(
                best.attributes,
                selectedAttributes,
                dimensionKeys
              )
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
      attributesMatch(v.attributes, next, dimensionKeys)
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

  // Toda dimensão visível tem um valor escolhido — ainda não garante que a
  // COMBINAÇÃO resultante existe como variação (ver `combinationUnavailable`
  // abaixo), só que o cliente não deixou nenhuma em branco.
  const allDimensionsChosen =
    !isMatrixMode ||
    dimensionKeys.every((k) => selectedAttributes[k] !== undefined);

  // Falta escolher: modo matriz exige toda dimensão preenchida; modo legado
  // exige um id; sistema antigo exige um label.
  const missingSelection = hasStructuredVariants
    ? isMatrixMode
      ? !allDimensionsChosen
      : !selectedVariantId
    : hasVariations && !selectedLabel;

  // Cliente escolheu um valor pra cada dimensão, mas essa combinação
  // específica nunca foi cadastrada (ex: só "P + Azul" existe, "M + Azul"
  // não) — diferente de "faltou escolher", não pode usar a mesma mensagem
  // "Selecione uma Variação" (o cliente já escolheu tudo que via na tela).
  const combinationUnavailable =
    isMatrixMode && allDimensionsChosen && !selectedVariant;

  // Variação escolhida mas esgotada especificamente nessa opção.
  const variantOutOfStock = selectedVariant?.inStock === false;

  const isSelectionMissing =
    missingSelection || combinationUnavailable || variantOutOfStock;

  const effectivePrice = product
    ? selectedVariant?.price ?? getEffectiveUnitPrice(product)
    : null;
  const priceUnavailable = effectivePrice == null;
  const isActionBlocked = isSelectionMissing || priceUnavailable;

  const handleAddToCart = () => {
    if (!product) return;

    if (isActionBlocked) {
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

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <BackButton className="text-slate-500 hover:text-slate-800 mb-6 px-0" />

        <div className="bg-white rounded-3xl shadow-sm border overflow-hidden flex flex-col md:flex-row">
          {/* IMAGEM E GALERIA */}
          <div className="md:w-1/2 bg-slate-100 flex flex-col">
            <ProductImageGallery
              images={galleryImages}
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
              {effectivePrice != null ? (
                <>
                  R$ {effectivePrice.toFixed(2)}
                  {getEffectiveUnitLabel(product) !== "un" && (
                    <span className="text-sm text-slate-400 font-normal ml-1">
                      /{getEffectiveUnitLabel(product)}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-xl text-slate-400">
                  Preço indisponível
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
                      {dimensionOptions[key]
                        .filter((value) =>
                          isOptionAvailable(
                            product?.variants || [],
                            key,
                            value,
                            selectedAttributes
                          )
                        )
                        .map((value) => {
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
                      : combinationUnavailable
                      ? "Essa combinação não está disponível. Escolha outra opção."
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
                  isActionBlocked
                    ? "bg-slate-100 text-slate-400 hover:bg-slate-200 shadow-none border border-slate-200"
                    : "bg-slate-900 hover:bg-slate-800 text-white shadow-slate-200",
                  animateButton && "animate-shake" // Simple shake animation class
                )}
              >
                <ShoppingCart
                  className={cn(isActionBlocked ? "opacity-50" : "")}
                />
                {priceUnavailable
                  ? "Preço Indisponível"
                  : variantOutOfStock
                  ? "Esgotado Nessa Opção"
                  : combinationUnavailable
                  ? "Combinação Indisponível"
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

        {/* Item 2 (#168) — relacionados por categoria/subcategoria.
            Independente do histórico de navegação: funciona pra visitante
            novo (lista vazia -> seção não renderiza, sem erro). */}
        {relatedProducts.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xl font-bold text-slate-800 mb-4">
              Você também pode gostar
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map((related) => (
                <ProductCard key={related.id} product={related} />
              ))}
            </div>
          </section>
        )}

        {/* Item 1 (#168) — "vistos recentemente" (localStorage, sem conta).
            Lista vazia (primeira visita do navegador) -> seção não
            renderiza, sem erro. */}
        {recentlyViewedProducts.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xl font-bold text-slate-800 mb-4">
              Vistos recentemente
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {recentlyViewedProducts.map((recent) => (
                <ProductCard key={recent.id} product={recent} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
