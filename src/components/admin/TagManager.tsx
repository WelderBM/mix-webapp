"use client";

import { useState } from "react";
import {
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  query,
  collection,
  where,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { Tag } from "@/types/tag";
import { Product } from "@/types/product";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, Plus, Check, X, Loader2, AlertTriangle } from "lucide-react";
import { uniqueSlug } from "@/lib/migrateCategories";
import { isSystemTag } from "@/lib/productTags";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface TagManagerProps {
  tags: Tag[];
  // Opcional (mesmo padrão do CategoryManager): sem produtos, os avisos de
  // "tag sem uso" simplesmente não aparecem.
  products?: Product[];
}

// Catálogo gerenciado das tags MANUAIS (issue #68) — reaproveita
// slugify/uniqueSlug de migrateCategories.ts (mesma regra de geração de id,
// tag é só mais um documento com nome único, sem hierarquia). Tags de
// sistema (`novidades`/`promocao`) não têm gestão aqui: são calculadas, ver
// src/lib/productTags.ts.
export function TagManager({ tags, products = [] }: TagManagerProps) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);

  const sorted = [...tags].sort((a, b) => a.order - b.order);

  const productCountByTag = products.reduce<Record<string, number>>(
    (acc, p) => {
      (p.tags ?? []).forEach((t) => {
        acc[t] = (acc[t] || 0) + 1;
      });
      return acc;
    },
    {}
  );

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    if (isSystemTag(name.toLowerCase())) {
      toast.error(
        `"${name}" é uma tag de sistema calculada automaticamente — não pode ser cadastrada aqui.`
      );
      return;
    }
    const id = uniqueSlug(
      name,
      tags.map((t) => t.id)
    );
    setBusyId(id);
    try {
      const tag: Tag = { id, name, order: tags.length, active: true };
      await setDoc(doc(db, "tags", id), tag);
      toast.success(`Tag "${name}" criada.`);
      setNewName("");
      setAdding(false);
    } catch {
      toast.error("Erro ao criar tag.");
    } finally {
      setBusyId(null);
    }
  };

  const handleRename = async (tag: Tag) => {
    const name = renameValue.trim();
    if (!name || name === tag.name) {
      setRenamingId(null);
      return;
    }
    setBusyId(tag.id);
    try {
      await setDoc(doc(db, "tags", tag.id), { name }, { merge: true });
      toast.success(
        "Tag renomeada. Produtos que já usavam o nome antigo continuam com o nome antigo até serem editados."
      );
      setRenamingId(null);
    } catch {
      toast.error("Erro ao renomear tag.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (tag: Tag) => {
    setTagToDelete(null);
    setBusyId(tag.id);
    try {
      const inUse = await getDocs(
        query(
          collection(db, "products"),
          where("tags", "array-contains", tag.name),
          limit(1)
        )
      );
      if (!inUse.empty) {
        toast.error(
          `Existem produtos usando "${tag.name}" — não é possível apagar.`
        );
        return;
      }
      await deleteDoc(doc(db, "tags", tag.id));
      toast.success("Tag apagada.");
    } catch {
      toast.error("Erro ao apagar tag.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-2">
      {sorted.map((tag) => {
        const productCount = productCountByTag[tag.name] || 0;
        const isEmpty = products.length > 0 && productCount === 0;
        return (
          <div key={tag.id} className="border rounded-lg bg-white">
            <div className="flex items-center gap-1 p-2">
              {renamingId === tag.id ? (
                <>
                  <Input
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    className="h-8 flex-1"
                    autoFocus
                  />
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => handleRename(tag)}
                  >
                    <Check size={14} className="text-green-600" />
                  </Button>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => setRenamingId(null)}
                  >
                    <X size={14} />
                  </Button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm font-medium text-slate-700 min-w-0 truncate">
                    {tag.name}
                    {products.length > 0 && (
                      <span className="ml-2 text-xs text-slate-400">
                        ({productCount} produto{productCount !== 1 ? "s" : ""})
                      </span>
                    )}
                  </span>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    className="text-slate-400 hover:text-purple-600"
                    disabled={busyId === tag.id}
                    onClick={() => {
                      setRenamingId(tag.id);
                      setRenameValue(tag.name);
                    }}
                  >
                    <Pencil size={14} />
                  </Button>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    className="text-slate-400 hover:text-red-600"
                    disabled={busyId === tag.id}
                    onClick={() => setTagToDelete(tag)}
                  >
                    {busyId === tag.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </Button>
                </>
              )}
            </div>

            {isEmpty && (
              <div className="border-t px-2 py-1.5">
                <p className="flex items-center gap-1.5 text-xs text-amber-600">
                  <AlertTriangle size={12} className="shrink-0" />
                  Nenhum produto usa essa tag hoje. Considere apagar.
                </p>
              </div>
            )}
          </div>
        );
      })}

      {sorted.length === 0 && (
        <p className="text-sm text-slate-400 italic p-2">
          Nenhuma tag manual cadastrada ainda. Crie a primeira abaixo — ela
          fica disponível pra seleção no cadastro de produto.
        </p>
      )}

      {adding ? (
        <div className="flex items-center gap-1">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder='Nome da nova tag (ex: "Dia das Mães")'
            className="h-8 flex-1"
            autoFocus
          />
          <Button type="button" size="icon-sm" variant="ghost" onClick={handleAdd}>
            <Check size={14} className="text-green-600" />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            onClick={() => setAdding(false)}
          >
            <X size={14} />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="text-xs text-purple-600 font-bold flex items-center gap-1 p-2"
        >
          <Plus size={14} /> Nova tag
        </button>
      )}

      <ConfirmDialog
        open={!!tagToDelete}
        onOpenChange={(open) => !open && setTagToDelete(null)}
        title={`Apagar a tag "${tagToDelete?.name}"?`}
        confirmLabel="Apagar"
        loading={busyId === tagToDelete?.id}
        onConfirm={() => tagToDelete && handleDelete(tagToDelete)}
      />
    </div>
  );
}
