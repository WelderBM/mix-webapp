"use client";

import { useEffect, useState } from "react";
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
import { db } from "@/lib/firebase";
import { Loader2 } from "lucide-react";

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

  // Estado inicial do formulário
  const [formData, setFormData] = useState<Partial<Product>>({
    name: "",
    price: 0,
    type: "NATURA_ITEM",
    category: "",
    imageUrl: "",
    unit: "un",
    inStock: true,
    itemSize: 1,
    capacity: 0,
    description: "",
  });

  // Preenche o form se for edição
  useEffect(() => {
    if (productToEdit) {
      setFormData(productToEdit);
    } else {
      setFormData({
        name: "",
        price: 0,
        type: "NATURA_ITEM",
        category: "Geral",
        imageUrl: "",
        unit: "un",
        inStock: true,
        itemSize: 1,
        capacity: 0,
        description: "",
      });
    }
  }, [productToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Limpeza de dados
      const payload = {
        ...formData,
        price: Number(formData.price),
        originalPrice: formData.originalPrice
          ? Number(formData.originalPrice)
          : undefined,
        itemSize:
          formData.type === "NATURA_ITEM"
            ? Number(formData.itemSize)
            : undefined,
        capacity:
          formData.type === "BASE_CONTAINER"
            ? Number(formData.capacity)
            : undefined,
      };

      if (productToEdit?.id) {
        // Atualizar
        const docRef = doc(db, "products", productToEdit.id);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...dataToUpdate } = payload as Product;
        await updateDoc(docRef, dataToUpdate);
      } else {
        // Criar Novo
        await addDoc(collection(db, "products"), payload);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Erro ao salvar:", error);
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome do Produto</Label>
              <Input
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ex: Hidratante TodoDia"
              />
            </div>

            <div className="space-y-2">
              <Label>Categoria Visual</Label>
              <Input
                required
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                placeholder="Ex: Perfumaria"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo (Sistema)</Label>
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
                  <SelectItem value="NATURA_ITEM">
                    Produto Natura (Recheio)
                  </SelectItem>
                  <SelectItem value="BASE_CONTAINER">
                    Base (Cesta/Caixa)
                  </SelectItem>
                  <SelectItem value="FILLER">Fundo (Palha/Seda)</SelectItem>
                  <SelectItem value="RIBBON">Fita/Laço</SelectItem>
                  <SelectItem value="WRAPPER">Embalagem Final</SelectItem>
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
                  <SelectItem value="un">Unidade (un)</SelectItem>
                  <SelectItem value="m">Metro (m)</SelectItem>
                  <SelectItem value="kg">Quilo (kg)</SelectItem>
                  <SelectItem value="pct">Pacote (pct)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Preço (R$)</Label>
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
              <Label>Preço Original (Opcional)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="Para oferta"
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
              {/* Campo Dinâmico: Capacidade OU Tamanho */}
              {formData.type === "BASE_CONTAINER" ? (
                <>
                  <Label className="text-purple-600 font-bold">
                    Capacidade (Slots)
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
                    placeholder="Ex: 10"
                  />
                </>
              ) : (
                <>
                  <Label className="text-blue-600 font-bold">
                    Tamanho (Slots)
                  </Label>
                  <Input
                    type="number"
                    value={formData.itemSize || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        itemSize: parseInt(e.target.value),
                      })
                    }
                    placeholder="Ex: 1"
                  />
                </>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>URL da Imagem</Label>
            <Input
              value={formData.imageUrl}
              onChange={(e) =>
                setFormData({ ...formData, imageUrl: e.target.value })
              }
              placeholder="https://..."
            />
            {formData.imageUrl && (
              <div className="relative w-20 h-20 mt-2 rounded-md overflow-hidden border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={formData.imageUrl}
                  alt="Preview"
                  className="object-cover w-full h-full"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Descrição Completa</Label>
            <Textarea
              value={formData.description || ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Detalhes técnicos, notas olfativas..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-slate-900 text-white"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Produto
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
