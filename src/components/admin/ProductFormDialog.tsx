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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Product, ProductType, MeasureUnit } from "@/lib/types";
import { collection, addDoc, updateDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { Loader2, Upload, X, Info, ChevronDown } from "lucide-react";
import Image from "next/image";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Switch } from "@/components/ui/switch";

interface ProductFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
  onSuccess: () => void;
  existingCategories: string[];
}

export function ProductFormDialog({
  isOpen,
  onClose,
  productToEdit,
  onSuccess,
  existingCategories,
}: ProductFormDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imageMode, setImageMode] = useState<"upload" | "url">("upload");
  const [categoryOpen, setCategoryOpen] = useState(false);

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
    canBeSoldAsRoll: true,
  });

  useEffect(() => {
    if (productToEdit) {
      setFormData(productToEdit);
      if (
        productToEdit.imageUrl &&
        productToEdit.imageUrl.startsWith("http") &&
        !productToEdit.imageUrl.includes("firebasestorage")
      ) {
        setImageMode("url");
      }
    } else {
      setFormData({
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
        canBeSoldAsRoll: true,
      });
    }
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
      console.error("Erro no upload:", error);
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
        canBeSoldAsRoll:
          formData.type === "RIBBON" ? formData.canBeSoldAsRoll : undefined,
      };

      if (productToEdit?.id) {
        const docRef = doc(db, "products", productToEdit.id);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...dataToUpdate } = payload as Product;
        await updateDoc(docRef, dataToUpdate);
      } else {
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
          <div className="space-y-2">
            <Label>Imagem do Produto</Label>
            <Tabs
              value={imageMode}
              onValueChange={(v) => setImageMode(v as "upload" | "url")}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-2">
                <TabsTrigger value="upload">Upload de Arquivo</TabsTrigger>
                <TabsTrigger value="url">Link da Imagem</TabsTrigger>
              </TabsList>
              <TabsContent value="upload">
                {!formData.imageUrl ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 rounded-xl h-32 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors group"
                  >
                    {isUploading ? (
                      <Loader2 className="h-8 w-8 text-purple-600 animate-spin" />
                    ) : (
                      <>
                        <Upload className="h-6 w-6 text-purple-600 mb-2 group-hover:scale-110" />
                        <p className="text-sm text-slate-600">
                          Clique para enviar foto
                        </p>
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
                  <div className="relative w-full h-32 bg-slate-100 rounded-xl overflow-hidden border flex items-center justify-center">
                    <Image
                      src={formData.imageUrl}
                      alt="Preview"
                      width={128}
                      height={128}
                      className="object-contain h-full"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, imageUrl: "" }))
                      }
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="url">
                <div className="flex gap-2">
                  <Input
                    placeholder="Cole o link da imagem aqui..."
                    value={formData.imageUrl}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        imageUrl: e.target.value,
                      }))
                    }
                  />
                  {formData.imageUrl && (
                    <div className="w-10 h-10 relative rounded border overflow-hidden shrink-0">
                      <img
                        src={formData.imageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
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
                placeholder="Ex: Hidratante"
              />
            </div>
            <div className="space-y-2 flex flex-col">
              <Label>Categoria</Label>
              <div className="flex gap-2">
                <Input
                  required
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  placeholder="Ex: Perfumaria"
                  className="flex-1"
                />
                <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      title="Ver categorias existentes"
                    >
                      <ChevronDown size={16} />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0" align="end">
                    <Command>
                      <CommandInput placeholder="Buscar categoria..." />
                      <CommandList>
                        <CommandEmpty>
                          Nenhuma categoria encontrada.
                        </CommandEmpty>
                        <CommandGroup heading="Categorias Existentes">
                          {existingCategories.map((cat) => (
                            <CommandItem
                              key={cat}
                              value={cat}
                              onSelect={(currentValue) => {
                                const original = existingCategories.find(
                                  (c) =>
                                    c.toLowerCase() ===
                                    currentValue.toLowerCase()
                                );
                                if (original)
                                  setFormData({
                                    ...formData,
                                    category: original,
                                  });
                                setCategoryOpen(false);
                              }}
                            >
                              {cat}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
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
                  <SelectItem value="BASE_CONTAINER">
                    Base (Cesta/Caixa)
                  </SelectItem>
                  <SelectItem value="FILLER">Fundo (Palha/Seda)</SelectItem>
                  <SelectItem value="RIBBON">Fita/Laço</SelectItem>
                  <SelectItem value="WRAPPER">Embalagem Final</SelectItem>
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
                  <SelectItem value="un">Unidade (un)</SelectItem>
                  <SelectItem value="m">Metro (m)</SelectItem>
                  <SelectItem value="pct">Pacote (pct)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.type === "RIBBON" && (
            <div className="flex items-center space-x-2 p-3 bg-purple-50 rounded-lg border border-purple-100">
              <Switch
                checked={formData.canBeSoldAsRoll}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, canBeSoldAsRoll: checked }))
                }
                id="can-be-sold-roll"
              />
              <Label
                htmlFor="can-be-sold-roll"
                className="text-sm font-medium leading-none text-purple-900"
              >
                Vender Rolo Inteiro?
              </Label>
              <Info size={14} className="text-purple-600 ml-auto" />
            </div>
          )}

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
              <Label>Oferta (R$)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="Antigo"
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
                    placeholder="Slots"
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
                    placeholder="Slots"
                  />
                </>
              )}
            </div>
          </div>

          {(formData.type === "STANDARD_ITEM" ||
            formData.type === "BASE_CONTAINER") && (
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-xs text-blue-800 space-y-1">
              <div className="flex items-center gap-2 font-bold mb-1">
                <Info size={14} className="text-blue-600" /> Referência
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
              placeholder="Detalhes..."
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
