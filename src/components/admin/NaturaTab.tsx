"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product, StoreSection, SectionType } from "@/types";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus,
  ArrowUp,
  ArrowDown,
  Eye,
  Pencil,
  Trash2,
  Save,
  Loader2,
  CheckCircle,
  Search,
  Leaf,
  LayoutTemplate,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { SafeImage } from "@/components/ui/SafeImage";

interface NaturaTabProps {
  allProducts: Product[];
}

interface SeoBlock {
  id: string;
  position: number;
  title: string;
  content: string;
  isActive: boolean;
}

interface NaturaSettings {
  sections: StoreSection[];
  seoBlocks?: SeoBlock[];
}

export function NaturaTab({ allProducts }: NaturaTabProps) {
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState<StoreSection[]>([]);
  const [seoBlocks, setSeoBlocks] = useState<SeoBlock[]>([]);

  // Section Editing State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<StoreSection | null>(
    null
  );
  const [selectedTemplate, setSelectedTemplate] =
    useState<SectionType>("product_shelf");
  const [searchTerm, setSearchTerm] = useState("");

  // SEO Block Editing State
  const [isSeoModalOpen, setIsSeoModalOpen] = useState(false);
  const [editingSeoBlock, setEditingSeoBlock] = useState<SeoBlock | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "natura"), (s) => {
      if (s.exists()) {
        const data = s.data() as NaturaSettings;
        setSections(data.sections || []);
        setSeoBlocks(data.seoBlocks || []);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSaveAll = async () => {
    try {
      await setDoc(doc(db, "settings", "natura"), { sections, seoBlocks });
      toast.success("Configurações da Natura salvas!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar.");
    }
  };

  const handleSaveSection = () => {
    if (!editingSection) return;

    setSections((prev) => {
      const exists = prev.find((s) => s.id === editingSection.id);
      if (exists) {
        return prev.map((s) =>
          s.id === editingSection.id ? editingSection : s
        );
      }
      return [...prev, editingSection];
    });

    setIsModalOpen(false);
    setEditingSection(null);
  };

  const moveSection = (index: number, direction: "up" | "down") => {
    const newSections = [...sections];
    if (direction === "up" && index > 0) {
      [newSections[index], newSections[index - 1]] = [
        newSections[index - 1],
        newSections[index],
      ];
    }
    if (direction === "down" && index < newSections.length - 1) {
      [newSections[index], newSections[index + 1]] = [
        newSections[index + 1],
        newSections[index],
      ];
    }
    setSections(newSections);
  };

  const deleteSection = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta seção?")) {
      setSections((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const toggleVisibility = (id: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s))
    );
  };

  // Helper for Product Selection in Modal
  const toggleProduct = (productId: string) => {
    if (!editingSection) return;
    const current = editingSection.productIds || [];
    const exists = current.includes(productId);

    setEditingSection({
      ...editingSection,
      productIds: exists
        ? current.filter((id) => id !== productId)
        : [...current, productId],
    });
  };

  // SEO Block Functions
  const handleSaveSeoBlock = () => {
    if (!editingSeoBlock) return;

    setSeoBlocks((prev) => {
      const exists = prev.find((b) => b.id === editingSeoBlock.id);
      if (exists) {
        return prev.map((b) =>
          b.id === editingSeoBlock.id ? editingSeoBlock : b
        );
      }
      return [...prev, editingSeoBlock];
    });

    setIsSeoModalOpen(false);
    setEditingSeoBlock(null);
  };

  const toggleSeoBlockVisibility = (id: string) => {
    setSeoBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, isActive: !b.isActive } : b))
    );
  };

  const deleteSeoBlock = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este bloco SEO?")) {
      setSeoBlocks((prev) => prev.filter((b) => b.id !== id));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin text-green-600" />
      </div>
    );
  }

  // Filter products for the modal
  const filteredProducts = allProducts.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-green-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-green-800 flex items-center gap-2">
            <Leaf className="text-green-600" /> Gestão Página Natura
          </h2>
          <p className="text-sm text-green-600/80">
            Customize as vitrines e banners exclusivos da página Natura
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <Button
            onClick={() => {
              setEditingSection({
                id: crypto.randomUUID(),
                title: "Nova Vitrine Natura",
                type: "product_shelf",
                width: "full",
                productIds: [],
                isActive: true,
              });
              setSelectedTemplate("product_shelf");
              setIsModalOpen(true);
            }}
            className="bg-green-600 hover:bg-green-700 text-white flex-1 md:flex-none"
          >
            <Plus size={16} className="mr-2" /> Nova Seção
          </Button>
          <Button
            onClick={handleSaveAll}
            className="bg-slate-800 hover:bg-slate-900 text-white flex-1 md:flex-none"
          >
            <Save size={16} className="mr-2" /> Salvar Alterações
          </Button>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 min-h-[300px]">
        {sections.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <LayoutTemplate size={48} className="mx-auto mb-4 opacity-20" />
            <p>Nenhuma seção configurada para a página Natura.</p>
          </div>
        ) : (
          sections.map((section, index) => (
            <div
              key={section.id}
              className={cn(
                "flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-white border rounded-lg group transition-all",
                !section.isActive && "opacity-60 bg-slate-100"
              )}
            >
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="flex gap-1 text-slate-400">
                  <button
                    onClick={() => moveSection(index, "up")}
                    disabled={index === 0}
                    className="hover:text-green-600 disabled:opacity-30 p-1"
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    onClick={() => moveSection(index, "down")}
                    disabled={index === sections.length - 1}
                    className="hover:text-green-600 disabled:opacity-30 p-1"
                  >
                    <ArrowDown size={16} />
                  </button>
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-slate-800">{section.title}</h3>
                  {!section.isActive && (
                    <Badge variant="outline">Inativo</Badge>
                  )}
                </div>
                <div className="flex gap-2 text-xs text-slate-500">
                  <Badge variant="secondary" className="text-[10px]">
                    {section.type}
                  </Badge>
                  <span>{section.productIds.length} produtos</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t sm:border-t-0 pt-2 sm:pt-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleVisibility(section.id)}
                >
                  {section.isActive ? (
                    <Eye size={16} className="text-green-600" />
                  ) : (
                    <Eye size={16} className="text-slate-400" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setEditingSection(section);
                    setSelectedTemplate(section.type); // Sync template selection
                    setIsModalOpen(true);
                  }}
                >
                  <Pencil size={16} className="text-blue-500" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteSection(section.id)}
                >
                  <Trash2 size={16} className="text-red-400" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* SEO BLOCKS SECTION */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <FileText className="text-blue-600" size={20} />
              Blocos de Texto SEO
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Adicione textos com palavras-chave entre as vitrines para melhorar
              o SEO
            </p>
          </div>
          <Button
            onClick={() => {
              setEditingSeoBlock({
                id: crypto.randomUUID(),
                position: 0,
                title: "Novo Bloco SEO",
                content: "<p>Adicione seu texto aqui...</p>",
                isActive: true,
              });
              setIsSeoModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            size="sm"
          >
            <Plus size={14} className="mr-1" /> Novo Bloco
          </Button>
        </div>

        <div className="space-y-2">
          {seoBlocks.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              <FileText size={32} className="mx-auto mb-2 opacity-20" />
              <p>Nenhum bloco SEO configurado.</p>
            </div>
          ) : (
            seoBlocks.map((block) => (
              <div
                key={block.id}
                className={cn(
                  "flex items-center gap-3 p-3 border rounded-lg bg-slate-50",
                  !block.isActive && "opacity-50"
                )}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm text-slate-800">
                      {block.title}
                    </h4>
                    {!block.isActive && (
                      <Badge variant="outline" className="text-[10px]">
                        Inativo
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    Posição:{" "}
                    {block.position === 0
                      ? "Antes de todas"
                      : `Após vitrine ${block.position}`}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => toggleSeoBlockVisibility(block.id)}
                  >
                    {block.isActive ? (
                      <Eye size={14} className="text-blue-600" />
                    ) : (
                      <Eye size={14} className="text-slate-400" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setEditingSeoBlock(block);
                      setIsSeoModalOpen(true);
                    }}
                  >
                    <Pencil size={14} className="text-blue-500" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => deleteSeoBlock(block.id)}
                  >
                    <Trash2 size={14} className="text-red-400" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MODAL DE EDIÇÃO DE SEÇÃO */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Seção Natura</DialogTitle>
          </DialogHeader>

          {editingSection && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Título da Seção</Label>
                  <Input
                    value={editingSection.title}
                    onChange={(e) =>
                      setEditingSection({
                        ...editingSection,
                        title: e.target.value,
                      })
                    }
                    placeholder="Ex: Perfumaria Feminina"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Exibição</Label>
                  <Select
                    value={editingSection.type}
                    onValueChange={(val: SectionType) => {
                      setEditingSection({ ...editingSection, type: val });
                      setSelectedTemplate(val);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="product_shelf">
                        Estante de Produtos (Carrossel)
                      </SelectItem>
                      <SelectItem value="banner_natura">
                        Banner Promocional
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* CONFIGURAÇÃO DE PRODUTOS (APENAS PARA SHELF) */}
              {selectedTemplate === "product_shelf" && (
                <div className="space-y-4 border rounded-lg p-4 bg-slate-50">
                  <div className="flex justify-between items-center">
                    <Label>
                      Selecionar Produtos ({editingSection.productIds.length})
                    </Label>
                    <div className="relative w-48">
                      <Search
                        size={14}
                        className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <Input
                        className="h-8 pl-8 text-xs bg-white"
                        placeholder="Buscar..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-60 overflow-y-auto p-1">
                    {filteredProducts.slice(0, 50).map((product) => {
                      const isSelected = editingSection.productIds.includes(
                        product.id
                      );
                      return (
                        <div
                          key={product.id}
                          onClick={() => toggleProduct(product.id)}
                          className={cn(
                            "cursor-pointer border rounded-lg p-2 flex flex-col items-center gap-2 text-center transition-all relative overflow-hidden",
                            isSelected
                              ? "border-green-500 bg-green-50 ring-1 ring-green-200"
                              : "bg-white hover:border-green-300"
                          )}
                        >
                          {isSelected && (
                            <div className="absolute top-1 right-1 text-green-600">
                              <CheckCircle
                                size={14}
                                fill="currentColor"
                                className="text-white"
                              />
                            </div>
                          )}
                          <div className="w-12 h-12 relative rounded-md overflow-hidden bg-slate-100">
                            <SafeImage
                              src={product.imageUrl}
                              fill
                              className="object-cover"
                              alt={product.name}
                            />
                          </div>
                          <p className="text-[10px] font-medium line-clamp-2 leading-tight">
                            {product.name}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* CONFIGURAÇÃO DE BANNER */}
              {selectedTemplate.includes("banner") && (
                <div className="space-y-4 border rounded-lg p-4 bg-slate-50">
                  <Label>Configuração do Banner</Label>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs">URL da Imagem</Label>
                      <Input
                        value={editingSection.bannerUrl || ""}
                        onChange={(e) =>
                          setEditingSection({
                            ...editingSection,
                            bannerUrl: e.target.value,
                          })
                        }
                        placeholder="https://..."
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">
                        Link de Destino (Opcional)
                      </Label>
                      <Input
                        value={editingSection.bannerLink || ""}
                        onChange={(e) =>
                          setEditingSection({
                            ...editingSection,
                            bannerLink: e.target.value,
                          })
                        }
                        placeholder="/categoria/exemplo"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveSection}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Salvar Seção
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE EDIÇÃO DE BLOCO SEO */}
      <Dialog open={isSeoModalOpen} onOpenChange={setIsSeoModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Bloco de Texto SEO</DialogTitle>
          </DialogHeader>

          {editingSeoBlock && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Título do Bloco</Label>
                <Input
                  value={editingSeoBlock.title}
                  onChange={(e) =>
                    setEditingSeoBlock({
                      ...editingSeoBlock,
                      title: e.target.value,
                    })
                  }
                  placeholder="Ex: Por que escolher Natura?"
                />
              </div>

              <div className="space-y-2">
                <Label>Posição</Label>
                <Select
                  value={editingSeoBlock.position.toString()}
                  onValueChange={(val) =>
                    setEditingSeoBlock({
                      ...editingSeoBlock,
                      position: parseInt(val),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">
                      Antes de todas as vitrines
                    </SelectItem>
                    {sections.map((_, index) => (
                      <SelectItem
                        key={index + 1}
                        value={(index + 1).toString()}
                      >
                        Após vitrine {index + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">
                  Escolha onde este bloco de texto aparecerá na página
                </p>
              </div>

              <div className="space-y-2">
                <Label>Conteúdo (HTML permitido)</Label>
                <textarea
                  value={editingSeoBlock.content}
                  onChange={(e) =>
                    setEditingSeoBlock({
                      ...editingSeoBlock,
                      content: e.target.value,
                    })
                  }
                  className="w-full min-h-[200px] p-3 border rounded-lg font-mono text-sm"
                  placeholder="<p>Adicione seu texto aqui com <strong>palavras-chave</strong> importantes...</p>"
                />
                <p className="text-xs text-slate-500">
                  💡 Dica: Use tags HTML como &lt;strong&gt;, &lt;em&gt;,
                  &lt;h3&gt; para destacar palavras-chave
                </p>
              </div>

              {/* Preview */}
              <div className="space-y-2">
                <Label>Preview</Label>
                <div
                  className="border rounded-lg p-4 bg-slate-50 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: editingSeoBlock.content }}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSeoModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveSeoBlock}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Salvar Bloco
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
