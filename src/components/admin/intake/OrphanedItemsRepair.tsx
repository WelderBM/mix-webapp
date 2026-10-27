"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { findOrphanedItems, reopenItems } from "@/lib/intake/actions";
import type { IntakeItem } from "@/types/intake";

// Itens "publicado" cujo produto foi apagado antes do #363: somem da fila
// e não dá para recadastrar. A conferência só roda no toque (lê os
// publicados), para não gastar leitura toda vez que a tela abre.
export function OrphanedItemsRepair({
  email,
  onDone,
}: {
  email: string | null;
  onDone: () => void;
}) {
  const [orphans, setOrphans] = useState<IntakeItem[] | null>(null);
  const [busy, setBusy] = useState(false);

  const check = async () => {
    setBusy(true);
    try {
      setOrphans(await findOrphanedItems());
    } catch {
      toast.error("Não foi possível conferir. Verifique a conexão.");
    } finally {
      setBusy(false);
    }
  };

  const reopen = async () => {
    if (!orphans?.length) return;
    setBusy(true);
    try {
      const n = await reopenItems(orphans, email);
      toast.success(n === 1 ? "1 item voltou para a fila." : `${n} itens voltaram para a fila.`);
      setOrphans([]);
      onDone();
    } catch {
      toast.error("Erro ao devolver os itens para a fila.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
      {orphans === null ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span>Apagou produtos da loja? Devolva os itens deles para a fila.</span>
          <Button variant="outline" className="h-11" onClick={check} disabled={busy}>
            {busy && <Loader2 className="mr-2 animate-spin" size={16} />}
            Conferir produtos apagados
          </Button>
        </div>
      ) : orphans.length === 0 ? (
        <p>Nenhum item publicado aponta para produto apagado.</p>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span>
            <b>{orphans.length}</b> {orphans.length === 1 ? "item está" : "itens estão"} como publicado, mas o
            produto foi apagado da loja.
          </span>
          <Button className="h-11" onClick={reopen} disabled={busy}>
            {busy && <Loader2 className="mr-2 animate-spin" size={16} />}
            Devolver para a fila
          </Button>
        </div>
      )}
    </div>
  );
}
