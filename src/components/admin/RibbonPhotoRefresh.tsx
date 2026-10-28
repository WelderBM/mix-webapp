"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Product } from "@/types";
import type { IntakeItem } from "@/types/intake";
import { imagesFrom, refreshCandidates } from "@/lib/ribbonPhotos/refresh";

// Trocar o desenho do rolo pela foto real nas fitas já cadastradas
// (relatório 27/10). Procura as fotos (Albano grátis; o resto pela busca,
// 1 crédito por fita), mostra a imagem atual ao lado da nova e só troca
// as marcadas: a foto que a atendente tirou não some sem ninguém ver.

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
}

type Found = Record<string, { urls: string[]; source: string | null }>;

/* eslint-disable @next/next/no-img-element -- miniaturas de fora (fabricante/busca) e do Storage */
function Thumb({ url, label }: { url?: string; label: string }) {
  return (
    <span className="block h-14 w-14 shrink-0 overflow-hidden rounded-lg border bg-slate-50">
      {url ? <img src={url} alt={label} loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-cover" /> : null}
    </span>
  );
}

export function RibbonPhotoRefresh({ open, onOpenChange, products }: Props) {
  const candidates = useMemo(() => refreshCandidates(products), [products]);
  const [found, setFound] = useState<Found | null>(null);
  const [pick, setPick] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setFound(null);
      setPick({});
    }
  }, [open]);

  async function search() {
    setBusy("Lendo os nomes do Noturno…");
    try {
      // Nome original do Noturno (com EAN e marca) casa melhor que o do
      // produto. Lê só os itens destas fitas (30 por consulta).
      const byProduct = new Map<string, IntakeItem>();
      const ids = candidates.map((p) => p.id);
      for (let i = 0; i < ids.length; i += 30) {
        const snap = await getDocs(query(collection(db, "intake_items"), where("productId", "in", ids.slice(i, i + 30))));
        snap.forEach((d) => {
          const it = d.data() as IntakeItem;
          if (it.productId) byProduct.set(it.productId, it);
        });
      }
      const { findRibbonPhotos } = await import("@/lib/imageSearch/client");
      const res = await findRibbonPhotos(
        candidates.map((p) => {
          const it = byProduct.get(p.id);
          return { id: p.id, name: it?.name ?? p.name, ean: it?.ean ?? null, brand: it?.brand ?? null };
        }),
        (done, total) => setBusy(`Procurando fotos reais (${done} de ${total})…`),
      );
      setFound(res);
      setPick(Object.fromEntries(Object.entries(res).filter(([, v]) => v.urls.length > 0).map(([id]) => [id, true])));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não deu para procurar as fotos agora.");
    } finally {
      setBusy(null);
    }
  }

  const chosen = candidates.filter((p) => pick[p.id] && found?.[p.id]?.urls.length);

  async function apply() {
    let ok = 0;
    try {
      const [{ fetchChosenImage }, { uploadIntakePhoto }] = await Promise.all([
        import("@/lib/imageSearch/client"),
        import("@/lib/intake/actions"),
      ]);
      // Levas de 4: o celular não trava e o servidor não engasga.
      for (let i = 0; i < chosen.length; i += 4) {
        setBusy(`Trocando fotos ${i + 1}–${Math.min(i + 4, chosen.length)} de ${chosen.length}…`);
        const done = await Promise.all(
          chosen.slice(i, i + 4).map(async (p, j) => {
            try {
              const urls: string[] = [];
              for (const [k, url] of (found?.[p.id]?.urls ?? []).entries()) {
                try {
                  const blob = await fetchChosenImage(url);
                  urls.push(await uploadIntakePhoto({ sourceCode: p.sourceCode } as IntakeItem, blob, (i + j) * 10 + k));
                } catch {
                  // foto que não baixou: segue com as outras
                }
              }
              if (!urls.length) return false;
              await updateDoc(doc(db, "products", p.id), {
                ...imagesFrom(urls),
                photoChecked: true,
                previousImageUrl: p.images?.[0]?.url ?? p.imageUrl ?? "",
              });
              return true;
            } catch {
              return false; // gravação recusada: a fita fica como estava
            }
          }),
        );
        ok += done.filter(Boolean).length;
      }
      // Desmarcadas de propósito e sem foto encontrada: conferidas, saem da
      // lista (não gastam busca de novo). A imagem delas não muda.
      const kept = candidates.filter((p) => found?.[p.id] && !chosen.includes(p));
      await Promise.all(kept.map((p) => updateDoc(doc(db, "products", p.id), { photoChecked: true }).catch(() => {})));
    } catch {
      toast.error("Não deu para terminar a troca. Confira a conexão e tente de novo.");
    } finally {
      setBusy(null);
    }
    if (ok === chosen.length) toast.success(`${ok} fitas com foto real.`);
    else toast.warning(`${ok} de ${chosen.length} fitas trocadas; as outras ficaram como estavam e continuam na lista.`);
    onOpenChange(false);
  }

  const withPhoto = found ? candidates.filter((p) => found[p.id]?.urls.length).length : 0;

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Trocar desenhos por fotos reais</DialogTitle>
          <DialogDescription>
            {candidates.length} fitas do Noturno têm uma imagem só. Procure as fotos reais, confira lado a lado
            e desmarque o que já está bom (como uma foto tirada na loja).
          </DialogDescription>
        </DialogHeader>

        {!found ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              As da Albano usam a foto oficial do fabricante. As outras marcas usam a busca, com 1 crédito por fita.
            </p>
            <Button className="h-11 w-full" disabled={!!busy || candidates.length === 0} onClick={search}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {busy ?? `Procurar fotos de ${candidates.length} fitas`}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              Achei foto real para {withPhoto} de {candidates.length}. As sem foto ficam como estão.
            </p>
            <ul className="divide-y rounded-xl border">
              {candidates.map((p) => {
                const f = found[p.id];
                const has = !!f?.urls.length;
                return (
                  <li key={p.id}>
                    <label className={`flex min-h-16 items-center gap-3 p-3 ${has ? "cursor-pointer" : "opacity-60"}`}>
                      <input
                        type="checkbox"
                        className="h-5 w-5 shrink-0"
                        disabled={!has || !!busy}
                        checked={!!pick[p.id] && has}
                        onChange={(e) => setPick((s) => ({ ...s, [p.id]: e.target.checked }))}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{p.name}</span>
                        <span className="text-xs text-slate-500">
                          {has ? (f.source === "fabricante" ? "Foto do fabricante" : "Foto da busca") : "Sem foto encontrada"}
                        </span>
                      </span>
                      <Thumb url={p.images?.[0]?.url ?? p.imageUrl} label="Imagem atual" />
                      {has ? (
                        <>
                          <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                          <Thumb url={f.urls[0]} label="Foto nova" />
                        </>
                      ) : null}
                    </label>
                  </li>
                );
              })}
            </ul>
            <Button className="h-11 w-full" disabled={!!busy || chosen.length === 0} onClick={apply}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {busy ?? `Trocar ${chosen.length} fotos`}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
