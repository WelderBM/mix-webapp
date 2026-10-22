"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { ChevronDown, Loader2 } from "lucide-react";
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
};

export function RibbonLinesFromNoturno({ open, onOpenChange }: Props) {
  const [items, setItems] = useState<IntakeItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<Record<string, LineState>>({});
  const [busy, setBusy] = useState<{ key: string; step: string } | null>(null);

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
    state[k] ?? { roll: "", meter: "", expanded: false, skip: {}, labels: {} };
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
      const [{ ribbonSvg }, { renderBalloonImage }, { uploadIntakePhoto, publishRibbonLine }] =
        await Promise.all([
          import("@/lib/intake/ribbonArt"),
          import("@/lib/intake/balloonArt"),
          import("@/lib/intake/actions"),
        ]);
      // Artes (geradas e enviadas em levas de 6, para não travar o celular).
      const urls: string[] = [];
      for (let i = 0; i < members.length; i += 6) {
        setBusy({ key: line.key, step: `Gerando imagens ${i + 1}–${Math.min(i + 6, members.length)} de ${members.length}…` });
        const part = await Promise.all(
          members.slice(i, i + 6).map(async (m, j) => {
            const blob = await renderBalloonImage(ribbonSvg(m.item.name, line.label), 600);
            return uploadIntakePhoto(m.item, blob, i + j);
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
      toast.success(`${members.length} fitas de ${line.label} cadastradas.`);
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
            com imagem de rolo na cor.
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
                            aria-label={`Incluir ${m.label}`}
                            className="h-5 w-5 accent-purple-600"
                          />
                        </label>
                        <input
                          value={s.labels[m.item.id] ?? m.label}
                          onChange={(e) => patch(line.key, { labels: { ...s.labels, [m.item.id]: e.target.value } })}
                          aria-label="Nome da cor"
                          className="h-11 min-w-0 flex-1 bg-transparent text-base outline-none"
                        />
                        <span className="shrink-0 pr-1 text-xs text-slate-500">{m.item.stock} un.</span>
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
      </DialogContent>
    </Dialog>
  );
}
