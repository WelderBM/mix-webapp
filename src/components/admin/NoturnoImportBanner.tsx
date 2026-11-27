"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { FileSpreadsheet } from "lucide-react";
import { db } from "@/lib/firebase";
import { toEpochMillis } from "@/lib/productTags";
import {
  daysSinceImport,
  importPeriodDays,
  isNoturnoImportDue,
} from "@/lib/noturnoImport";

// Aviso fixo no topo do painel (#416): some só quando um Excel do Noturno é
// importado (gravado em `intake_meta/import` pela tela de importar) e volta
// depois do período das Configurações. Sem botão de dispensar, de propósito.
export function NoturnoImportBanner({ periodDays }: { periodDays?: number }) {
  // undefined = carregando (não pisca o aviso antes de saber).
  const [lastMs, setLastMs] = useState<number | null | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    getDoc(doc(db, "intake_meta", "import"))
      .then((snap) => {
        if (alive) setLastMs(toEpochMillis(snap.data()?.lastImportedAt));
      })
      .catch((error) => {
        // Sem leitura não dá para saber: não mostra nada em vez de um aviso falso.
        console.error("Erro ao ler a última importação do Noturno:", error);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (lastMs === undefined) return null;
  const now = Date.now();
  if (!isNoturnoImportDue(lastMs, periodDays, now)) return null;

  const days = lastMs == null ? null : daysSinceImport(lastMs, now);
  const when =
    days == null
      ? "O Excel do Noturno ainda não foi importado no site."
      : `A última importação do Excel do Noturno foi há ${days} ${days === 1 ? "dia" : "dias"}.`;

  return (
    <div
      role="status"
      className="flex flex-col gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 md:flex-row md:items-center md:justify-between"
    >
      <div className="flex items-start gap-3">
        <FileSpreadsheet className="mt-0.5 shrink-0 text-amber-700" aria-hidden="true" />
        <div>
          <p className="font-semibold text-amber-900">Hora de atualizar o estoque</p>
          <p className="text-sm text-amber-900">
            {when} Baixe o Excel no Noturno e importe aqui (lembrete a cada{" "}
            {importPeriodDays(periodDays)} dias).
          </p>
        </div>
      </div>
      <Link
        href="/admin/lancamento/importar"
        className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg bg-amber-700 px-4 font-semibold text-white hover:bg-amber-800"
      >
        Importar agora
      </Link>
    </div>
  );
}
