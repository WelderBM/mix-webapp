"use client";

import { useEffect, useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Product, ProductType, MeasureUnit } from "@/lib/types";
import { collection, addDoc, updateDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { Loader2, Upload, X, Info } from "lucide-react";
import Image from "next/image";

interface ProductFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
  onSuccess: () => void;
}

export function ProductFormDialog({
  isOpen,
  onClose,
  productToEdit,
  onSuccess,
}: ProductFormDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<Partial<Product>>({
    name: "",
    price: 0,
    type: "STANDARD_ITEM",
    category: "",
    imageUrl: "",
    unit: "un",
    inStock: true,
    itemSize: 1,
    capacity: 0,
    description: "",
  });

  useEffect(() => {
    if (productToEdit) setFormData(productToEdit);
    else
      setFormData({
        name: "",
        price: 0,
        type: "STANDARD_ITEM",
        category: "Geral",
        imageUrl: "",
        unit: "un",
        inStock: true,
        itemSize: 1,
        capacity: 0,
        description: "",
      });
  }, [productToEdit, isOpen]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const storageRef = ref(storage, `products/${Date.now()}-${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setFormData((prev) => ({ ...prev, imageUrl: url }));
    } catch (error) {
      console.error(error);
      alert("Falha ao enviar imagem.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        originalPrice: formData.originalPrice
          ? Number(formData.originalPrice)
          : undefined,
        itemSize:
          formData.type === "STANDARD_ITEM"
            ? Number(formData.itemSize)
            : undefined,
        capacity:
          formData.type === "BASE_CONTAINER"
            ? Number(formData.capacity)
            : undefined,
      };
      if (productToEdit?.id) {
        const docRef = doc(db, "products", productToEdit.id);
        const { id, ...dataToUpdate } = payload as Product;
        await updateDoc(docRef, dataToUpdate);
      } else {
        await addDoc(collection(db, "products"), payload);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar produto");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {productToEdit ? "Editar Produto" : "Novo Produto"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Imagem</Label>
            {!formData.imageUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 rounded-xl h-40 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors group"
              >
                {isUploading ? (
                  <Loader2 className="animate-spin text-purple-600" />
                ) : (
                  <>
                    <Upload className="h-6 w-6 text-purple-600 mb-2 group-hover:scale-110" />
                    <p className="text-sm text-slate-600">Enviar foto</p>
                  </>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </div>
            ) : (
              <div className="relative w-full h-48 bg-slate-100 rounded-xl overflow-hidden border">
                <Image
                  src={formData.imageUrl}
                  alt="Preview"
                  fill
                  className="object-contain"
                />
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, imageUrl: "" }))
                  }
                  className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Input
                required
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={formData.type}
                onValueChange={(val) =>
                  setFormData({ ...formData, type: val as ProductType })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STANDARD_ITEM">Produto Padrão</SelectItem>
                  <SelectItem value="BASE_CONTAINER">Base</SelectItem>
                  <SelectItem value="FILLER">Fundo</SelectItem>
                  <SelectItem value="RIBBON">Fita</SelectItem>
                  <SelectItem value="WRAPPER">Embalagem</SelectItem>
                  <SelectItem value="SUPPLY_BULK">Atacado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Unidade</Label>
              <Select
                value={formData.unit}
                onValueChange={(val) =>
                  setFormData({ ...formData, unit: val as MeasureUnit })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="un">un</SelectItem>
                  <SelectItem value="m">m</SelectItem>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="pct">pct</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Preço</Label>
              <Input
                type="number"
                step="0.01"
                required
                value={formData.price}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    price: parseFloat(e.target.value),
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Oferta</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.originalPrice || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    originalPrice: parseFloat(e.target.value),
                  })
                }
              />
            </div>
            <div className="space-y-2">
              {formData.type === "BASE_CONTAINER" ? (
                <>
                  <Label className="text-purple-600 font-bold">
                    Capacidade
                  </Label>
                  <Input
                    type="number"
                    value={formData.capacity || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        capacity: parseInt(e.target.value),
                      })
                    }
                  />
                </>
              ) : (
                <>
                  <Label className="text-blue-600 font-bold">Tamanho</Label>
                  <Input
                    type="number"
                    value={formData.itemSize || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        itemSize: parseInt(e.target.value),
                      })
                    }
                  />
                </>
              )}
            </div>
          </div>
          {(formData.type === "STANDARD_ITEM" ||
            formData.type === "BASE_CONTAINER") && (
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-xs text-blue-800 space-y-1">
              <div className="flex items-center gap-2 font-bold mb-1">
                <Info size={14} /> Referência de Tamanhos (Slots)
              </div>
              <div className="grid grid-cols-2 gap-2">
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>Sabonete = 1</li>
                  <li>Hidratante = 2</li>
                  <li>Perfume = 3</li>
                </ul>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>Caixa P = 4</li>
                  <li>Cesta M = 8</li>
                  <li>Cesta G = 12+</li>
                </ul>
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              value={formData.description || ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || isUploading}
              className="bg-slate-900 text-white"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{" "}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
