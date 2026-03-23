"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ImageUpload } from "./ImageUpload";
import { Image as ImageIcon, Pencil, Trash2, Camera, Plus } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";

interface ImageUploadModalProps {
  value?: string;
  onChange?: (url: string) => void;
  onUploadComplete?: (urls: string[]) => void;
  multiple?: boolean;
  folder?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
}

export function ImageUploadModal({
  value,
  onChange,
  onUploadComplete,
  multiple = false,
  folder = "products",
  label = "Alterar Imagem",
  className,
  disabled = false,
}: ImageUploadModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <div className={className}>
        {multiple ? (
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full h-16 border-dashed border-2 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition-all text-slate-500 font-bold gap-3"
              disabled={disabled}
            >
              <div className="w-10 h-10 rounded-full bg-white shadow-sm border flex items-center justify-center text-purple-600">
                <Plus size={20} />
              </div>
              <div className="text-left">
                <p className="text-sm">Clique para subir arquivos</p>
                <p className="text-[10px] uppercase tracking-widest text-slate-400">Suporta múltiplas imagens</p>
              </div>
            </Button>
          </DialogTrigger>
        ) : (
          <div className="flex items-center gap-3 w-full">
            {/* Thumbnail preview */}
            <div className="relative w-12 h-12 rounded-lg border-2 border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center shrink-0">
              {value ? (
                <SafeImage
                  src={value}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
              ) : (
                <ImageIcon size={20} className="text-slate-300" />
              )}
            </div>
            
            <div className="flex flex-col gap-1 flex-1">
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={disabled}
                  className="h-8 text-[11px] font-black uppercase gap-2 text-slate-700 hover:bg-slate-100 border-slate-300 shadow-sm"
                >
                  <Pencil size={12} className="text-purple-600" />
                  {value ? "Trocar" : "Escolher"}
                </Button>
              </DialogTrigger>
              
              {value && onChange && (
                <button
                  onClick={() => onChange("")}
                  disabled={disabled}
                  className="text-[9px] text-red-500 hover:text-red-600 flex items-center gap-1 font-black uppercase transition-all ml-1"
                >
                  <Trash2 size={10} /> Remover imagem
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
              <Camera size={18} />
            </div>
            <DialogTitle className="text-xl font-bold text-slate-800">
              {multiple ? "Subir Galeria" : "Escolher Imagem"}
            </DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="py-4">
          <ImageUpload 
            value={value || ""}
            folder={folder}
            multiple={multiple}
            onUploadComplete={(urls) => {
              if (onUploadComplete) onUploadComplete(urls);
              setIsOpen(false);
            }}
            onChange={(url) => {
              if (onChange) onChange(url);
              // For single selection, we close it
              if (!multiple) setIsOpen(false);
            }}
            disabled={disabled}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
