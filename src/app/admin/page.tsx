"use client";

import { useEffect, useState, useMemo } from "react";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  setDoc,
} from "firebase/firestore";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { Product, StoreSettings, StoreSection, SectionType } from "@/types";
import { Order } from "@/types/order";
import { BalloonConfig, BalloonTypeConfig } from "@/types/balloon";
// Order type imported from @/types/order

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
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
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  LogOut,
  Package,
  Layout,
  ArrowUp,
  ArrowDown,
  Save,
  X,
  Leaf,
  Gift,
  Scissors,
  Grid2X2,
  RectangleHorizontal,
  MonitorPlay,
  Eye,
  Search,
  Filter,
  ExternalLink,
  ShoppingBag,
  Phone,
  MessageCircle,
  Database,
  PartyPopper,
  Copy,
  Wand2,
  Layers,
  Settings2,
  ChevronDown,
  Ruler,
  Loader2,
  MoreHorizontal,
} from "lucide-react";
import { ProductFormDialog } from "@/components/admin/ProductFormDialog";
import Link from "next/link";
import { SuperAdminZone } from "@/components/admin/SuperAdminZone";
import { SafeImage } from "@/components/ui/SafeImage";
import { cn, formatCurrency } from "@/lib/utils";

import { suggestHexColor } from "@/lib/balloonColors";
import { OrdersTab } from "@/components/admin/OrdersTab";
import { AdminLogin } from "@/components/admin/AdminLogin";

export default function AdminPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [viewMode, setViewMode] = useState<"orders" | "inventory">("orders"); // Defaults to orders since user emphasized it

  const [allProducts, setAllProducts] = useState<Product[]>([]);

  const [settings, setSettings] = useState<StoreSettings>({
    id: "general",
    storeName: "Mix Novidades",
    whatsappNumber: "",
    theme: { primaryColor: "#0f172a", activeTheme: "default" },
    filters: { activeCategories: [], categoryOrder: [] },
    homeSections: [],
  });

  const [balloonConfig, setBalloonConfig] = useState<BalloonConfig>({
    types: [],
    allColors: [],
  });

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  // Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToView, setProductToView] = useState<Product | null>(null);

  // Seções
  const [editingSection, setEditingSection] = useState<StoreSection | null>(
    null
  );
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [sectionSearchTerm, setSectionSearchTerm] = useState("");
  const [secTypeFilter, setSecTypeFilter] = useState("ALL");
  const [secCatFilter, setSecCatFilter] = useState("ALL");
  const [selectedTemplate, setSelectedTemplate] =
    useState<SectionType>("product_shelf");

  // Sub-tabs para balões
  const [balloonTab, setBalloonTab] = useState<"edition" | "visual">("visual");
  const [expandedTypes, setExpandedTypes] = useState<Record<string, boolean>>(
    {}
  );

  // Sub-tabs para fitas
  const [ribbonTab, setRibbonTab] = useState<"edition" | "visual">("visual");
  const [ribbonSearchTerm, setRibbonSearchTerm] = useState("");

  // System Tools Modal
  const [isSysToolsOpen, setIsSysToolsOpen] = useState(false);

  // Auth & Data
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoadingAuth(false);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    // Buscar Produtos
    const unsubProd = onSnapshot(
      query(collection(db, "products"), orderBy("name")),
      (s) =>
        setAllProducts(
          s.docs.map((d) => ({ id: d.id, ...d.data() } as Product))
        )
    );

    // Buscar Configurações
    const unsubSett = onSnapshot(doc(db, "settings", "general"), (s) => {
      if (s.exists()) setSettings(s.data() as StoreSettings);
    });

    // Buscar Configurações de Balões
    const unsubBall = onSnapshot(doc(db, "settings", "balloons"), (s) => {
      if (s.exists()) setBalloonConfig(s.data() as BalloonConfig);
    });

    return () => {
      unsubProd();
      unsubSett();

      unsubBall();
    };
  }, [currentUser]);

  // Lógica de Filtros de Produtos
  const filteredProducts = useMemo(() => {
    return allProducts.filter((product) => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === "ALL" || product.type === typeFilter;
      const matchesCategory =
        categoryFilter === "ALL" || product.category === categoryFilter;
      return matchesSearch && matchesType && matchesCategory;
    });
  }, [allProducts, searchTerm, typeFilter, categoryFilter]);

  const uniqueCategories = useMemo(
    () =>
      Array.from(
        new Set(allProducts.map((p) => p.category).filter(Boolean))
      ).sort(),
    [allProducts]
  );

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

  // Ações
  const handleDeleteProduct = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir?")) {
      await deleteDoc(doc(db, "products", id));
      toast.success("Produto excluído.");
    }
  };

  const handleViewProduct = () => {
    if (productToView) {
      window.open(`/produto/${productToView.id}`, "_blank");
      setProductToView(null);
    }
  };

  // Helpers de UI
  const getProductTypeLabel = (type: string) => {
    switch (type) {
      case "BASE_CONTAINER":
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700">
            Base
          </Badge>
        );
      case "STANDARD_ITEM":
        return (
          <Badge variant="outline" className="bg-slate-50 text-slate-700">
            Item
          </Badge>
        );
      case "FILLER":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            Preench.
          </Badge>
        );
      case "WRAPPER":
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-700">
            Saco
          </Badge>
        );
      case "ACCESSORY":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
            Acess.
          </Badge>
        );
      case "RIBBON":
        return (
          <Badge variant="outline" className="bg-pink-50 text-pink-700">
            Laço
          </Badge>
        );
      case "KIT_TEMPLATE":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700">
            Kit
          </Badge>
        );
      case "ASSEMBLED_KIT":
        return (
          <Badge variant="outline" className="bg-teal-50 text-teal-700">
            Kit Montado
          </Badge>
        );
      default:
        return <Badge variant="outline">Outro</Badge>;
    }
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            Pendente
          </Badge>
        );
      case "processing":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            Preparando
          </Badge>
        );
      case "delivering":
        return (
          <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
            Enviado
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            Entregue
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            Cancelado
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Helpers de Seção
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

  const saveAllSettings = async () => {
    try {
      await setDoc(doc(db, "settings", "general"), settings);
      await setDoc(doc(db, "settings", "balloons"), balloonConfig);
      toast.success("Salvo com sucesso!");
    } catch (e) {
      toast.error("Erro ao salvar.");
    }
  };

  // === Ações de Balões (Batch) ===
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

  const handleSyncSizesToAll = (fromIndex: number) => {
    if (
      !confirm(
        "Isso irá substituir os tamanhos de TODOS os outros tipos. Continuar?"
      )
    )
      return;
    const sourceSizes = balloonConfig.types[fromIndex].sizes;
    const newTypes = balloonConfig.types.map((t) => ({
      ...t,
      sizes: JSON.parse(JSON.stringify(sourceSizes)),
    }));
    setBalloonConfig((prev) => ({ ...prev, types: newTypes }));
    toast.success("Tamanhos sincronizados!");
  };

  const handleSyncColorsToAll = (fromIndex: number) => {
    if (
      !confirm(
        "Isso irá substituir as cores de TODOS os outros tipos. Continuar?"
      )
    )
      return;
    const sourceColors = balloonConfig.types[fromIndex].colors;
    const newTypes = balloonConfig.types.map((t) => ({
      ...t,
      colors: [...sourceColors],
    }));
    setBalloonConfig((prev) => ({ ...prev, types: newTypes }));
    toast.success("Cores sincronizadas!");
  };

  // Helpers para adicionar/remover produtos da seção (dentro do modal)
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

  if (loadingAuth) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-100">
        <Loader2 className="animate-spin text-purple-600 w-8 h-8" />
      </div>
    );
  }

  if (!currentUser) {
    return <AdminLogin />;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-xl shadow-sm gap-4">
          <div>
            <h1 className="text-2xl font-bold">Painel Mix Novidades</h1>
            <p className="text-xs text-slate-500">Gestão simplificada</p>
          </div>
          <div className="flex gap-2 flex-wrap justify-center md:justify-end">
            <Button
              onClick={saveAllSettings}
              className="bg-green-600 hover:bg-green-700 text-white gap-2 flex-1 md:flex-none"
            >
              <Save size={18} /> Salvar Configurações
            </Button>
            <Link href="/" target="_blank" className="flex-1 md:flex-none">
              <Button variant="outline" className="w-full">
                <Eye size={18} className="mr-2" /> Ver Loja
              </Button>
            </Link>
            <Button
              onClick={() => {
                signOut(auth);
              }}
              variant="ghost"
            >
              <LogOut size={16} />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-slate-400">
                  <MoreHorizontal size={18} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setIsSysToolsOpen(true)}
                  className="text-red-600 gap-2"
                >
                  <Database size={14} /> Ferramentas de Sistema
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex p-1 bg-slate-200/50 border border-slate-200 rounded-lg w-fit mt-6">
          <button
            onClick={() => setViewMode("orders")}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2",
              viewMode === "orders"
                ? "bg-white text-blue-700 shadow-sm font-bold"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <ShoppingBag size={16} /> Pedidos
          </button>
          <button
            onClick={() => setViewMode("inventory")}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2",
              viewMode === "inventory"
                ? "bg-white text-purple-700 shadow-sm font-bold"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Package size={16} /> Gerenciar Estoque
          </button>
        </div>

        {viewMode === "orders" ? (
          <OrdersTab />
        ) : (
          <Tabs defaultValue="products">
            <TabsList className="bg-white p-1 rounded-lg border w-full md:w-auto grid grid-cols-2 md:inline-flex h-auto">
              <TabsTrigger value="products" className="gap-2">
                <Package size={16} /> Produtos
              </TabsTrigger>
              <TabsTrigger value="sections" className="gap-2">
                <Layout size={16} /> Vitrine
              </TabsTrigger>
              <TabsTrigger value="balloons" className="gap-2">
                <PartyPopper size={16} /> Balões
              </TabsTrigger>
              <TabsTrigger value="ribbons" className="gap-2">
                <Scissors size={16} /> Fitas
              </TabsTrigger>
            </TabsList>

            {/* === ABA PRODUTOS === */}
            <TabsContent value="products">
              <div className="bg-white p-6 rounded-xl shadow-sm space-y-4">
                {/* BARRA DE FERRAMENTAS */}
                <div className="flex flex-col xl:flex-row justify-between gap-4 items-start xl:items-center">
                  <div className="flex flex-col md:flex-row gap-2 w-full xl:w-auto flex-1 flex-wrap">
                    <div className="relative grow md:grow-0 md:w-[300px]">
                      <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        size={18}
                      />
                      <Input
                        placeholder="Buscar por nome..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <div className="w-full md:w-[180px]">
                      <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger>
                          <div className="flex items-center gap-2">
                            <Filter size={14} className="text-slate-400" />{" "}
                            <SelectValue placeholder="Tipo" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">Todos os Tipos</SelectItem>
                          <SelectItem value="BASE_CONTAINER">
                            Base/Cesta
                          </SelectItem>
                          <SelectItem value="STANDARD_ITEM">
                            Recheio/Item
                          </SelectItem>
                          <SelectItem value="WRAPPER">
                            Saco/Embalagem
                          </SelectItem>
                          <SelectItem value="FILLER">Preenchimento</SelectItem>
                          <SelectItem value="ACCESSORY">Acessório</SelectItem>
                          <SelectItem value="RIBBON">Laço</SelectItem>
                          <SelectItem value="ASSEMBLED_KIT">
                            Kit Montado
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      setEditingProduct(null);
                      setIsModalOpen(true);
                    }}
                    className="bg-purple-600 w-full md:w-auto"
                  >
                    <Plus size={16} className="mr-2" /> Novo Produto
                  </Button>
                </div>

                <div className="border rounded-lg overflow-hidden overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="w-[60px]">Img</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="hidden md:table-cell">
                          Categ.
                        </TableHead>
                        <TableHead>Preço</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div className="w-8 h-8 bg-slate-100 rounded overflow-hidden relative border">
                              {product.imageUrl ? (
                                <SafeImage
                                  src={product.imageUrl}
                                  alt={product.name}
                                  name={product.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <Package
                                  className="m-auto text-slate-300"
                                  size={14}
                                />
                              )}
                            </div>
                          </TableCell>
                          <TableCell
                            className="font-medium max-w-[150px] truncate"
                            title={product.name}
                          >
                            {product.name}
                          </TableCell>
                          <TableCell>
                            {getProductTypeLabel(product.type)}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Badge variant="secondary" className="text-[10px]">
                              {product.category || "-"}
                            </Badge>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            R$ {product.price.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setProductToView(product)}
                                className="text-blue-500 hover:bg-blue-50 h-8 w-8"
                              >
                                <Eye size={16} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEditingProduct(product);
                                  setIsModalOpen(true);
                                }}
                                className="h-8 w-8"
                              >
                                <Pencil size={16} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteProduct(product.id)}
                                className="text-red-400 hover:text-red-600 h-8 w-8"
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredProducts.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-center py-12 text-slate-500"
                          >
                            Nenhum produto encontrado.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>

            {/* === ABA VITRINE === */}
            <TabsContent value="sections" className="space-y-4">
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
                      <div className="flex flex-col gap-1 text-slate-400">
                        <button
                          onClick={() => moveSection(index, "up")}
                          disabled={index === 0}
                          className="hover:text-blue-600 disabled:opacity-30"
                        >
                          <ArrowUp size={16} />
                        </button>
                        <button
                          onClick={() => moveSection(index, "down")}
                          disabled={
                            index === (settings.homeSections?.length || 0) - 1
                          }
                          className="hover:text-blue-600 disabled:opacity-30"
                        >
                          <ArrowDown size={16} />
                        </button>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-800">
                            {section.title}
                          </h3>
                          {!section.isActive && (
                            <Badge variant="outline" className="text-xs">
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
                            // Create new array with updated item
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
            </TabsContent>

            <TabsContent value="balloons" className="space-y-4">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                  <div>
                    <h2 className="text-2xl font-black text-slate-800">
                      Balões
                    </h2>
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
                    <div className="flex justify-end">
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
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <Plus size={16} className="mr-2" /> Novo Tipo de Balão
                      </Button>
                    </div>

                    <div className="space-y-6">
                      {balloonConfig.types.map((type, typeIndex) => (
                        <div
                          key={type.id}
                          className="border rounded-xl p-5 bg-slate-50 border-slate-200 space-y-6"
                        >
                          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                            <div className="flex-1 w-full">
                              <Label className="font-bold text-slate-700">
                                Nome do Tipo (ex: Simples, Metálico)
                              </Label>
                              <Input
                                value={type.name}
                                onChange={(e) => {
                                  const newTypes = [...balloonConfig.types];
                                  newTypes[typeIndex].name = e.target.value;
                                  setBalloonConfig({
                                    ...balloonConfig,
                                    types: newTypes,
                                  });
                                }}
                                className="bg-white mt-2 border-slate-200"
                              />
                            </div>
                            <div className="flex gap-1 mt-6">
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Duplicar este tipo"
                                onClick={() => handleDuplicateType(typeIndex)}
                                className="text-blue-500 hover:bg-blue-50"
                              >
                                <Copy size={16} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  if (confirm("Remover este tipo de balão?")) {
                                    const newTypes = balloonConfig.types.filter(
                                      (t) => t.id !== type.id
                                    );
                                    setBalloonConfig({
                                      ...balloonConfig,
                                      types: newTypes,
                                    });
                                  }
                                }}
                                className="text-red-400 hover:bg-red-50"
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <Label className="font-bold text-slate-700">
                                  Tamanhos e Preços
                                </Label>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Aplicar estes tamanhos a todos os outros modelos"
                                  className="h-7 px-2 text-[10px] text-purple-600 hover:text-purple-700 hover:bg-purple-50 font-bold"
                                  onClick={() =>
                                    handleSyncSizesToAll(typeIndex)
                                  }
                                >
                                  <Layers size={12} className="mr-1" /> Replicar
                                  p/ Todos
                                </Button>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-purple-200 text-purple-600 font-bold"
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
                                          ].price = parseFloat(e.target.value);
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
                                        ].unitsPerPackage = parseInt(
                                          e.target.value
                                        );
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
                                onClick={() => handleSyncColorsToAll(typeIndex)}
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
                                  placeholder="Nome da cor (ex: Azul Baby)"
                                  className="bg-white border-slate-200"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      const val = e.currentTarget.value.trim();
                                      if (val) {
                                        const suggestedHex =
                                          suggestHexColor(val) || "#CCCCCC";
                                        // Add color logic (complex because current types are string[])
                                        // We will store as "Name|Hex" string for backward compatibility or easy migration
                                        // OR we check if we can update the ID structure.
                                        // Let's stick to STRING for now but formatted as "Name|Hex" ?
                                        // No, that's messy.
                                        // Let's just assume the user wants the INTERFACE to look cool or maybe they want to see the color.
                                        // OK, let's look at the `type.colors` array. It is `string[]`.
                                        // I will simply add the string. The "AI" part might be just for show if I can't store Hex?
                                        // Wait, I can migrate the `string[]` to `Assignment[]`?
                                        // Let's stick to adding just the NAME for now, but if the user wants Hex, I might need to change the type.
                                        // Let's try to just add the Name, but use the `suggestHexColor` to show a preview toast?
                                        // "IA: Sugestão para Azul Baby é #89CFF0"
                                        // No, that's useless if not saved.

                                        // DECISION: I will upgrade the system to support "Name|Hex" strings in the array.
                                        // The frontend will parse them.
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
                        </div>
                      ))}
                    </div>
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
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-black">
                                  {type.name.charAt(0)}
                                </div>
                                <div>
                                  <h3 className="font-bold text-slate-800">
                                    {type.name}
                                  </h3>
                                  <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">
                                    {type.sizes.length} Tamanhos ·{" "}
                                    {type.colors.length} Cores
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm("Excluir modelo?")) {
                                      setBalloonConfig((prev) => ({
                                        ...prev,
                                        types: prev.types.filter(
                                          (t) => t.id !== type.id
                                        ),
                                      }));
                                    }
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
            </TabsContent>

            {/* === ABA FITAS === */}
            <TabsContent value="ribbons">
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
                      setEditingProduct({
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
                      setIsModalOpen(true);
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
                              <div className="flex items-center justify-between group hover:border-primary/30 transition-all">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 rounded-lg bg-white border overflow-hidden relative shadow-sm">
                                    <SafeImage
                                      src={fita.imageUrl}
                                      alt={fita.name}
                                      name={fita.name}
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-slate-800 text-sm leading-tight">
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
                                <div className="flex items-center gap-2">
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
                                    onClick={() => {
                                      setEditingProduct(fita);
                                      setIsModalOpen(true);
                                    }}
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
                                        RIBBON
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
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 rounded-lg bg-slate-50 border overflow-hidden relative">
                                    <SafeImage
                                      src={fita.imageUrl}
                                      alt={fita.name}
                                      name={fita.name}
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-slate-800 text-sm leading-tight">
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
                                <div className="flex items-center gap-2">
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
                                    onClick={() => {
                                      setEditingProduct(fita);
                                      setIsModalOpen(true);
                                    }}
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
                                        RIBBON
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
                                    "text-[10px] font-black uppercase",
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
                                    onClick={() => {
                                      setEditingProduct(fita);
                                      setIsModalOpen(true);
                                    }}
                                    className="h-8 w-8"
                                  >
                                    <Pencil size={14} />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={async () => {
                                      if (confirm("Excluir fita?")) {
                                        await deleteDoc(
                                          doc(db, "products", fita.id)
                                        );
                                        toast.success("Fita excluída");
                                      }
                                    }}
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
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* --- DISCREET SUPER ADMIN DIALOG --- */}
        <Dialog open={isSysToolsOpen} onOpenChange={setIsSysToolsOpen}>
          <DialogContent className="max-w-3xl bg-slate-900 border-slate-800 text-slate-100">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings2 className="text-red-500" /> Ferramentas de Sistema
                (Danger Zone)
              </DialogTitle>
            </DialogHeader>
            <SuperAdminZone />
          </DialogContent>
        </Dialog>

        {/* MODAL CONFIGURAR SEÇÃO (Mantido do original para não quebrar) */}
        <Dialog open={isSectionModalOpen} onOpenChange={setIsSectionModalOpen}>
          <DialogContent className="h-[85vh] flex flex-col bg-slate-50">
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
                      <Label>URL da Imagem do Banner</Label>
                      <Input
                        value={editingSection?.bannerUrl || ""}
                        onChange={(e) =>
                          setEditingSection((prev) =>
                            prev ? { ...prev, bannerUrl: e.target.value } : null
                          )
                        }
                        placeholder="https://exemplo.com/imagem.jpg"
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
                            <SelectItem value="BASE_CONTAINER">
                              Base/Cesta
                            </SelectItem>
                            <SelectItem value="STANDARD_ITEM">
                              Recheio/Item
                            </SelectItem>
                            <SelectItem value="ASSEMBLED_KIT">
                              Kit Montado
                            </SelectItem>
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
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded border bg-white overflow-hidden relative">
                                    {p.imageUrl ? (
                                      <SafeImage
                                        src={p.imageUrl}
                                        alt={p.name}
                                        name={p.name}
                                        fill
                                        className="object-cover"
                                      />
                                    ) : (
                                      <Package
                                        size={16}
                                        className="m-auto text-slate-300"
                                      />
                                    )}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-sm font-bold truncate max-w-[180px]">
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
                                    "h-8 px-3 rounded-full text-xs font-bold transition-all",
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

        {/* MODAL VIEW PRODUTO */}
        <Dialog
          open={!!productToView}
          onOpenChange={(o) => !o && setProductToView(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Visualizar Produto</DialogTitle>
              <DialogDescription>
                Página pública: <b>{productToView?.name}</b>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setProductToView(null)}>
                Cancelar
              </Button>
              <Button
                onClick={handleViewProduct}
                className="bg-blue-600 text-white gap-2"
              >
                <ExternalLink size={16} /> Abrir Página
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* MODAL EDITAR PRODUTO */}
        <ProductFormDialog
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          productToEdit={editingProduct}
          onSuccess={() => setIsModalOpen(false)}
          existingCategories={uniqueCategories}
        />
      </div>
    </div>
  );
}
