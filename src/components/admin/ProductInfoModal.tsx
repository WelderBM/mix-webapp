"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { Product } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductTypeBadge } from "@/components/ui/status-badge";
import { SafeImage } from "@/components/ui/SafeImage";
import { ExternalLink, Pencil, Trash2, Package, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { getEffectiveUnitPrice, getEffectiveUnitLabel } from "@/lib/ribbon-pricing";

interface ProductInfoModalProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (product: Product) => void;
  onDeleted: () => void;
  /**
   * Variante/imagem que o CLIENTE escolheu num pedido específico (não é do
   * produto em si — vem do `CartItem`). Quando presente, destaca essa
   * escolha visualmente em vez de mostrar só o produto genérico (issue #73).
   */
  highlightVariant?: { type: string; name: string } | null;
  highlightImageLabel?: string | null;
  highlightImageUrl?: string | null;
}

export function ProductInfoModal({
  product,
  open,
  onOpenChange,
  onEdit,
  onDeleted,
  highlightVariant,
  highlightImageLabel,
  highlightImageUrl,
}: ProductInfoModalProps) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!product) return null;

  const effectivePrice = getEffectiveUnitPrice(product);
  const displayImageUrl = highlightImageUrl || product.imageUrl;
  const hasHighlight = !!(
    highlightVariant ||
    highlightImageLabel ||
    highlightImageUrl
  );

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "products", product.id));
      toast.success("Produto excluído.");
      setConfirmOpen(false);
      onOpenChange(false);
      onDeleted();
    } catch (error) {
      toast.error("Erro ao excluir produto.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="truncate pr-6">{product.name}</DialogTitle>
            <DialogDescription className="sr-only">
              Detalhes do produto, com opções de editar, excluir ou ver na
              loja.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="w-full h-40 bg-slate-100 rounded-lg overflow-hidden relative border flex items-center justify-center">
              {displayImageUrl ? (
                <SafeImage
                  src={displayImageUrl}
                  alt={product.name}
                  name={product.name}
                  fill
                  sizes="(min-width: 640px) 512px, 100vw"
                  className="object-cover"
                />
              ) : (
                <Package className="text-slate-300" size={32} />
              )}
            </div>

            {hasHighlight && (
              <div className="text-sm bg-purple-50 border border-purple-200 rounded-lg p-3 space-y-1">
                <p className="text-xs text-purple-500 font-bold uppercase">
                  Escolhido pelo cliente neste pedido
                </p>
                <p className="text-purple-900 font-medium">
                  {highlightVariant
                    ? `${highlightVariant.type}: ${highlightVariant.name}`
                    : highlightImageLabel}
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <ProductTypeBadge type={product.type} />
              <Badge variant="secondary">
                {product.category || "Sem categoria"}
              </Badge>
              {product.subcategory && (
                <Badge variant="outline">{product.subcategory}</Badge>
              )}
              <Badge variant={product.inStock ? "default" : "destructive"}>
                {product.inStock ? "Em estoque" : "Sem estoque"}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">
                  Preço
                </p>
                <p className="font-bold text-slate-800">
                  {effectivePrice != null
                    ? formatCurrency(effectivePrice)
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">
                  Unidade
                </p>
                <p className="font-bold text-slate-800">
                  {getEffectiveUnitLabel(product)}
                </p>
              </div>
            </div>

            {product.type === "RIBBON" && product.ribbonInventory && (
              <div className="text-sm bg-slate-50 border rounded-lg p-3 space-y-1">
                <p className="text-xs text-slate-400 font-bold uppercase">
                  Estoque da fita
                </p>
                <p className="text-slate-700">
                  {product.ribbonInventory.status === "ABERTO"
                    ? "🟢 Aberto"
                    : "🔴 Fechado"}{" "}
                  — {product.ribbonInventory.remainingMeters}m /{" "}
                  {product.ribbonInventory.totalRollMeters}m
                </p>
              </div>
            )}

            {product.description && (
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase mb-1">
                  Descrição
                </p>
                <p className="text-sm text-slate-600">
                  {product.description}
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="mt-2 sm:justify-between flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="text-red-500 hover:text-red-600 hover:bg-red-50 gap-2"
              onClick={() => setConfirmOpen(true)}
            >
              <Trash2 size={16} /> Excluir
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => router.push(`/produto/${product.id}`)}
              >
                <ExternalLink size={16} /> Ver na Loja
              </Button>
              <Button
                type="button"
                className="bg-purple-600 hover:bg-purple-700 gap-2"
                onClick={() => onEdit(product)}
              >
                <Pencil size={16} /> Editar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir "{product.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. O produto sai da loja
              imediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              Cancelar
            </AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={deleting}
              onClick={handleDelete}
              className="gap-2"
            >
              {deleting ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <Trash2 size={16} />
              )}
              Sim, excluir
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
