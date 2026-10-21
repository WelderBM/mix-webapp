"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  FileSpreadsheet,
  Loader2,
  Lock,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useSystemToolsUnlocked,
  SystemPasswordPrompt,
} from "@/components/admin/SystemPasswordGate";
import type { IntakeItem, IntakeSourceFields } from "@/types/intake";
import type { IntakeMergeResult } from "@/lib/intake/merge";

// Importador do cadastro do Noturno → fila de lançamento (issue #198).
// Parse, análise e comparação rodam no navegador; só o que mudou é
// gravado. As libs de leitura são importadas sob demanda pra não pesar
// no bundle do resto do admin.

const BATCH_SIZE = 400; // limite do Firestore é 500 operações por batch

interface Analysis {
  fileName: string;
  items: IntakeSourceFields[];
  merge: IntakeMergeResult;
}

export default function NoturnoImportPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const { unlocked, unlock } = useSystemToolsUnlocked();
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);

  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [done, setDone] = useState<IntakeMergeResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthChecking(false);
      if (!u) router.push("/admin");
    });
  }, [router]);

  async function handleFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      toast.error("Envie o arquivo .xlsx exportado do Noturno.");
      return;
    }
    setAnalyzing(true);
    setAnalysis(null);
    setDone(null);
    try {
      const [{ readFirstSheet }, { rowsFromSheet, analyzeNoturnoRows }, { mergeIntake }] =
        await Promise.all([
          import("@/lib/intake/xlsx"),
          import("@/lib/intake/noturno"),
          import("@/lib/intake/merge"),
        ]);
      const sheet = readFirstSheet(new Uint8Array(await file.arrayBuffer()));
      const items = analyzeNoturnoRows(rowsFromSheet(sheet));

      const snap = await getDocs(collection(db, "intake_items"));
      const existing = new Map<string, IntakeItem>(
        snap.docs.map((d) => [d.id, { ...(d.data() as IntakeItem), id: d.id }])
      );
      setAnalysis({ fileName: file.name, items, merge: mergeIntake(existing, items) });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível ler o arquivo.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function runImport() {
    if (!analysis) return;
    const { writes } = analysis.merge;
    setProgress(0);
    try {
      for (let i = 0; i < writes.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        for (const w of writes.slice(i, i + BATCH_SIZE)) {
          const ref = doc(db, "intake_items", w.id);
          const stamp = { lastImportedAt: serverTimestamp() };
          if (w.isNew) {
            batch.set(ref, { ...w.data, ...stamp, firstImportedAt: serverTimestamp() });
          } else {
            batch.set(ref, { ...w.data, ...stamp }, { merge: true });
          }
        }
        await batch.commit();
        setProgress(Math.min(writes.length, i + BATCH_SIZE));
      }
      setDone(analysis.merge);
      setAnalysis(null);
      toast.success("Importação concluída.");
    } catch (err) {
      toast.error(
        "Falha ao gravar (o que já foi gravado fica; importe o mesmo arquivo de novo pra completar): " +
          (err instanceof Error ? err.message : String(err))
      );
    } finally {
      setProgress(null);
    }
  }

  if (authChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }
  if (!user) return null;

  if (!unlocked) {
    return (
      <>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
          <Lock className="text-slate-300" size={40} />
          <div>
            <h1 className="font-bold text-slate-700">Área restrita</h1>
            <p className="max-w-xs text-sm text-slate-500">
              Importar o cadastro do Noturno exige a senha de sistema.
            </p>
          </div>
          <Button onClick={() => setShowPasswordPrompt(true)}>Desbloquear</Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin">Voltar</Link>
          </Button>
        </div>
        <SystemPasswordPrompt
          open={showPasswordPrompt}
          onOpenChange={setShowPasswordPrompt}
          onUnlocked={unlock}
        />
      </>
    );
  }

  const m = analysis?.merge;
  const top = analysis
    ? analysis.items
        .filter((i) => i.suggestedStatus !== "bloqueado")
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 8)
    : [];
  const importing = progress !== null;

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <Button variant="ghost" size="icon" asChild aria-label="Voltar ao admin">
            <Link href="/admin">
              <ArrowLeft size={20} />
            </Link>
          </Button>
          <div>
            <h1 className="font-bold text-slate-800">Importar do Noturno</h1>
            <p className="text-xs text-slate-500">
              Cadastro → fila de lançamento. Nada aparece na loja até ser publicado.
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-4 p-4">
        <section className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          <p className="font-medium text-slate-800">Como exportar</p>
          <p className="mt-1">
            No Noturno, exporte o cadastro de produtos em Excel (.xlsx) e envie aqui o
            arquivo completo, sem editar. Pode reenviar sempre que entrarem notas novas:
            só os produtos novos são criados, e o estoque dos já existentes é atualizado.
          </p>
        </section>

        <button
          type="button"
          disabled={analyzing || importing}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files[0];
            if (f) handleFile(f);
          }}
          className="flex min-h-36 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-white p-6 text-slate-500 transition-colors hover:border-purple-400 hover:text-purple-600 disabled:opacity-60"
        >
          {analyzing ? (
            <>
              <Loader2 className="animate-spin" size={28} />
              <span>Lendo e comparando com a fila…</span>
            </>
          ) : (
            <>
              <Upload size={28} />
              <span className="font-medium">Toque para escolher o arquivo .xlsx</span>
              <span className="text-xs">ou arraste aqui</span>
            </>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />

        {analysis && m && (
          <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <FileSpreadsheet size={16} />
              <span className="truncate">{analysis.fileName}</span>
              <span className="ml-auto shrink-0">{analysis.items.length} produtos</span>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Stat label="Novos" value={m.created} tone="text-emerald-700" />
              <Stat label="Atualizados" value={m.updated} tone="text-sky-700" />
              <Stat label="Sem mudança" value={m.unchanged} tone="text-slate-500" />
              <Stat label="Saíram do Noturno" value={m.missing} tone="text-amber-700" />
            </div>

            {top.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                  Primeiros da fila
                </p>
                <ul className="divide-y divide-slate-100 text-sm">
                  {top.map((i) => (
                    <li key={i.sourceCode} className="flex justify-between gap-3 py-1.5">
                      <span className="truncate text-slate-700">{i.name}</span>
                      <span className="shrink-0 text-slate-400">{i.stock} em estoque</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {m.writes.length === 0 ? (
              <p className="text-sm text-slate-500">
                Nada mudou desde a última importação.
              </p>
            ) : (
              <Button className="h-12 w-full text-base" disabled={importing} onClick={runImport}>
                {importing ? (
                  <>
                    <Loader2 className="mr-2 animate-spin" size={18} />
                    Gravando {progress} de {m.writes.length}…
                  </>
                ) : (
                  `Importar ${m.writes.length} alterações`
                )}
              </Button>
            )}
          </section>
        )}

        {done && (
          <section className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            <CheckCircle2 className="mt-0.5 shrink-0" size={18} />
            <p>
              Importação concluída: {done.created} novos, {done.updated} atualizados
              {done.missing > 0 && `, ${done.missing} marcados como fora do Noturno`}.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3 text-center">
      <p className={`text-xl font-bold ${tone}`}>{value.toLocaleString("pt-BR")}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
