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
import { Product, ProductType, MeasureUnit, ProductVariant } from "@/lib/types"; // Importar ProductVariant
import { collection, addDoc, updateDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import {
  Loader2,
  Upload,
  X,
  Info,
  ChevronDown,
  Plus,
  Trash2,
} from "lucide-react";
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

  // Estados para Variantes
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [newVarName, setNewVarName] = useState("");
  const [newVarPrice, setNewVarPrice] = useState("");

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
      setVariants(productToEdit.variants || []); // Carrega variantes existentes
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
      setVariants([]);
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

  // Funções de Variante
  const addVariant = () => {
    if (!newVarName || !newVarPrice) return;
    const newVariant: ProductVariant = {
      id: crypto.randomUUID(),
      name: newVarName,
      price: parseFloat(newVarPrice),
      inStock: true,
    };
    setVariants([...variants, newVariant]);
    setNewVarName("");
    setNewVarPrice("");
  };

  const removeVariant = (id: string) => {
    setVariants(variants.filter((v) => v.id !== id));
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
        variants: variants, // Salva as variantes
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
          {/* Seção Imagem (Resumida) */}
          <div className="space-y-2">
            <Label>Imagem Principal</Label>
            <Tabs
              value={imageMode}
              onValueChange={(v) => setImageMode(v as "upload" | "url")}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-2">
                <TabsTrigger value="upload">Upload</TabsTrigger>
                <TabsTrigger value="url">Link</TabsTrigger>
              </TabsList>
              <TabsContent value="upload">
                {!formData.imageUrl ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 rounded-xl h-24 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50"
                  >
                    <Upload className="h-6 w-6 text-purple-600 mb-1" />
                    <span className="text-xs text-slate-500">
                      {isUploading ? "Enviando..." : "Clique para enviar"}
                    </span>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </div>
                ) : (
                  <div className="relative w-full h-24 bg-slate-100 rounded-xl overflow-hidden border flex items-center justify-center">
                    <Image
                      src={formData.imageUrl}
                      alt="Pré-visualização da imagem para upload"
                      width={100}
                      height={100}
                      className="object-contain h-full"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, imageUrl: "" }))
                      }
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="url">
                <div className="flex gap-2">
                  <Input
                    placeholder="Link da imagem..."
                    value={formData.imageUrl}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        imageUrl: e.target.value,
                      }))
                    }
                  />
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
                placeholder="Ex: Fita Cetim"
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
                  placeholder="Ex: Fitas"
                  className="flex-1"
                />
                <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="icon" className="shrink-0">
                      <ChevronDown size={16} />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0" align="end">
                    <Command>
                      <CommandInput placeholder="Buscar..." />
                      <CommandList>
                        <CommandEmpty>Nada encontrado.</CommandEmpty>
                        <CommandGroup heading="Existentes">
                          {existingCategories.map((cat) => (
                            <CommandItem
                              key={cat}
                              value={cat}
                              onSelect={(val) => {
                                const original = existingCategories.find(
                                  (c) => c.toLowerCase() === val.toLowerCase()
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

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Preço Varejo</Label>
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
                  <SelectItem value="STANDARD_ITEM">Padrão</SelectItem>
                  <SelectItem value="RIBBON">Fita</SelectItem>
                  <SelectItem value="BASE_CONTAINER">Base</SelectItem>
                  <SelectItem value="FILLER">Fundo</SelectItem>
                  <SelectItem value="WRAPPER">Emb. Final</SelectItem>
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
                  <SelectItem value="pct">pct</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ÁREA DE VARIANTES (ATACADO) */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <Label className="text-slate-700 font-bold flex items-center gap-2">
              Variações / Atacado{" "}
              <span className="text-xs font-normal text-slate-500">
                (Opcional)
              </span>
            </Label>

            <div className="flex gap-2 items-end">
              <div className="flex-1 space-y-1">
                <span className="text-xs text-slate-500">
                  Nome (ex: Rolo 10m)
                </span>
                <Input
                  value={newVarName}
                  onChange={(e) => setNewVarName(e.target.value)}
                  className="bg-white h-8 text-sm"
                />
              </div>
              <div className="w-24 space-y-1">
                <span className="text-xs text-slate-500">Preço</span>
                <Input
                  type="number"
                  step="0.01"
                  value={newVarPrice}
                  onChange={(e) => setNewVarPrice(e.target.value)}
                  className="bg-white h-8 text-sm"
                />
              </div>
              <Button
                type="button"
                onClick={addVariant}
                size="sm"
                className="h-8 bg-green-600 hover:bg-green-700"
              >
                <Plus size={14} />
              </Button>
            </div>

            {variants.length > 0 && (
              <div className="space-y-1 mt-2">
                {variants.map((v) => (
                  <div
                    key={v.id}
                    className="flex justify-between items-center bg-white p-2 rounded border text-sm"
                  >
                    <span>{v.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-700">
                        R$ {v.price?.toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeVariant(v.id)}
                        className="text-red-400 hover:text-red-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {formData.type === "RIBBON" && (
            <div className="flex items-center space-x-2 p-3 bg-purple-50 rounded-lg border border-purple-100">
              <Switch
                checked={formData.canBeSoldAsRoll}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, canBeSoldAsRoll: checked }))
                }
                id="roll"
              />
              <Label
                htmlFor="roll"
                className="text-sm font-medium text-purple-900"
              >
                Vender Rolo Inteiro?
              </Label>
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
