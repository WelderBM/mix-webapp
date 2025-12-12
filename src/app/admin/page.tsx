"use client";

import { useEffect, useState, useMemo } from "react";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Product,
  StoreSettings,
  Order,
  OrderStatus,
  StoreSection,
} from "@/lib/types";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  LogOut,
  Search,
  Package,
  Palette,
  Settings,
  Layout,
  ArrowUp,
  ArrowDown,
  Save,
  X,
  ListFilter,
  Filter,
  ShoppingBag,
  Eye,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  Bike,
} from "lucide-react";
import { ProductFormDialog } from "@/components/admin/ProductFormDialog";
import { OrderDetailsSheet } from "@/components/admin/OrderDetailsSheet";
import { ThemePreview } from "@/components/admin/ThemePreview";
import { adjustColor } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");

  // Dados Principais
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<StoreSettings>({
    id: "general",
    storeName: "Mix WebApp",
    whatsappNumber: "",
    theme: { primaryColor: "#7c3aed" },
    filters: { activeCategories: [], categoryOrder: [] },
    homeSections: [], // Inicializa vazio
  });

  // Filtros de Produto
  const [searchTerm, setSearchTerm] = useState("");
  const [adminTypeFilter, setAdminTypeFilter] = useState("ALL");
  const [adminCategoryFilter, setAdminCategoryFilter] = useState("ALL");

  // Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isOrderSheetOpen, setIsOrderSheetOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // --- ESTADOS DE SEÇÃO (NOVO) ---
  const [editingSection, setEditingSection] = useState<StoreSection | null>(
    null
  );
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [sectionSearchTerm, setSectionSearchTerm] = useState("");

  // Auth
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

  // Data Fetching
  useEffect(() => {
    if (!isAuthenticated) return;
    const unsubProd = onSnapshot(
      query(collection(db, "products"), orderBy("name")),
      (s) =>
        setAllProducts(
          s.docs.map((d) => ({ id: d.id, ...d.data() } as Product))
        )
    );
    const unsubSett = onSnapshot(doc(db, "settings", "general"), (s) => {
      if (s.exists()) setSettings(s.data() as StoreSettings);
    });
    const unsubOrd = onSnapshot(
      query(collection(db, "orders"), orderBy("createdAt", "desc")),
      (s) => setOrders(s.docs.map((d) => ({ id: d.id, ...d.data() } as Order)))
    );
    return () => {
      unsubProd();
      unsubSett();
      unsubOrd();
    };
  }, [isAuthenticated]);

  // --- UTILS DE PRODUTO ---
  const availableCategories = useMemo(() => {
    let prods = allProducts;
    if (adminTypeFilter !== "ALL")
      prods = prods.filter((p) => p.type === adminTypeFilter);
    return Array.from(new Set(prods.map((p) => p.category))).sort();
  }, [allProducts, adminTypeFilter]);

  const filteredProducts = useMemo(() => {
    return allProducts.filter((p) => {
      const matchName = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = adminTypeFilter === "ALL" || p.type === adminTypeFilter;
      const matchCat =
        adminCategoryFilter === "ALL" || p.category === adminCategoryFilter;
      return matchName && matchType && matchCat;
    });
  }, [allProducts, searchTerm, adminTypeFilter, adminCategoryFilter]);

  // --- AÇÕES GERAIS ---
  const toggleProductStatus = async (product: Product) => {
    await updateDoc(doc(db, "products", product.id), {
      inStock: !product.inStock,
    });
  };
  const confirmDelete = async () => {
    if (deleteId) {
      await deleteDoc(doc(db, "products", deleteId));
      setDeleteId(null);
      toast.success("Excluído!");
    }
  };

  // --- AÇÕES DE SEÇÃO (CRUD & ORDEM) ---
  const handleSaveSection = () => {
    if (!editingSection) return;
    setSettings((prev) => {
      const currentSections = prev.homeSections || []; // Garante array
      const exists = currentSections.find((s) => s.id === editingSection.id);
      let newSections;
      if (exists) {
        newSections = currentSections.map((s) =>
          s.id === editingSection.id ? editingSection : s
        );
      } else {
        newSections = [...currentSections, editingSection];
      }
      return { ...prev, homeSections: newSections };
    });
    setIsSectionModalOpen(false);
  };

  const deleteSection = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      homeSections: prev.homeSections.filter((s) => s.id !== id),
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
    setSettings((prev) => ({ ...prev, homeSections: newSections }));
  };

  // Dentro do Modal de Seção
  const addProductToSection = (productId: string) => {
    if (editingSection && !editingSection.productIds.includes(productId)) {
      setEditingSection({
        ...editingSection,
        productIds: [...editingSection.productIds, productId],
      });
    }
  };
  const removeProductFromSection = (productId: string) => {
    if (editingSection)
      setEditingSection({
        ...editingSection,
        productIds: editingSection.productIds.filter((id) => id !== productId),
      });
  };
  const moveProductInSection = (index: number, direction: "up" | "down") => {
    if (!editingSection) return;
    const newIds = [...editingSection.productIds];
    if (direction === "up" && index > 0)
      [newIds[index], newIds[index - 1]] = [newIds[index - 1], newIds[index]];
    if (direction === "down" && index < newIds.length - 1)
      [newIds[index], newIds[index + 1]] = [newIds[index + 1], newIds[index]];
    setEditingSection({ ...editingSection, productIds: newIds });
  };

  const saveAllSettings = async () => {
    try {
      await setDoc(doc(db, "settings", "general"), settings);
      toast.success("Loja atualizada!");
    } catch (e) {
      toast.error("Erro ao salvar.");
    }
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
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-xl shadow-sm gap-4">
          <h1 className="text-2xl font-bold">Painel Mix</h1>
          <div className="flex gap-2">
            <Button
              onClick={saveAllSettings}
              className="bg-green-600 hover:bg-green-700 text-white gap-2"
            >
              <Save size={18} /> Salvar Alterações da Loja
            </Button>
            <Link href="/" target="_blank">
              <Button variant="outline">Ver Loja</Button>
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

        <Tabs defaultValue="sections">
          <TabsList className="bg-white p-1 rounded-lg border w-full md:w-auto flex flex-wrap">
            <TabsTrigger value="sections" className="gap-2 flex-1 md:flex-none">
              <Layout size={16} /> Vitrine (Seções)
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-2 flex-1 md:flex-none">
              <Package size={16} /> Produtos
            </TabsTrigger>
            <TabsTrigger
              value="appearance"
              className="gap-2 flex-1 md:flex-none"
            >
              <Palette size={16} /> Aparência
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2 flex-1 md:flex-none">
              <ShoppingBag size={16} /> Pedidos
            </TabsTrigger>
          </TabsList>

          {/* ABA: VITRINE (SEÇÕES) */}
          <TabsContent value="sections" className="space-y-4">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    Organização da Home
                  </h2>
                  <p className="text-sm text-slate-500">
                    Crie seções personalizadas para sua vitrine.
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setEditingSection({
                      id: crypto.randomUUID(),
                      title: "Nova Seção",
                      type: "manual",
                      productIds: [],
                      isActive: true,
                    });
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
                    className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg group hover:border-purple-200 transition-colors"
                  >
                    <div className="flex items-center gap-4">
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
                      <div>
                        <h3 className="font-bold text-slate-800">
                          {section.title}
                        </h3>
                        <div className="flex gap-2 items-center">
                          <Badge variant="secondary" className="text-xs">
                            {section.productIds.length} produtos
                          </Badge>
                          {!section.isActive && (
                            <Badge
                              variant="outline"
                              className="text-xs text-red-500 border-red-200"
                            >
                              Oculta
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Switch
                        checked={section.isActive}
                        onCheckedChange={(c) => {
                          const ns = [...settings.homeSections];
                          ns[index].isActive = c;
                          setSettings({ ...settings, homeSections: ns });
                        }}
                      />
                      <div className="h-6 w-px bg-slate-200 mx-2" />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingSection(section);
                          setIsSectionModalOpen(true);
                        }}
                      >
                        <Pencil size={14} className="mr-2" /> Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteSection(section.id)}
                        className="text-red-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
                {(!settings.homeSections ||
                  settings.homeSections.length === 0) && (
                  <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                    <p className="text-slate-400 mb-2">
                      Sua vitrine está vazia.
                    </p>
                    <Button
                      variant="link"
                      onClick={() => {
                        setEditingSection({
                          id: crypto.randomUUID(),
                          title: "Destaques",
                          type: "manual",
                          productIds: [],
                          isActive: true,
                        });
                        setIsSectionModalOpen(true);
                      }}
                    >
                      Criar primeira seção
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ABA: PRODUTOS (Com Filtro em Camadas) */}
          <TabsContent value="products" className="space-y-4">
            <div className="flex flex-col xl:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm gap-4">
              <div className="flex flex-col md:flex-row gap-2 w-full xl:w-auto flex-1">
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="md:max-w-xs"
                />
                <Select
                  value={adminTypeFilter}
                  onValueChange={(v) => {
                    setAdminTypeFilter(v);
                    setAdminCategoryFilter("ALL");
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos os Tipos</SelectItem>
                    <SelectItem value="STANDARD_ITEM">Produtos</SelectItem>
                    <SelectItem value="RIBBON">Fitas</SelectItem>
                    <SelectItem value="BASE_CONTAINER">Bases</SelectItem>
                    <SelectItem value="FILLER">Enchimentos</SelectItem>
                    <SelectItem value="SUPPLY_BULK">Atacado</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={adminCategoryFilter}
                  onValueChange={setAdminCategoryFilter}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todas</SelectItem>
                    {availableCategories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => {
                  setEditingProduct(null);
                  setIsModalOpen(true);
                }}
                className="bg-purple-600"
              >
                <Plus size={16} className="mr-2" /> Novo Produto
              </Button>
            </div>

            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Cat.</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.slice(0, 20).map((p) => (
                    <TableRow
                      key={p.id}
                      className={!p.inStock ? "opacity-60 bg-slate-50" : ""}
                    >
                      <TableCell>
                        <Switch
                          checked={p.inStock}
                          onCheckedChange={() => toggleProductStatus(p)}
                        />
                      </TableCell>
                      <TableCell className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded border relative overflow-hidden">
                          {p.imageUrl && (
                            <Image
                              src={p.imageUrl}
                              alt=""
                              fill
                              className="object-cover"
                            />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{p.name}</div>
                          {p.variants && p.variants.length > 0 && (
                            <span className="text-[10px] text-blue-600 font-bold">
                              +{p.variants.length} variações
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{p.category}</Badge>
                      </TableCell>
                      <TableCell>R$ {p.price.toFixed(2)}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingProduct(p);
                            setIsModalOpen(true);
                          }}
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(p.id)}
                          className="text-red-500"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* ABA: APARÊNCIA (Cor Única + Preview) */}
          <TabsContent value="appearance">
            <div className="bg-white p-6 rounded-xl shadow-sm flex flex-col xl:flex-row gap-8">
              <div className="flex-1 space-y-6">
                <h2 className="text-lg font-bold">Identidade Visual</h2>
                <div className="p-4 border rounded-xl bg-slate-50 space-y-4">
                  <Label>Cor Principal da Marca</Label>
                  <div className="flex gap-4 items-center">
                    <div className="relative">
                      <Input
                        type="color"
                        value={settings.theme.primaryColor}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            theme: { primaryColor: e.target.value },
                          })
                        }
                        className="w-20 h-20 p-1 rounded-xl cursor-pointer shadow-sm border-2 border-white"
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        value={settings.theme.primaryColor}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            theme: { primaryColor: e.target.value },
                          })
                        }
                        className="uppercase font-mono text-lg tracking-widest mb-2"
                      />
                      <p className="text-xs text-slate-500">
                        Esta cor define toda a identidade do site. Cores
                        secundárias e de contraste serão geradas
                        automaticamente.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-1 flex flex-col items-center border-l pl-8">
                <Label className="mb-4 block text-slate-400 uppercase text-xs font-bold">
                  Simulação em Tempo Real
                </Label>
                <ThemePreview
                  primaryColor={settings.theme.primaryColor}
                  secondaryColor={adjustColor(settings.theme.primaryColor, -20)}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="orders">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h2 className="font-bold mb-4">Últimos Pedidos</h2>
              {/* Tabela de pedidos simplificada para brevidade */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell>{o.customerName}</TableCell>
                      <TableCell>R$ {o.total.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{o.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedOrder(o);
                            setIsOrderSheetOpen(true);
                          }}
                        >
                          <Eye size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>

        {/* MODAL DE EDIÇÃO DE SEÇÃO */}
        <Dialog open={isSectionModalOpen} onOpenChange={setIsSectionModalOpen}>
          <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Editar Seção da Home</DialogTitle>
            </DialogHeader>
            <div className="flex-1 flex flex-col gap-4 overflow-hidden py-2">
              <div>
                <Label>Título da Seção</Label>
                <Input
                  value={editingSection?.title}
                  onChange={(e) =>
                    setEditingSection((prev) =>
                      prev ? { ...prev, title: e.target.value } : null
                    )
                  }
                  placeholder="Ex: Ofertas da Semana"
                />
              </div>

              <div className="flex gap-4 flex-1 min-h-0">
                {/* Esquerda: Buscar Produtos */}
                <div className="flex-1 flex flex-col border rounded-lg bg-slate-50 overflow-hidden">
                  <div className="p-2 border-b bg-white">
                    <Input
                      placeholder="Buscar produto para adicionar..."
                      value={sectionSearchTerm}
                      onChange={(e) => setSectionSearchTerm(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                  <ScrollArea className="flex-1 p-2">
                    {allProducts
                      .filter((p) =>
                        p.name
                          .toLowerCase()
                          .includes(sectionSearchTerm.toLowerCase())
                      )
                      .slice(0, 50)
                      .map((p) => (
                        <div
                          key={p.id}
                          className="flex justify-between items-center p-2 hover:bg-white rounded cursor-pointer text-sm group"
                          onClick={() => addProductToSection(p.id)}
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <div className="w-8 h-8 bg-gray-200 rounded shrink-0 relative">
                              {p.imageUrl && (
                                <Image
                                  src={p.imageUrl}
                                  alt=""
                                  fill
                                  className="object-cover"
                                />
                              )}
                            </div>
                            <span className="truncate">{p.name}</span>
                          </div>
                          <Plus
                            size={16}
                            className="text-green-600 opacity-0 group-hover:opacity-100"
                          />
                        </div>
                      ))}
                  </ScrollArea>
                </div>

                {/* Centro: Ícone Seta */}
                <div className="flex items-center text-slate-300">
                  <ArrowUp size={24} className="rotate-90" />
                </div>

                {/* Direita: Produtos Selecionados (Ordenáveis) */}
                <div className="flex-1 flex flex-col border rounded-lg bg-white overflow-hidden border-blue-100">
                  <div className="p-2 border-b bg-blue-50 text-blue-800 font-semibold text-xs flex justify-between">
                    <span>Produtos na Seção</span>
                    <span>{editingSection?.productIds.length} itens</span>
                  </div>
                  <ScrollArea className="flex-1 p-2">
                    {editingSection?.productIds.map((id, index) => {
                      const prod = allProducts.find((p) => p.id === id);
                      if (!prod) return null;
                      return (
                        <div
                          key={id}
                          className="flex items-center gap-2 p-2 border-b last:border-0 bg-slate-50 mb-1 rounded group"
                        >
                          <div className="flex flex-col gap-0.5 text-slate-400">
                            <button
                              onClick={() => moveProductInSection(index, "up")}
                              disabled={index === 0}
                              className="hover:text-blue-600 disabled:opacity-20"
                            >
                              <ArrowUp size={14} />
                            </button>
                            <button
                              onClick={() =>
                                moveProductInSection(index, "down")
                              }
                              disabled={
                                index === editingSection.productIds.length - 1
                              }
                              className="hover:text-blue-600 disabled:opacity-20"
                            >
                              <ArrowDown size={14} />
                            </button>
                          </div>
                          <div className="w-8 h-8 relative bg-gray-200 rounded overflow-hidden flex-shrink-0">
                            {prod.imageUrl && (
                              <Image
                                src={prod.imageUrl}
                                alt=""
                                fill
                                className="object-cover"
                              />
                            )}
                          </div>
                          <span className="text-xs truncate flex-1 font-medium">
                            {prod.name}
                          </span>
                          <button
                            onClick={() => removeProductFromSection(id)}
                            className="text-red-400 hover:bg-red-50 p-1 rounded"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      );
                    })}
                    {editingSection?.productIds.length === 0 && (
                      <div className="text-center text-xs text-slate-400 py-10">
                        Arraste ou clique nos produtos à esquerda para
                        adicionar.
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSaveSection} className="bg-green-600">
                Concluir Seção
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* OUTROS MODAIS */}
        <ProductFormDialog
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          productToEdit={editingProduct}
          onSuccess={() => setIsModalOpen(false)}
          existingCategories={Array.from(
            new Set(allProducts.map((p) => p.category))
          )}
        />
        <OrderDetailsSheet
          isOpen={isOrderSheetOpen}
          onClose={() => setIsOrderSheetOpen(false)}
          order={selectedOrder}
          onStatusChange={() => {}}
          onCopyDelivery={() => {}}
        />
        <AlertDialog
          open={!!deleteId}
          onOpenChange={(open) => !open && setDeleteId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir?</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Não</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-red-600">
                Sim
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
