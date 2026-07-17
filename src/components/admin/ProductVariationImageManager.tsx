"use client";

import { ProductImage, ProductVariant } from "@/types/product";
import { ImageUploadModal } from "./ImageUploadModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";
import { cn } from "@/lib/utils";

interface ProductVariationImageManagerProps {
  images: ProductImage[];
  variants: ProductVariant[];
  onChange: (variants: ProductVariant[]) => void;
  disabled?: boolean;
}

export function ProductVariationImageManager({
  images,
  variants,
  onChange,
  disabled,
}: ProductVariationImageManagerProps) {
  const handleFieldChange = (id: string, patch: Partial<ProductVariant>) => {
    onChange(
      variants.map((v) => {
        if (v.id !== id) return v;
        const merged = { ...v, ...patch };
        // Firestore rejects fields with value `undefined` — patches that
        // clear an optional field (ex: imageId) must drop the key entirely.
        (Object.keys(merged) as (keyof ProductVariant)[]).forEach((key) => {
          if (merged[key] === undefined) delete merged[key];
        });
        return merged;
      })
    );
  };

  const handlePickExisting = (id: string, imageId: string) => {
    const img = images.find((i) => i.id === imageId);
    handleFieldChange(id, { imageId, imageUrl: img?.url });
  };

  const handleUpload = (id: string, url: string) => {
    handleFieldChange(id, { imageId: undefined, imageUrl: url || undefined });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <Label>Imagens das Variações</Label>
        <span className="text-sm text-slate-500">
          Toda variação precisa de uma imagem própria — escolha uma já
          enviada no produto ou envie uma nova.
        </span>
      </div>

      <div className="space-y-3">
        {variants.map((variant) => (
          <div
            key={variant.id}
            className={cn(
              "flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border",
              variant.imageUrl
                ? "border-slate-200 bg-white"
                : "border-red-200 bg-red-50/40"
            )}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-700">
                {variant.attributes
                  ? Object.entries(variant.attributes)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(" · ")
                  : `${variant.type}: ${variant.name || "(sem nome)"}`}
              </p>
              {!variant.imageUrl && (
                <p className="text-xs text-red-600 font-bold flex items-center gap-1 mt-0.5">
                  <AlertTriangle size={12} /> Imagem obrigatória
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap shrink-0">
              {images.length > 0 && (
                <Select
                  value={variant.imageId || undefined}
                  onValueChange={(v) => handlePickExisting(variant.id, v)}
                  disabled={disabled}
                >
                  <SelectTrigger className="h-9 text-xs w-44">
                    <SelectValue placeholder="Usar imagem já enviada" />
                  </SelectTrigger>
                  <SelectContent>
                    {images.map((img, imgIndex) => (
                      <SelectItem key={img.id} value={img.id}>
                        <span className="flex items-center gap-2">
                          <span className="relative w-5 h-5 rounded overflow-hidden border shrink-0">
                            <SafeImage
                              src={img.url}
                              alt=""
                              fill
                              sizes="20px"
                              className="object-cover"
                            />
                          </span>
                          {img.isCover
                            ? "Capa"
                            : img.label || `Imagem ${imgIndex + 1}`}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <ImageUploadModal
                multiple={false}
                value={variant.imageUrl}
                onChange={(url) => handleUpload(variant.id, url)}
                folder="products"
                disabled={disabled}
              />
            </div>
          </div>
        ))}

        {variants.length === 0 && (
          <p className="text-sm text-slate-400 italic">
            Nenhuma variação criada no passo anterior.
          </p>
        )}
      </div>
    </div>
  );
}
