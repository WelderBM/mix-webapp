"use client";

import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Product, ProductType, ProductVariant } from "@/lib/types";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
} from "firebase/firestore"; // Adicionei getDocs
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Box, Layers, List } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

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

  // Estado para busca de produtos (para compor kit)
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);

  const [formData, setFormData] = useState<Partial<Product>>({
    name: "",
    description: "",
    price: 0,
    type: "STANDARD_ITEM",
    category: "",
    imageUrl: "",
    unit: "un",
    inStock: true,
    itemSize: 0,
    capacity: 0,
    wrapperConstraints: { minSlots: 1, maxSlots: 10 },
    variants: [], // Inicializa array de variantes
    defaultComponents: [], // Inicializa array de componentes de kit
  });

  // Carrega produtos para a seleção de componentes do Kit
  useEffect(() => {
    if (isOpen && formData.type === "KIT_TEMPLATE") {
      const fetchProds = async () => {
        const snap = await getDocs(collection(db, "products"));
        setAvailableProducts(
          snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product))
        );
      };
      fetchProds();
    }
  }, [isOpen, formData.type]);

  useEffect(() => {
    if (productToEdit) {
      setFormData({
        ...productToEdit,
        variants: productToEdit.variants || [],
        defaultComponents: productToEdit.defaultComponents || [],
      });
    } else {
      setFormData({
        name: "",
        description: "",
        price: 0,
        type: "STANDARD_ITEM",
        category: "",
        imageUrl: "",
        unit: "un",
        inStock: true,
        itemSize: 0,
        capacity: 0,
        wrapperConstraints: { minSlots: 1, maxSlots: 10 },
        variants: [],
        defaultComponents: [],
      });
    }
  }, [productToEdit, isOpen]);

  // --- LÓGICA DE VARIAÇÕES ---
  const addVariant = () => {
    const newVar: ProductVariant = {
      id: crypto.randomUUID(),
      name: "",
      price: 0,
      inStock: true,
    };
    setFormData((prev) => ({
      ...prev,
      variants: [...(prev.variants || []), newVar],
    }));
  };

  const removeVariant = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants?.filter((v) => v.id !== id),
    }));
  };

  const updateVariant = (
    id: string,
    field: keyof ProductVariant,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants?.map((v) =>
        v.id === id ? { ...v, [field]: value } : v
      ),
    }));
  };

  // --- LÓGICA DE COMPONENTES DE KIT ---
  const toggleComponent = (prodId: string) => {
    setFormData((prev) => {
      const current = prev.defaultComponents || [];
      if (current.includes(prodId)) {
        return {
          ...prev,
          defaultComponents: current.filter((id) => id !== prodId),
        };
      } else {
        return { ...prev, defaultComponents: [...current, prodId] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Limpeza de dados baseada no tipo
      const cleanData = { ...formData };
      if (cleanData.type !== "WRAPPER") delete cleanData.wrapperConstraints;
      if (cleanData.type !== "BASE_CONTAINER") delete cleanData.capacity;
      if (cleanData.type !== "STANDARD_ITEM") delete cleanData.itemSize;
      if (cleanData.type !== "KIT_TEMPLATE") delete cleanData.defaultComponents;

      if (productToEdit) {
        await updateDoc(doc(db, "products", productToEdit.id), cleanData);
        toast.success("Produto atualizado!");
      } else {
        await addDoc(collection(db, "products"), cleanData);
        toast.success("Produto criado!");
      }
      onSuccess();
      onClose();
    } catch (error) {
      toast.error("Erro ao salvar produto");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle>
            {productToEdit ? "Editar Produto" : "Novo Produto"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="w-full justify-start bg-slate-100 p-1">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <Box size={14} /> Dados Básicos
              </TabsTrigger>
              <TabsTrigger value="variants" className="flex items-center gap-2">
                <Layers size={14} /> Variações ({formData.variants?.length})
              </TabsTrigger>
              {formData.type === "KIT_TEMPLATE" && (
                <TabsTrigger
                  value="composition"
                  className="flex items-center gap-2"
                >
                  <List size={14} /> Composição
                </TabsTrigger>
              )}
            </TabsList>

            {/* ABA 1: DADOS BÁSICOS */}
            <TabsContent value="basic" className="space-y-4 mt-4">
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
                  <Label>Preço Base (R$)</Label>
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Produto</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(v) =>
                      setFormData({ ...formData, type: v as ProductType })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STANDARD_ITEM">
                        Item Comum (Recheio)
                      </SelectItem>
                      <SelectItem value="BASE_CONTAINER">
                        Base (Cesta/Caixa)
                      </SelectItem>
                      <SelectItem value="FILLER">
                        Preenchimento (Palha/Seda)
                      </SelectItem>
                      <SelectItem value="WRAPPER">Embalagem (Saco)</SelectItem>
                      <SelectItem value="RIBBON">Laço Pronto / Fita</SelectItem>
                      <SelectItem value="ACCESSORY">
                        Acessório (Fio de Fada)
                      </SelectItem>
                      <SelectItem value="KIT_TEMPLATE">
                        Kit Pré-montado
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Input
                    list="categories"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    placeholder="Ex: Perfumaria"
                  />
                  <datalist id="categories">
                    {existingCategories.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* CAMPOS ESPECÍFICOS */}
              {formData.type === "BASE_CONTAINER" && (
                <div className="space-y-2 p-3 bg-purple-50 rounded border border-purple-100">
                  <Label className="text-purple-900">
                    Capacidade da Base (Slots)
                  </Label>
                  <Input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        capacity: parseFloat(e.target.value),
                      })
                    }
                  />
                  <p className="text-xs text-purple-700">
                    Quantos itens "padrão" cabem aqui?
                  </p>
                </div>
              )}

              {formData.type === "STANDARD_ITEM" && (
                <div className="space-y-2 p-3 bg-slate-50 rounded border border-slate-100">
                  <Label>Tamanho do Item (Slots)</Label>
                  <Input
                    type="number"
                    value={formData.itemSize}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        itemSize: parseFloat(e.target.value),
                      })
                    }
                  />
                  <p className="text-xs text-slate-500">
                    Quanto espaço ocupa? (Ex: 1, 2)
                  </p>
                </div>
              )}

              {formData.type === "WRAPPER" && (
                <div className="space-y-2 p-3 bg-blue-50 rounded border border-blue-100">
                  <Label className="text-blue-900">
                    Compatibilidade (Slots)
                  </Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      placeholder="Min"
                      type="number"
                      value={formData.wrapperConstraints?.minSlots}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          wrapperConstraints: {
                            ...formData.wrapperConstraints!,
                            minSlots: parseFloat(e.target.value),
                          },
                        })
                      }
                    />
                    <span>até</span>
                    <Input
                      placeholder="Max"
                      type="number"
                      value={formData.wrapperConstraints?.maxSlots}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          wrapperConstraints: {
                            ...formData.wrapperConstraints!,
                            maxSlots: parseFloat(e.target.value),
                          },
                        })
                      }
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>URL da Imagem</Label>
                <Input
                  value={formData.imageUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, imageUrl: e.target.value })
                  }
                  placeholder="https://..."
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.inStock}
                  onCheckedChange={(c) =>
                    setFormData({ ...formData, inStock: c })
                  }
                />
                <Label>Em Estoque</Label>
              </div>
            </TabsContent>

            {/* ABA 2: VARIAÇÕES */}
            <TabsContent value="variants" className="space-y-4 mt-4">
              <div className="bg-slate-50 p-4 rounded-lg border">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="font-bold text-slate-800">
                      Variações de Venda
                    </h3>
                    <p className="text-xs text-slate-500">
                      Ex: Caixa Fechada, Rolo 10m, etc.
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={addVariant}
                    variant="outline"
                  >
                    <Plus size={14} className="mr-1" /> Adicionar
                  </Button>
                </div>

                {formData.variants?.length === 0 && (
                  <p className="text-center text-sm text-slate-400 py-4">
                    Nenhuma variação cadastrada.
                  </p>
                )}

                <div className="space-y-3">
                  {formData.variants?.map((v) => (
                    <div
                      key={v.id}
                      className="flex gap-2 items-center bg-white p-2 rounded border shadow-sm"
                    >
                      <Input
                        placeholder="Nome (Ex: Rolo 10m)"
                        value={v.name}
                        onChange={(e) =>
                          updateVariant(v.id, "name", e.target.value)
                        }
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        placeholder="Preço"
                        value={v.price}
                        onChange={(e) =>
                          updateVariant(
                            v.id,
                            "price",
                            parseFloat(e.target.value)
                          )
                        }
                        className="w-24"
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => removeVariant(v.id)}
                        className="text-red-400"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* ABA 3: COMPOSIÇÃO DO KIT (Só aparece se tipo for KIT_TEMPLATE) */}
            {formData.type === "KIT_TEMPLATE" && (
              <TabsContent value="composition" className="space-y-4 mt-4">
                <div className="bg-slate-50 p-4 rounded-lg border h-[300px] flex flex-col">
                  <h3 className="font-bold text-slate-800 mb-2">
                    Produtos no Kit
                  </h3>
                  <p className="text-xs text-slate-500 mb-3">
                    Selecione os itens que já vêm neste kit.
                  </p>

                  <div className="flex-1 overflow-y-auto space-y-1 pr-2">
                    {availableProducts.map((p) => {
                      const isSelected = formData.defaultComponents?.includes(
                        p.id
                      );
                      return (
                        <div
                          key={p.id}
                          onClick={() => toggleComponent(p.id)}
                          className={`flex items-center justify-between p-2 rounded border cursor-pointer text-sm ${
                            isSelected
                              ? "bg-green-50 border-green-200"
                              : "bg-white hover:bg-slate-100"
                          }`}
                        >
                          <span>{p.name}</span>
                          {isSelected && (
                            <Badge
                              variant="secondary"
                              className="bg-green-100 text-green-700"
                            >
                              Incluso
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </TabsContent>
            )}
          </Tabs>

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
