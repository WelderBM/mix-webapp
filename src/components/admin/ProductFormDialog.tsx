// src/components/admin/ProductFormDialog.tsx (VERSÃO CONSOLIDADA COM CONTROLE DE FITA)
"use client";

import { useState, useEffect } from "react";
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import {
  Product,
  ProductType,
  RibbonInventory,
  RibbonRollStatus,
} from "@/types/product";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Check,
  Ruler,
  Save,
  Loader2,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { ImageUpload } from "./ImageUpload";

// Definindo o tipo base de dados do formulário (simplificado)
interface ProductFormData extends Product {
  ribbonInventory?: RibbonInventory;
}

interface ProductFormDialogProps {
  productToEdit: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingCategories: string[];
}

const initialFormState: ProductFormData = {
  id: "",
  name: "",
  price: 0,
  type: "STANDARD_ITEM",
  category: "Geral",
  unit: "un",
  inStock: true,
  disabled: false,
  description: "",
  imageUrl: "",
  ribbonInventory: {
    status: "FECHADO",
    remainingMeters: 0,
    totalRollMeters: 0,
  },
};

export const ProductFormDialog: React.FC<ProductFormDialogProps> = ({
  productToEdit,
  isOpen,
  onClose,
  onSuccess,
  existingCategories,
}) => {
  const [formData, setFormData] = useState<ProductFormData>(initialFormState);
  const [loading, setLoading] = useState(false);
  const [customCategory, setCustomCategory] = useState(false);

  useEffect(() => {
    if (productToEdit) {
      setFormData({
        ...initialFormState,
        ...productToEdit,
        ribbonInventory:
          productToEdit.ribbonInventory || initialFormState.ribbonInventory,
      });
      // Verifica se a categoria é personalizada
      if (
        productToEdit.category &&
        !existingCategories.includes(productToEdit.category) &&
        productToEdit.category !== "Geral"
      ) {
        setCustomCategory(true);
      } else {
        setCustomCategory(false);
      }
    } else {
      setFormData(initialFormState);
      setCustomCategory(false);
    }
  }, [productToEdit, isOpen, existingCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // VALIDATIONS
    if (!formData.name.trim()) {
      toast.error("O nome do produto é obrigatório.");
      return;
    }

    if (Number(formData.price) <= 0) {
      toast.error("O preço deve ser maior que zero.");
      return;
    }

    if (!formData.category || formData.category.trim() === "") {
      toast.error("A categoria é obrigatória.");
      return;
    }

    if (!formData.type) {
      toast.error("O tipo do produto é obrigatório.");
      return;
    }

    if (!formData.unit || formData.unit.trim() === "") {
      toast.error("A unidade de venda (un, m, kg) é obrigatória.");
      return;
    }

    setLoading(true);

    try {
      // Gera ID se for novo
      const productId = formData.id || doc(collection(db, "products")).id;

      const productData: Product = {
        ...formData,
        id: productId,
        price: Number(formData.price),
        category: formData.category.trim(),
        unit: formData.unit.trim() as any,
      };

      await setDoc(doc(db, "products", productId), productData);

      toast.success(productToEdit ? "Produto atualizado!" : "Produto criado!");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      toast.error("Erro ao salvar produto.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ProductFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleRibbonInventoryChange = (
    key: keyof RibbonInventory,
    value: any
  ) => {
    setFormData((prev) => {
      const totalMeters = prev.ribbonInventory?.totalRollMeters || 0;

      if (key === "status") {
        const newStatus = value as RibbonRollStatus;
        return {
          ...prev,
          ribbonInventory: {
            ...prev.ribbonInventory,
            status: newStatus,
            remainingMeters:
              newStatus === "FECHADO"
                ? totalMeters
                : prev.ribbonInventory?.remainingMeters || 0,
          } as RibbonInventory,
        };
      }

      if (key === "totalRollMeters") {
        const newTotal = parseFloat(value) || 0;
        return {
          ...prev,
          ribbonInventory: {
            ...prev.ribbonInventory,
            totalRollMeters: newTotal,
            remainingMeters:
              prev.ribbonInventory?.status === "FECHADO"
                ? newTotal
                : prev.ribbonInventory?.remainingMeters || 0,
          } as RibbonInventory,
        };
      }

      return {
        ...prev,
        ribbonInventory: {
          ...prev.ribbonInventory,
          [key]: parseFloat(value) || 0,
        } as RibbonInventory,
      };
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !loading && onClose()}>
      <DialogContent
        className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {productToEdit ? "Editar Produto" : "Novo Produto"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="Detalhes" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="Detalhes">Detalhes Básicos</TabsTrigger>
              <TabsTrigger value="Inventario">Inventário e Estoque</TabsTrigger>
            </TabsList>

            <TabsContent value="Detalhes" className="py-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Produto</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  {!customCategory ? (
                    <div className="flex gap-2">
                      <Select
                        value={
                          existingCategories.includes(formData.category)
                            ? formData.category
                            : "Geral"
                        }
                        onValueChange={(v) => {
                          if (v === "custom_new") {
                            setCustomCategory(true);
                            handleInputChange("category", "");
                          } else {
                            handleInputChange("category", v);
                          }
                        }}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {existingCategories.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                          <SelectItem
                            value="custom_new"
                            className="text-purple-600 font-bold"
                          >
                            + Nova Categoria
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Nome da nova categoria"
                        value={formData.category}
                        onChange={(e) =>
                          handleInputChange("category", e.target.value)
                        }
                        className="flex-1"
                        autoFocus
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setCustomCategory(false)}
                        title="Voltar para lista"
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(v) =>
                      handleInputChange("type", v as ProductType)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RIBBON">FITA (ROLO)</SelectItem>
                      <SelectItem value="BASE_CONTAINER">
                        CESTA/CAIXA
                      </SelectItem>
                      <SelectItem value="STANDARD_ITEM">ITEM PADRÃO</SelectItem>
                      <SelectItem value="ACCESSORY">ACESSÓRIO</SelectItem>
                      <SelectItem value="WRAPPER">EMBALAGEM</SelectItem>
                      <SelectItem value="FILLER">PREENCHIMENTO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Preço</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => handleInputChange("price", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Unidade de Venda</Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(v) => handleInputChange("unit", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione Unidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="un">UNIDADE (un)</SelectItem>
                      <SelectItem value="m">METRO (m)</SelectItem>
                      <SelectItem value="pct">PACOTE (pct)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                />
              </div>
            </TabsContent>

            <TabsContent value="Inventario" className="py-4 space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="inStock"
                  checked={formData.inStock}
                  onCheckedChange={(checked) =>
                    handleInputChange("inStock", checked)
                  }
                />
                <Label htmlFor="inStock">Em Estoque</Label>
              </div>

              <div className="space-y-4">
                <ImageUpload
                  value={formData.imageUrl || ""}
                  onChange={(url) => handleInputChange("imageUrl", url)}
                  disabled={loading}
                />
              </div>

              {formData.type === "RIBBON" && (
                <div className="space-y-4 rounded-lg border p-4 bg-yellow-50/50">
                  <h4 className="font-bold text-lg text-yellow-800 flex items-center gap-2">
                    <Ruler size={20} /> Controle de Estoque da Fita
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="totalMeters">
                        Metragem Total do Rolo (m)
                      </Label>
                      <Input
                        id="totalMeters"
                        type="number"
                        value={formData.ribbonInventory?.totalRollMeters || 0}
                        onChange={(e) =>
                          handleRibbonInventoryChange(
                            "totalRollMeters",
                            e.target.value
                          )
                        }
                        placeholder="Ex: 500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Status do Rolo</Label>
                      <Select
                        value={formData.ribbonInventory?.status || "FECHADO"}
                        onValueChange={(status: RibbonRollStatus) => {
                          handleRibbonInventoryChange("status", status);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FECHADO">
                            🔴 Fechado (Venda Rolo Inteiro)
                          </SelectItem>
                          <SelectItem value="ABERTO">
                            🟢 Aberto (Venda por Metro/Laço)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {formData.ribbonInventory?.status === "ABERTO" && (
                    <div className="space-y-2 animate-in fade-in">
                      <Label
                        htmlFor="remainingMeters"
                        className="flex justify-between"
                      >
                        Metragem Restante (m)
                        <span className="text-sm text-slate-500">
                          Total: {formData.ribbonInventory.totalRollMeters}m
                        </span>
                      </Label>
                      <Input
                        id="remainingMeters"
                        type="number"
                        value={formData.ribbonInventory.remainingMeters}
                        onChange={(e) =>
                          handleRibbonInventoryChange(
                            "remainingMeters",
                            e.target.value
                          )
                        }
                        placeholder="Ex: 25.5"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="customBow">
                      Disponível para Laço Customizado/Venda ao Metro?
                    </Label>
                    <Switch
                      id="customBow"
                      checked={formData.isAvailableForCustomBow}
                      onCheckedChange={(checked) =>
                        handleInputChange("isAvailableForCustomBow", checked)
                      }
                    />
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="animate-spin mr-2" size={16} />
              ) : (
                <Save size={16} className="mr-2" />
              )}
              {productToEdit ? "Atualizar" : "Criar Produto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
