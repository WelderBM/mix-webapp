"use client";

import { ProductImage, ProductVariant } from "@/types/product";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Trash2 } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";
import { cn } from "@/lib/utils";

export interface VariationImagePatch {
  variantId: string;
  variantPatch: Partial<ProductVariant>;
}

interface ProductVariationImageManagerProps {
  images: ProductImage[];
  variants: ProductVariant[];
  // Manda só a INTENÇÃO (qual variação, o que mudar nela) — quem aplica o
  // merge de verdade é o pai, de dentro do updater funcional do
  // `setFormData`, contra o estado mais recente garantido.
  onChange: (patch: VariationImagePatch) => void;
  disabled?: boolean;
}

// Escolher imagem de variação só a partir da Galeria de Imagens (já
// enviada ali, em cima) — nada de upload direto aqui. O upload direto por
// linha fazia duas coisas de uma vez (criar a imagem na galeria E vincular
// à variação); se o admin abrisse o diálogo de uma segunda linha antes do
// upload da primeira terminar de subir, o vínculo da primeira era perdido —
// mesmo depois de tentar resolver por atualização atômica e por updater
// funcional. Reduzir pra uma única fonte de verdade (a Galeria, sempre
// commitada antes de qualquer vínculo) elimina a corrida por completo.
export function ProductVariationImageManager({
  images,
  variants,
  onChange,
  disabled,
}: ProductVariationImageManagerProps) {
  const handlePickExisting = (id: string, imageId: string) => {
    const img = images.find((i) => i.id === imageId);
    onChange({ variantId: id, variantPatch: { imageId, imageUrl: img?.url } });
  };

  const handleRemove = (id: string) => {
    // eslint-disable-next-line no-console
    console.log(
      "[DEBUG variation-image] handleRemove clicked for id=" +
        id +
        " current variant=" +
        JSON.stringify(variants.find((v) => v.id === id))
    );
    onChange({
      variantId: id,
      variantPatch: { imageId: undefined, imageUrl: undefined },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <Label>Imagens das Variações</Label>
        <span className="text-sm text-slate-500">
          Toda variação precisa de uma imagem própria — envie as fotos na
          Galeria de Imagens abaixo primeiro, depois escolha uma pra cada
          variação aqui.
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
              {images.length > 0 ? (
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
              ) : (
                <span className="text-xs text-slate-400 italic">
                  Envie uma imagem na Galeria abaixo primeiro
                </span>
              )}

              {variant.imageUrl && (
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleRemove(variant.id)}
                  disabled={disabled}
                  title="Remover imagem"
                >
                  <Trash2 size={14} />
                </Button>
              )}
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
