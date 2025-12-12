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
  ProductType,
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
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  CheckCircle,
  Clock,
  Truck,
  XCircle,
  Bike,
  Eye,
  Filter,
  ListFilter,
  ArrowUp,
  ArrowDown,
  Save,
} from "lucide-react";
import { ProductFormDialog } from "@/components/admin/ProductFormDialog";
import { OrderDetailsSheet } from "@/components/admin/OrderDetailsSheet";
import { ThemePreview } from "@/components/admin/ThemePreview"; // Simulador Visual
import { HOME_CATEGORY_GROUPS } from "@/lib/category_groups";
import Image from "next/image";
import Link from "next/link";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");

  // --- DADOS ---
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // --- FILTROS & PAGINAÇÃO ---
  const [searchTerm, setSearchTerm] = useState("");
  const [adminTypeFilter, setAdminTypeFilter] = useState<string>("ALL"); // Filtro Nível 1
  const [adminCategoryFilter, setAdminCategoryFilter] = useState("ALL"); // Filtro Nível 2
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // --- CONFIGURAÇÕES ---
  const [settings, setSettings] = useState<StoreSettings>({
    id: "general",
    storeName: "Mix WebApp",
    whatsappNumber: "",
    theme: {
      primaryColor: "#7c3aed",
      secondaryColor: "#16a34a",
      accentColor: "#f97316",
      backgroundColor: "#f8fafc",
    },
    filters: { activeCategories: [], categoryOrder: [] },
  });

  // Estado local para reordenação visual dos grupos antes de salvar
  const [orderedGroups, setOrderedGroups] = useState<string[]>([]);

  // --- MODAIS ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isOrderSheetOpen, setIsOrderSheetOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // --- AUTH ---
  useEffect(() => {
    const auth = localStorage.getItem("mix_admin_auth");
    if (auth === "true") setIsAuthenticated(true);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "admin123") {
      localStorage.setItem("mix_admin_auth", "true");
      setIsAuthenticated(true);
      toast.success("Bem-vindo ao Painel!");
    } else {
      toast.error("Senha incorreta");
    }
  };

  // --- DATA FETCHING (REALTIME) ---
  useEffect(() => {
    if (!isAuthenticated) return;

    // 1. Produtos
    const qProd = query(collection(db, "products"), orderBy("name"));
    const unsubProd = onSnapshot(qProd, (snapshot) => {
      const prods = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Product)
      );
      setAllProducts(prods);
      setLoading(false);
    });

    // 2. Configurações & Inicialização da Ordem
    const unsubSettings = onSnapshot(
      doc(db, "settings", "general"),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as StoreSettings;
          setSettings(data);

          // Lógica de Ordem: Usa a salva ou a padrão do arquivo
          const defaultGroups = Object.keys(HOME_CATEGORY_GROUPS);
          if (data.filters?.categoryOrder?.length > 0) {
            const savedOrder = data.filters.categoryOrder;
            // Adiciona novos grupos que porventura tenham surgido no código
            const newGroups = defaultGroups.filter(
              (g) => !savedOrder.includes(g)
            );
            setOrderedGroups([...savedOrder, ...newGroups]);
          } else {
            setOrderedGroups(defaultGroups);
          }
        }
      }
    );

    // 3. Pedidos
    const qOrders = query(
      collection(db, "orders"),
      orderBy("createdAt", "desc")
    );
    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      const ords = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Order)
      );
      setOrders(ords);
    });

    return () => {
      unsubProd();
      unsubSettings();
      unsubOrders();
    };
  }, [isAuthenticated]);

  // --- LÓGICA DE FILTROS ---
  useEffect(() => {
    let results = allProducts;

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      results = results.filter(
        (p) =>
          p.name.toLowerCase().includes(lowerTerm) ||
          p.category.toLowerCase().includes(lowerTerm)
      );
    }

    if (adminTypeFilter !== "ALL") {
      results = results.filter((p) => p.type === adminTypeFilter);
    }

    if (adminCategoryFilter !== "ALL") {
      results = results.filter((p) => p.category === adminCategoryFilter);
    }

    setFilteredProducts(results);
    setCurrentPage(1);
  }, [searchTerm, adminTypeFilter, adminCategoryFilter, allProducts]);

  // Categorias disponíveis dinâmicas (baseadas no Tipo selecionado)
  const availableCategories = useMemo(() => {
    let prods = allProducts;
    if (adminTypeFilter !== "ALL") {
      prods = prods.filter((p) => p.type === adminTypeFilter);
    }
    return Array.from(new Set(prods.map((p) => p.category))).sort();
  }, [allProducts, adminTypeFilter]);

  // Todas as categorias (para o modal de edição)
  const allCategoriesForModal = Array.from(
    new Set(allProducts.map((p) => p.category))
  ).sort();

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // --- AÇÕES GERAIS ---
  const toggleProductStatus = async (product: Product) => {
    await updateDoc(doc(db, "products", product.id), {
      inStock: !product.inStock,
    });
    toast.success(`Produto ${!product.inStock ? "ativado" : "desativado"}`);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      await deleteDoc(doc(db, "products", deleteId));
      setDeleteId(null);
      toast.success("Produto excluído com sucesso.");
    }
  };

  // --- AÇÕES DE SETTINGS (CORES E ORDEM) ---
  const updateThemeColor = (
    key: keyof StoreSettings["theme"],
    value: string
  ) => {
    setSettings((prev) => ({
      ...prev,
      theme: { ...prev.theme, [key]: value },
    }));
  };

  const moveGroup = (index: number, direction: "up" | "down") => {
    const newOrder = [...orderedGroups];
    if (direction === "up" && index > 0) {
      [newOrder[index], newOrder[index - 1]] = [
        newOrder[index - 1],
        newOrder[index],
      ];
    } else if (direction === "down" && index < newOrder.length - 1) {
      [newOrder[index], newOrder[index + 1]] = [
        newOrder[index + 1],
        newOrder[index],
      ];
    }
    setOrderedGroups(newOrder);
    setSettings((prev) => ({
      ...prev,
      filters: { ...prev.filters, categoryOrder: newOrder },
    }));
  };

  const saveSettings = async () => {
    try {
      await setDoc(doc(db, "settings", "general"), settings);
      toast.success("Configurações salvas e aplicadas na loja!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar.");
    }
  };

  // --- AÇÕES DE PEDIDO ---
  const handleStatusChange = async (
    orderId: string,
    newStatus: OrderStatus
  ) => {
    await updateDoc(doc(db, "orders", orderId), { status: newStatus });
    toast.info("Status atualizado.");
  };

  const handleCopyDeliveryInfo = (order: Order) => {
    const storeAddress =
      "Mix Novidades (Rua Pedro Aldemar Bantim, 945 - Silvio Botelho)";
    const shortId = order.id.slice(0, 5).toUpperCase();
    const totalValue = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(order.total);
    let paymentInstruction =
      order.paymentTiming === "prepaid"
        ? "✅ **JÁ PAGO** (Apenas entregar)"
        : `💰 **COBRAR NA ENTREGA:** ${totalValue} (${
            order.paymentMethod === "pix" ? "Pix" : "Dinheiro"
          })`;
    const text =
      `🛵 *COTAR ENTREGA #${shortId}*\n\n` +
      `📍 *Retirada:* ${storeAddress}\n` +
      `🏁 *Entrega:* ${order.address}\n` +
      `👤 *Cliente:* ${order.customerName || "Não informado"}\n` +
      `${paymentInstruction}\n` +
      `📦 *Volume:* ${order.items.length} itens`;
    navigator.clipboard.writeText(text);
    toast.success("Texto copiado! Cole no WhatsApp.");
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsOrderSheetOpen(true);
  };
  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "processing":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "delivering":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  const getStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return "Pendente";
      case "processing":
        return "Separando";
      case "delivering":
        return "Em Entrega";
      case "completed":
        return "Concluído";
      case "cancelled":
        return "Cancelado";
      default:
        return status;
    }
  };

  if (!isAuthenticated)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <form
          onSubmit={handleLogin}
          className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm space-y-4"
        >
          <h1 className="text-2xl font-bold text-center text-slate-800">
            Mix Admin
          </h1>
          <Input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" className="w-full">
            Entrar
          </Button>
        </form>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Painel de Controle
            </h1>
            <p className="text-slate-500 text-sm">
              Gerencie produtos, aparência e regras.
            </p>
          </div>
          <div className="flex gap-3">
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

        <Tabs defaultValue="orders" className="w-full space-y-6">
          <TabsList className="bg-white p-1 rounded-lg border shadow-sm">
            <TabsTrigger value="orders" className="gap-2">
              <ShoppingBag size={16} /> Pedidos
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-2">
              <Package size={16} /> Produtos
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2">
              <Palette size={16} /> Aparência
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings size={16} /> Seções Home
            </TabsTrigger>
          </TabsList>

          {/* ABA PRODUTOS */}
          <TabsContent value="products" className="space-y-4">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center bg-white p-4 rounded-xl shadow-sm gap-4">
              <div className="flex flex-col md:flex-row gap-2 w-full xl:w-auto flex-1">
                <div className="relative flex-1 md:max-w-xs">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                  />
                  <Input
                    placeholder="Buscar por nome..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* FILTRO 1: TIPO */}
                <Select
                  value={adminTypeFilter}
                  onValueChange={(val) => {
                    setAdminTypeFilter(val);
                    setAdminCategoryFilter("ALL");
                  }}
                >
                  <SelectTrigger className="w-full md:w-[200px]">
                    <div className="flex items-center gap-2 text-slate-600">
                      <ListFilter size={16} />
                      <SelectValue placeholder="Tipo" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos os Tipos</SelectItem>
                    <SelectItem value="STANDARD_ITEM">Padrão</SelectItem>
                    <SelectItem value="RIBBON">Fitas & Laços</SelectItem>
                    <SelectItem value="BASE_CONTAINER">Bases</SelectItem>
                    <SelectItem value="FILLER">Enchimentos</SelectItem>
                    <SelectItem value="WRAPPER">Embalagens</SelectItem>
                    <SelectItem value="SUPPLY_BULK">Atacado</SelectItem>
                  </SelectContent>
                </Select>

                {/* FILTRO 2: CATEGORIA */}
                <Select
                  value={adminCategoryFilter}
                  onValueChange={setAdminCategoryFilter}
                >
                  <SelectTrigger className="w-full md:w-[200px]">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Filter size={16} />
                      <SelectValue placeholder="Categoria" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todas Categorias</SelectItem>
                    {availableCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
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
                className="bg-purple-600 hover:bg-purple-700 w-full md:w-auto"
              >
                <Plus size={16} className="mr-2" /> Novo Produto
              </Button>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedProducts.map((product) => (
                      <TableRow
                        key={product.id}
                        className={
                          !product.inStock ? "opacity-60 bg-slate-50" : ""
                        }
                      >
                        <TableCell>
                          <Switch
                            checked={product.inStock}
                            onCheckedChange={() => toggleProductStatus(product)}
                          />
                        </TableCell>
                        <TableCell className="flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded bg-slate-100 overflow-hidden shrink-0 border border-slate-100">
                            {product.imageUrl && (
                              <Image
                                src={product.imageUrl}
                                alt=""
                                fill
                                className="object-cover"
                              />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium">{product.name}</span>
                            {product.variants &&
                              product.variants.length > 0 && (
                                <span className="text-[10px] text-blue-600 font-bold">
                                  +{product.variants.length} variações
                                </span>
                              )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {product.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell>
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(product.price)}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingProduct(product);
                              setIsModalOpen(true);
                            }}
                          >
                            <Pencil size={16} className="text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(product.id)}
                          >
                            <Trash2 size={16} className="text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <div className="p-4 flex items-center justify-between border-t">
                <span className="text-sm text-slate-500">
                  Página {currentPage} de {totalPages || 1}
                </span>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                  >
                    <ChevronLeft size={16} /> Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages || totalPages === 0}
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    Próximo <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ABA PEDIDOS */}
          <TabsContent value="orders" className="space-y-4">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <ShoppingBag className="text-purple-600" /> Gestão de Pedidos
              </h2>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="w-[50px] text-center">
                        Ver
                      </TableHead>
                      <TableHead>Info</TableHead>
                      <TableHead>Entrega</TableHead>
                      <TableHead>Pagamento</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">
                        Ações Rápidas
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-10 text-slate-500"
                        >
                          Nenhum pedido recebido ainda.
                        </TableCell>
                      </TableRow>
                    ) : (
                      orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="text-center">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-purple-600 hover:bg-purple-50"
                              onClick={() => handleViewOrder(order)}
                            >
                              <Eye size={20} />
                            </Button>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-mono text-xs text-slate-500">
                                #{order.id.slice(0, 5).toUpperCase()}
                              </span>
                              <span className="font-medium text-slate-800">
                                {order.customerName || "Cliente"}
                              </span>
                              <span className="text-xs text-slate-400">
                                {new Date(order.createdAt).toLocaleDateString(
                                  "pt-BR"
                                )}{" "}
                                •{" "}
                                {new Date(order.createdAt).toLocaleTimeString(
                                  "pt-BR",
                                  { hour: "2-digit", minute: "2-digit" }
                                )}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {order.deliveryMethod === "pickup" ? (
                              <Badge
                                variant="secondary"
                                className="bg-slate-100 text-slate-600"
                              >
                                Retirada
                              </Badge>
                            ) : (
                              <div className="flex flex-col gap-1 max-w-[180px]">
                                <Badge
                                  variant="secondary"
                                  className="bg-blue-50 text-blue-700 w-fit"
                                >
                                  Entrega
                                </Badge>
                                <span
                                  className="text-xs text-slate-500 truncate"
                                  title={order.address}
                                >
                                  {order.address}
                                </span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm capitalize">
                              {order.paymentMethod}
                            </span>
                          </TableCell>
                          <TableCell className="font-bold text-slate-700">
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(order.total)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`border ${getStatusColor(
                                order.status
                              )}`}
                            >
                              {getStatusLabel(order.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              {order.deliveryMethod === "delivery" && (
                                <Button
                                  size="sm"
                                  className="h-8 w-8 p-0 bg-slate-900 hover:bg-slate-700 text-white mr-2"
                                  onClick={() => handleCopyDeliveryInfo(order)}
                                >
                                  <Bike size={16} />
                                </Button>
                              )}
                              {order.status === "pending" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-blue-600"
                                  onClick={() =>
                                    handleStatusChange(order.id, "processing")
                                  }
                                >
                                  <Clock size={16} />
                                </Button>
                              )}
                              {order.status === "processing" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-purple-600"
                                  onClick={() =>
                                    handleStatusChange(order.id, "delivering")
                                  }
                                >
                                  <Truck size={16} />
                                </Button>
                              )}
                              {order.status === "delivering" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-green-600"
                                  onClick={() =>
                                    handleStatusChange(order.id, "completed")
                                  }
                                >
                                  <CheckCircle size={16} />
                                </Button>
                              )}
                              {order.status !== "completed" &&
                                order.status !== "cancelled" && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 text-red-400"
                                    onClick={() =>
                                      handleStatusChange(order.id, "cancelled")
                                    }
                                  >
                                    <XCircle size={16} />
                                  </Button>
                                )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          {/* ABA APARÊNCIA (CORES + PREVIEW) */}
          <TabsContent value="appearance">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Palette size={18} className="text-purple-600" /> Personalização
                do Tema
              </h2>
              <div className="flex flex-col lg:flex-row gap-10 items-start">
                <div className="flex-1 space-y-6 w-full max-w-md">
                  <div className="space-y-4 p-4 border rounded-xl bg-slate-50">
                    <div className="space-y-2">
                      <Label>Cor Primária</Label>
                      <div className="flex gap-3">
                        <Input
                          type="color"
                          value={settings.theme.primaryColor}
                          onChange={(e) =>
                            updateThemeColor("primaryColor", e.target.value)
                          }
                          className="w-14 h-14 p-1 rounded-xl cursor-pointer shadow-sm"
                        />
                        <div className="flex-1">
                          <Input
                            value={settings.theme.primaryColor}
                            onChange={(e) =>
                              updateThemeColor("primaryColor", e.target.value)
                            }
                            className="uppercase font-mono mb-1"
                          />
                          <p className="text-xs text-slate-500">
                            Usada em botões de filtro, cabeçalho e destaques.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Cor Secundária</Label>
                      <div className="flex gap-3">
                        <Input
                          type="color"
                          value={settings.theme.secondaryColor}
                          onChange={(e) =>
                            updateThemeColor("secondaryColor", e.target.value)
                          }
                          className="w-14 h-14 p-1 rounded-xl cursor-pointer shadow-sm"
                        />
                        <div className="flex-1">
                          <Input
                            value={settings.theme.secondaryColor}
                            onChange={(e) =>
                              updateThemeColor("secondaryColor", e.target.value)
                            }
                            className="uppercase font-mono mb-1"
                          />
                          <p className="text-xs text-slate-500">
                            Usada em botões "Adicionar" e checkout.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={saveSettings}
                    className="w-full bg-slate-900 text-white h-12 text-lg"
                  >
                    <Save size={18} className="mr-2" /> Salvar Tema
                  </Button>
                </div>
                {/* SIMULADOR EM TEMPO REAL */}
                <div className="flex-1 w-full flex flex-col items-center">
                  <Label className="mb-4 text-slate-500 uppercase text-xs font-bold tracking-wide">
                    Pré-visualização (Simulação)
                  </Label>
                  <ThemePreview
                    primaryColor={settings.theme.primaryColor}
                    secondaryColor={settings.theme.secondaryColor}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ABA CONFIGURAÇÕES (ORDEM) */}
          <TabsContent value="settings">
            <div className="bg-white p-6 rounded-xl shadow-sm space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <ListFilter size={18} className="text-blue-600" /> Ordem das
                  Seções (Home)
                </h2>
              </div>
              <p className="text-sm text-slate-500">
                Defina a ordem que os grupos de produtos aparecem na página
                inicial.
              </p>
              <div className="space-y-2 border rounded-lg p-2 bg-slate-50">
                {orderedGroups.map((group, index) => (
                  <div
                    key={group}
                    className="flex items-center justify-between p-3 bg-white border rounded-md shadow-sm"
                  >
                    <span className="font-medium text-slate-700">
                      {index + 1}. {group}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => moveGroup(index, "up")}
                        disabled={index === 0}
                      >
                        <ArrowUp size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => moveGroup(index, "down")}
                        disabled={index === orderedGroups.length - 1}
                      >
                        <ArrowDown size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <Button
                onClick={saveSettings}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <Save size={16} className="mr-2" /> Salvar Ordem
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <OrderDetailsSheet
        isOpen={isOrderSheetOpen}
        onClose={() => setIsOrderSheetOpen(false)}
        order={selectedOrder}
        onStatusChange={handleStatusChange}
        onCopyDelivery={handleCopyDeliveryInfo}
      />
      <ProductFormDialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productToEdit={editingProduct}
        onSuccess={() => {
          setIsModalOpen(false);
          toast.success("Produto salvo!");
        }}
        existingCategories={allCategoriesForModal}
      />
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Sim, excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
