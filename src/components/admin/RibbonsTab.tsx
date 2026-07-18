"use client";

import { Dispatch, SetStateAction, useState } from "react";
import { doc, deleteDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product, StoreSettings } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ImageUploadModal } from "@/components/admin/ImageUploadModal";
import { SafeImage } from "@/components/ui/SafeImage";
import { PRODUCT_TYPE_META } from "@/components/ui/status-badge";
import {
  Plus,
  Pencil,
  Trash2,
  Package,
  Scissors,
  Grid2X2,
  Settings2,
  ChevronDown,
  Search,
  Ruler,
  Gift,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

interface RibbonsTabProps {
  allProducts: Product[];
  settings: StoreSettings;
  setSettings: Dispatch<SetStateAction<StoreSettings>>;
  onEditProduct: (product: Product | null) => void;
}

export function RibbonsTab({
  allProducts,
  settings,
  setSettings,
  onEditProduct,
}: RibbonsTabProps) {
  const [ribbonTab, setRibbonTab] = useState<"edition" | "visual">("visual");
  const [ribbonSearchTerm, setRibbonSearchTerm] = useState("");
  const [expandedTypes, setExpandedTypes] = useState<Record<string, boolean>>(
    {}
  );
  const [fitaToDelete, setFitaToDelete] = useState<Product | null>(null);
  const [deletingFita, setDeletingFita] = useState(false);

  const handleDeleteFita = async () => {
    if (!fitaToDelete) return;
    setDeletingFita(true);
    try {
      await deleteDoc(doc(db, "products", fitaToDelete.id));
      toast.success("Fita excluída");
      setFitaToDelete(null);
    } catch {
      toast.error("Erro ao excluir fita.");
    } finally {
      setDeletingFita(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-6 rounded-xl shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              Gerenciamento de Fitas
            </h2>
            <p className="text-sm text-slate-500">
              Controle de estoque de rolos e fitas por metro
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
            <Button
              variant={ribbonTab === "visual" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setRibbonTab("visual")}
              className={cn(
                "rounded-lg px-4 font-bold h-9",
                ribbonTab === "visual"
                  ? "shadow-sm bg-white"
                  : "text-slate-500"
              )}
            >
              <Grid2X2 size={14} className="mr-2" /> Visualização
            </Button>
            <Button
              variant={ribbonTab === "edition" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setRibbonTab("edition")}
              className={cn(
                "rounded-lg px-4 font-bold h-9",
                ribbonTab === "edition"
                  ? "shadow-sm bg-white"
                  : "text-slate-500"
              )}
            >
              <Settings2 size={14} className="mr-2" /> Edição
            </Button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <Input
              placeholder="Buscar fita por nome..."
              value={ribbonSearchTerm}
              onChange={(e) => setRibbonSearchTerm(e.target.value)}
              className="pl-9 bg-slate-50 border-slate-200"
            />
          </div>
          <Button
            onClick={() => {
              onEditProduct({
                id: "",
                name: "",
                price: 0,
                category: "Fitas",
                type: "RIBBON",
                imageUrl: "",
                inStock: true,
                unit: "m",
                rollPrice: 0,
                ribbonInventory: {
                  status: "FECHADO",
                  remainingMeters: 10,
                  totalRollMeters: 10,
                },
                isAvailableForCustomBow: true,
              } as any);
            }}
            className="bg-primary hover:bg-primary/90 text-white font-bold gap-2"
          >
            <Plus size={18} /> Nova Fita
          </Button>
        </div>

        {ribbonTab === "visual" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* COLUNA: ROLOS FECHADOS */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-bold text-slate-700 flex items-center gap-2 uppercase tracking-wider text-xs">
                  <Package size={14} className="text-blue-500" /> Rolos
                  Fechados
                </h3>
                <Badge variant="outline" className="bg-blue-50">
                  {
                    allProducts.filter(
                      (p) =>
                        p.type === "RIBBON" &&
                        p.ribbonInventory?.status === "FECHADO"
                    ).length
                  }
                </Badge>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {allProducts
                  .filter(
                    (p) =>
                      p.type === "RIBBON" &&
                      p.ribbonInventory?.status === "FECHADO" &&
                      p.name
                        .toLowerCase()
                        .includes(ribbonSearchTerm.toLowerCase())
                  )
                  .map((fita) => (
                    <div
                      key={fita.id}
                      className="bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-sm"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-y-2 group hover:border-primary/30 transition-all">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-lg bg-white border overflow-hidden relative shadow-sm shrink-0">
                            <SafeImage
                              src={fita.imageUrl}
                              alt={fita.name}
                              name={fita.name}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-800 text-sm leading-tight truncate">
                              {fita.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                                {formatCurrency(fita.rollPrice || 0)}
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold">
                                {fita.ribbonInventory?.totalRollMeters}m
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              const updated = {
                                ...fita,
                                ribbonInventory: {
                                  ...fita.ribbonInventory,
                                  status: "ABERTO",
                                  remainingMeters:
                                    fita.ribbonInventory
                                      ?.totalRollMeters || 0,
                                },
                              };
                              await setDoc(
                                doc(db, "products", fita.id),
                                updated
                              );
                              toast.success("Rolo aberto para venda!");
                            }}
                            className="h-8 px-3 text-[10px] font-bold uppercase tracking-tight bg-white hover:bg-blue-50 text-blue-600 border-blue-200 rounded-full"
                          >
                            Abrir Rolo
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEditProduct(fita)}
                            className="h-8 w-8 text-slate-400 hover:text-primary"
                          >
                            <Pencil size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setExpandedTypes((prev) => ({
                                ...prev,
                                [fita.id]: !prev[fita.id],
                              }))
                            }
                            className={cn(
                              "h-8 w-8 transition-transform",
                              expandedTypes[fita.id] && "rotate-180"
                            )}
                          >
                            <ChevronDown size={14} />
                          </Button>
                        </div>
                      </div>

                      {/* Área Retrátil de Informação */}
                      {expandedTypes[fita.id] && (
                        <div className="mt-3 pt-3 border-t border-slate-200/50 animate-in slide-in-from-top-2 duration-300">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                                Função Técnica (Tipo)
                              </span>
                              <Badge
                                variant="outline"
                                className="text-[10px] bg-blue-50 text-blue-700 border-blue-100 italic"
                              >
                                {PRODUCT_TYPE_META[fita.type]?.label ??
                                  fita.type}
                              </Badge>
                              <p className="text-[9px] text-slate-500 mt-1 leading-tight font-medium">
                                Controle de metragem habilitado.
                              </p>
                            </div>
                            <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                                Organização (Categoria)
                              </span>
                              <Badge
                                variant="outline"
                                className="text-[10px] bg-purple-50 text-purple-700 border-purple-100 font-bold"
                              >
                                {fita.category}
                              </Badge>
                              <p className="text-[9px] text-slate-500 mt-1 leading-tight font-medium">
                                Localização na vitrine do cliente.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>

            {/* COLUNA: POR METRO (ABERTOS) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-bold text-slate-700 flex items-center gap-2 uppercase tracking-wider text-xs">
                  <Scissors size={14} className="text-purple-500" />{" "}
                  Fitas Abertas (Metro)
                </h3>
                <Badge variant="outline" className="bg-purple-50">
                  {
                    allProducts.filter(
                      (p) =>
                        p.type === "RIBBON" &&
                        p.ribbonInventory?.status === "ABERTO"
                    ).length
                  }
                </Badge>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {allProducts
                  .filter(
                    (p) =>
                      p.type === "RIBBON" &&
                      p.ribbonInventory?.status === "ABERTO" &&
                      p.name
                        .toLowerCase()
                        .includes(ribbonSearchTerm.toLowerCase())
                  )
                  .map((fita) => (
                    <div
                      key={fita.id}
                      className="bg-white p-3 rounded-xl border border-purple-100 shadow-sm transition-all hover:border-purple-300"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-y-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-lg bg-slate-50 border overflow-hidden relative shrink-0">
                            <SafeImage
                              src={fita.imageUrl}
                              alt={fita.name}
                              name={fita.name}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-800 text-sm leading-tight truncate">
                              {fita.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-black text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100 uppercase tracking-widest">
                                {formatCurrency(fita.price)}/m
                              </span>
                              <div className="flex items-center gap-1.5 ml-2">
                                <Ruler
                                  size={10}
                                  className="text-slate-400"
                                />
                                <span className="text-[10px] font-bold text-slate-600">
                                  {
                                    fita.ribbonInventory
                                      ?.remainingMeters
                                  }
                                  m /{" "}
                                  {
                                    fita.ribbonInventory
                                      ?.totalRollMeters
                                  }
                                  m
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              const updated = {
                                ...fita,
                                ribbonInventory: {
                                  ...fita.ribbonInventory,
                                  status: "FECHADO",
                                },
                              };
                              await setDoc(
                                doc(db, "products", fita.id),
                                updated
                              );
                              toast.success(
                                "Fita movida para rolos fechados"
                              );
                            }}
                            className="h-8 px-3 text-[10px] font-bold uppercase tracking-tight bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-200 rounded-full"
                          >
                            Fechar Manual
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEditProduct(fita)}
                            className="h-8 w-8 text-slate-400 hover:text-primary"
                          >
                            <Pencil size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setExpandedTypes((prev) => ({
                                ...prev,
                                [fita.id]: !prev[fita.id],
                              }))
                            }
                            className={cn(
                              "h-8 w-8 transition-transform",
                              expandedTypes[fita.id] && "rotate-180"
                            )}
                          >
                            <ChevronDown size={14} />
                          </Button>
                        </div>
                      </div>

                      {/* Área Retrátil de Informação */}
                      {expandedTypes[fita.id] && (
                        <div className="mt-3 pt-3 border-t border-slate-200/50 animate-in slide-in-from-top-2 duration-300">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                                Função Técnica (Tipo)
                              </span>
                              <Badge
                                variant="outline"
                                className="text-[10px] bg-blue-50 text-blue-700 border-blue-100 italic"
                              >
                                {PRODUCT_TYPE_META[fita.type]?.label ??
                                  fita.type}
                              </Badge>
                              <p className="text-[9px] text-slate-500 mt-1 leading-tight font-medium">
                                Controle de metragem habilitado.
                              </p>
                            </div>
                            <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                                Organização (Categoria)
                              </span>
                              <Badge
                                variant="outline"
                                className="text-[10px] bg-purple-50 text-purple-700 border-purple-100 font-bold"
                              >
                                {fita.category}
                              </Badge>
                              <p className="text-[9px] text-slate-500 mt-1 leading-tight font-medium">
                                Localização na vitrine do cliente.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="border rounded-xl overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-slate-50 uppercase tracking-widest text-[10px] font-black">
                <TableRow>
                  <TableHead className="w-[80px]">Foto</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Preço Rolo</TableHead>
                  <TableHead>Preço Metro</TableHead>
                  <TableHead>Restante</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allProducts
                  .filter(
                    (p) =>
                      p.type === "RIBBON" &&
                      p.name
                        .toLowerCase()
                        .includes(ribbonSearchTerm.toLowerCase())
                  )
                  .map((fita) => (
                    <TableRow
                      key={fita.id}
                      className="hover:bg-slate-50/50"
                    >
                      <TableCell>
                        <div className="w-10 h-10 rounded border overflow-hidden relative bg-white">
                          <SafeImage
                            src={fita.imageUrl}
                            alt={fita.name}
                            name={fita.name}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-slate-700">
                        {fita.name}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            fita.ribbonInventory?.status === "FECHADO"
                              ? "secondary"
                              : "default"
                          }
                          className={cn(
                            "text-[9px] font-black uppercase whitespace-normal text-center h-auto py-1",
                            fita.ribbonInventory?.status === "FECHADO"
                              ? "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-50"
                              : "bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-50"
                          )}
                        >
                          {fita.ribbonInventory?.status === "FECHADO"
                            ? "Fechado"
                            : "Aberto"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-slate-500">
                        {formatCurrency(fita.rollPrice || 0)}
                      </TableCell>
                      <TableCell className="font-medium text-slate-500">
                        {formatCurrency(fita.price)}/m
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-bold text-slate-700">
                            {fita.ribbonInventory?.remainingMeters}m
                          </span>
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary"
                              style={{
                                width: `${
                                  ((fita.ribbonInventory
                                    ?.remainingMeters || 0) /
                                    (fita.ribbonInventory
                                      ?.totalRollMeters || 1)) *
                                  100
                                }%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEditProduct(fita)}
                            className="h-8 w-8"
                          >
                            <Pencil size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setFitaToDelete(fita)}
                            className="h-8 w-8 text-red-500 hover:bg-red-50"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* ===== CONFIGURAÇÃO DO LAÇO ===== */}
        <div className="bg-white p-6 rounded-xl shadow-sm space-y-6 mt-6 border border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Gift size={20} className="text-primary" /> Configuração do Laço
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Gerencie os modelos e tamanhos disponíveis no montador de laços.
            </p>
          </div>

          {/* Modelos */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-700">Modelos de Laço</h3>
              <Button
                size="sm"
                variant="outline"
                className="gap-2 text-xs"
                onClick={() => {
                  const newModel = {
                    id: crypto.randomUUID(),
                    name: "Novo Modelo",
                    subtitle: "Descrição do modelo",
                    imageUrl: "",
                  };
                  setSettings((prev: StoreSettings) => ({
                    ...prev,
                    bowModels: [...(prev.bowModels || []), newModel],
                  }));
                }}
              >
                <Plus size={14} /> Adicionar Modelo
              </Button>
            </div>
            <div className="space-y-3">
              {(settings.bowModels || []).map((model, idx) => (
                <div key={model.id} className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <ImageUploadModal
                    value={model.imageUrl}
                    folder="laco/models"
                    onChange={(url) => {
                      const updated = [...(settings.bowModels || [])];
                      updated[idx] = { ...updated[idx], imageUrl: url };
                      setSettings((prev: StoreSettings) => ({ ...prev, bowModels: updated }));
                    }}
                  />
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Input
                      placeholder="Nome"
                      value={model.name}
                      onChange={(e) => {
                        const updated = [...(settings.bowModels || [])];
                        updated[idx] = { ...updated[idx], name: e.target.value };
                        setSettings((prev: StoreSettings) => ({ ...prev, bowModels: updated }));
                      }}
                      className="text-sm"
                    />
                    <Input
                      placeholder="Subtítulo"
                      value={model.subtitle}
                      onChange={(e) => {
                        const updated = [...(settings.bowModels || [])];
                        updated[idx] = { ...updated[idx], subtitle: e.target.value };
                        setSettings((prev: StoreSettings) => ({ ...prev, bowModels: updated }));
                      }}
                      className="text-sm"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:bg-red-50 shrink-0"
                    onClick={() => {
                      setSettings((prev: StoreSettings) => ({
                        ...prev,
                        bowModels: (prev.bowModels || []).filter((_, i) => i !== idx),
                      }));
                    }}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
              {(settings.bowModels || []).length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">Nenhum modelo cadastrado.</p>
              )}
            </div>
          </div>

          {/* Tamanhos */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-700">Tamanhos</h3>
              <Button
                size="sm"
                variant="outline"
                className="gap-2 text-xs"
                onClick={() => {
                  const newSize = {
                    id: crypto.randomUUID(),
                    name: "Novo Tamanho",
                    price: 0,
                  };
                  setSettings((prev: StoreSettings) => ({
                    ...prev,
                    bowSizes: [...(prev.bowSizes || []), newSize],
                  }));
                }}
              >
                <Plus size={14} /> Adicionar Tamanho
              </Button>
            </div>
            <div className="space-y-3">
              {(settings.bowSizes || []).map((size, idx) => (
                <div key={size.id} className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Nome (ex: Pequeno)"
                      value={size.name}
                      onChange={(e) => {
                        const updated = [...(settings.bowSizes || [])];
                        updated[idx] = { ...updated[idx], name: e.target.value };
                        setSettings((prev: StoreSettings) => ({ ...prev, bowSizes: updated }));
                      }}
                      className="text-sm"
                    />
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">R$</span>
                      <Input
                        type="number"
                        placeholder="0,00"
                        value={size.price}
                        onChange={(e) => {
                          const updated = [...(settings.bowSizes || [])];
                          updated[idx] = { ...updated[idx], price: parseFloat(e.target.value) || 0 };
                          setSettings((prev: StoreSettings) => ({ ...prev, bowSizes: updated }));
                        }}
                        className="pl-9 text-sm"
                      />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:bg-red-50 shrink-0"
                    onClick={() => {
                      setSettings((prev: StoreSettings) => ({
                        ...prev,
                        bowSizes: (prev.bowSizes || []).filter((_, i) => i !== idx),
                      }));
                    }}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
              {(settings.bowSizes || []).length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">Nenhum tamanho cadastrado.</p>
              )}
            </div>
          </div>

          <p className="text-xs text-slate-400">
            Clique em <strong>Salvar Configurações</strong> no topo para aplicar as alterações.
          </p>
        </div>
      </div>

      <ConfirmDialog
        open={!!fitaToDelete}
        onOpenChange={(open) => !open && setFitaToDelete(null)}
        title={`Excluir a fita "${fitaToDelete?.name}"?`}
        confirmLabel="Excluir"
        loading={deletingFita}
        onConfirm={handleDeleteFita}
      />
    </div>
  );
}
