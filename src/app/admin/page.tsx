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
import { Product, StoreSettings } from "@/lib/types";
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
} from "lucide-react";
import { ProductFormDialog } from "@/components/admin/ProductFormDialog";
import Image from "next/image";
import Link from "next/link";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");

  // Dados de Produtos
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Configurações (Cores/Filtros)
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
    filters: {
      activeCategories: [],
      categoryOrder: [],
    },
  });

  // Controle de Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // --- AUTENTICAÇÃO ---
  useEffect(() => {
    const auth = localStorage.getItem("mix_admin_auth");
    if (auth === "true") setIsAuthenticated(true);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "6367") {
      localStorage.setItem("mix_admin_auth", "true");
      setIsAuthenticated(true);
    } else {
      alert("Senha incorreta");
    }
  };

  // --- DATA FETCHING ---
  useEffect(() => {
    if (!isAuthenticated) return;

    // Busca Produtos
    const q = query(collection(db, "products"), orderBy("name"));
    const unsubProd = onSnapshot(q, (snapshot) => {
      const prods = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Product)
      );
      setAllProducts(prods);
      setLoading(false);
    });

    // Busca Configurações
    const unsubSettings = onSnapshot(
      doc(db, "settings", "general"),
      (docSnap) => {
        if (docSnap.exists()) {
          setSettings(docSnap.data() as StoreSettings);
        }
      }
    );

    return () => {
      unsubProd();
      unsubSettings();
    };
  }, [isAuthenticated]);

  // --- FILTRO E PAGINAÇÃO ---
  useEffect(() => {
    const results = allProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(results);
    setCurrentPage(1); // Reseta página ao filtrar
  }, [searchTerm, allProducts]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // --- AÇÕES DE PRODUTO ---
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

  // --- AÇÕES DE CONFIGURAÇÃO ---
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

  if (!isAuthenticated) {
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
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
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

        {/* ABAS PRINCIPAIS */}
        <Tabs defaultValue="products" className="w-full space-y-6">
          <TabsList className="bg-white p-1 rounded-lg border shadow-sm">
            <TabsTrigger value="products" className="gap-2">
              <Package size={16} /> Produtos
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2">
              <Palette size={16} /> Aparência & Cores
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings size={16} /> Filtros & Configs
            </TabsTrigger>
          </TabsList>

          {/* === ABA 1: PRODUTOS === */}
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

              {/* PAGINAÇÃO */}
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

          {/* === ABA 2: APARÊNCIA (Cores) === */}
          <TabsContent value="appearance">
            <div className="bg-white p-6 rounded-xl shadow-sm space-y-8">
              <div>
                <h2 className="text-lg font-bold mb-4">
                  Personalização de Cores
                </h2>
                <p className="text-sm text-slate-500 mb-6">
                  Escolha as cores que combinam com o momento (Natal, Páscoa,
                  Dia das Mães).
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                  <div className="space-y-2">
                    <Label>Cor Primária (Botões, Destaques)</Label>
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
                    <Label>Cor Secundária (Fundos, Detalhes)</Label>
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

          {/* === ABA 3: CONFIGURAÇÕES (Filtros) === */}
          <TabsContent value="settings">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h2 className="text-lg font-bold mb-4">
                Gerenciar Categorias e Filtros
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                Aqui você poderá (em breve) reordenar os filtros arrastando e
                soltando, e decidir quais categorias ficam ocultas no menu.
              </p>

              {/* Placeholder para feature futura de Drag & Drop de categorias */}
              <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-center text-slate-400">
                Funcionalidade de Reordenação em desenvolvimento...
              </div>
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
