"use client";

import { useRef, useState } from "react";
import { ProductImage } from "@/types/product";
import { SafeImage } from "@/components/ui/SafeImage";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Expand, ChevronLeft, ChevronRight, Package } from "lucide-react";

interface ProductImageGalleryProps {
  images: ProductImage[];
  productName: string;
  selectedImageUrl: string | null;
  onSelectImage: (url: string) => void;
  coverImageId?: string;
  showError?: boolean;
  imageLabel?: string | null;
}

export function ProductImageGallery({
  images,
  productName,
  selectedImageUrl,
  onSelectImage,
  coverImageId,
  showError,
  imageLabel,
}: ProductImageGalleryProps) {
  const [isZooming, setIsZooming] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState("50% 50%");
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentIndex = Math.max(
    0,
    images.findIndex((img) => img.url === selectedImageUrl)
  );

  // Passagem entre imagens (setas, thumbnails e tela cheia chamam a mesma
  // função, que por sua vez chama onSelectImage — a ligação com
  // variação/rótulo fica toda no componente pai, aqui é só navegação.
  const goToIndex = (index: number) => {
    if (images.length === 0) return;
    const clamped = (index + images.length) % images.length;
    onSelectImage(images[clamped].url);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomOrigin(`${x}% ${y}%`);
  };

  return (
    <div className="flex flex-col">
      {/* IMAGEM PRINCIPAL — zoom no cursor + abre tela cheia ao clicar */}
      <div
        ref={containerRef}
        className="relative min-h-[400px] flex-1 overflow-hidden bg-slate-100 group cursor-zoom-in"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsZooming(true)}
        onMouseLeave={() => setIsZooming(false)}
        onClick={() => selectedImageUrl && setFullscreenOpen(true)}
      >
        {selectedImageUrl ? (
          <SafeImage
            src={selectedImageUrl}
            alt={imageLabel || productName}
            name={productName}
            fill
            className="object-cover transition-transform duration-150 ease-out pointer-events-none"
            style={{
              transform: isZooming ? "scale(2)" : "scale(1)",
              transformOrigin: zoomOrigin,
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-300">
            <Package size={80} />
          </div>
        )}

        {imageLabel && (
          <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm pointer-events-none">
            {imageLabel}
          </div>
        )}

        {selectedImageUrl && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setFullscreenOpen(true);
            }}
            className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            title="Ver em tela cheia"
          >
            <Expand size={18} />
          </button>
        )}

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goToIndex(currentIndex - 1);
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              title="Imagem anterior"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goToIndex(currentIndex + 1);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              title="Próxima imagem"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}
      </div>

      {/* THUMBNAILS */}
      {images.length > 1 && (
        <div
          className={cn(
            "flex gap-2 p-4 overflow-x-auto border-t items-center transition-all duration-300",
            showError
              ? "bg-red-50 border-red-200 animate-pulse ring-2 ring-red-100 ring-inset"
              : "bg-white"
          )}
        >
          {images.map((img, index) => {
            const isCover = coverImageId === img.id;
            return (
              <div key={img.id} className="flex items-center">
                <button
                  type="button"
                  onClick={() => onSelectImage(img.url)}
                  className={cn(
                    "relative w-20 h-20 shrink-0 rounded-lg overflow-hidden border-2 transition-all",
                    selectedImageUrl === img.url
                      ? "border-purple-600 ring-2 ring-purple-100 scale-105 z-10"
                      : "border-slate-100 opacity-70 hover:opacity-100",
                    isCover && "grayscale-[0.3]"
                  )}
                >
                  <SafeImage
                    src={img.url}
                    alt={img.label || productName}
                    fill
                    className="object-cover"
                  />
                  {isCover && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                      <span className="text-[10px] bg-black/60 text-white px-1 rounded-sm backdrop-blur-sm">
                        Capa
                      </span>
                    </div>
                  )}
                </button>
                {isCover && index === 0 && (
                  <div className="w-px h-12 bg-slate-200 mx-2 shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TELA CHEIA — mesmo carrossel, mesma função de seleção */}
      <Dialog open={fullscreenOpen} onOpenChange={setFullscreenOpen}>
        <DialogContent
          className="max-w-[95vw] sm:max-w-5xl w-full h-[90vh] sm:h-[90vh] p-0 sm:p-0 bg-black sm:bg-black border-none sm:border-none rounded-lg overflow-hidden text-white sm:text-white"
          onInteractOutside={() => setFullscreenOpen(false)}
        >
          <DialogTitle className="sr-only">
            {productName}
            {imageLabel ? ` — ${imageLabel}` : ""}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Visualização em tela cheia das imagens do produto.
          </DialogDescription>
          <div className="relative w-full h-full flex items-center justify-center">
            {selectedImageUrl && (
              <SafeImage
                src={selectedImageUrl}
                alt={imageLabel || productName}
                name={productName}
                fill
                className="object-contain"
              />
            )}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => goToIndex(currentIndex - 1)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full"
                  title="Imagem anterior"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  type="button"
                  onClick={() => goToIndex(currentIndex + 1)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full"
                  title="Próxima imagem"
                >
                  <ChevronRight size={24} />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {images.map((img) => (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => onSelectImage(img.url)}
                      className={cn(
                        "w-2 h-2 rounded-full transition-all",
                        img.url === selectedImageUrl
                          ? "bg-white w-5"
                          : "bg-white/40 hover:bg-white/60"
                      )}
                      title={img.label || undefined}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
