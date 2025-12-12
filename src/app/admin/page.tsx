"use client";

import { useEffect, useState } from "react";
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
import { Product, StoreSettings, Order, OrderStatus } from "@/lib/types";
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
} from "lucide-react";
import { ProductFormDialog } from "@/components/admin/ProductFormDialog";
import Image from "next/image";
import Link from "next/link";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [settings, setSettings] = useState<StoreSettings>({
    id: "general",
    storeName: "Mix WebApp",
    whatsappNumber: "",
    theme: {
      primaryColor: "#7c3aed",
      secondaryColor: "#db2777",
      accentColor: "#10b981",
      backgroundColor: "#f8fafc",
    },
    filters: { activeCategories: [], categoryOrder: [] },
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    const auth = localStorage.getItem("mix_admin_auth");
    if (auth === "true") setIsAuthenticated(true);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "admin123") {
      localStorage.setItem("mix_admin_auth", "true");
      setIsAuthenticated(true);
    } else {
      alert("Senha incorreta");
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    const qProd = query(collection(db, "products"), orderBy("name"));
    const unsubProd = onSnapshot(qProd, (snapshot) => {
      const prods = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Product)
      );
      setAllProducts(prods);
      setLoading(false);
    });
    const unsubSettings = onSnapshot(
      doc(db, "settings", "general"),
      (docSnap) => {
        if (docSnap.exists()) {
          setSettings(docSnap.data() as StoreSettings);
        }
      }
    );
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

  useEffect(() => {
    const results = allProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(results);
    setCurrentPage(1);
  }, [searchTerm, allProducts]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const toggleProductStatus = async (product: Product) => {
    await updateDoc(doc(db, "products", product.id), {
      inStock: !product.inStock,
    });
  };
  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza? Isso apaga permanentemente.")) {
      await deleteDoc(doc(db, "products", id));
    }
  };
  const saveSettings = async () => {
    try {
      await setDoc(doc(db, "settings", "general"), settings);
      alert("Configurações salvas com sucesso!");
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar.");
    }
  };
  const updateThemeColor = (
    key: keyof StoreSettings["theme"],
    value: string
  ) => {
    setSettings((prev) => ({
      ...prev,
      theme: { ...prev.theme, [key]: value },
    }));
  };
  const handleStatusChange = async (
    orderId: string,
    newStatus: OrderStatus
  ) => {
    await updateDoc(doc(db, "orders", orderId), { status: newStatus });
  };
  const handleCopyDeliveryInfo = (order: Order) => {
    const storeAddress = "Mix Novidades (Rua Pedro Aldemar Bantim, 945)";
    const shortId = order.id.slice(0, 5).toUpperCase();
    const totalValue = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(order.total);

    let paymentInstruction = "";
    if (order.paymentTiming === "prepaid") {
      paymentInstruction = "✅ **JÁ PAGO** (Apenas entregar)";
    } else {
      paymentInstruction = `💰 **COBRAR NA ENTREGA:** ${totalValue} (${
        order.paymentMethod === "pix" ? "Pix" : "Dinheiro"
      })`;
    }

    const text =
      `🛵 *SOLICITAÇÃO DE ENTREGA #${shortId}*\n\n` +
      `📍 *Retirada:* ${storeAddress}\n` +
      `🏁 *Entrega:* ${order.address}\n` +
      `👤 *Cliente:* ${order.customerName || "Cliente"}\n\n` +
      `${paymentInstruction}\n` +
      `📦 *Volume:* ${order.items.length} itens`;

    navigator.clipboard.writeText(text);
    alert("Texto copiado! Cole no WhatsApp do Motoboy.");
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
              <Settings size={16} /> Configurações
            </TabsTrigger>
          </TabsList>
          <TabsContent value="products" className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm">
              <div className="relative w-72">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <Input
                  placeholder="Buscar produtos..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button
                onClick={() => {
                  setEditingProduct(null);
                  setIsModalOpen(true);
                }}
                className="bg-purple-600 hover:bg-purple-700"
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
                    <TableHead>Categoria</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10">
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
                          <div className="relative w-10 h-10 rounded bg-slate-100 overflow-hidden shrink-0">
                            {product.imageUrl && (
                              <Image
                                src={product.imageUrl}
                                alt=""
                                fill
                                className="object-cover"
                              />
                            )}
                          </div>
                          <span className="font-medium">{product.name}</span>
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
                            onClick={() => handleDelete(product.id)}
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
          <TabsContent value="orders" className="space-y-4">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <ShoppingBag className="text-purple-600" /> Gestão de Pedidos
              </h2>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead>Info</TableHead>
                      <TableHead>Entrega</TableHead>
                      <TableHead>Pagamento</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-10 text-slate-500"
                        >
                          Nenhum pedido recebido ainda.
                        </TableCell>
                      </TableRow>
                    ) : (
                      orders.map((order) => (
                        <TableRow key={order.id}>
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
                              <div className="flex flex-col gap-1 max-w-[200px]">
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
                                  title="Copiar para Motoboy"
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
                                  title="Separando"
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
                                  title="Saiu para Entrega"
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
                                  title="Concluir"
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
                                    title="Cancelar"
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
          <TabsContent value="appearance">
            <div className="bg-white p-6 rounded-xl shadow-sm space-y-8">
              <div>
                <h2 className="text-lg font-bold mb-4">
                  Personalização de Cores
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                  <div className="space-y-2">
                    <Label>Cor Primária</Label>
                    <div className="flex gap-3">
                      <Input
                        type="color"
                        value={settings.theme.primaryColor}
                        onChange={(e) =>
                          updateThemeColor("primaryColor", e.target.value)
                        }
                        className="w-12 h-12 p-1 rounded-lg cursor-pointer"
                      />
                      <Input
                        value={settings.theme.primaryColor}
                        onChange={(e) =>
                          updateThemeColor("primaryColor", e.target.value)
                        }
                        className="uppercase"
                      />
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
                        className="w-12 h-12 p-1 rounded-lg cursor-pointer"
                      />
                      <Input
                        value={settings.theme.secondaryColor}
                        onChange={(e) =>
                          updateThemeColor("secondaryColor", e.target.value)
                        }
                        className="uppercase"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t">
                <Button
                  onClick={saveSettings}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Salvar Alterações de Tema
                </Button>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="settings">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h2 className="text-lg font-bold mb-4">Gerenciar Categorias</h2>
              <p className="text-sm text-slate-500 mb-6">Em breve.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <ProductFormDialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productToEdit={editingProduct}
        onSuccess={() => setIsModalOpen(false)}
      />
    </div>
  );
}
