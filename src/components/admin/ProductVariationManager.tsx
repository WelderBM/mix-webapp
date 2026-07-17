"use client";

import { useState } from "react";
import { ProductVariant } from "@/types/product";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Plus } from "lucide-react";

interface ProductVariationManagerProps {
  variants: ProductVariant[];
  onChange: (variants: ProductVariant[]) => void;
  disabled?: boolean;
}

const SUGGESTED_TYPES = ["Tamanho", "Cor"];

export const ProductVariationManager: React.FC<
  ProductVariationManagerProps
> = ({ variants, onChange, disabled }) => {
  // Linha que está digitando um tipo novo (fora do catálogo sugerido).
  const [customTypeRowId, setCustomTypeRowId] = useState<string | null>(null);

  const knownTypes = Array.from(
    new Set(
      [...SUGGESTED_TYPES, ...variants.map((v) => v.type)].filter(Boolean)
    )
  );

  const handleAdd = () => {
    const newVariant: ProductVariant = {
      id: crypto.randomUUID(),
      type: knownTypes[0] || "Tamanho",
      name: "",
      inStock: true,
    };
    onChange([...variants, newVariant]);
  };

  const handleRemove = (id: string) => {
    onChange(variants.filter((v) => v.id !== id));
    if (customTypeRowId === id) setCustomTypeRowId(null);
  };

  const handleFieldChange = (id: string, patch: Partial<ProductVariant>) => {
    onChange(variants.map((v) => (v.id === id ? { ...v, ...patch } : v)));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <Label>Variações (opcional)</Label>
        <span className="text-sm text-slate-500">
          Use quando o produto vem em mais de uma opção (ex: tamanhos,
          cores). Preço e estoque são opcionais — sem preço próprio, a
          variação usa o preço do produto. A imagem de cada variação é
          atribuída no próximo passo.
        </span>
      </div>

      {variants.length > 0 && (
        <div className="space-y-3">
          {variants.map((variant) => (
            <div
              key={variant.id}
              className="flex flex-col gap-2 p-3 rounded-lg border border-slate-200 bg-white sm:flex-row sm:items-center"
            >
              <div className="grid grid-cols-2 gap-2 flex-1">
                {customTypeRowId === variant.id ? (
                  <div className="flex gap-1">
                    <Input
                      placeholder="Novo tipo (ex: Aroma)"
                      value={variant.type}
                      onChange={(e) =>
                        handleFieldChange(variant.id, {
                          type: e.target.value,
                        })
                      }
                      className="h-9 text-sm"
                      autoFocus
                    />
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      className="shrink-0"
                      onClick={() => setCustomTypeRowId(null)}
                    >
                      <X size={14} />
                    </Button>
                  </div>
                ) : (
                  <Select
                    value={
                      knownTypes.includes(variant.type)
                        ? variant.type
                        : undefined
                    }
                    onValueChange={(v) => {
                      if (v === "custom_new_type") {
                        setCustomTypeRowId(variant.id);
                        handleFieldChange(variant.id, { type: "" });
                      } else {
                        handleFieldChange(variant.id, { type: v });
                      }
                    }}
                    disabled={disabled}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {knownTypes.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                      <SelectItem
                        value="custom_new_type"
                        className="text-purple-600 font-bold"
                      >
                        + Novo tipo
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}

                <Input
                  placeholder="Nome (ex: G, Azul)"
                  value={variant.name}
                  onChange={(e) =>
                    handleFieldChange(variant.id, { name: e.target.value })
                  }
                  className="h-9 text-sm"
                  disabled={disabled}
                />
              </div>

              <Input
                type="number"
                step="0.01"
                placeholder="Preço do produto"
                value={variant.price ?? ""}
                onChange={(e) =>
                  handleFieldChange(variant.id, {
                    price:
                      e.target.value === ""
                        ? undefined
                        : Number(e.target.value),
                  })
                }
                className="h-9 text-sm w-32 shrink-0"
                disabled={disabled}
              />

              <div className="flex items-center gap-3 justify-between sm:justify-start shrink-0">
                <div className="flex items-center gap-1.5">
                  <Switch
                    checked={variant.inStock}
                    onCheckedChange={(checked) =>
                      handleFieldChange(variant.id, { inStock: checked })
                    }
                    disabled={disabled}
                  />
                  <span className="text-xs text-slate-500 whitespace-nowrap">
                    Em estoque
                  </span>
                </div>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleRemove(variant.id)}
                  disabled={disabled}
                  title="Remover variação"
                >
                  <X size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={handleAdd}
        disabled={disabled}
      >
        <Plus size={14} /> Adicionar Variação
      </Button>
    </div>
  );
};
