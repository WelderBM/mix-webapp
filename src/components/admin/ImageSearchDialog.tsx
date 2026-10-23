"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ImageResult } from "@/lib/imageSearch/provider";

// Escolha de foto na internet (#267): busca → grade → foto grande →
// "Usar esta foto". A atendente confere a cor com a prateleira; o app
// baixa e comprime por trás, sem ela copiar link nenhum.

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialQuery: string;
  onPick: (photo: Blob) => void;
}

export function ImageSearchDialog({ open, onOpenChange, initialQuery, onPick }: Props) {
  const [q, setQ] = useState(initialQuery);
  const [results, setResults] = useState<ImageResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [chosen, setChosen] = useState<ImageResult | null>(null);
  const [saving, setSaving] = useState(false);

  // Cada abertura começa da busca sugerida. A busca só roda ao tocar em
  // Buscar: a cota de buscas é limitada.
  useEffect(() => {
    if (open) {
      setQ(initialQuery);
      setResults(null);
      setChosen(null);
    }
  }, [open, initialQuery]);

  async function search() {
    if (q.trim().length < 2 || searching) return;
    setSearching(true);
    setChosen(null);
    try {
      const { searchImages } = await import("@/lib/imageSearch/client");
      setResults(await searchImages(q.trim()));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível buscar.");
    } finally {
      setSearching(false);
    }
  }

  async function confirm() {
    if (!chosen) return;
    setSaving(true);
    try {
      const { fetchChosenImage } = await import("@/lib/imageSearch/client");
      onPick(await fetchChosenImage(chosen.imageUrl));
      onOpenChange(false);
    } catch (e) {
      toast.error(
        (e instanceof Error ? e.message : "Não foi possível baixar.") + " Escolha outra foto.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !saving && onOpenChange(v)}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Buscar foto na internet</DialogTitle>
          <DialogDescription>
            Escolha a foto que bate com o produto da prateleira, principalmente a cor.
          </DialogDescription>
        </DialogHeader>

        {chosen ? (
          <div className="space-y-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- foto externa, só pré-visualização */}
            <img
              src={chosen.imageUrl}
              alt={chosen.title}
              referrerPolicy="no-referrer"
              className="mx-auto max-h-[50dvh] w-auto rounded-lg object-contain"
            />
            <p className="truncate text-center text-xs text-slate-500">{chosen.domain}</p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="h-11" disabled={saving} onClick={() => setChosen(null)}>
                <ArrowLeft size={16} className="mr-2" /> Voltar
              </Button>
              <Button className="h-11" disabled={saving} onClick={confirm}>
                {saving ? <Loader2 size={16} className="mr-2 animate-spin" /> : null}
                Usar esta foto
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                search();
              }}
            >
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label="O que buscar"
                className="h-11 min-w-0 flex-1 rounded-md border border-slate-300 px-3 text-base"
              />
              <Button type="submit" className="h-11 shrink-0" disabled={searching}>
                {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                <span className="ml-2">Buscar</span>
              </Button>
            </form>
            {results && results.length === 0 && (
              <p className="text-sm text-slate-500">Nada encontrado. Tente outras palavras.</p>
            )}
            {results && results.length > 0 && (
              <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {results.map((r) => (
                  <li key={r.imageUrl}>
                    <button
                      type="button"
                      onClick={() => setChosen(r)}
                      className="block aspect-square w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
                      aria-label={`Ver foto: ${r.title || r.domain}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- miniatura externa */}
                      <img
                        src={r.thumbnailUrl}
                        alt=""
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
