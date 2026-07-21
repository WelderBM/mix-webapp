"use client";

import { Dispatch, SetStateAction, useState } from "react";
import { BalloonConfig, BalloonTypeConfig } from "@/types/balloon";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ImageUploadModal } from "@/components/admin/ImageUploadModal";
import {
  Plus,
  Trash2,
  Copy,
  Layers,
  Wand2,
  Settings2,
  ChevronDown,
  Eye,
  X,
  PartyPopper,
  Image as ImageIcon,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { suggestHexColor, SAO_ROQUE_COLORS } from "@/lib/balloonColors";
import { toast } from "sonner";

interface BalloonsTabProps {
  balloonConfig: BalloonConfig;
  setBalloonConfig: Dispatch<SetStateAction<BalloonConfig>>;
}

export function BalloonsTab({
  balloonConfig,
  setBalloonConfig,
}: BalloonsTabProps) {
  const [balloonTab, setBalloonTab] = useState<"edition" | "visual">(
    "visual"
  );
  const [expandedTypes, setExpandedTypes] = useState<Record<string, boolean>>(
    {}
  );
  const [sizesSyncSource, setSizesSyncSource] =
    useState<BalloonTypeConfig | null>(null);
  const [colorsSyncSource, setColorsSyncSource] =
    useState<BalloonTypeConfig | null>(null);
  const [balloonTypeToDelete, setBalloonTypeToDelete] =
    useState<BalloonTypeConfig | null>(null);

  const handleDuplicateType = (index: number) => {
    const source = balloonConfig.types[index];
    const duplicated: BalloonTypeConfig = {
      ...JSON.parse(JSON.stringify(source)),
      id: crypto.randomUUID(),
      name: `${source.name} (Cópia)`,
    };
    setBalloonConfig((prev) => ({
      ...prev,
      types: [...prev.types, duplicated],
    }));
    toast.success("Tipo duplicado!");
  };

  const handleDeleteBalloonType = (typeId: string) => {
    setBalloonConfig((prev) => ({
      ...prev,
      types: prev.types.filter((t) => t.id !== typeId),
    }));
    setBalloonTypeToDelete(null);
  };

  const handleSyncSizesToAll = (sourceType: BalloonTypeConfig) => {
    const currentSource = balloonConfig.types.find(
      (t) => t.id === sourceType.id
    );
    setSizesSyncSource(null);
    if (!currentSource) {
      toast.error(
        "O tipo de origem foi removido antes da confirmação — nada foi sincronizado."
      );
      return;
    }
    const sourceSizes = currentSource.sizes;
    const newTypes = balloonConfig.types.map((t) => ({
      ...t,
      sizes: JSON.parse(JSON.stringify(sourceSizes)),
    }));
    setBalloonConfig({ ...balloonConfig, types: newTypes });
    toast.success("Tamanhos sincronizados!");
  };

  const handleSyncColorsToAll = (sourceType: BalloonTypeConfig) => {
    const currentSource = balloonConfig.types.find(
      (t) => t.id === sourceType.id
    );
    setColorsSyncSource(null);
    if (!currentSource) {
      toast.error(
        "O tipo de origem foi removido antes da confirmação — nada foi sincronizado."
      );
      return;
    }
    const sourceColors = currentSource.colors;
    const newTypes = balloonConfig.types.map((t) => ({
      ...t,
      colors: [...sourceColors],
    }));
    setBalloonConfig({ ...balloonConfig, types: newTypes });
    toast.success("Cores sincronizadas!");
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-800">Balões</h2>
            <p className="text-sm text-slate-500">
              Controle do catálogo e precificação
            </p>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto">
            <button
              onClick={() => setBalloonTab("visual")}
              className={cn(
                "flex-1 md:px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2",
                balloonTab === "visual"
                  ? "bg-white text-purple-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <Eye size={16} /> Visualização
            </button>
            <button
              onClick={() => setBalloonTab("edition")}
              className={cn(
                "flex-1 md:px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2",
                balloonTab === "edition"
                  ? "bg-white text-purple-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <Settings2 size={16} /> Edição
            </button>
          </div>
        </div>

        {balloonTab === "edition" ? (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Placeholder Global - Moved from SuperAdmin */}
            <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100 flex flex-col md:flex-row items-center gap-6 shadow-sm">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 text-purple-700">
                  <ImageIcon size={20} />
                  <h3 className="font-bold uppercase tracking-tight">Fundo Global da Vitrine</h3>
                </div>
                <p className="text-sm text-slate-500">
                  Esta imagem aparecerá em todos os balões que não possuem imagem própria.
                  Deixe em branco para usar o confete padrão.
                </p>
              </div>

              <div className="shrink-0 bg-white p-3 rounded-xl border border-purple-200">
                <ImageUploadModal
                  value={balloonConfig.placeholderUrl || ""}
                  onChange={(url) => {
                    setBalloonConfig({
                      ...balloonConfig,
                      placeholderUrl: url
                    });
                  }}
                  folder="balloons/placeholders"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button
                onClick={() => {
                  const newType: BalloonTypeConfig = {
                    id: crypto.randomUUID(),
                    name: "Novo Tipo",
                    sizes: [],
                    colors: [],
                  };
                  setBalloonConfig((prev) => ({
                    ...prev,
                    types: [...prev.types, newType],
                  }));
                }}
                className="bg-purple-600 hover:bg-purple-700 shadow-md active:scale-95 transition-all"
              >
                <Plus size={16} className="mr-2" /> Novo Tipo de Balão
              </Button>
            </div>

            <Accordion type="single" collapsible className="space-y-4">
              {balloonConfig.types.map((type, typeIndex) => (
                <AccordionItem
                  value={type.id}
                  key={type.id}
                  className="border rounded-xl bg-white border-slate-200 overflow-hidden shadow-sm"
                >
                  <AccordionTrigger className="px-5 hover:no-underline hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4 w-full text-left">
                      {/* Small Preview in Header */}
                      <div className="w-10 h-10 rounded-lg border-2 border-slate-100 bg-slate-50 overflow-hidden flex items-center justify-center shrink-0">
                        {type.imageUrl ? (
                          <img
                            src={type.imageUrl}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <PartyPopper size={16} className="text-slate-300" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-800 truncate uppercase tracking-tight">
                          {type.name || "Tipo sem nome"}
                        </h3>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-1.5 py-0.5 rounded">
                            {type.sizes.length} tamanhos
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-1.5 py-0.5 rounded">
                            {type.colors.length} cores
                          </span>
                          {type.active === false && (
                            <Badge variant="outline" className="text-[9px] h-4 bg-red-50 text-red-600 border-red-200 uppercase font-black">
                              Inativo
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="px-5 pb-6 pt-2 space-y-8 animate-in slide-in-from-top-2 duration-300">
                    {/* Basic Info & Actions Area */}
                    <div className="flex flex-col md:flex-row gap-6 items-start justify-between bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                      <div className="flex-[2] w-full space-y-4">
                        <div>
                          <Label className="font-black text-[10px] text-slate-500 uppercase tracking-widest mb-1.5 block">
                            Configurador do Tipo
                          </Label>
                          <div className="flex gap-3">
                            <Input
                              value={type.name}
                              placeholder="Ex: Látex Prime"
                              onChange={(e) => {
                                const newTypes = [...balloonConfig.types];
                                newTypes[typeIndex].name = e.target.value;
                                setBalloonConfig({
                                  ...balloonConfig,
                                  types: newTypes,
                                });
                              }}
                              className="bg-white border-slate-200 h-10 font-bold text-slate-800"
                            />

                            <div className="flex items-center gap-2 bg-white px-3 border border-slate-200 rounded-md shrink-0 h-10 shadow-sm">
                              <input
                                type="checkbox"
                                id={`active-${type.id}`}
                                className="w-4 h-4 accent-purple-600 cursor-pointer"
                                checked={type.active !== false}
                                onChange={(e) => {
                                  const newTypes = [...balloonConfig.types];
                                  newTypes[typeIndex].active = e.target.checked;
                                  setBalloonConfig({
                                    ...balloonConfig,
                                    types: newTypes,
                                  });
                                }}
                              />
                              <Label
                                htmlFor={`active-${type.id}`}
                                className="text-xs font-black uppercase text-slate-600 cursor-pointer select-none"
                              >
                                Ativo
                              </Label>
                            </div>
                          </div>
                        </div>

                        <div className="pt-2">
                          <Label className="font-black text-[10px] text-slate-500 uppercase tracking-widest mb-1.5 block text-left">
                            Imagem Ilustrativa
                          </Label>
                          <ImageUploadModal
                            value={type.imageUrl || ""}
                            onChange={(url) => {
                              const newTypes = [...balloonConfig.types];
                              newTypes[typeIndex].imageUrl = url;
                              setBalloonConfig({
                                ...balloonConfig,
                                types: newTypes,
                              });
                            }}
                            folder="balloons/types"
                            className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm max-w-sm"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 shrink-0 self-start pt-6">
                        <Button
                          variant="outline"
                          size="sm"
                          title="Duplicar este tipo"
                          onClick={() => handleDuplicateType(typeIndex)}
                          className="h-9 px-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-100"
                        >
                          <Copy size={16} className="mr-2" />
                          Duplicar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setBalloonTypeToDelete(type)}
                          className="h-9 px-3 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100"
                        >
                          <Trash2 size={16} className="mr-2" />
                          Remover
                        </Button>
                      </div>
                    </div>

                    {/* Rest of the content (Sizes, Colors) - keep existing logic but inside AccordionContent */}

                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        <Label className="font-bold text-slate-700 whitespace-nowrap">
                          Tamanhos e Preços
                        </Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Aplicar estes tamanhos a todos os outros modelos"
                          className="h-7 px-2 text-[10px] text-purple-600 hover:text-purple-700 hover:bg-purple-50 font-bold shrink-0"
                          onClick={() => setSizesSyncSource(type)}
                        >
                          <Layers size={12} className="mr-1" /> Replicar
                          p/ Todos
                        </Button>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto border-purple-200 text-purple-600 font-bold shrink-0"
                        onClick={() => {
                          const newTypes = [...balloonConfig.types];
                          newTypes[typeIndex].sizes.push({
                            size: "",
                            price: 0,
                            unitsPerPackage: 0,
                          });
                          setBalloonConfig({
                            ...balloonConfig,
                            types: newTypes,
                          });
                        }}
                      >
                        <Plus size={14} className="mr-1" /> Add Tamanho
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {type.sizes.map((size, sizeIndex) => (
                        <div
                          key={sizeIndex}
                          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3 relative group"
                        >
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-[10px] uppercase font-black text-slate-400">
                                Tamanho
                              </Label>
                              <Input
                                value={size.size}
                                placeholder="ex: 5"
                                onChange={(e) => {
                                  const newTypes = [
                                    ...balloonConfig.types,
                                  ];
                                  newTypes[typeIndex].sizes[
                                    sizeIndex
                                  ].size = e.target.value;
                                  setBalloonConfig({
                                    ...balloonConfig,
                                    types: newTypes,
                                  });
                                }}
                                className="h-9 text-sm font-bold"
                              />
                            </div>
                            <div>
                              <Label className="text-[10px] uppercase font-black text-slate-400">
                                Preço (pacote)
                              </Label>
                              <Input
                                type="number"
                                value={size.price}
                                onChange={(e) => {
                                  const newTypes = [
                                    ...balloonConfig.types,
                                  ];
                                  newTypes[typeIndex].sizes[
                                    sizeIndex
                                  ].price =
                                    parseFloat(e.target.value) || 0;
                                  setBalloonConfig({
                                    ...balloonConfig,
                                    types: newTypes,
                                  });
                                }}
                                className="h-9 text-sm font-bold"
                              />
                            </div>
                          </div>
                          <div>
                            <Label className="text-[10px] uppercase font-black text-slate-400">
                              Unid/Pacote
                            </Label>
                            <Input
                              type="number"
                              value={size.unitsPerPackage}
                              onChange={(e) => {
                                const newTypes = [
                                  ...balloonConfig.types,
                                ];
                                newTypes[typeIndex].sizes[
                                  sizeIndex
                                ].unitsPerPackage =
                                  parseInt(e.target.value) || 0;
                                setBalloonConfig({
                                  ...balloonConfig,
                                  types: newTypes,
                                });
                              }}
                              className="h-9 text-sm font-bold"
                            />
                          </div>
                          <button
                            onClick={() => {
                              const newTypes = [...balloonConfig.types];
                              newTypes[typeIndex].sizes.splice(
                                sizeIndex,
                                1
                              );
                              setBalloonConfig({
                                ...balloonConfig,
                                types: newTypes,
                              });
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="font-bold text-slate-700">
                        Cores Disponíveis
                      </Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Aplicar esta lista de cores a todos os outros modelos"
                        className="h-7 px-2 text-[10px] text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-bold"
                        onClick={() => setColorsSyncSource(type)}
                      >
                        <Wand2 size={12} className="mr-1" /> Replicar p/
                        Todos
                      </Button>
                    </div>

                    <p className="text-xs text-slate-500 mb-2">
                      Digite o nome da cor e Add. O sistema sugere o Hex
                      aproximado da São Roque.
                    </p>

                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          id={`new-color-input-${typeIndex}`}
                          list={`color-suggestions-${typeIndex}`}
                          placeholder="Nome da cor (ex: Azul Baby)"
                          className="bg-white border-slate-200"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const val = e.currentTarget.value.trim();
                              if (val) {
                                const suggestedHex =
                                  suggestHexColor(val) || "#CCCCCC";
                                const combo = `${val}|${suggestedHex}`;
                                const newTypes = [
                                  ...balloonConfig.types,
                                ];
                                // Avoid duplicates
                                if (
                                  !newTypes[typeIndex].colors.some(
                                    (c) =>
                                      c.split("|")[0].toLowerCase() ===
                                      val.toLowerCase()
                                  )
                                ) {
                                  newTypes[typeIndex].colors.push(
                                    combo
                                  );
                                  setBalloonConfig({
                                    ...balloonConfig,
                                    types: newTypes,
                                  });
                                  e.currentTarget.value = "";
                                }
                              }
                            }
                          }}
                        />
                        <datalist id={`color-suggestions-${typeIndex}`}>
                          {Object.keys(SAO_ROQUE_COLORS).map(
                            (colorName) => (
                              <option
                                key={colorName}
                                value={colorName}
                              />
                            )
                          )}
                        </datalist>
                        <Button
                          size="sm"
                          className="absolute right-1 top-1 h-7 bg-purple-600 hover:bg-purple-700 text-xs"
                          onClick={() => {
                            const input = document.getElementById(
                              `new-color-input-${typeIndex}`
                            ) as HTMLInputElement;
                            if (input && input.value.trim()) {
                              const val = input.value.trim();
                              const suggestedHex =
                                suggestHexColor(val) || "#CCCCCC";
                              const combo = `${val}|${suggestedHex}`;
                              const newTypes = [...balloonConfig.types];
                              if (
                                !newTypes[typeIndex].colors.some(
                                  (c) =>
                                    c.split("|")[0].toLowerCase() ===
                                    val.toLowerCase()
                                )
                              ) {
                                newTypes[typeIndex].colors.push(combo);
                                setBalloonConfig({
                                  ...balloonConfig,
                                  types: newTypes,
                                });
                                input.value = "";
                              }
                            }
                          }}
                        >
                          <Plus size={14} />
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3">
                      {type.colors.map((c, idx) => {
                        // Retro-compatibility handling
                        const [name, hex] = c.includes("|")
                          ? c.split("|")
                          : [c, suggestHexColor(c) || "#eee"];

                        return (
                          <div
                            key={idx}
                            className="flex items-center gap-2 bg-white border border-slate-200 rounded-full pl-1 pr-2 py-1 shadow-sm"
                          >
                            <div
                              className="w-4 h-4 rounded-full border border-slate-300 shadow-inner"
                              style={{ backgroundColor: hex }}
                              title={hex}
                            />
                            <span className="text-xs font-bold text-slate-700">
                              {name}
                            </span>
                            <button
                              onClick={() => {
                                const newTypes = [
                                  ...balloonConfig.types,
                                ];
                                newTypes[typeIndex].colors = newTypes[
                                  typeIndex
                                ].colors.filter((_, i) => i !== idx);
                                setBalloonConfig({
                                  ...balloonConfig,
                                  types: newTypes,
                                });
                              }}
                              className="text-slate-400 hover:text-red-500 ml-1"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {balloonConfig.types.map((type) => {
                const isExpanded = expandedTypes[type.id];
                return (
                  <div
                    key={type.id}
                    className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden transition-all hover:border-purple-200"
                  >
                    <div
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() =>
                        setExpandedTypes((prev) => ({
                          ...prev,
                          [type.id]: !isExpanded,
                        }))
                      }
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-black overflow-hidden border border-purple-200 shrink-0">
                          {type.imageUrl ? (
                            <img
                              src={type.imageUrl}
                              alt={type.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            type.name.charAt(0)
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-slate-800 truncate">
                            {type.name}
                          </h3>
                          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">
                            {type.sizes.length} Tamanhos ·{" "}
                            {type.colors.length} Cores
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setBalloonTypeToDelete(type);
                          }}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <Trash2 size={16} />
                        </Button>
                        <div
                          className={cn(
                            "text-slate-400 transition-transform",
                            isExpanded ? "rotate-180" : ""
                          )}
                        >
                          <ChevronDown size={20} />
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-4 bg-white border-t border-slate-200 space-y-4 animate-in slide-in-from-top-2 duration-200">
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
                            Tamanhos Disponíveis
                          </Label>
                          <div className="flex flex-wrap gap-2">
                            {type.sizes.map((s, idx) => (
                              <div
                                key={idx}
                                className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg flex items-center gap-3"
                              >
                                <span className="font-black text-slate-700">
                                  {s.size}"
                                </span>
                                <span className="text-purple-600 font-bold text-xs">
                                  {formatCurrency(s.price)}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {s.unitsPerPackage} un
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
                            Cores
                          </Label>
                          <div className="flex flex-wrap gap-1.5">
                            {type.colors.map((c, idx) => (
                              <span
                                key={idx}
                                className="bg-purple-50 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-purple-100"
                              >
                                {c}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {balloonConfig.types.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed rounded-xl text-slate-400">
            Nenhum tipo de balão configurado.
          </div>
        )}
      </div>

      <ConfirmDialog
        open={sizesSyncSource !== null}
        onOpenChange={(open) => !open && setSizesSyncSource(null)}
        title="Substituir tamanhos de todos os modelos?"
        description="Isso irá substituir os tamanhos de TODOS os outros tipos. Continuar?"
        confirmLabel="Substituir"
        onConfirm={() =>
          sizesSyncSource !== null && handleSyncSizesToAll(sizesSyncSource)
        }
      />

      <ConfirmDialog
        open={colorsSyncSource !== null}
        onOpenChange={(open) => !open && setColorsSyncSource(null)}
        title="Substituir cores de todos os modelos?"
        description="Isso irá substituir as cores de TODOS os outros tipos. Continuar?"
        confirmLabel="Substituir"
        onConfirm={() =>
          colorsSyncSource !== null && handleSyncColorsToAll(colorsSyncSource)
        }
      />

      <ConfirmDialog
        open={!!balloonTypeToDelete}
        onOpenChange={(open) => !open && setBalloonTypeToDelete(null)}
        title={`Excluir o modelo "${balloonTypeToDelete?.name}"?`}
        confirmLabel="Excluir"
        onConfirm={() =>
          balloonTypeToDelete &&
          handleDeleteBalloonType(balloonTypeToDelete.id)
        }
      />
    </div>
  );
}
