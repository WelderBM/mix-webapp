"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { ChevronDown, ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { auth, db } from "@/lib/firebase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { IntakeItem } from "@/types/intake";
import {
  buildRibbonProduct,
  groupRibbonLines,
  validateLinePrices,
  type RibbonLine,
} from "@/lib/intake/ribbonLines";
import { parsePrice } from "@/lib/intake/publish";
import { ImageSearchDialog } from "@/components/admin/ImageSearchDialog";
import { imageSearchEnabled } from "@/lib/imageSearch/client";

// Miniatura da foto escolhida na internet (o object URL é liberado ao sair).
function BlobThumb({ blob }: { blob: Blob }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);
  // eslint-disable-next-line @next/next/no-img-element -- blob local
  return url ? <img src={url} alt="" className="h-full w-full object-cover" /> : null;
}

// Fitas de plástico para laço "por linha" (#259): linha × largura ×
// metragem vêm do Noturno; o preço do rolo e do metro é digitado UMA vez
// por linha e cada cor vira uma fita personalizada (RIBBON), com arte de
// rolo gerada na cor. Uma linha por vez (dá para conferir antes da próxima).

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type LineState = {
  roll: string;
  meter: string;
  expanded: boolean;
  skip: Record<string, boolean>; // item.id → fora
  labels: Record<string, string>; // item.id → nome corrigido
  photos: Record<string, Blob>; // item.id → foto escolhida na internet (#267)
};

export function RibbonLinesFromNoturno({ open, onOpenChange }: Props) {
  const [items, setItems] = useState<IntakeItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<Record<string, LineState>>({});
  const [busy, setBusy] = useState<{ key: string; step: string } | null>(null);
  // Busca de foto (#267): só aparece com a chave configurada no servidor.
  const [canSearch, setCanSearch] = useState(false);
  const [searchFor, setSearchFor] = useState<{ line: string; id: string; q: string } | null>(null);
  useEffect(() => {
    if (open) imageSearchEnabled().then(setCanSearch);
  }, [open]);

  // Fitas da fila (~350 leituras): só ao abrir.
  useEffect(() => {
    if (!open || items) return;
    setError(null);
    getDocs(query(collection(db, "intake_items"), where("family", "==", "FITA")))
      .then((snap) => setItems(snap.docs.map((d) => ({ ...(d.data() as IntakeItem), id: d.id }))))
      .catch(() => setError("Não foi possível ler as fitas do Noturno. Verifique a conexão."));
  }, [open, items]);

  const lines = useMemo(() => (items ? groupRibbonLines(items) : []), [items]);
  const st = (k: string): LineState =>
    state[k] ?? { roll: "", meter: "", expanded: false, skip: {}, labels: {}, photos: {} };
  const patch = (k: string, p: Partial<LineState>) =>
    setState((s) => ({ ...s, [k]: { ...st(k), ...p } }));

  function close(next: boolean) {
    if (busy) return;
    if (!next) {
      setState({});
      setItems(null);
    }
    onOpenChange(next);
  }

  async function register(line: RibbonLine<IntakeItem>) {
    const s = st(line.key);
    const prices = { rollPrice: parsePrice(s.roll), meterPrice: parsePrice(s.meter) };
    const err = validateLinePrices(prices);
    if (err) return toast.error(err);
    const members = line.members.filter((m) => !s.skip[m.item.id]);
    if (members.length === 0) return toast.error("Marque pelo menos uma cor.");
    try {
      const [{ ribbonSvg }, { renderBalloonImage }, { uploadIntakePhoto, publishRibbonLine }, search] =
        await Promise.all([
          import("@/lib/intake/ribbonArt"),
          import("@/lib/intake/balloonArt"),
          import("@/lib/intake/actions"),
          import("@/lib/imageSearch/client"),
        ]);
      // Fotos reais (relatório 27/10): a oficial do fabricante ou, se não
      // houver, até 3 da busca. Só para quem a atendente não fotografou.
      const toFind = members.filter((m) => !s.photos[m.item.id]);
      let found: Record<string, { urls: string[] }> = {};
      if (toFind.length) {
        try {
          found = await search.findRibbonPhotos(
            toFind.map((m) => ({ id: m.item.id, name: m.item.name, ean: m.item.ean, brand: m.item.brand })),
            (done, total) => setBusy({ key: line.key, step: `Procurando fotos reais (${done} de ${total})…` }),
          );
        } catch {
          toast.warning("Não deu para buscar as fotos agora; as fitas vão com o desenho do rolo.");
        }
      }
      // Baixa e envia em levas de 4 (celular não trava, servidor não engasga).
      const urls: string[][] = [];
      let real = 0;
      for (let i = 0; i < members.length; i += 4) {
        setBusy({ key: line.key, step: `Enviando fotos ${i + 1}–${Math.min(i + 4, members.length)} de ${members.length}…` });
        const part = await Promise.all(
          members.slice(i, i + 4).map(async (m, j) => {
            const n = (i + j) * 10;
            const picked = s.photos[m.item.id];
            if (picked) {
              real++;
              return [await uploadIntakePhoto(m.item, picked, n)];
            }
            const got: string[] = [];
            for (const [k, url] of (found[m.item.id]?.urls ?? []).entries()) {
              try {
                got.push(await uploadIntakePhoto(m.item, await search.fetchChosenImage(url), n + k));
              } catch {
                // foto que não baixou: segue com as outras
              }
            }
            if (got.length) {
              real++;
              return got;
            }
            // Sem foto real: o desenho do rolo na cor, como antes.
            const edited = s.labels[m.item.id];
            const blob = await renderBalloonImage(
              ribbonSvg(edited ? `FITA ${edited}` : m.item.name, line.label),
              600,
            );
            return [await uploadIntakePhoto(m.item, blob, n)];
          }),
        );
        urls.push(...part);
      }
      setBusy({ key: line.key, step: "Cadastrando as fitas…" });
      await publishRibbonLine(
        members.map((m, i) => ({
          item: m.item,
          product: buildRibbonProduct(
            m.item,
            line,
            (s.labels[m.item.id] ?? m.label).trim(),
            { rollPrice: prices.rollPrice!, meterPrice: prices.meterPrice! },
            urls[i] ?? null,
          ),
        })),
        auth.currentUser?.email ?? null,
      );
      toast.success(
        `${members.length} fitas de ${line.label} cadastradas` +
          (real < members.length ? ` (${members.length - real} com o desenho do rolo, sem foto real).` : ", todas com foto real."),
      );
      // Some da lista: os itens viraram "publicado".
      const done = new Set(members.map((m) => m.item.id));
      setItems((list) => list?.map((i) => (done.has(i.id) ? { ...i, status: "publicado" } : i)) ?? list);
    } catch (e) {
      toast.error("Não foi possível cadastrar: " + (e instanceof Error ? e.message : String(e)));
      setItems(null); // relê para mostrar o que já foi gravado
    } finally {
      setBusy(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Cadastrar fitas de laço pelo Noturno</DialogTitle>
          <DialogDescription>
            Uma linha por vez: digite o preço do rolo fechado e o do metro
            (etiqueta) e todas as cores da linha viram fitas personalizadas,
            com a foto real do fabricante (ou da busca) e, se não houver,
            o desenho do rolo na cor.
          </DialogDescription>
        </DialogHeader>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {!items && !error && (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-slate-400" size={28} />
          </div>
        )}
        {items && lines.length === 0 && (
          <p className="text-sm text-slate-500">Nenhuma fita de plástico pendente no Noturno.</p>
        )}

        <div className="space-y-3">
          {lines.map((line) => {
            const s = st(line.key);
            const chosen = line.members.filter((m) => !s.skip[m.item.id]).length;
            const working = busy?.key === line.key;
            return (
              <section key={line.key} className="space-y-3 rounded-xl border border-slate-200 p-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-bold text-slate-800">{line.label}</p>
                  <p className="text-xs text-slate-500">
                    {line.members.length} cores · {Math.round(line.stock)} rolos em estoque
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(["roll", "meter"] as const).map((f) => (
                    <label key={f} className="space-y-1 text-xs text-slate-600">
                      {f === "roll" ? "Preço do rolo fechado" : "Preço do metro"}
                      <div className="relative">
                        <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-400">R$</span>
                        <input
                          inputMode="decimal"
                          value={s[f]}
                          onChange={(e) => patch(line.key, { [f]: e.target.value.replace(/[^\d.,]/g, "") })}
                          placeholder="0,00"
                          className="h-11 w-full rounded-md border border-slate-300 pl-8 pr-2 text-base"
                        />
                      </div>
                    </label>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => patch(line.key, { expanded: !s.expanded })}
                  className="flex min-h-11 w-full items-center justify-between text-sm text-slate-600"
                >
                  <span>
                    Cores ({chosen} de {line.members.length}) — conferir nomes
                  </span>
                  <ChevronDown size={16} className={s.expanded ? "rotate-180" : ""} />
                </button>
                {s.expanded && (
                  <ul className="divide-y divide-slate-100 rounded-lg border border-slate-100">
                    {line.members.map((m) => (
                      <li key={m.item.id} className="flex items-center gap-2 px-1">
                        <label className="flex h-11 w-11 shrink-0 items-center justify-center">
                          <input
                            type="checkbox"
                            checked={!s.skip[m.item.id]}
                            onChange={(e) => patch(line.key, { skip: { ...s.skip, [m.item.id]: !e.target.checked } })}
                            aria-label={`Incluir ${m.label || m.item.name}`}
                            className="h-5 w-5 accent-purple-600"
                          />
                        </label>
                        <input
                          value={s.labels[m.item.id] ?? m.label}
                          onChange={(e) => patch(line.key, { labels: { ...s.labels, [m.item.id]: e.target.value } })}
                          aria-label="Nome da cor"
                          placeholder="sem cor no nome"
                          className="h-11 min-w-0 flex-1 bg-transparent text-base outline-none"
                        />
                        <span className="shrink-0 pr-1 text-xs text-slate-500">{m.item.stock} un.</span>
                        {canSearch && (
                          <button
                            type="button"
                            onClick={() =>
                              setSearchFor({
                                line: line.key,
                                id: m.item.id,
                                q: `fita ${line.label} ${(s.labels[m.item.id] ?? m.label).trim()}`,
                              })
                            }
                            aria-label={`Buscar foto: ${s.labels[m.item.id] ?? m.label}`}
                            className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-md text-slate-500"
                          >
                            {s.photos[m.item.id] ? <BlobThumb blob={s.photos[m.item.id]} /> : <ImagePlus size={20} />}
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                <Button className="h-11 w-full" disabled={!!busy} onClick={() => register(line)}>
                  {working ? (
                    <>
                      <Loader2 className="mr-2 animate-spin" size={16} /> {busy?.step}
                    </>
                  ) : (
                    `Cadastrar ${chosen} fitas`
                  )}
                </Button>
              </section>
            );
          })}
        </div>
        {searchFor && (
          <ImageSearchDialog
            open
            onOpenChange={(v) => !v && setSearchFor(null)}
            initialQuery={searchFor.q}
            onPick={(photo) => {
              const { line, id } = searchFor;
              patch(line, { photos: { ...st(line).photos, [id]: photo } });
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
