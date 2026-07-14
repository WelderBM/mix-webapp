"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Product } from "@/types";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Upload,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
  Package,
  FileJson,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";

// ──────────────────────────────────────
// TIPOS
// ──────────────────────────────────────
interface BatchItem extends Partial<Product> {
  id: string;
  name: string;
  _albanoMeta?: {
    stagingId: string;
    brand: string;
    color: string | null;
    productUrl: string;
    scrapedAt: string;
  };
}

interface BatchFile {
  batchVersion: string;
  exportedAt: string;
  source: string;
  totalItems: number;
  items: BatchItem[];
}

type ItemStatus = "new" | "update" | "skip" | "error";

interface ItemPreview {
  item: BatchItem;
  status: ItemStatus;
  reason?: string;
}

// ──────────────────────────────────────
// PÁGINA PRINCIPAL
// ──────────────────────────────────────
export default function BatchImportPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  // Estado do arquivo
  const [batchFile, setBatchFile] = useState<BatchFile | null>(null);
  const [previews, setPreviews] = useState<ItemPreview[]>([]);
  const [existingIds, setExistingIds] = useState<Set<string>>(new Set());

  // UI states
  const [isDragging, setIsDragging] = useState(false);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    created: number;
    updated: number;
    skipped: number;
    errors: number;
  } | null>(null);
  const [showJsonPaste, setShowJsonPaste] = useState(false);
  const [jsonPaste, setJsonPaste] = useState("");
  const [showPreviewItems, setShowPreviewItems] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Auth check
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthChecking(false);
      if (!u) router.push("/admin");
    });
    return unsub;
  }, [router]);

  // ── Analisa o arquivo e compara com o Firestore
  const analyzeFile = useCallback(async (data: BatchFile) => {
    setLoadingAnalysis(true);
    try {
      // Busca IDs existentes no Firestore
      const snap = await getDocs(collection(db, "products"));
      const existingSet = new Set(snap.docs.map((d) => d.id));
      setExistingIds(existingSet);

      // Classifica cada item
      const classified: ItemPreview[] = data.items.map((item) => {
        if (!item.id || !item.name) {
          return { item, status: "error", reason: "ID ou nome ausente" };
        }
        if (existingSet.has(item.id)) {
          return { item, status: "update", reason: "Produto já existe (será atualizado)" };
        }
        return { item, status: "new", reason: "Novo produto" };
      });

      setPreviews(classified);
      setBatchFile(data);
    } catch (err) {
      toast.error("Erro ao analisar arquivo: " + String(err));
    } finally {
      setLoadingAnalysis(false);
    }
  }, []);

  // ── Parse e validação do JSON
  const parseAndAnalyze = useCallback(
    (raw: string) => {
      try {
        const data = JSON.parse(raw) as BatchFile;
        if (!Array.isArray(data.items)) throw new Error("Campo 'items' ausente ou inválido");
        analyzeFile(data);
      } catch (err) {
        toast.error("JSON inválido: " + String(err));
      }
    },
    [analyzeFile]
  );

  // ── Drag & Drop handlers
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (!file?.name.endsWith(".json")) {
        toast.error("Apenas arquivos .json são aceitos");
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => parseAndAnalyze(ev.target?.result as string);
      reader.readAsText(file);
    },
    [parseAndAnalyze]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => parseAndAnalyze(ev.target?.result as string);
    reader.readAsText(file);
  };

  // ── Importação em lote
  const runImport = async () => {
    if (!batchFile) return;

    const toImport = previews.filter(
      (p) => p.status === "new" || p.status === "update"
    );

    if (toImport.length === 0) {
      toast.error("Nenhum item válido para importar");
      return;
    }

    setImporting(true);
    const result = { created: 0, updated: 0, skipped: 0, errors: 0 };

    // Processa em lotes de 50 (limite Firestore batch = 500 ops)
    const BATCH_SIZE = 50;
    for (let i = 0; i < toImport.length; i += BATCH_SIZE) {
      const chunk = toImport.slice(i, i + BATCH_SIZE);

      await Promise.all(
        chunk.map(async ({ item, status }) => {
          try {
            const { _albanoMeta, ...productData } = item;

            // Monta o produto compatível com o schema do mix-webapp
            const product: Partial<Product> = {
              id: item.id,
              name: item.name,
              description: item.description || "",
              price: item.price ?? 0,
              rollPrice: item.rollPrice ?? undefined,
              originalPrice: item.originalPrice ?? undefined,
              type: item.type || "RIBBON",
              category: item.category || "Fitas",
              imageUrl: item.imageUrl || "",
              images: item.images || [],
              unit: item.unit || "m",
              inStock: item.inStock ?? true,
              disabled: item.disabled ?? false,
              canBeSoldAsRoll: item.canBeSoldAsRoll ?? true,
              isAvailableForCustomBow: item.isAvailableForCustomBow ?? true,
              width: item.width,
              ribbonInventory: item.ribbonInventory || {
                status: "FECHADO",
                remainingMeters: 0,
                totalRollMeters: 100,
              },
            };

            const ref = doc(db, "products", item.id);
            await setDoc(ref, product, { merge: status === "update" });

            if (status === "new") result.created++;
            else result.updated++;
          } catch (err) {
            console.error(`Erro ao importar ${item.id}:`, err);
            result.errors++;
          }
        })
      );
    }

    result.skipped = previews.filter((p) => p.status === "skip").length;
    setImportResult(result);
    setImporting(false);

    if (result.errors === 0) {
      toast.success(
        `✅ Importação concluída! ${result.created} criados, ${result.updated} atualizados.`
      );
    } else {
      toast.error(
        `⚠️  Importação com erros: ${result.errors} falha(s). Veja o console.`
      );
    }
  };

  // ── Contadores
  const counts = {
    new: previews.filter((p) => p.status === "new").length,
    update: previews.filter((p) => p.status === "update").length,
    error: previews.filter((p) => p.status === "error").length,
  };

  // ── Auth loading
  if (authChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <button
            onClick={() => router.push("/admin")}
            className="text-slate-500 hover:text-slate-800 transition-colors p-1"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Package size={22} className="text-purple-600" />
              Importação em Lote
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Importe fitas da Albano em massa para o catálogo do Mix
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* ── RESULTADO DA IMPORTAÇÃO ── */}
        {importResult && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <CheckCircle2 size={20} className="text-green-500" />
              Importação Concluída
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Stat label="Criados" value={importResult.created} color="green" />
              <Stat label="Atualizados" value={importResult.updated} color="blue" />
              <Stat label="Ignorados" value={importResult.skipped} color="slate" />
              <Stat label="Erros" value={importResult.errors} color="red" />
            </div>
            <div className="mt-4 flex gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setBatchFile(null);
                  setPreviews([]);
                  setImportResult(null);
                }}
              >
                Nova importação
              </Button>
              <Button size="sm" onClick={() => router.push("/admin")}>
                Voltar ao Admin
              </Button>
            </div>
          </div>
        )}

        {/* ── UPLOAD DE ARQUIVO ── */}
        {!batchFile && !loadingAnalysis && (
          <div className="space-y-4">
            {/* Drag & Drop */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`rounded-2xl border-2 border-dashed p-12 flex flex-col items-center justify-center cursor-pointer transition-all ${
                isDragging
                  ? "border-purple-400 bg-purple-50"
                  : "border-slate-300 hover:border-purple-300 hover:bg-slate-50 bg-white"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleFileInput}
              />
              <FileJson
                size={48}
                className={`mb-4 ${
                  isDragging ? "text-purple-500" : "text-slate-300"
                }`}
              />
              <p className="text-slate-700 font-semibold text-lg">
                {isDragging
                  ? "Solte o arquivo aqui"
                  : "Arraste o JSON ou clique para selecionar"}
              </p>
              <p className="text-slate-400 text-sm mt-1">
                Arquivo exportado pelo Mix Ingestion Staging
              </p>
            </div>

            {/* Separador */}
            <div className="flex items-center gap-3 text-slate-400 text-sm">
              <div className="flex-1 border-t border-slate-200" />
              ou
              <div className="flex-1 border-t border-slate-200" />
            </div>

            {/* Colar JSON */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <button
                onClick={() => setShowJsonPaste(!showJsonPaste)}
                className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors w-full"
              >
                <FileJson size={16} />
                Colar JSON manualmente
                {showJsonPaste ? (
                  <EyeOff size={14} className="ml-auto" />
                ) : (
                  <Eye size={14} className="ml-auto" />
                )}
              </button>

              {showJsonPaste && (
                <div className="mt-3 space-y-3">
                  <textarea
                    value={jsonPaste}
                    onChange={(e) => setJsonPaste(e.target.value)}
                    placeholder='{"batchVersion":"1.0","items":[...]}'
                    rows={8}
                    className="w-full text-xs font-mono border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-y"
                  />
                  <Button
                    onClick={() => parseAndAnalyze(jsonPaste)}
                    disabled={!jsonPaste.trim()}
                    size="sm"
                    className="w-full"
                  >
                    Analisar JSON
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ANÁLISE EM ANDAMENTO ── */}
        {loadingAnalysis && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 flex flex-col items-center">
            <Loader2 size={40} className="animate-spin text-purple-500 mb-4" />
            <p className="font-medium text-slate-700">
              Analisando arquivo e comparando com o Firestore...
            </p>
          </div>
        )}

        {/* ── PREVIEW ── */}
        {batchFile && !loadingAnalysis && !importResult && (
          <div className="space-y-6">
            {/* Resumo */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <h2 className="font-bold text-slate-800 text-lg">
                  Preview da Importação
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setBatchFile(null);
                      setPreviews([]);
                    }}
                    className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
                  >
                    <RefreshCw size={12} /> Trocar arquivo
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <Stat label="Novos produtos" value={counts.new} color="green" />
                <Stat label="Atualizações" value={counts.update} color="blue" />
                <Stat label="Erros" value={counts.error} color="red" />
              </div>

              {counts.error > 0 && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl p-4 mb-4 text-sm text-red-700">
                  <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                  <div>
                    <strong>{counts.error} item(s) com erro</strong> — verifique
                    se todos têm id e name válidos. Estes serão ignorados na
                    importação.
                  </div>
                </div>
              )}

              {/* Ações */}
              <div className="flex gap-3 flex-wrap">
                <Button
                  onClick={runImport}
                  disabled={importing || counts.new + counts.update === 0}
                  className="gap-2"
                >
                  {importing ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Upload size={16} />
                  )}
                  {importing
                    ? "Importando..."
                    : `Importar ${counts.new + counts.update} produto(s)`}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowPreviewItems(!showPreviewItems)}
                  className="gap-2"
                >
                  {showPreviewItems ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                  {showPreviewItems ? "Ocultar lista" : "Ver lista"}
                </Button>
              </div>
            </div>

            {/* Lista de itens */}
            {showPreviewItems && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-700 text-sm">
                    {previews.length} item(s) no arquivo
                  </h3>
                  <div className="flex gap-2 text-xs">
                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                      🟢 {counts.new} novos
                    </span>
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                      🔵 {counts.update} atualizações
                    </span>
                    {counts.error > 0 && (
                      <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                        🔴 {counts.error} erros
                      </span>
                    )}
                  </div>
                </div>

                <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                  {previews.map(({ item, status, reason }, i) => (
                    <div
                      key={item.id || i}
                      className={`flex items-center gap-4 px-6 py-3 text-sm ${
                        status === "error" ? "bg-red-50" : ""
                      }`}
                    >
                      {/* Status badge */}
                      <span
                        className={`shrink-0 w-2 h-2 rounded-full ${
                          status === "new"
                            ? "bg-green-500"
                            : status === "update"
                            ? "bg-blue-500"
                            : status === "error"
                            ? "bg-red-500"
                            : "bg-slate-300"
                        }`}
                      />

                      {/* Imagem */}
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-8 h-8 rounded-lg object-cover shrink-0 bg-slate-100"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 text-base">
                          🎀
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 truncate">
                          {item.name || "(sem nome)"}
                        </p>
                        <p className="text-xs text-slate-400 font-mono truncate">
                          {item.id || "(sem id)"}
                        </p>
                      </div>

                      {/* Categoria */}
                      <span className="text-xs text-slate-400 hidden sm:block shrink-0">
                        {item.category || "—"}
                      </span>

                      {/* Largura */}
                      {item.width && (
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono shrink-0">
                          {item.width}mm
                        </span>
                      )}

                      {/* Status text */}
                      <span
                        className={`text-xs shrink-0 font-medium ${
                          status === "new"
                            ? "text-green-600"
                            : status === "update"
                            ? "text-blue-600"
                            : status === "error"
                            ? "text-red-600"
                            : "text-slate-400"
                        }`}
                      >
                        {status === "new"
                          ? "Novo"
                          : status === "update"
                          ? "Atualizar"
                          : status === "error"
                          ? "Erro"
                          : "Ignorar"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── INSTRUÇÕES ── */}
        {!batchFile && !loadingAnalysis && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <span>📋</span> Como usar
            </h3>
            <ol className="space-y-2 text-sm text-slate-600 list-decimal list-inside">
              <li>
                Rode o scraper em{" "}
                <code className="bg-slate-100 px-1 rounded text-xs font-mono">
                  mix-ingestion-tools/scraper
                </code>{" "}
                para gerar o catálogo Albano.
              </li>
              <li>
                Abra a staging app (
                <code className="bg-slate-100 px-1 rounded text-xs font-mono">
                  mix-ingestion-tools/staging-app
                </code>
                ) e marque as fitas que estão no estoque físico.
              </li>
              <li>
                Clique em{" "}
                <strong>Exportar JSON → Mix</strong> na staging app para baixar
                o arquivo de importação.
              </li>
              <li>
                Arraste ou selecione o arquivo JSON nesta página e confirme a
                importação.
              </li>
            </ol>
          </div>
        )}
      </div>
    </main>
  );
}

// ──────────────────────────────────────
// COMPONENTE AUXILIAR
// ──────────────────────────────────────
function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "green" | "blue" | "red" | "slate";
}) {
  const colorMap = {
    green: "text-green-600 bg-green-50",
    blue: "text-blue-600 bg-blue-50",
    red: "text-red-600 bg-red-50",
    slate: "text-slate-600 bg-slate-100",
  };

  return (
    <div className={`rounded-xl p-4 text-center ${colorMap[color]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs mt-0.5 font-medium opacity-80">{label}</p>
    </div>
  );
}
