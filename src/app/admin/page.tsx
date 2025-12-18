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
import { db } from "@/lib/firebase";
import { Product, StoreSettings, StoreSection, SectionType } from "@/types";
// Definição local de Order para evitar conflitos se não estiver no types
type Order = {
  id: string;
  customerName: string;
  customerPhone?: string;
  total: number;
  status: string;
  createdAt: string; // ou Date
  paymentMethod: string;
};

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
} from "lucide-react";
import { ProductFormDialog } from "@/components/admin/ProductFormDialog";
import Link from "next/link";
import { SuperAdminZone } from "@/components/admin/SuperAdminZone";
import { SafeImage } from "@/components/ui/SafeImage";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<StoreSettings>({
    id: "general",
    storeName: "Mix Novidades",
    whatsappNumber: "",
    theme: { primaryColor: "#0f172a", activeTheme: "default" },
    filters: { activeCategories: [], categoryOrder: [] },
    homeSections: [],
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
  const [selectedTemplate, setSelectedTemplate] =
    useState<SectionType>("product_shelf");

  // Auth & Data
  useEffect(() => {
    if (localStorage.getItem("mix_admin_auth") === "true")
      setIsAuthenticated(true);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "admin123") {
      localStorage.setItem("mix_admin_auth", "true");
      setIsAuthenticated(true);
    } else toast.error("Senha errada");
  };

  useEffect(() => {
    if (!isAuthenticated) return;

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

    // Buscar Pedidos
    // Nota: Se der erro de índice no Firebase, remova o orderBy temporariamente
    const unsubOrd = onSnapshot(query(collection(db, "orders")), (s) =>
      setOrders(s.docs.map((d) => ({ id: d.id, ...d.data() } as Order)))
    );

    return () => {
      unsubProd();
      unsubSett();
      unsubOrd();
    };
  }, [isAuthenticated]);

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
      toast.success("Salvo com sucesso!");
    } catch (e) {
      toast.error("Erro ao salvar.");
    }
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

  if (!isAuthenticated)
    return (
      <div className="h-screen flex items-center justify-center bg-slate-100">
        <form
          onSubmit={handleLogin}
          className="bg-white p-8 rounded shadow w-full max-w-sm"
        >
          <h1 className="text-xl font-bold mb-4">Login Admin</h1>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha"
          />
          <Button className="w-full mt-2">Entrar</Button>
        </form>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-xl shadow-sm gap-4">
          <div>
            <h1 className="text-2xl font-bold">Painel Mix Novidades</h1>
            <p className="text-xs text-slate-500">Gestão simplificada</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={saveAllSettings}
              className="bg-green-600 hover:bg-green-700 text-white gap-2"
            >
              <Save size={18} /> Salvar Configurações
            </Button>
            <Link href="/" target="_blank">
              <Button variant="outline">
                <Eye size={18} className="mr-2" /> Ver Loja
              </Button>
            </Link>
            <Button
              onClick={() => {
                localStorage.removeItem("mix_admin_auth");
                setIsAuthenticated(false);
              }}
              variant="ghost"
            >
              <LogOut size={16} />
            </Button>
          </div>
        </div>

        <Tabs defaultValue="orders">
          <TabsList className="bg-white p-1 rounded-lg border w-full md:w-auto flex flex-wrap">
            <TabsTrigger value="orders" className="gap-2 flex-1 md:flex-none">
              <ShoppingBag size={16} /> Pedidos
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-2 flex-1 md:flex-none">
              <Package size={16} /> Produtos
            </TabsTrigger>
            <TabsTrigger value="sections" className="gap-2 flex-1 md:flex-none">
              <Layout size={16} /> Vitrine
            </TabsTrigger>
            <TabsTrigger value="seed" className="gap-2 text-red-600">
              <Database size={16} /> Seed / Sistema
            </TabsTrigger>
          </TabsList>

          {/* === ABA PEDIDOS === */}
          <TabsContent value="orders">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h2 className="text-lg font-bold text-slate-800 mb-4">
                Pedidos Recentes
              </h2>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-xs text-slate-500">
                          #{order.id?.slice(0, 6)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-800">
                              {order.customerName}
                            </span>
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                              <Phone size={10} /> {order.customerPhone || "N/A"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-slate-800 whitespace-nowrap">
                          R$ {order.total.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {getOrderStatusBadge(order.status)}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <Link
                            href={`https://wa.me/55${(
                              order.customerPhone || ""
                            ).replace(/\D/g, "")}`}
                            target="_blank"
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50 gap-2"
                            >
                              <MessageCircle size={16} />{" "}
                              <span className="hidden md:inline">WhatsApp</span>
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                    {orders.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-12 text-slate-500"
                        >
                          Nenhum pedido recebido ainda.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

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
                        <SelectItem value="WRAPPER">Saco/Embalagem</SelectItem>
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

              <div className="border rounded-lg overflow-hidden">
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
                    className="flex items-center gap-4 p-4 bg-slate-50 border rounded-lg group"
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
                      <h3 className="font-bold text-slate-800">
                        {section.title}
                      </h3>
                      <p className="text-xs text-slate-500">{section.type}</p>
                    </div>
                    <div className="flex items-center gap-2">
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

          {/* === ABA SEED / SISTEMA === */}
          <TabsContent value="seed">
            <SuperAdminZone />
          </TabsContent>
        </Tabs>

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

                {/* Seletor simplificado de produtos para exemplo */}
                {selectedTemplate === "product_shelf" && (
                  <div className="flex flex-col gap-2">
                    <Label>Adicionar Produtos (Clique no +)</Label>
                    <ScrollArea className="h-[200px] border rounded p-2">
                      {allProducts.map((p) => (
                        <div
                          key={p.id}
                          className="flex justify-between items-center p-2 hover:bg-slate-100 cursor-pointer"
                          onClick={() => addProductToSection(p.id)}
                        >
                          <span className="text-sm">{p.name}</span>
                          <Plus size={14} className="text-green-600" />
                        </div>
                      ))}
                    </ScrollArea>
                    <div className="text-xs text-slate-500">
                      Selecionados: {editingSection?.productIds.length}
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
