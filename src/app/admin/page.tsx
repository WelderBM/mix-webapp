"use client";

import { useEffect, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product } from "@/lib/types";
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
import { Plus, Pencil, Trash2, LogOut, Search, Package } from "lucide-react";
import { ProductFormDialog } from "@/components/admin/ProductFormDialog";
import Image from "next/image";
import { Home as HomeIcon } from "lucide-react";
import Link from "next/link";

export default function AdminPage() {
  // Estado de Autenticação Simples
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");

  // Dados
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Controle do Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Verifica login ao carregar
  useEffect(() => {
    const auth = localStorage.getItem("mix_admin_auth");
    if (auth === "true") setIsAuthenticated(true);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "6367") {
      // SENHA TEMPORÁRIA
      localStorage.setItem("mix_admin_auth", "true");
      setIsAuthenticated(true);
    } else {
      alert("Senha incorreta");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("mix_admin_auth");
    setIsAuthenticated(false);
  };

  // Carrega produtos em tempo real
  useEffect(() => {
    if (!isAuthenticated) return;

    const q = query(collection(db, "products"), orderBy("name"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prods = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Product)
      );
      setProducts(prods);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAuthenticated]);

  // Ações
  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este produto?")) {
      await deleteDoc(doc(db, "products", id));
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleNew = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  // Filtro
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <form
          onSubmit={handleLogin}
          className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm space-y-4"
        >
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-slate-800">Mix Admin</h1>
            <p className="text-slate-500">Acesso Restrito</p>
          </div>
          <Input
            type="password"
            placeholder="Senha de acesso"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
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
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Package className="text-purple-600" />
              Gestão de Produtos
            </h1>
            <p className="text-slate-500 text-sm">
              Gerencie seu catálogo, preços e estoque.
            </p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
            {/* Botão Seguro para a Home */}
            <Link href="/" target="_blank">
              <Button
                variant="outline"
                className="border-purple-200 text-purple-700 hover:bg-purple-50"
              >
                <HomeIcon size={16} className="mr-2" /> Ir para Loja
              </Button>
            </Link>

            <Button
              onClick={handleLogout}
              variant="ghost"
              className="text-slate-500"
            >
              <LogOut size={16} className="mr-2" /> Sair
            </Button>
            <Button
              onClick={handleNew}
              className="bg-purple-600 hover:bg-purple-700 flex-1 md:flex-none"
            >
              <Plus size={16} className="mr-2" /> Novo Produto
            </Button>
          </div>
        </div>

        {/* Filtros e Busca */}
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <Input
              placeholder="Buscar por nome ou categoria..."
              className="pl-10 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Slots/Cap</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-10 text-slate-500"
                  >
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-10 text-slate-500"
                  >
                    Nenhum produto encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded bg-slate-100 overflow-hidden shrink-0">
                        {product.imageUrl ? (
                          <Image
                            src={product.imageUrl}
                            alt=""
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-200" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-800">
                          {product.name}
                        </span>
                        {product.originalPrice && (
                          <span className="text-[10px] text-red-500 font-bold">
                            OFERTA
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="text-[10px] uppercase"
                      >
                        {product.type.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(product.price)}
                      <span className="text-xs text-slate-400 ml-1">
                        /{product.unit}
                      </span>
                    </TableCell>
                    <TableCell>
                      {product.type === "BASE_CONTAINER" ? (
                        <span className="text-purple-600 font-bold">
                          {product.capacity} Cap
                        </span>
                      ) : (
                        <span className="text-slate-500">
                          {product.itemSize} Slot
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(product)}
                      >
                        <Pencil size={16} className="text-slate-600" />
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
        </div>
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
