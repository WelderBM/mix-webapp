"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { BalloonConfig } from "@/types/balloon";
import {
  applyCatalogProposal,
  baseTypeId,
  proposeCatalog,
  type ProposalType,
} from "@/lib/intake/balloonCatalog";
import { parsePrice } from "@/lib/intake/publish";

// "Montar pelo Noturno" (#236): monta/completa o catálogo do montador de
// balões a partir da fila do Noturno — tipos, tamanhos (com pacote) e
// cores com estoque. Só o preço de cada tamanho é digitado. O resultado
// entra na edição da aba Balões; quem salva é o "Salvar Configurações"
// de sempre (mesmo fluxo, mesmo rascunho).

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: BalloonConfig;
  onApply: (next: BalloonConfig) => void;
}

const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function BalloonCatalogFromNoturno({ open, onOpenChange, config, onApply }: Props) {
  const [items, setItems] = useState<
    { family: string | null; name: string; stock: number; inLatestImport?: boolean; brand?: string | null }[] | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [include, setInclude] = useState<Record<string, boolean>>({});
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [packs, setPacks] = useState<Record<string, string>>({});
  const [removeStale, setRemoveStale] = useState<Record<string, boolean>>({});

  // Tudo digitado vale só para esta abertura: ao fechar, limpa — senão um
  // preço antigo voltaria e sobrescreveria uma correção feita na Edição.
  function close(next: boolean) {
    if (!next) {
      setPrices({});
      setPacks({});
      setInclude({});
      setRemoveStale({});
      setItems(null); // relê a fila na próxima abertura
    }
    onOpenChange(next);
  }

  // Balões da fila (~650 leituras): só ao abrir a janela.
  useEffect(() => {
    if (!open || items) return;
    setError(null);
    getDocs(query(collection(db, "intake_items"), where("family", "==", "BALAO")))
      .then((snap) =>
        setItems(
          snap.docs.map((d) => {
            const x = d.data();
            return { family: x.family, name: x.name, stock: x.stock, inLatestImport: x.inLatestImport, brand: x.brand ?? null };
          }),
        ),
      )
      .catch(() =>
        setError("Não foi possível ler os balões do Noturno. Verifique a conexão e tente de novo."),
      );
  }, [open, items]);

  const proposal: ProposalType[] = useMemo(
    () => (items ? proposeCatalog(items, config) : []),
    [items, config],
  );

  const priceKey = (typeId: string, size: string) => `${typeId}|${size}`;
  const missingPrices = proposal
    .filter((p) => include[p.typeId] !== false)
    .flatMap((p) => p.sizes.filter((s) => s.currentPrice == null && !parsePrice(prices[priceKey(p.typeId, s.size)] ?? "")))
    .length;

  function apply() {
    const typed: Record<string, number | null> = {};
    for (const [k, v] of Object.entries(prices)) typed[k] = parsePrice(v);
    const typedPacks: Record<string, number | null> = {};
    for (const [k, v] of Object.entries(packs)) typedPacks[k] = v ? Number(v) : null;
    onApply(
      applyCatalogProposal(config, proposal, { include, prices: typed, packs: typedPacks, removeStale }),
    );
    toast.success(
      "Catálogo montado. Na Edição, confira os nomes das cores novas e toque em Salvar Configurações.",
    );
    close(false);
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Montar o catálogo de balões pelo Noturno</DialogTitle>
          <DialogDescription>
            Tipos, tamanhos, pacote e cores com estoque vêm do Noturno. Digite o
            preço da etiqueta de cada tamanho novo (o preço é do PACOTE; em
            branco ou zero, mantém o atual). Confira o pacote marcado em
            amarelo. Cor que o Noturno não tem sai do catálogo (dá para
            desmarcar); nome quebrado é corrigido.
          </DialogDescription>
        </DialogHeader>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {!items && !error && (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-slate-400" size={28} />
          </div>
        )}
        {items && proposal.length === 0 && (
          <p className="text-sm text-slate-500">
            Nenhum balão do Noturno casa com os tipos do catálogo.
          </p>
        )}

        <div className="space-y-4">
          {proposal.map((p) => {
            const on = include[p.typeId] !== false;
            const newColors = p.colors.filter((c) => !c.inCatalog);
            return (
              <section key={p.typeId} className="space-y-3 rounded-xl border border-slate-200 p-3">
                <label className="flex min-h-11 items-center gap-3">
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={(e) => setInclude((x) => ({ ...x, [p.typeId]: e.target.checked }))}
                    className="h-5 w-5 accent-purple-600"
                  />
                  <span className="font-bold text-slate-800">{p.name}</span>
                  {p.brand && !p.name.includes(p.brand) && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                      {p.brand}
                    </span>
                  )}
                  {!p.exists && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                      tipo novo
                    </span>
                  )}
                </label>
                {on && (
                  <>
                    <ul className="divide-y divide-slate-100 rounded-lg border border-slate-100">
                      {p.sizes.map((s) => (
                        <li key={s.size} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-2 py-1.5 text-sm">
                          <span className="w-14 shrink-0 font-bold text-slate-800">
                            {s.size}
                            {/* Polegadas; canudo "260" é o modelo, cm já vem escrito. */}
                            {/^\d/.test(s.size) && !s.size.endsWith("cm") && baseTypeId(p.typeId) !== "canudo" ? '"' : ""}
                          </span>
                          <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1 text-xs text-slate-500">
                            <label
                              className={`flex items-center gap-1 rounded px-1 ${
                                s.packSource === "padrao" || s.packSource === "misto"
                                  ? "bg-amber-100 text-amber-900"
                                  : ""
                              }`}
                              title={
                                s.packSource === "padrao"
                                  ? "O nome não diz quantos vêm: confira na embalagem"
                                  : s.packSource === "misto"
                                    ? "Os nomes discordam: confira na embalagem"
                                    : undefined
                              }
                            >
                              pacote c/
                              <input
                                inputMode="numeric"
                                aria-label={`Unidades por pacote ${p.name} ${s.size}`}
                                placeholder={String(s.unitsPerPackage)}
                                value={packs[priceKey(p.typeId, s.size)] ?? ""}
                                onChange={(e) =>
                                  setPacks((x) => ({
                                    ...x,
                                    [priceKey(p.typeId, s.size)]: e.target.value.replace(/\D/g, ""),
                                  }))
                                }
                                className="h-11 w-14 rounded border border-slate-300 bg-white px-1 text-base text-slate-800"
                              />
                            </label>
                            {(s.packSource === "padrao" || s.packSource === "misto") && (
                              <strong className="text-amber-800">confira na embalagem</strong>
                            )}
                            · {Math.round(s.stock).toLocaleString("pt-BR")} em estoque
                            {s.currentPrice == null && <strong className="ml-1 text-amber-700">· novo</strong>}
                          </span>
                          <div className="relative w-28 shrink-0">
                            <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                              R$
                            </span>
                            <input
                              inputMode="decimal"
                              aria-label={`Preço do pacote ${p.name} ${s.size}`}
                              placeholder={s.currentPrice != null ? brl(s.currentPrice).replace("R$", "").trim() : "preço"}
                              value={prices[priceKey(p.typeId, s.size)] ?? ""}
                              onChange={(e) =>
                                setPrices((x) => ({
                                  ...x,
                                  [priceKey(p.typeId, s.size)]: e.target.value.replace(/[^\d.,]/g, ""),
                                }))
                              }
                              className="h-11 w-full rounded-md border border-slate-300 pl-8 pr-2 text-base"
                            />
                          </div>
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-slate-500">
                      {p.colors.length} cores com estoque
                      {newColors.length > 0 && (
                        <>
                          {" · "}
                          <strong className="text-emerald-700">{newColors.length} novas:</strong>{" "}
                          {newColors.slice(0, 8).map((c) => c.name).join(", ")}
                          {newColors.length > 8 && "…"}
                        </>
                      )}
                    </p>
                    {p.renames.length > 0 && (
                      <p className="text-xs text-slate-500">
                        <strong className="text-slate-700">{p.renames.length} nome(s) corrigido(s):</strong>{" "}
                        {p.renames.map((r) => `${r.from} → ${r.to}`).join(", ")}
                      </p>
                    )}
                    {p.stale.length > 0 && (
                      <label className="flex items-start gap-3 rounded-lg bg-amber-50 p-2 text-xs text-amber-900">
                        <input
                          type="checkbox"
                          checked={removeStale[p.typeId] !== false}
                          onChange={(e) => setRemoveStale((x) => ({ ...x, [p.typeId]: e.target.checked }))}
                          className="mt-0.5 h-5 w-5 shrink-0 accent-purple-600"
                        />
                        <span>
                          <strong>
                            Remover {p.stale.length} cor(es) que o Noturno não tem:
                          </strong>{" "}
                          {p.stale.map((c) => c.split("|")[0]).join(", ")}
                        </span>
                      </label>
                    )}
                  </>
                )}
              </section>
            );
          })}
        </div>

        <DialogFooter className="gap-2">
          {missingPrices > 0 && (
            <p className="text-xs text-amber-700 sm:mr-auto">
              {missingPrices} tamanho(s) novo(s) sem preço ficam de fora.
            </p>
          )}
          <Button variant="outline" className="h-11" onClick={() => close(false)}>
            Cancelar
          </Button>
          <Button className="h-11" disabled={!items || proposal.length === 0} onClick={apply}>
            Aplicar ao catálogo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
