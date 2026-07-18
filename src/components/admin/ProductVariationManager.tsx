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
import { X, Plus, ChevronUp, ChevronDown, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface ProductVariationManagerProps {
  variants: ProductVariant[];
  onChange: (variants: ProductVariant[]) => void;
  disabled?: boolean;
}

const SUGGESTED_TYPES = ["Tamanho", "Cor"];

// Teto duro checado ANTES de montar o produto cartesiano (multiplicação é
// barata, montar o array é o custo caro) — protege contra um fat-finger tipo
// 5 dimensões x 20 valores travando a aba. MAX_TOTAL_VARIANTS é o limite de
// negócio no total de variações do produto, checado depois de gerar/filtrar.
const HARD_CEILING = 500;
const MAX_TOTAL_VARIANTS = 100;

interface DimensionDraft {
  id: string;
  name: string;
  valuesRaw: string;
}

export const ProductVariationManager: React.FC<
  ProductVariationManagerProps
> = ({ variants, onChange, disabled }) => {
  // Linha que está digitando um tipo novo (fora do catálogo sugerido).
  const [customTypeRowId, setCustomTypeRowId] = useState<string | null>(null);

  // Rascunhos do gerador de combinações. Pré-populado a partir das
  // `attributes` já existentes nas variações (pra "adicionar um valor de Cor
  // e gerar de novo" ser o fluxo natural, não "começar do zero"). Seguro como
  // lazy initializer porque este componente é desmontado/remontado a cada
  // troca de passo do wizard (`{currentStepId === "variacoes" && <.../>}` em
  // ProductFormDialog), então reabrir o passo já resincroniza do zero.
  const [dimensionDrafts, setDimensionDrafts] = useState<DimensionDraft[]>(
    () => {
      const existingKeys = Array.from(
        new Set(variants.flatMap((v) => Object.keys(v.attributes || {})))
      );
      if (existingKeys.length === 0) {
        return [
          { id: crypto.randomUUID(), name: "", valuesRaw: "" },
          { id: crypto.randomUUID(), name: "", valuesRaw: "" },
        ];
      }
      return existingKeys.map((key) => ({
        id: crypto.randomUUID(),
        name: key,
        valuesRaw: Array.from(
          new Set(
            variants
              .map((v) => v.attributes?.[key])
              .filter((v): v is string => !!v)
          )
        ).join(", "),
      }));
    }
  );

  // Uma variação de UMA dimensão só (ex: só "Tamanho: G") é estruturalmente
  // igual a uma combinação de 1 dimensão — não existe mais um "tipo solto"
  // separado de `attributes`, os dois são a mesma coisa. Só variações com 2+
  // dimensões (geradas via combinação) ficam fora da sugestão de tipo aqui,
  // já que o nome combinado ("Tamanho / Cor") não é um tipo de verdade.
  const knownTypes = Array.from(
    new Set(
      [
        ...SUGGESTED_TYPES,
        ...variants
          .filter((v) => Object.keys(v.attributes || {}).length <= 1)
          .map((v) => v.type),
      ].filter(Boolean)
    )
  );

  const handleAdd = () => {
    const type = knownTypes[0] || "Tamanho";
    const newVariant: ProductVariant = {
      id: crypto.randomUUID(),
      type,
      name: "",
      inStock: true,
      attributes: { [type]: "" },
    };
    onChange([...variants, newVariant]);
  };

  const handleRemove = (id: string) => {
    onChange(variants.filter((v) => v.id !== id));
    if (customTypeRowId === id) setCustomTypeRowId(null);
  };

  // A primeira variação da lista é sempre a padrão (preço/imagem exibidos
  // antes de qualquer escolha do cliente) — sem campo separado pra isso,
  // reordenar é a única forma de trocar qual é a padrão.
  const handleMove = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= variants.length) return;
    const next = [...variants];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const handleFieldChange = (id: string, patch: Partial<ProductVariant>) => {
    onChange(
      variants.map((v) => {
        if (v.id !== id) return v;
        const merged = { ...v, ...patch };
        // Firestore rejects fields with value `undefined` — patches that
        // clear an optional field (ex: price) must drop the key entirely.
        (Object.keys(merged) as (keyof ProductVariant)[]).forEach((key) => {
          if (merged[key] === undefined) delete merged[key];
        });
        return merged;
      })
    );
  };

  // Editar tipo/nome de uma variação de 1 dimensão só precisa manter
  // `attributes` em sincronia — é a mesma informação, só que estruturada
  // (uma combinação de 1 dimensão é ela mesma). Trocar o tipo também renomeia
  // a chave de `attributes`, não só o rótulo de exibição.
  const handleSingleDimensionChange = (
    id: string,
    patch: { type?: string; name?: string }
  ) => {
    const variant = variants.find((v) => v.id === id);
    if (!variant) return;
    const nextType = patch.type ?? variant.type;
    const nextName = patch.name ?? variant.name;
    handleFieldChange(id, {
      type: nextType,
      name: nextName,
      attributes: { [nextType]: nextName },
    });
  };

  const handleDimensionDraftChange = (
    id: string,
    patch: Partial<DimensionDraft>
  ) => {
    setDimensionDrafts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...patch } : d))
    );
  };

  const handleAddDimensionDraft = () => {
    setDimensionDrafts((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: "", valuesRaw: "" },
    ]);
  };

  const handleRemoveDimensionDraft = (id: string) => {
    setDimensionDrafts((prev) => prev.filter((d) => d.id !== id));
  };

  const handleGenerateCombinations = () => {
    const dims = dimensionDrafts
      .map((d) => ({
        name: d.name.trim(),
        values: Array.from(
          new Set(
            d.valuesRaw
              .split(",")
              .map((v) => v.trim())
              .filter(Boolean)
          )
        ),
      }))
      .filter((d) => d.name && d.values.length > 0);

    if (dims.length === 0) {
      toast.error("Defina ao menos 1 dimensão com nome e valores.");
      return;
    }

    const dimNames = dims.map((d) => d.name);
    if (new Set(dimNames).size !== dimNames.length) {
      toast.error("Dimensões duplicadas — cada nome deve ser único.");
      return;
    }

    const expectedCombos = dims.reduce((acc, d) => acc * d.values.length, 1);
    if (expectedCombos > HARD_CEILING) {
      toast.error(
        "Combinação muito grande — reduza o número de valores ou dimensões."
      );
      return;
    }

    const existingAttributedKeys = new Set(
      variants
        .filter((v) => v.attributes)
        .flatMap((v) => Object.keys(v.attributes!))
    );
    if (
      existingAttributedKeys.size > 0 &&
      (dimNames.length !== existingAttributedKeys.size ||
        !dimNames.every((n) => existingAttributedKeys.has(n)))
    ) {
      toast.warning(
        "As dimensões mudaram desde a última geração — as variações antigas continuarão existindo, mas talvez não fiquem selecionáveis pro cliente até você atualizá-las ou removê-las."
      );
    }

    const combos: Record<string, string>[] = dims.reduce<
      Record<string, string>[]
    >(
      (acc, dim) =>
        acc.flatMap((base) =>
          dim.values.map((val) => ({ ...base, [dim.name]: val }))
        ),
      [{}]
    );

    const sortedKey = (attrs: Record<string, string>) =>
      JSON.stringify(
        Object.keys(attrs)
          .sort()
          .map((k) => [k, attrs[k]])
      );

    const existingCombos = new Set(
      variants.filter((v) => v.attributes).map((v) => sortedKey(v.attributes!))
    );

    const newRows: ProductVariant[] = combos
      .filter((combo) => !existingCombos.has(sortedKey(combo)))
      .map((combo) => ({
        id: crypto.randomUUID(),
        type: Object.keys(combo).join(" / "),
        name: Object.values(combo).join(" / "),
        inStock: true,
        attributes: combo,
      }));

    const totalAfter = variants.length + newRows.length;
    if (totalAfter > MAX_TOTAL_VARIANTS) {
      toast.error(
        `Isso resultaria em ${totalAfter} variações (máx ${MAX_TOTAL_VARIANTS}). Reduza os valores.`
      );
      return;
    }

    if (newRows.length === 0) {
      toast.info("Todas as combinações já existem — nada novo para gerar.");
      return;
    }

    // Append-only: nunca mexe nas linhas já existentes, então preço/estoque/
    // imagem já editados manualmente sobrevivem a uma nova geração.
    onChange([...variants, ...newRows]);
    toast.success(`${newRows.length} nova(s) variação(ões) gerada(s).`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <Label>Variações (opcional)</Label>
        <span className="text-sm text-slate-500">
          Use quando o produto vem em mais de uma opção (ex: tamanhos,
          cores). Preço e estoque são opcionais — sem preço próprio, a
          variação usa o preço do produto. A imagem de cada variação é
          atribuída no passo de revisão. A primeira da lista é a variação
          padrão (exibida antes do cliente escolher) — use as setas pra
          reordenar.
        </span>
      </div>

      <div className="rounded-lg border border-dashed border-purple-200 bg-purple-50/30 p-3 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wide text-purple-700">
            Gerar Combinações
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={handleAddDimensionDraft}
            disabled={disabled}
          >
            <Plus size={12} /> Nova Dimensão
          </Button>
        </div>
        <p className="text-xs text-slate-500">
          Defina dimensões independentes (ex: Tamanho, Cor) — o cliente
          escolhe um valor de cada, sem que uma escolha desmarque a outra.
          Combinações já existentes não são duplicadas nem sobrescritas.
        </p>
        <div className="space-y-2">
          {dimensionDrafts.map((draft) => (
            <div key={draft.id} className="flex gap-2 items-center">
              <Input
                placeholder="Dimensão (ex: Tamanho)"
                value={draft.name}
                onChange={(e) =>
                  handleDimensionDraftChange(draft.id, {
                    name: e.target.value,
                  })
                }
                className="h-9 text-sm w-36 shrink-0"
                disabled={disabled}
              />
              <Input
                placeholder="Valores separados por vírgula (ex: P, M, G, GG)"
                value={draft.valuesRaw}
                onChange={(e) =>
                  handleDimensionDraftChange(draft.id, {
                    valuesRaw: e.target.value,
                  })
                }
                className="h-9 text-sm flex-1"
                disabled={disabled}
              />
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                className="shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={() => handleRemoveDimensionDraft(draft.id)}
                disabled={disabled}
                title="Remover dimensão"
              >
                <X size={14} />
              </Button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          size="sm"
          className="gap-2 bg-purple-600 hover:bg-purple-700"
          onClick={handleGenerateCombinations}
          disabled={disabled}
        >
          <Sparkles size={14} /> Gerar Combinações
        </Button>
      </div>

      {variants.length > 0 && (
        <div className="space-y-3">
          {variants.map((variant, index) => (
            <div
              key={variant.id}
              className="flex flex-col gap-2 p-3 rounded-lg border border-slate-200 bg-white sm:flex-row sm:items-center"
            >
              <div className="flex sm:flex-col items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleMove(index, -1)}
                  disabled={disabled || index === 0}
                  title="Mover para cima"
                  className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <ChevronUp size={16} />
                </button>
                {index === 0 ? (
                  <span className="text-[9px] font-black uppercase text-purple-600 whitespace-nowrap">
                    Padrão
                  </span>
                ) : (
                  <span className="text-[9px] font-black uppercase text-slate-300">
                    {index + 1}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleMove(index, 1)}
                  disabled={disabled || index === variants.length - 1}
                  title="Mover para baixo"
                  className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <ChevronDown size={16} />
                </button>
              </div>

              <div className="flex-1">
                {Object.keys(variant.attributes || {}).length > 1 ? (
                  <div className="h-9 flex flex-wrap items-center gap-x-1 px-1 text-sm text-slate-700 font-medium">
                    {Object.entries(variant.attributes!).map(([k, v], i) => (
                      <span key={k} className="whitespace-nowrap">
                        {i > 0 && (
                          <span className="text-slate-300 mx-1">·</span>
                        )}
                        {k}: <b>{v}</b>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {customTypeRowId === variant.id ? (
                      <div className="flex gap-1">
                        <Input
                          placeholder="Novo tipo (ex: Aroma)"
                          value={variant.type}
                          onChange={(e) =>
                            handleSingleDimensionChange(variant.id, {
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
                            handleSingleDimensionChange(variant.id, {
                              type: "",
                            });
                          } else {
                            handleSingleDimensionChange(variant.id, {
                              type: v,
                            });
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
                        handleSingleDimensionChange(variant.id, {
                          name: e.target.value,
                        })
                      }
                      className="h-9 text-sm"
                      disabled={disabled}
                    />
                  </div>
                )}
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
