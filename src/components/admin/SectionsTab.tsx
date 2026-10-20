"use client";

import { Dispatch, SetStateAction, useMemo, useState } from "react";
import {
  Product,
  StoreSettings,
  StoreSection,
  SectionType,
  SectionSource,
  Category,
  Tag,
} from "@/types";
import { normalizeSectionSource, LOW_STOCK_RIBBON_RATIO } from "@/lib/sections";
import { SYSTEM_TAG_NOVIDADES, SYSTEM_TAG_PROMOCAO } from "@/lib/productTags";
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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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
import {
  PRODUCT_TYPE_META,
  getVisibleProductTypes,
} from "@/components/ui/status-badge";
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
  // Categoria/tag por ID (issue #71) — mesma fonte que ProductsTab/
  // ProductFormDialog já usam pra cadastro, reaproveitada aqui pro
  // seletor de vitrine "por categoria"/"por tag".
  categories: Category[];
  tags: Tag[];
}

// Tags de sistema com rótulo amigável pro seletor — nunca cadastradas em
// `tags/{id}` (ver TagManager.tsx), então precisam de nome fixo aqui em vez
// de vir de `Tag.name`.
const SYSTEM_TAG_LABELS: Record<string, string> = {
  [SYSTEM_TAG_NOVIDADES]: "Novidades (automática)",
  [SYSTEM_TAG_PROMOCAO]: "Promoção (automática)",
};

const emptySource: SectionSource = { mode: "manual", productIds: [] };

// Abre uma seção pra edição (nova ou existente) sempre com `source`
// presente — normaliza dado legado (só `productIds`, sem `source`) na
// hora de entrar no formulário, nunca ao salvar/ler em outro lugar.
const withNormalizedSource = (section: StoreSection): StoreSection => ({
  ...section,
  source: normalizeSectionSource(section),
});

export function SectionsTab({
  settings,
  setSettings,
  allProducts,
  uniqueCategories,
  categories,
  tags,
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
  // Confirmação de exclusão (issue #57) — excluir sem confirmar é a mesma
  // classe de bug destrutivo encontrada na #166; nunca chamar `deleteSection`
  // direto do onClick da lixeira.
  const [sectionToDelete, setSectionToDelete] = useState<StoreSection | null>(
    null
  );

  // `StoreSettings.features.customKitEnabled` (issue #108) — enquanto
  // desligada (padrão), some com BASE_CONTAINER/ASSEMBLED_KIT do filtro de
  // tipo "vitrinável" abaixo, sobrando só STANDARD_ITEM (issue #165).
  // WRAPPER/FILLER/ACCESSORY/RIBBON continuam de fora independente da flag
  // — são componentes de kit, nunca aparecem como seção própria da home
  // (ver comentário original no <SelectContent> mais abaixo).
  const customKitEnabled = settings.features?.customKitEnabled ?? false;
  const secTypeOptions = useMemo(() => {
    const visible = getVisibleProductTypes(customKitEnabled);
    return [
      ...visible.filter(
        (t) => t === "BASE_CONTAINER" || t === "STANDARD_ITEM"
      ),
      // ASSEMBLED_KIT nunca vem de getVisibleProductTypes (excluído sempre,
      // tratado à parte por cada consumidor) — aqui, especificamente, ele
      // segue a MESMA flag que os tipos-componente de kit.
      ...(customKitEnabled ? (["ASSEMBLED_KIT"] as const) : []),
    ];
  }, [customKitEnabled]);

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

  // Só faz sentido pro modo "manual" — os outros modos não têm uma lista de
  // ids editável à mão (resolvem contra categoria/tag/regra).
  const addProductToSection = (productId: string) => {
    if (!editingSection || editingSection.source.mode !== "manual") return;
    if (editingSection.source.productIds.includes(productId)) return;
    setEditingSection({
      ...editingSection,
      source: {
        mode: "manual",
        productIds: [...editingSection.source.productIds, productId],
      },
    });
  };
  const removeProductFromSection = (productId: string) => {
    if (!editingSection || editingSection.source.mode !== "manual") return;
    setEditingSection({
      ...editingSection,
      source: {
        mode: "manual",
        productIds: editingSection.source.productIds.filter(
          (id) => id !== productId
        ),
      },
    });
  };

  // Rótulo curto do badge de fonte na listagem (não usado no formulário —
  // ali cada modo já tem seus próprios campos visíveis).
  const sourceBadgeLabel = (section: StoreSection): string => {
    const source = normalizeSectionSource(section);
    switch (source.mode) {
      case "manual":
        return `Manual · ${source.productIds.length} produto${
          source.productIds.length === 1 ? "" : "s"
        }`;
      case "category": {
        const category = categories.find((c) => c.id === source.categoryId);
        const sub = source.subcategoryId
          ? category?.subcategories.find(
              (s) => s.id === source.subcategoryId
            )
          : undefined;
        return `Categoria · ${category?.name ?? "(apagada)"}${
          sub ? ` / ${sub.name}` : ""
        }`;
      }
      case "tag": {
        const label =
          SYSTEM_TAG_LABELS[source.tag] ??
          tags.find((t) => t.name === source.tag)?.name ??
          source.tag;
        return `Tag · ${label}`;
      }
      case "auto":
        return "Automático · Estoque baixo";
      default:
        return "";
    }
  };

  // Variável isolada (em vez de reler `editingSection.source.mode` dentro de
  // cada closure abaixo) pra manter o TS estreitando `source` pra
  // `{ mode: "manual"; productIds }` de forma estável, sem depender de
  // narrowing através de fronteira de função.
  const manualSource =
    editingSection?.source.mode === "manual" ? editingSection.source : null;

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
                source: emptySource,
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
                {/* Alvo de toque >=44px (issue #57 / mobile-first-guide):
                    reordenar é ação sequencial e repetida em mobile, então
                    o botão precisa ser maior que o ícone que carrega —
                    h-11 w-11 (44px) com o ArrowUp/ArrowDown de 18px dentro. */}
                <div className="flex gap-2 text-slate-400">
                  <button
                    type="button"
                    onClick={() => moveSection(index, "up")}
                    disabled={index === 0}
                    aria-label="Mover seção para cima"
                    className="h-11 w-11 flex items-center justify-center rounded-lg hover:text-blue-600 hover:bg-slate-100 disabled:opacity-30"
                  >
                    <ArrowUp size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSection(index, "down")}
                    disabled={
                      index === (settings.homeSections?.length || 0) - 1
                    }
                    aria-label="Mover seção para baixo"
                    className="h-11 w-11 flex items-center justify-center rounded-lg hover:text-blue-600 hover:bg-slate-100 disabled:opacity-30"
                  >
                    <ArrowDown size={18} />
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
                <p className="text-xs text-slate-500 flex flex-wrap items-center gap-x-2">
                  <span>{section.type}</span>
                  {section.type === "product_shelf" && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>{sourceBadgeLabel(section)}</span>
                    </>
                  )}
                </p>
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
                    setEditingSection(withNormalizedSource(section));
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
                  onClick={() => setSectionToDelete(section)}
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

              {/* CONFIGURAÇÃO DE FONTE DA VITRINE (issue #71) */}
              {selectedTemplate === "product_shelf" && editingSection && (
                <div className="flex flex-col gap-4">
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700">
                      Como esta vitrine escolhe produtos
                    </Label>
                    <Select
                      value={editingSection.source.mode}
                      onValueChange={(mode: SectionSource["mode"]) => {
                        const nextSource: SectionSource =
                          mode === "manual"
                            ? { mode: "manual", productIds: [] }
                            : mode === "category"
                            ? {
                                mode: "category",
                                categoryId: categories[0]?.id ?? "",
                              }
                            : mode === "tag"
                            ? { mode: "tag", tag: "" }
                            : { mode: "auto", rule: "low_stock" };
                        setEditingSection({
                          ...editingSection,
                          source: nextSource,
                        });
                      }}
                    >
                      <SelectTrigger className="w-full h-10 border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">
                          Manual — escolho os produtos
                        </SelectItem>
                        <SelectItem value="category">
                          Por categoria — se preenche sozinha
                        </SelectItem>
                        <SelectItem value="tag">
                          Por tag — se preenche sozinha
                        </SelectItem>
                        <SelectItem value="auto">
                          Automático — estoque baixo
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {editingSection.source.mode === "category" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <div className="space-y-2">
                        <Label className="text-xs text-slate-600">
                          Categoria
                        </Label>
                        <Select
                          value={editingSection.source.categoryId}
                          onValueChange={(categoryId) =>
                            editingSection.source.mode === "category" &&
                            setEditingSection({
                              ...editingSection,
                              source: { mode: "category", categoryId },
                            })
                          }
                        >
                          <SelectTrigger className="w-full h-10 border-slate-200">
                            <SelectValue placeholder="Selecione a categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-slate-600">
                          Subcategoria (opcional)
                        </Label>
                        <Select
                          value={editingSection.source.subcategoryId ?? "ALL"}
                          onValueChange={(subcategoryId) =>
                            editingSection.source.mode === "category" &&
                            setEditingSection({
                              ...editingSection,
                              source: {
                                mode: "category",
                                categoryId: editingSection.source.categoryId,
                                subcategoryId:
                                  subcategoryId === "ALL"
                                    ? undefined
                                    : subcategoryId,
                              },
                            })
                          }
                        >
                          <SelectTrigger className="w-full h-10 border-slate-200">
                            <SelectValue placeholder="Todas" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ALL">
                              Todas as subcategorias
                            </SelectItem>
                            {categories
                              .find(
                                (c) =>
                                  editingSection.source.mode === "category" &&
                                  c.id === editingSection.source.categoryId
                              )
                              ?.subcategories.map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                  {s.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {editingSection.source.mode === "tag" && (
                    <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <Label className="text-xs text-slate-600">Tag</Label>
                      <Select
                        value={editingSection.source.tag}
                        onValueChange={(tag) =>
                          setEditingSection({
                            ...editingSection,
                            source: { mode: "tag", tag },
                          })
                        }
                      >
                        <SelectTrigger className="w-full h-10 border-slate-200">
                          <SelectValue placeholder="Selecione a tag" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={SYSTEM_TAG_NOVIDADES}>
                            {SYSTEM_TAG_LABELS[SYSTEM_TAG_NOVIDADES]}
                          </SelectItem>
                          <SelectItem value={SYSTEM_TAG_PROMOCAO}>
                            {SYSTEM_TAG_LABELS[SYSTEM_TAG_PROMOCAO]}
                          </SelectItem>
                          {tags
                            .filter((t) => t.active)
                            .map((t) => (
                              <SelectItem key={t.id} value={t.name}>
                                {t.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {editingSection.source.mode === "auto" && (
                    <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      Mostra produtos do tipo Fita com o rolo aberto e pouca
                      sobra ({Math.round(LOW_STOCK_RIBBON_RATIO * 100)}% ou
                      menos do rolo restante). Sem campo extra — a regra é
                      fixa.
                    </p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-600">
                        Limite de produtos (opcional)
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        inputMode="numeric"
                        placeholder="Sem limite"
                        className="h-10 border-slate-200"
                        value={editingSection.limit ?? ""}
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (raw === "") {
                            setEditingSection({
                              ...editingSection,
                              limit: undefined,
                            });
                            return;
                          }
                          const parsed = Number(raw);
                          // Guard explícito: entrada inválida/negativa/zero
                          // nunca vira `limit` gravado (NaN silencioso
                          // quebraria `slice(0, limit)` em resolveSectionProducts).
                          if (!Number.isFinite(parsed) || parsed < 1) return;
                          setEditingSection({
                            ...editingSection,
                            limit: parsed,
                          });
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-600">
                        Ordenar por
                      </Label>
                      <Select
                        value={editingSection.sort ?? "NONE"}
                        onValueChange={(sort) =>
                          setEditingSection({
                            ...editingSection,
                            sort:
                              sort === "NONE"
                                ? undefined
                                : (sort as StoreSection["sort"]),
                          })
                        }
                      >
                        <SelectTrigger className="w-full h-10 border-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NONE">Padrão</SelectItem>
                          <SelectItem value="newest">Mais novos</SelectItem>
                          <SelectItem value="price_asc">
                            Menor preço
                          </SelectItem>
                          <SelectItem value="price_desc">
                            Maior preço
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* Seletor de produtos — só existe pro modo manual */}
              {selectedTemplate === "product_shelf" && manualSource && (
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
                              seção própria da home. BASE_CONTAINER e
                              ASSEMBLED_KIT também somem daqui com
                              customKitEnabled desligado (issue #165). */}
                          {secTypeOptions.map((value) => (
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
                          const isSelected = manualSource.productIds.includes(
                            p.id
                          );
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
                        {manualSource.productIds.length}
                      </span>
                    </div>
                    {manualSource.productIds.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[10px] text-red-500 font-black uppercase hover:bg-red-50"
                        onClick={() =>
                          setEditingSection((prev) =>
                            prev
                              ? { ...prev, source: { mode: "manual", productIds: [] } }
                              : null
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

      <ConfirmDialog
        open={!!sectionToDelete}
        onOpenChange={(open) => !open && setSectionToDelete(null)}
        title={`Apagar a seção "${sectionToDelete?.title}"?`}
        description="Essa ação não pode ser desfeita. A seção some da Home assim que você salvar as configurações."
        confirmLabel="Apagar"
        onConfirm={() => {
          if (!sectionToDelete) return;
          deleteSection(sectionToDelete.id);
          setSectionToDelete(null);
        }}
      />
    </div>
  );
}
