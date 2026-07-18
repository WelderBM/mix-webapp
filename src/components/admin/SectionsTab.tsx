"use client";

import { Dispatch, SetStateAction, useMemo, useState } from "react";
import { Product, StoreSettings, StoreSection, SectionType } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ImageUploadModal } from "@/components/admin/ImageUploadModal";
import { SafeImage } from "@/components/ui/SafeImage";
import { PRODUCT_TYPE_META } from "@/components/ui/status-badge";
import {
  Plus,
  ArrowUp,
  ArrowDown,
  Eye,
  Pencil,
  Trash2,
  Search,
  Package,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionsTabProps {
  settings: StoreSettings;
  setSettings: Dispatch<SetStateAction<StoreSettings>>;
  allProducts: Product[];
  uniqueCategories: string[];
}

export function SectionsTab({
  settings,
  setSettings,
  allProducts,
  uniqueCategories,
}: SectionsTabProps) {
  const [editingSection, setEditingSection] = useState<StoreSection | null>(
    null
  );
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [sectionSearchTerm, setSectionSearchTerm] = useState("");
  const [secTypeFilter, setSecTypeFilter] = useState("ALL");
  const [secCatFilter, setSecCatFilter] = useState("ALL");
  const [selectedTemplate, setSelectedTemplate] =
    useState<SectionType>("product_shelf");

  const filteredSecProducts = useMemo(() => {
    return allProducts.filter((product) => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(sectionSearchTerm.toLowerCase());
      const matchesType =
        secTypeFilter === "ALL" || product.type === secTypeFilter;
      const matchesCategory =
        secCatFilter === "ALL" || product.category === secCatFilter;
      return matchesSearch && matchesType && matchesCategory;
    });
  }, [allProducts, sectionSearchTerm, secTypeFilter, secCatFilter]);

  const handleSaveSection = () => {
    if (!editingSection) return;
    setSettings((prev: StoreSettings) => {
      const currentSections = prev.homeSections || [];
      const exists = currentSections.find((s) => s.id === editingSection.id);
      const newSections = exists
        ? currentSections.map((s) =>
            s.id === editingSection.id ? editingSection : s
          )
        : [...currentSections, editingSection];
      return { ...prev, homeSections: newSections };
    });
    setIsSectionModalOpen(false);
  };

  const deleteSection = (id: string) => {
    setSettings((prev: StoreSettings) => ({
      ...prev,
      homeSections: (prev.homeSections || []).filter((s) => s.id !== id),
    }));
  };

  const moveSection = (index: number, direction: "up" | "down") => {
    const newSections = [...(settings.homeSections || [])];
    if (direction === "up" && index > 0)
      [newSections[index], newSections[index - 1]] = [
        newSections[index - 1],
        newSections[index],
      ];
    if (direction === "down" && index < newSections.length - 1)
      [newSections[index], newSections[index + 1]] = [
        newSections[index + 1],
        newSections[index],
      ];
    setSettings((prev: StoreSettings) => ({
      ...prev,
      homeSections: newSections,
    }));
  };

  const addProductToSection = (productId: string) => {
    if (editingSection && !editingSection.productIds.includes(productId))
      setEditingSection({
        ...editingSection,
        productIds: [...editingSection.productIds, productId],
      });
  };
  const removeProductFromSection = (productId: string) => {
    if (editingSection)
      setEditingSection({
        ...editingSection,
        productIds: editingSection.productIds.filter((id) => id !== productId),
      });
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Organização da Home
            </h2>
            <p className="text-sm text-slate-500">
              Adicione vitrines ou banners.
            </p>
          </div>
          <Button
            onClick={() => {
              setEditingSection({
                id: crypto.randomUUID(),
                title: "Nova Seção",
                type: "product_shelf",
                width: "full",
                productIds: [],
                isActive: true,
              });
              setSelectedTemplate("product_shelf");
              setIsSectionModalOpen(true);
            }}
          >
            <Plus size={16} className="mr-2" /> Nova Seção
          </Button>
        </div>
        <div className="space-y-3">
          {settings.homeSections?.map((section, index) => (
            <div
              key={section.id}
              className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-slate-50 border rounded-lg group"
            >
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="flex gap-1 text-slate-400">
                  <button
                    onClick={() => moveSection(index, "up")}
                    disabled={index === 0}
                    className="hover:text-blue-600 disabled:opacity-30 p-1"
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    onClick={() => moveSection(index, "down")}
                    disabled={
                      index === (settings.homeSections?.length || 0) - 1
                    }
                    className="hover:text-blue-600 disabled:opacity-30 p-1"
                  >
                    <ArrowDown size={16} />
                  </button>
                </div>
              </div>

              <div className="flex-1 w-full sm:w-auto">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-slate-800 break-words line-clamp-1">
                    {section.title}
                  </h3>
                  {!section.isActive && (
                    <Badge
                      variant="outline"
                      className="text-xs shrink-0"
                    >
                      Inativo
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500">{section.type}</p>
              </div>

              <div className="flex items-center justify-end w-full sm:w-auto gap-2 border-t sm:border-t-0 pt-2 sm:pt-0 mt-2 sm:mt-0">
                <Button
                  variant="ghost"
                  size="icon"
                  title="Alternar Visibilidade"
                  onClick={() => {
                    const updated = {
                      ...section,
                      isActive: !section.isActive,
                    };
                    const newSections = settings.homeSections!.map(
                      (s) => (s.id === section.id ? updated : s)
                    );
                    setSettings({
                      ...settings,
                      homeSections: newSections,
                    });
                  }}
                  className={cn(
                    "hover:bg-slate-100",
                    !section.isActive && "text-slate-400"
                  )}
                >
                  {section.isActive ? (
                    <Eye size={16} />
                  ) : (
                    <Eye className="text-slate-300" size={16} />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setEditingSection(section);
                    setSelectedTemplate(section.type);
                    setIsSectionModalOpen(true);
                  }}
                  className="text-blue-500 hover:bg-blue-50"
                >
                  <Pencil size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteSection(section.id)}
                  className="text-red-400 hover:bg-red-50"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL CONFIGURAR SEÇÃO */}
      <Dialog open={isSectionModalOpen} onOpenChange={setIsSectionModalOpen}>
        <DialogContent className="sm:h-[85vh] flex flex-col bg-slate-50">
          <DialogHeader>
            <DialogTitle>Configurar Seção</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto p-1 space-y-6">
            <div className="bg-white p-4 rounded-xl border shadow-sm space-y-4">
              <Label>Título da Seção</Label>
              <Input
                value={editingSection?.title}
                onChange={(e) =>
                  setEditingSection((prev) =>
                    prev ? { ...prev, title: e.target.value } : null
                  )
                }
              />

              <div className="grid grid-cols-2 gap-4">
                <div
                  className="bg-slate-50 p-3 rounded-lg border border-slate-100 cursor-pointer hover:border-purple-200 transition-colors"
                  onClick={() => {
                    setSelectedTemplate("product_shelf");
                    setEditingSection((prev) =>
                      prev ? { ...prev, type: "product_shelf" } : null
                    );
                  }}
                >
                  <div
                    className={cn(
                      "text-sm font-bold mb-1",
                      selectedTemplate === "product_shelf"
                        ? "text-purple-600"
                        : "text-slate-700"
                    )}
                  >
                    Vitrine de Produtos
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Lista de produtos selecionados manualmente.
                  </p>
                </div>
                <div
                  className="bg-slate-50 p-3 rounded-lg border border-slate-100 cursor-pointer hover:border-purple-200 transition-colors"
                  onClick={() => {
                    setSelectedTemplate("custom_banner");
                    setEditingSection((prev) =>
                      prev ? { ...prev, type: "custom_banner" } : null
                    );
                  }}
                >
                  <div
                    className={cn(
                      "text-sm font-bold mb-1",
                      selectedTemplate === "custom_banner"
                        ? "text-purple-600"
                        : "text-slate-700"
                    )}
                  >
                    Banner Customizado
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Imagem com link para qualquer lugar.
                  </p>
                </div>
                <div
                  className="bg-slate-50 p-3 rounded-lg border border-slate-100 cursor-pointer hover:border-purple-200 transition-colors"
                  onClick={() => {
                    setSelectedTemplate("banner_kit");
                    setEditingSection((prev) =>
                      prev ? { ...prev, type: "banner_kit" } : null
                    );
                  }}
                >
                  <div
                    className={cn(
                      "text-sm font-bold mb-1",
                      selectedTemplate === "banner_kit"
                        ? "text-purple-600"
                        : "text-slate-700"
                    )}
                  >
                    Banner Monte seu Kit
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Atalho para montar kit personalizado.
                  </p>
                </div>
                <div
                  className="bg-slate-50 p-3 rounded-lg border border-slate-100 cursor-pointer hover:border-purple-200 transition-colors"
                  onClick={() => {
                    setSelectedTemplate("banner_ribbon");
                    setEditingSection((prev) =>
                      prev ? { ...prev, type: "banner_ribbon" } : null
                    );
                  }}
                >
                  <div
                    className={cn(
                      "text-sm font-bold mb-1",
                      selectedTemplate === "banner_ribbon"
                        ? "text-purple-600"
                        : "text-slate-700"
                    )}
                  >
                    Banner Fitas
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Atalho para fitas personalizadas.
                  </p>
                </div>
                <div
                  className="bg-slate-50 p-3 rounded-lg border border-slate-100 cursor-pointer hover:border-purple-200 transition-colors"
                  onClick={() => {
                    setSelectedTemplate("banner_balloon");
                    setEditingSection((prev) =>
                      prev ? { ...prev, type: "banner_balloon" } : null
                    );
                  }}
                >
                  <div
                    className={cn(
                      "text-sm font-bold mb-1",
                      selectedTemplate === "banner_balloon"
                        ? "text-purple-600"
                        : "text-slate-700"
                    )}
                  >
                    Banner Balões
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Atalho para montar balões.
                  </p>
                </div>
                <div
                  className="bg-slate-50 p-3 rounded-lg border border-slate-100 cursor-pointer hover:border-purple-200 transition-colors"
                  onClick={() => {
                    setSelectedTemplate("banner_natura");
                    setEditingSection((prev) =>
                      prev ? { ...prev, type: "banner_natura" } : null
                    );
                  }}
                >
                  <div
                    className={cn(
                      "text-sm font-bold mb-1",
                      selectedTemplate === "banner_natura"
                        ? "text-purple-600"
                        : "text-slate-700"
                    )}
                  >
                    Banner Natura
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Banner promocional Natura.
                  </p>
                </div>
              </div>

              {/* CONFIGURAÇÃO DE BANNER CUSTOMIZADO */}
              {selectedTemplate === "custom_banner" && (
                <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="space-y-2">
                    <Label>Imagem do Banner</Label>
                    <ImageUploadModal
                      value={editingSection?.bannerUrl || ""}
                      folder="banners"
                      onChange={(url) =>
                        setEditingSection((prev) =>
                          prev ? { ...prev, bannerUrl: url } : null
                        )
                      }
                    />
                    <p className="text-[10px] text-slate-500">
                      Recomendado: 1200x400px
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Link de Destino (Opcional)</Label>
                    <Input
                      value={editingSection?.bannerLink || ""}
                      onChange={(e) =>
                        setEditingSection((prev) =>
                          prev
                            ? { ...prev, bannerLink: e.target.value }
                            : null
                        )
                      }
                      placeholder="https:// ou use um atalho abaixo"
                    />
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() =>
                          setEditingSection((prev) =>
                            prev
                              ? { ...prev, bannerLink: "/montar-kit" }
                              : null
                          )
                        }
                      >
                        Montar Kit (/montar-kit)
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() =>
                          setEditingSection((prev) =>
                            prev ? { ...prev, bannerLink: "/fitas" } : null
                          )
                        }
                      >
                        Fitas (/fitas)
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() =>
                          setEditingSection((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  bannerLink: "https://wa.me/5595991136427",
                                }
                              : null
                          )
                        }
                      >
                        WhatsApp
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Seletor simplificado de produtos para exemplo */}
              {selectedTemplate === "product_shelf" && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label className="font-bold text-slate-700">
                      Adicionar Produtos à Vitrine
                    </Label>
                    <div className="flex flex-col md:flex-row gap-2">
                      <div className="relative flex-1">
                        <Search
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                          size={16}
                        />
                        <Input
                          placeholder="Buscar produto..."
                          value={sectionSearchTerm}
                          onChange={(e) =>
                            setSectionSearchTerm(e.target.value)
                          }
                          className="pl-9 h-10 border-slate-200"
                        />
                      </div>
                      <Select
                        value={secCatFilter}
                        onValueChange={setSecCatFilter}
                      >
                        <SelectTrigger className="w-full md:w-[150px] h-10 border-slate-200">
                          <SelectValue placeholder="Categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">
                            Todas Categorias
                          </SelectItem>
                          {uniqueCategories.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={secTypeFilter}
                        onValueChange={setSecTypeFilter}
                      >
                        <SelectTrigger className="w-full md:w-[150px] h-10 border-slate-200">
                          <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">Todos Tipos</SelectItem>
                          {/* Só tipos "vitrináveis" como produto
                              independente — WRAPPER/FILLER/ACCESSORY/RIBBON
                              são componentes de kit, não aparecem como
                              seção própria da home. */}
                          {(
                            ["BASE_CONTAINER", "STANDARD_ITEM", "ASSEMBLED_KIT"] as const
                          ).map((value) => (
                            <SelectItem key={value} value={value}>
                              {PRODUCT_TYPE_META[value].filterLabel}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                    <ScrollArea className="h-[350px]">
                      <div className="p-2 space-y-1">
                        {filteredSecProducts.map((p) => {
                          const isSelected =
                            editingSection?.productIds.includes(p.id);
                          return (
                            <div
                              key={p.id}
                              className={cn(
                                "flex justify-between items-center p-2 rounded-lg transition-colors group",
                                isSelected
                                  ? "bg-purple-50 text-purple-700"
                                  : "hover:bg-white"
                              )}
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="w-10 h-10 rounded border bg-white overflow-hidden relative shrink-0">
                                  {p.imageUrl ? (
                                    <SafeImage
                                      src={p.imageUrl}
                                      alt={p.name}
                                      name={p.name}
                                      fill
                                      sizes="40px"
                                      className="object-cover"
                                    />
                                  ) : (
                                    <Package
                                      size={16}
                                      className="m-auto text-slate-300"
                                    />
                                  )}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="text-sm font-bold truncate">
                                    {p.name}
                                  </span>
                                  <span className="text-[10px] uppercase font-black opacity-50">
                                    {p.category || "Sem Categoria"}
                                  </span>
                                </div>
                              </div>

                              <Button
                                size="sm"
                                variant={
                                  isSelected ? "destructive" : "outline"
                                }
                                onClick={() =>
                                  isSelected
                                    ? removeProductFromSection(p.id)
                                    : addProductToSection(p.id)
                                }
                                className={cn(
                                  "h-8 px-3 rounded-full text-xs font-bold transition-all shrink-0 ml-2",
                                  isSelected
                                    ? "bg-red-500 hover:bg-red-600 border-none shadow-sm shadow-red-200"
                                    : "hover:border-purple-600 hover:text-purple-600"
                                )}
                              >
                                {isSelected ? (
                                  <>
                                    <X size={14} className="mr-1" /> Remover
                                  </>
                                ) : (
                                  <>
                                    <Plus size={14} className="mr-1" />{" "}
                                    Adicionar
                                  </>
                                )}
                              </Button>
                            </div>
                          );
                        })}
                        {filteredSecProducts.length === 0 && (
                          <div className="py-10 text-center text-slate-400 text-sm">
                            Nenhum produto encontrado com esses filtros.
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>

                  <div className="flex items-center justify-between px-2">
                    <div className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
                      Produtos na vitrine:{" "}
                      <span className="text-purple-600">
                        {editingSection?.productIds?.length || 0}
                      </span>
                    </div>
                    {(editingSection?.productIds?.length || 0) > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[10px] text-red-500 font-black uppercase hover:bg-red-50"
                        onClick={() =>
                          setEditingSection((prev) =>
                            prev ? { ...prev, productIds: [] } : null
                          )
                        }
                      >
                        Limpar Tudo
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="p-4 border-t bg-white">
            <Button onClick={handleSaveSection} className="bg-green-600">
              Salvar Seção
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
