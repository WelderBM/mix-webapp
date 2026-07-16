"use client";

import { useState } from "react";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { Category, CategorySubcategory } from "@/types/category";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronDown,
  ChevronRight,
  Pencil,
  Trash2,
  Plus,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { uniqueSlug } from "@/lib/migrateCategories";

interface CategoryManagerProps {
  categories: Category[];
}

// Reaproveitado tanto dentro do wizard de produto (passo "Categoria", atrás
// do botão "Gerenciar") quanto no card de Configurações — mesmo componente,
// os dois pontos do addendum do plano, em vez de duas UIs separadas.

export function CategoryManager({ categories }: CategoryManagerProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [renamingCategoryId, setRenamingCategoryId] = useState<string | null>(
    null
  );
  const [renameValue, setRenameValue] = useState("");
  const [addingSubFor, setAddingSubFor] = useState<string | null>(null);
  const [newSubName, setNewSubName] = useState("");
  const [renamingSub, setRenamingSub] = useState<{
    categoryId: string;
    subId: string;
  } | null>(null);
  const [renameSubValue, setRenameSubValue] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const sorted = [...categories].sort((a, b) => a.order - b.order);

  const handleAddCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;
    const id = uniqueSlug(
      name,
      categories.map((c) => c.id)
    );
    setBusyId(id);
    try {
      const category: Category = {
        id,
        name,
        order: categories.length,
        active: true,
        subcategories: [],
      };
      await setDoc(doc(db, "categories", id), category);
      toast.success(`Categoria "${name}" criada.`);
      setNewCategoryName("");
      setAddingCategory(false);
    } catch {
      toast.error("Erro ao criar categoria.");
    } finally {
      setBusyId(null);
    }
  };

  const handleRenameCategory = async (category: Category) => {
    const name = renameValue.trim();
    if (!name || name === category.name) {
      setRenamingCategoryId(null);
      return;
    }
    setBusyId(category.id);
    try {
      await setDoc(doc(db, "categories", category.id), { name }, { merge: true });
      toast.success(
        "Categoria renomeada. Produtos que já usavam o nome antigo continuam com o nome antigo até serem editados."
      );
      setRenamingCategoryId(null);
    } catch {
      toast.error("Erro ao renomear categoria.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    if (!confirm(`Apagar a categoria "${category.name}"?`)) return;
    setBusyId(category.id);
    try {
      const inUse = await getDocs(
        query(
          collection(db, "products"),
          where("category", "==", category.name),
          limit(1)
        )
      );
      if (!inUse.empty) {
        toast.error(
          `Existem produtos usando "${category.name}" — não é possível apagar.`
        );
        return;
      }
      await deleteDoc(doc(db, "categories", category.id));
      toast.success("Categoria apagada.");
    } catch {
      toast.error("Erro ao apagar categoria.");
    } finally {
      setBusyId(null);
    }
  };

  const handleAddSubcategory = async (category: Category) => {
    const name = newSubName.trim();
    if (!name) return;
    const id = uniqueSlug(
      name,
      category.subcategories.map((s) => s.id)
    );
    setBusyId(category.id);
    try {
      const sub: CategorySubcategory = {
        id,
        name,
        order: category.subcategories.length,
      };
      await setDoc(
        doc(db, "categories", category.id),
        { subcategories: [...category.subcategories, sub] },
        { merge: true }
      );
      toast.success(`Subcategoria "${name}" criada.`);
      setNewSubName("");
      setAddingSubFor(null);
    } catch {
      toast.error("Erro ao criar subcategoria.");
    } finally {
      setBusyId(null);
    }
  };

  const handleRenameSubcategory = async (
    category: Category,
    sub: CategorySubcategory
  ) => {
    const name = renameSubValue.trim();
    if (!name || name === sub.name) {
      setRenamingSub(null);
      return;
    }
    setBusyId(category.id);
    try {
      const updated = category.subcategories.map((s) =>
        s.id === sub.id ? { ...s, name } : s
      );
      await setDoc(
        doc(db, "categories", category.id),
        { subcategories: updated },
        { merge: true }
      );
      toast.success("Subcategoria renomeada.");
      setRenamingSub(null);
    } catch {
      toast.error("Erro ao renomear subcategoria.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteSubcategory = async (
    category: Category,
    sub: CategorySubcategory
  ) => {
    if (!confirm(`Apagar a subcategoria "${sub.name}"?`)) return;
    setBusyId(category.id);
    try {
      const inUse = await getDocs(
        query(
          collection(db, "products"),
          where("category", "==", category.name),
          where("subcategory", "==", sub.name),
          limit(1)
        )
      );
      if (!inUse.empty) {
        toast.error(
          `Existem produtos usando "${sub.name}" — não é possível apagar.`
        );
        return;
      }
      const updated = category.subcategories.filter((s) => s.id !== sub.id);
      await setDoc(
        doc(db, "categories", category.id),
        { subcategories: updated },
        { merge: true }
      );
      toast.success("Subcategoria apagada.");
    } catch {
      toast.error("Erro ao apagar subcategoria.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-2">
      {sorted.map((category) => (
        <div key={category.id} className="border rounded-lg bg-white">
          <div className="flex items-center gap-1 p-2">
            <button
              type="button"
              onClick={() =>
                setExpandedId((id) => (id === category.id ? null : category.id))
              }
              className="p-1 text-slate-400 hover:text-slate-600 shrink-0"
            >
              {expandedId === category.id ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </button>

            {renamingCategoryId === category.id ? (
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
                  onClick={() => handleRenameCategory(category)}
                >
                  <Check size={14} className="text-green-600" />
                </Button>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => setRenamingCategoryId(null)}
                >
                  <X size={14} />
                </Button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm font-medium text-slate-700 min-w-0 truncate">
                  {category.name}
                  {category.subcategories.length > 0 && (
                    <span className="ml-2 text-xs text-slate-400">
                      ({category.subcategories.length} subcategoria
                      {category.subcategories.length > 1 ? "s" : ""})
                    </span>
                  )}
                </span>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  className="text-slate-400 hover:text-purple-600"
                  disabled={busyId === category.id}
                  onClick={() => {
                    setRenamingCategoryId(category.id);
                    setRenameValue(category.name);
                  }}
                >
                  <Pencil size={14} />
                </Button>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  className="text-slate-400 hover:text-red-600"
                  disabled={busyId === category.id}
                  onClick={() => handleDeleteCategory(category)}
                >
                  {busyId === category.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                </Button>
              </>
            )}
          </div>

          {expandedId === category.id && (
            <div className="border-t bg-slate-50/70 p-2 pl-8 space-y-1">
              {category.subcategories
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((sub) => (
                  <div key={sub.id} className="flex items-center gap-1">
                    {renamingSub?.categoryId === category.id &&
                    renamingSub.subId === sub.id ? (
                      <>
                        <Input
                          value={renameSubValue}
                          onChange={(e) => setRenameSubValue(e.target.value)}
                          className="h-7 flex-1 text-sm"
                          autoFocus
                        />
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          onClick={() =>
                            handleRenameSubcategory(category, sub)
                          }
                        >
                          <Check size={12} className="text-green-600" />
                        </Button>
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => setRenamingSub(null)}
                        >
                          <X size={12} />
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-sm text-slate-600 min-w-0 truncate">
                          {sub.name}
                        </span>
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          className="text-slate-400 hover:text-purple-600"
                          onClick={() => {
                            setRenamingSub({
                              categoryId: category.id,
                              subId: sub.id,
                            });
                            setRenameSubValue(sub.name);
                          }}
                        >
                          <Pencil size={12} />
                        </Button>
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          className="text-slate-400 hover:text-red-600"
                          onClick={() => handleDeleteSubcategory(category, sub)}
                        >
                          <Trash2 size={12} />
                        </Button>
                      </>
                    )}
                  </div>
                ))}

              {addingSubFor === category.id ? (
                <div className="flex items-center gap-1 pt-1">
                  <Input
                    value={newSubName}
                    onChange={(e) => setNewSubName(e.target.value)}
                    placeholder="Nome da subcategoria"
                    className="h-7 flex-1 text-sm"
                    autoFocus
                  />
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => handleAddSubcategory(category)}
                  >
                    <Check size={12} className="text-green-600" />
                  </Button>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => setAddingSubFor(null)}
                  >
                    <X size={12} />
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setAddingSubFor(category.id);
                    setNewSubName("");
                  }}
                  className="text-xs text-purple-600 font-bold flex items-center gap-1 pt-1"
                >
                  <Plus size={12} /> Nova subcategoria
                </button>
              )}
            </div>
          )}
        </div>
      ))}

      {sorted.length === 0 && (
        <p className="text-sm text-slate-400 italic p-2">
          Nenhuma categoria ainda.
        </p>
      )}

      {addingCategory ? (
        <div className="flex items-center gap-1">
          <Input
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Nome da nova categoria"
            className="h-8 flex-1"
            autoFocus
          />
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            onClick={handleAddCategory}
          >
            <Check size={14} className="text-green-600" />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            onClick={() => setAddingCategory(false)}
          >
            <X size={14} />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAddingCategory(true)}
          className="text-xs text-purple-600 font-bold flex items-center gap-1 p-2"
        >
          <Plus size={14} /> Nova categoria
        </button>
      )}
    </div>
  );
}
