"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSearchParamsPatch } from "@/hooks/useSearchParamsPatch";
import { Product } from "@/types";
import { Category } from "@/types/category";
import { CategoryManager } from "@/components/admin/CategoryManager";
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
} from "@/components/ui/dialog";
import { ProductInfoModal } from "@/components/admin/ProductInfoModal";
import { SafeImage } from "@/components/ui/SafeImage";
import {
  ProductTypeBadge,
  PRODUCT_TYPE_META,
} from "@/components/ui/status-badge";
import {
  Plus,
  Package,
  Search,
  Filter,
  ChevronRight,
  Tags,
} from "lucide-react";

interface ProductsTabProps {
  allProducts: Product[];
  categories: Category[];
  onEditProduct: (product: Product | null) => void;
}

export function ProductsTab({
  allProducts,
  categories,
  onEditProduct,
}: ProductsTabProps) {
  const searchParams = useSearchParams();
  const patchParams = useSearchParamsPatch();

  const [searchTerm, setSearchTerm] = useState(
    () => searchParams.get("nome") || ""
  );
  const [typeFilter, setTypeFilter] = useState<string>(
    () => searchParams.get("tipo") || "ALL"
  );
  const [categoryFilter] = useState<string>("ALL");
  const [productToView, setProductToView] = useState<Product | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(
    () => searchParams.get("categorias") === "1"
  );

  // Espera parar de digitar antes de gravar na URL, pra não disparar um
  // router.replace a cada tecla.
  useEffect(() => {
    const timeout = setTimeout(() => {
      patchParams({ nome: searchTerm || undefined });
    }, 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const handleTypeFilterChange = (value: string) => {
    setTypeFilter(value);
    patchParams({ tipo: value === "ALL" ? undefined : value });
  };

  const handleCategoryModalChange = (open: boolean) => {
    setIsCategoryModalOpen(open);
    patchParams({ categorias: open ? "1" : undefined });
  };

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

  return (
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
            <Select value={typeFilter} onValueChange={handleTypeFilterChange}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <Filter size={14} className="text-slate-400" />{" "}
                  <SelectValue placeholder="Tipo" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os Tipos</SelectItem>
                {Object.entries(PRODUCT_TYPE_META).map(([value, meta]) => (
                  <SelectItem key={value} value={value}>
                    {meta.filterLabel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-2 w-full xl:w-auto">
          <Button
            variant="outline"
            onClick={() => handleCategoryModalChange(true)}
            className="w-full md:w-auto"
          >
            <Tags size={16} className="mr-2" /> Categorias e Subcategorias
          </Button>
          <Button
            onClick={() => onEditProduct(null)}
            className="bg-purple-600 w-full md:w-auto"
          >
            <Plus size={16} className="mr-2" /> Novo Produto
          </Button>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="w-[60px]">Img</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="hidden md:table-cell">Categ.</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product) => (
              <TableRow
                key={product.id}
                onClick={() => setProductToView(product)}
                className="cursor-pointer hover:bg-slate-50"
              >
                <TableCell>
                  <div className="w-8 h-8 bg-slate-100 rounded overflow-hidden relative border">
                    {product.imageUrl ? (
                      <SafeImage
                        src={product.imageUrl}
                        alt={product.name}
                        name={product.name}
                        fill
                        sizes="32px"
                        className="object-cover"
                      />
                    ) : (
                      <Package className="m-auto text-slate-300" size={14} />
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
                  <ProductTypeBadge type={product.type} />
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
                  <ChevronRight
                    size={16}
                    className="text-slate-300 ml-auto"
                  />
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

      {/* MODAL ÚNICO DE PRODUTO (ver/editar/excluir/ver na loja) */}
      <ProductInfoModal
        product={productToView}
        open={!!productToView}
        onOpenChange={(o) => !o && setProductToView(null)}
        onEdit={(p) => {
          setProductToView(null);
          onEditProduct(p);
        }}
        onDeleted={() => setProductToView(null)}
      />

      {/* MODAL CATEGORIAS E SUBCATEGORIAS */}
      <Dialog open={isCategoryModalOpen} onOpenChange={handleCategoryModalChange}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Categorias e Subcategorias</DialogTitle>
          </DialogHeader>
          <CategoryManager categories={categories} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
