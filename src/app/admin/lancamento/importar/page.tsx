"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  Timestamp,
  where,
  serverTimestamp,
  updateDoc,
  setDoc,
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
  Tags,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useSystemToolsUnlocked,
  SystemPasswordPrompt,
} from "@/components/admin/SystemPasswordGate";
import type { IntakeItem, IntakeSourceFields } from "@/types/intake";
import type { IntakeMergeResult } from "@/lib/intake/merge";
import {
  groupStock,
  isIgnorableSyncError,
  type ProductStockUpdate,
} from "@/lib/intake/stockSync";
import { useCategoryStore } from "@/store/categoryStore";
import {
  buildTaxonomyWrites,
  planTaxonomy,
  type TaxonomyPlan,
} from "@/lib/intake/subcategories";
import { uniqueSlug } from "@/lib/migrateCategories";
import {
  surveyCatalog,
  withAddedColors,
  type CatalogSurvey,
} from "@/lib/intake/balloonCatalog";
import type { BalloonConfig } from "@/types/balloon";

// Importador do cadastro do Noturno → fila de lançamento (issue #198).
// Parse, análise e comparação rodam no navegador; só o que mudou é
// gravado. As libs de leitura são importadas sob demanda pra não pesar
// no bundle do resto do admin.

const BATCH_SIZE = 400; // limite do Firestore é 500 operações por batch

interface Analysis {
  fileName: string;
  items: IntakeSourceFields[];
  existing: Map<string, IntakeItem>;
  // Quando a fila foi lida (relógio do aparelho), para a releitura parcial.
  readAt: number;
  merge: IntakeMergeResult;
  // Produtos já publicados cujo estoque cruzou o zero (#202).
  stockSync: ProductStockUpdate[];
}

interface ImportResult extends IntakeMergeResult {
  soldOut: number;
  backInStock: number;
  syncSkipped: number;
}

// Lê a fila atual e calcula o que gravar. Chamada na prévia E de novo no
// clique em "Importar": entre os dois, uma atendente pode ter publicado
// algo — gravar com o retrato da prévia usaria estado velho (produto
// publicado ficaria fora da sincronização e o placar perderia a contagem).
// No clique, em vez de reler a fila inteira (~7 mil leituras, #373), relê
// só os itens que mudaram desde a prévia: toda gravação na fila marca
// publishedAt, statusChangedAt ou lastImportedAt.
const CLOCK_MARGIN_MS = 10 * 60 * 1000; // relógio do aparelho pode estar adiantado

async function changedSince(sinceMs: number) {
  const since = Timestamp.fromMillis(sinceMs - CLOCK_MARGIN_MS);
  const col = collection(db, "intake_items");
  const snaps = await Promise.all(
    ["publishedAt", "statusChangedAt", "lastImportedAt"].map((field) =>
      getDocs(query(col, where(field, ">", since))),
    ),
  );
  return snaps.flatMap((snap) => snap.docs);
}

async function computeImport(
  items: IntakeSourceFields[],
  base?: { existing: Map<string, IntakeItem>; readAt: number },
) {
  const [{ mergeIntake }, { applyWrites }, { computeStockSync }] =
    await Promise.all([
      import("@/lib/intake/merge"),
      import("@/lib/intake/summary"),
      import("@/lib/intake/stockSync"),
    ]);
  const readAt = Date.now();
  let existing: Map<string, IntakeItem>;
  if (base) {
    existing = new Map(base.existing);
    for (const d of await changedSince(base.readAt)) {
      existing.set(d.id, { ...(d.data() as IntakeItem), id: d.id });
    }
  } else {
    const snap = await getDocs(collection(db, "intake_items"));
    existing = new Map(
      snap.docs.map((d) => [d.id, { ...(d.data() as IntakeItem), id: d.id }]),
    );
  }
  const merge = mergeIntake(existing, items);
  const stockSync = computeStockSync(
    existing,
    applyWrites(existing, merge.writes),
  );
  return { existing, readAt, merge, stockSync };
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
  const [done, setDone] = useState<ImportResult | null>(null);
  const categories = useCategoryStore((st) => st.categories);
  const subscribeCategories = useCategoryStore((st) => st.subscribe);
  const [creatingTaxonomy, setCreatingTaxonomy] = useState(false);
  // Balões do Noturno × catálogo do montador (#236).
  const [balloonConfig, setBalloonConfig] = useState<BalloonConfig | null>(null);
  const [addingColors, setAddingColors] = useState(false);

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, "settings", "balloons"))
      .then((s) => s.exists() && setBalloonConfig(s.data() as BalloonConfig))
      .catch(() => {});
  }, [user]);

  const balloonSurvey = useMemo(
    () => (analysis && balloonConfig ? surveyCatalog(analysis.items, balloonConfig) : null),
    [analysis, balloonConfig],
  );

  // Cores do Noturno que o catálogo não tem → catálogo (transação: não
  // sobrescreve uma edição feita no admin ao mesmo tempo).
  async function addBalloonColors(adds: { typeId: string; color: string }[]) {
    setAddingColors(true);
    try {
      const ref = doc(db, "settings", "balloons");
      const next = await runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        const cfg = snap.data() as BalloonConfig;
        const types = withAddedColors(cfg.types, adds);
        tx.update(ref, { types });
        return { ...cfg, types };
      });
      setBalloonConfig(next);
      toast.success(`${adds.length} cor(es) adicionada(s) ao catálogo de balões.`);
    } catch (err) {
      toast.error("Não foi possível adicionar: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setAddingColors(false);
    }
  }

  useEffect(() => {
    if (user) subscribeCategories();
  }, [user, subscribeCategories]);

  // Varredura pós-importação (#232): só o que ainda vai ser lançado.
  const taxonomy = useMemo(() => {
    if (!analysis) return null;
    const pending = analysis.items.filter(
      (i) => (analysis.existing.get(i.sourceCode)?.status ?? "pendente") === "pendente",
    );
    return planTaxonomy(pending, categories);
  }, [analysis, categories]);

  async function createMissingTaxonomy(plan: TaxonomyPlan) {
    setCreatingTaxonomy(true);
    try {
      const writes = buildTaxonomyWrites(plan, categories, uniqueSlug);
      for (const w of writes) {
        await setDoc(doc(db, "categories", w.id), w.data, { merge: !w.isNew });
      }
      toast.success("Categorias e subcategorias criadas na loja.");
    } catch (err) {
      toast.error(
        "Não foi possível criar: " + (err instanceof Error ? err.message : String(err)),
      );
    } finally {
      setCreatingTaxonomy(false);
    }
  }
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
      const [{ readFirstSheet }, { rowsFromSheet, analyzeNoturnoRows }] =
        await Promise.all([
          import("@/lib/intake/xlsx"),
          import("@/lib/intake/noturno"),
        ]);
      const sheet = readFirstSheet(new Uint8Array(await file.arrayBuffer()));
      const items = analyzeNoturnoRows(rowsFromSheet(sheet));
      const { existing, readAt, merge, stockSync } = await computeImport(items);
      setAnalysis({ fileName: file.name, items, existing, readAt, merge, stockSync });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Não foi possível ler o arquivo.",
      );
    } finally {
      setAnalyzing(false);
    }
  }

  async function runImport() {
    if (!analysis) return;
    setProgress(0);
    try {
      // Recalcula com o estado ATUAL da fila (ver computeImport).
      const { existing, merge, stockSync } = await computeImport(
        analysis.items,
        analysis,
      );
      const { writes } = merge;
      // Produtos ANTES da fila: se algo falhar no meio, reimportar o mesmo
      // arquivo recalcula a sincronização (a fila ainda está no estado
      // antigo). Ao contrário, a fila já igual ao arquivo esconderia a
      // diferença e o produto ficaria com o estoque errado.
      const results = await Promise.allSettled(
        stockSync.map(async (u) => {
          const ref = doc(db, "products", u.productId);
          if (!u.variants) return updateDoc(ref, { inStock: u.inStock });
          // Produto lançado em grupo (#201): atualiza cada cor; o estoque do
          // produto conta só as cores que ele ainda tem (#253). Transação:
          // uma cor acrescentada pela fila ao mesmo tempo não se perde.
          return runTransaction(db, async (tx) => {
            const snap = await tx.get(ref);
            if (!snap.exists()) throw { code: "not-found" };
            const data = snap.data();
            tx.update(ref, groupStock(data.variants, u, data.inStock));
          });
        }),
      );
      // Só "produto não existe" (apagado à mão no admin) é ignorado. Qualquer
      // outra falha (rede, cota) interrompe ANTES de gravar a fila — senão a
      // fila ficaria igual ao arquivo e a próxima importação não refaria a
      // sincronização, deixando o produto à venda com estoque zero.
      const failed = results.filter(
        (r): r is PromiseRejectedResult =>
          r.status === "rejected" && !isIgnorableSyncError(r.reason),
      );
      if (failed.length > 0) throw failed[0].reason;
      const syncSkipped = results.filter((r) => r.status === "rejected").length;

      for (let i = 0; i < writes.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        for (const w of writes.slice(i, i + BATCH_SIZE)) {
          const ref = doc(db, "intake_items", w.id);
          const stamp = { lastImportedAt: serverTimestamp() };
          if (w.isNew) {
            batch.set(ref, {
              ...w.data,
              ...stamp,
              firstImportedAt: serverTimestamp(),
            });
          } else {
            batch.set(ref, { ...w.data, ...stamp }, { merge: true });
          }
        }
        await batch.commit();
        setProgress(Math.min(writes.length, i + BATCH_SIZE));
      }
      const { applyWrites, buildIntakeSummary } =
        await import("@/lib/intake/summary");
      const summary = buildIntakeSummary(
        applyWrites(existing, writes).values(),
      );
      await setDoc(doc(db, "intake_meta", "summary"), {
        ...summary,
        updatedAt: serverTimestamp(),
      });
      // Estoque dos balões para o montador da loja (cor esgotada some).
      if (balloonConfig) {
        // chars: estoque de cada letra/número do foil, por cor.
        const { stock, chars } = surveyCatalog(analysis.items, balloonConfig);
        await setDoc(doc(db, "settings", "balloonStock"), {
          stock,
          chars,
          updatedAt: serverTimestamp(),
        });
      }
      setDone({
        ...merge,
        soldOut: stockSync.filter((u) => !u.inStock).length,
        backInStock: stockSync.filter((u) => u.inStock).length,
        syncSkipped,
      });
      setAnalysis(null);
      toast.success("Importação concluída.");
    } catch (err) {
      toast.error(
        "Falha ao gravar (o que já foi gravado fica; importe o mesmo arquivo de novo pra completar): " +
          (err instanceof Error ? err.message : String(err)),
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
          <Button onClick={() => setShowPasswordPrompt(true)}>
            Desbloquear
          </Button>
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
          <Button
            variant="ghost"
            size="icon"
            asChild
            aria-label="Voltar ao admin"
          >
            <Link href="/admin">
              <ArrowLeft size={20} />
            </Link>
          </Button>
          <div>
            <h1 className="font-bold text-slate-800">Importar do Noturno</h1>
            <p className="text-xs text-slate-500">
              Cadastro → fila de lançamento. Nada aparece na loja até ser
              publicado.
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-4 p-4">
        <section className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          <p className="font-medium text-slate-800">Como exportar</p>
          <p className="mt-1">
            No Noturno, exporte o cadastro de produtos em{" "}
            <strong>Excel (.xlsx)</strong> e envie aqui o arquivo completo, sem
            editar. Pode reenviar sempre que entrarem notas novas: só os
            produtos novos são criados, e o estoque dos já existentes é
            atualizado.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Precisa ser o Excel: o relatório em PDF corta o nome do produto em
            44 letras e perde cor e estampa (ex.: vários sacos de presente ficam
            com o mesmo nome).
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
              <span className="font-medium">
                Toque para escolher o arquivo .xlsx
              </span>
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
              <span className="ml-auto shrink-0">
                {analysis.items.length} produtos
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Stat label="Novos" value={m.created} tone="text-emerald-700" />
              <Stat label="Atualizados" value={m.updated} tone="text-sky-700" />
              <Stat
                label="Sem mudança"
                value={m.unchanged}
                tone="text-slate-500"
              />
              <Stat
                label="Saíram do Noturno"
                value={m.missing}
                tone="text-amber-700"
              />
            </div>

            {analysis.stockSync.length > 0 && (
              <p className="rounded-lg bg-sky-50 p-3 text-sm text-sky-900">
                Produtos já na loja:{" "}
                {analysis.stockSync.filter((u) => !u.inStock).length} vão ficar{" "}
                <strong>esgotados</strong> e{" "}
                {analysis.stockSync.filter((u) => u.inStock).length} voltam à{" "}
                <strong>venda</strong>, conforme o estoque do Noturno.
              </p>
            )}

            {balloonSurvey && (
              <BalloonSurveyPanel
                survey={balloonSurvey}
                config={balloonConfig!}
                busy={addingColors}
                onAdd={addBalloonColors}
              />
            )}

            {taxonomy && (
              <TaxonomyPanel
                plan={taxonomy}
                busy={creatingTaxonomy}
                onCreate={() => createMissingTaxonomy(taxonomy)}
              />
            )}

            {top.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                  Primeiros da fila
                </p>
                <ul className="divide-y divide-slate-100 text-sm">
                  {top.map((i) => (
                    <li
                      key={i.sourceCode}
                      className="flex justify-between gap-3 py-1.5"
                    >
                      <span className="truncate text-slate-700">{i.name}</span>
                      <span className="shrink-0 text-slate-400">
                        {i.stock} em estoque
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {m.writes.length === 0 && analysis.stockSync.length === 0 ? (
              <p className="text-sm text-slate-500">
                Nada mudou desde a última importação.
              </p>
            ) : (
              <Button
                className="h-12 w-full text-base"
                disabled={importing}
                onClick={runImport}
              >
                {importing ? (
                  <>
                    <Loader2 className="mr-2 animate-spin" size={18} />
                    Gravando…
                  </>
                ) : m.writes.length > 0 ? (
                  `Importar ${m.writes.length} alterações`
                ) : (
                  `Atualizar estoque de ${analysis.stockSync.length} produtos`
                )}
              </Button>
            )}
          </section>
        )}

        {done && (
          <section className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            <CheckCircle2 className="mt-0.5 shrink-0" size={18} />
            <p>
              Importação concluída: {done.created} novos, {done.updated}{" "}
              atualizados
              {done.missing > 0 &&
                `, ${done.missing} marcados como fora do Noturno`}
              {done.soldOut > 0 &&
                `, ${done.soldOut} produtos da loja esgotados`}
              {done.backInStock > 0 && `, ${done.backInStock} de volta à venda`}
              {done.syncSkipped > 0 &&
                ` (${done.syncSkipped} produtos não encontrados na loja, ignorados)`}
              .
            </p>
          </section>
        )}
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="rounded-lg bg-slate-50 p-3 text-center">
      <p className={`text-xl font-bold ${tone}`}>
        {value.toLocaleString("pt-BR")}
      </p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

// Organização da loja (#232): como a fila vai cair nas categorias e
// subcategorias do site, o que falta criar e o que as regras não pegaram.
function TaxonomyPanel({
  plan,
  busy,
  onCreate,
}: {
  plan: TaxonomyPlan;
  busy: boolean;
  onCreate: () => void;
}) {
  const byCategory = new Map<string, { subcategory: string; count: number }[]>();
  for (const c of plan.classified) {
    byCategory.set(c.category, [...(byCategory.get(c.category) ?? []), c]);
  }
  const missingCount =
    plan.missingCategories.length + plan.missingSubcategories.length;
  if (plan.classified.length === 0 && plan.unclassified.length === 0) return null;
  return (
    <div className="space-y-3 rounded-lg border border-slate-200 p-3">
      <p className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <Tags size={16} /> Organização da loja
      </p>
      <ul className="space-y-1 text-sm text-slate-600">
        {[...byCategory.entries()].map(([cat, subs]) => (
          <li key={cat}>
            <strong className="text-slate-800">{cat}:</strong>{" "}
            {subs.map((x) => `${x.subcategory} (${x.count})`).join(", ")}
          </li>
        ))}
      </ul>
      {missingCount > 0 && (
        <div className="space-y-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          <p>
            Ainda não existem no site
            {plan.missingCategories.length > 0 &&
              ` — categorias: ${plan.missingCategories.join(", ")}`}
            {plan.missingSubcategories.length > 0 &&
              ` — ${plan.missingSubcategories.length} subcategoria(s)`}
            . Sem elas, a atendente escolhe à mão.
          </p>
          <Button
            variant="outline"
            className="h-11 w-full bg-white"
            disabled={busy}
            onClick={onCreate}
          >
            {busy ? <Loader2 className="animate-spin" size={16} /> : "Criar o que falta no site"}
          </Button>
        </div>
      )}
      {plan.unclassified.length > 0 && (
        <details className="text-sm text-slate-600">
          <summary className="cursor-pointer">
            Sem subcategoria:{" "}
            {plan.unclassified.map((u) => `${u.family} ${u.count}`).join(", ")}
          </summary>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs text-slate-500">
            {plan.unclassified.flatMap((u) =>
              u.examples.map((e) => <li key={u.family + e}>{e}</li>),
            )}
          </ul>
        </details>
      )}
    </div>
  );
}

// Balões do Noturno × catálogo do montador (#236): o que casou, cores e
// tamanhos que faltam no catálogo, e o que segue como produto comum.
function BalloonSurveyPanel({
  survey,
  config,
  busy,
  onAdd,
}: {
  survey: CatalogSurvey;
  config: BalloonConfig;
  busy: boolean;
  onAdd: (adds: { typeId: string; color: string }[]) => void;
}) {
  const typeName = (id: string) => config.types.find((t) => t.id === id)?.name ?? id;
  // Uma sugestão por tipo+cor (a mesma cor em vários tamanhos entra uma vez).
  const byTypeColor = new Map<string, { typeId: string; color: string; stock: number }>();
  for (const c of survey.newColors) {
    const k = `${c.typeId}|${c.color.toLowerCase()}`;
    const e = byTypeColor.get(k) ?? { typeId: c.typeId, color: c.color, stock: 0 };
    e.stock += c.stock;
    byTypeColor.set(k, e);
  }
  const colorAdds = [...byTypeColor.values()].sort((a, b) => b.stock - a.stock);
  const [names, setNames] = useState<Record<string, string>>({});
  const nameOf = (a: { typeId: string; color: string }) => names[`${a.typeId}|${a.color}`] ?? a.color;
  return (
    <div className="space-y-3 rounded-lg border border-slate-200 p-3">
      <p className="text-sm font-medium text-slate-700">Balões × catálogo do site</p>
      <p className="text-sm text-slate-600">
        <strong>{survey.matched}</strong> balões ligados ao catálogo: o estoque de
        cada cor e tamanho vai para o montador da loja ao importar (cor zerada
        some). <strong>{survey.notCatalog}</strong> são formatos ou temáticos e
        seguem como produto.
      </p>
      {colorAdds.length > 0 && (
        <div className="space-y-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          <p>
            Cores com estoque no Noturno que o catálogo não tem. Corrija o nome
            se precisar e adicione:
          </p>
          <ul className="space-y-1">
            {colorAdds.map((a) => (
              <li key={a.typeId + a.color} className="flex items-center gap-2">
                <span className="w-28 shrink-0 truncate text-xs text-amber-800">
                  {typeName(a.typeId)}
                </span>
                <input
                  value={nameOf(a)}
                  onChange={(e) =>
                    setNames((n) => ({ ...n, [`${a.typeId}|${a.color}`]: e.target.value }))
                  }
                  aria-label={`Nome da cor ${a.color}`}
                  className="h-11 min-w-0 flex-1 rounded-md border border-amber-200 bg-white px-2 text-base"
                />
                <span className="shrink-0 text-xs">{Math.round(a.stock)} un.</span>
                <Button
                  variant="outline"
                  className="h-11 shrink-0 bg-white"
                  disabled={busy}
                  onClick={() => onAdd([{ typeId: a.typeId, color: nameOf(a) }])}
                >
                  Adicionar
                </Button>
              </li>
            ))}
          </ul>
          {colorAdds.length > 1 && (
            <Button
              variant="outline"
              className="h-11 w-full bg-white"
              disabled={busy}
              onClick={() => onAdd(colorAdds.map((a) => ({ typeId: a.typeId, color: nameOf(a) })))}
            >
              {busy ? <Loader2 className="animate-spin" size={16} /> : `Adicionar as ${colorAdds.length} cores`}
            </Button>
          )}
        </div>
      )}
      {survey.newSizes.length > 0 && (
        <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
          Tamanhos no Noturno que o catálogo não tem (cadastre com preço em
          Admin → Balões):{" "}
          {survey.newSizes
            .map((z) => `${typeName(z.typeId)} ${z.size}" (${Math.round(z.stock)} un.)`)
            .join(", ")}
        </p>
      )}
    </div>
  );
}
