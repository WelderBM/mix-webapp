import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ProductImage } from "@/types/product";
import { ImageUploadModal } from "./ImageUploadModal";
import { X, Star } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";

interface ProductImageManagerProps {
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
  disabled?: boolean;
}

export const ProductImageManager: React.FC<ProductImageManagerProps> = ({
  images,
  onChange,
  disabled,
}) => {
  const handleAddImages = (urls: string[]) => {
    const newImagesList = urls.map((url) => ({
      id: crypto.randomUUID(),
      url,
      isCover: false,
    }));

    // If list was empty, set first new image as cover
    if (images.length === 0 && newImagesList.length > 0) {
      newImagesList[0].isCover = true;
    }

    onChange([...images, ...newImagesList]);
  };

  const handleDelete = (id: string) => {
    const newImages = images.filter((img) => img.id !== id);
    // If we deleted the cover, make the first available image the new cover
    if (images.find((img) => img.id === id)?.isCover && newImages.length > 0) {
      newImages[0].isCover = true;
    }
    onChange(newImages);
  };

  const handleSetCover = (id: string) => {
    const newImages = images.map((img) => ({
      ...img,
      isCover: img.id === id,
    }));
    onChange(newImages);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <Label>Galeria de Imagens</Label>
        <span className="text-sm text-slate-500">
          Adicione múltiplas imagens. A primeira imagem ou a marcada com estrela
          será a capa. Pra nomear uma imagem como variação (ex: "Azul"), vincule
          ela numa variação logo abaixo.
        </span>
      </div>

      {/* Grid of existing images */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {images.map((img) => (
          <div
            key={img.id}
            className={`relative flex gap-4 p-3 rounded-lg border transition-all ${
              img.isCover
                ? "border-green-500 bg-green-50/30"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            {/* Thumbnail */}
            <div className="relative w-24 h-24 shrink-0 bg-slate-100 rounded-md overflow-hidden border">
              <SafeImage
                src={img.url}
                alt={img.label || "Imagem do produto"}
                className="object-cover"
                fill
                sizes="96px"
              />
            </div>

            {/* Controls */}
            <div className="flex flex-col flex-1 gap-2 justify-center">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={img.isCover ? "default" : "outline"}
                  className={`h-7 text-xs gap-1 ${
                    img.isCover ? "bg-green-600 hover:bg-green-700" : ""
                  }`}
                  onClick={() => handleSetCover(img.id)}
                  disabled={disabled || img.isCover} // Disabled if already cover
                >
                  <Star size={12} className={img.isCover ? "fill-white" : ""} />
                  {img.isCover ? "Capa Principal" : "Definir Capa"}
                </Button>

                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50 ml-auto"
                  onClick={() => handleDelete(img.id)}
                  disabled={disabled}
                  title="Remover imagem"
                >
                  <X size={14} />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upload New Area */}
      <div className="mt-4">
        <ImageUploadModal
          multiple={true}
          onUploadComplete={handleAddImages}
          disabled={disabled}
          folder="products"
        />
      </div>
    </div>
  );
};
