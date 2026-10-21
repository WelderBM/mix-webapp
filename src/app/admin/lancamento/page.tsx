"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { ArrowLeft, Loader2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  IntakeFlag,
  IntakeItem,
  IntakeWorkflowStatus,
} from "@/types/intake";
import { matchesQuery, parseQuery } from "@/lib/intake/search";
import {
  sortedFamilies,
  NO_FAMILY,
  type IntakeSummary,
} from "@/lib/intake/summary";
import { statusTransitionDeltas } from "@/lib/intake/publish";
import { useCategoryStore } from "@/store/categoryStore";
import { LaunchSheet } from "@/components/admin/intake/LaunchSheet";

// Fila de lançamento (issue #199): a atendente, na frente da prateleira,
// acha o item em segundos — por corredor (família) ou busca tolerante.
// Cada consulta lê só a família escolhida ou os itens que casam com UM
// termo da busca; nunca a fila inteira (cota diária do Firestore).

const SEARCH_LIMIT = 300;
const PAGE_SIZE = 50;

type StatusFilter = IntakeWorkflowStatus | "todos";

const STATUS_LABEL: Record<StatusFilter, string> = {
  pendente: "Pendentes",
  publicado: "Publicados",
  pulado: "Pulados",
  fora_da_loja: "Fora da loja",
  todos: "Todos",
};

const DISCARD_HINT: Partial<Record<IntakeFlag, string>> = {
  datado: "Datado",
  obsoleto: "Obsoleto",
  perecivel: "Perecível",
};

export default function IntakeQueuePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  const [summary, setSummary] = useState<IntakeSummary | null | undefined>(
    undefined,
  );
  const [family, setFamily] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusFilter>("pendente");
  const [text, setText] = useState("");
  const [debounced, setDebounced] = useState("");
  const [items, setItems] = useState<IntakeItem[] | null>(null);
  const [hitLimit, setHitLimit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shown, setShown] = useState(PAGE_SIZE);
  const cache = useRef(new Map<string, IntakeItem[]>());
  const [selected, setSelected] = useState<IntakeItem | null>(null);
  const categories = useCategoryStore((s) => s.categories);
  const subscribeCategories = useCategoryStore((s) => s.subscribe);

  useEffect(() => {
    if (user) subscribeCategories();
  }, [user, subscribeCategories]);

  // Depois de publicar/pular: atualiza lista, cache e placar localmente,
  // sem reler o banco.
  function handleChanged(updated: IntakeItem) {
    const prev = selected;
    const swap = (list: IntakeItem[]) =>
      list.map((i) => (i.id === updated.id ? updated : i));
    for (const [k, list] of cache.current) cache.current.set(k, swap(list));
    setItems((list) => (list ? swap(list) : list));
    if (prev && summary) {
      const { byStatus, familyPending } = statusTransitionDeltas(
        prev.status,
        updated.status,
      );
      const next: IntakeSummary = structuredClone(summary);
      for (const [st, d] of Object.entries(byStatus)) {
        next.byStatus[st as IntakeWorkflowStatus] += d;
      }
      const fam = next.families[prev.family ?? NO_FAMILY];
      if (fam) fam.pending += familyPending;
      setSummary(next);
    }
  }

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthChecking(false);
      if (!u) router.push("/admin");
    });
  }, [router]);

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, "intake_meta", "summary"))
      .then((s) => setSummary(s.exists() ? (s.data() as IntakeSummary) : null))
      .catch(() => setSummary(null));
  }, [user]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(text), 300);
    return () => clearTimeout(t);
  }, [text]);

  // Nomes de família são comuns demais pra servir de chave de consulta.
  const familyKeys = useMemo(
    () =>
      new Set(Object.keys(summary?.families ?? {}).map((f) => f.toLowerCase())),
    [summary],
  );
  const parsed = useMemo(
    () => parseQuery(debounced, familyKeys),
    [debounced, familyKeys],
  );

  // Busca no banco: por termo (se houver) ou pela família escolhida.
  useEffect(() => {
    if (!user) return;
    const key = parsed.indexToken
      ? `q:${parsed.indexToken}`
      : family
        ? `f:${family}`
        : null;
    setShown(PAGE_SIZE);
    if (!key) {
      setItems(null);
      return;
    }
    const cached = cache.current.get(key);
    if (cached) {
      setItems(cached);
      setHitLimit(key.startsWith("q:") && cached.length >= SEARCH_LIMIT);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    const col = collection(db, "intake_items");
    const q = parsed.indexToken
      ? query(
          col,
          where("searchTokens", "array-contains", parsed.indexToken),
          limit(SEARCH_LIMIT),
        )
      : query(col, where("family", "==", family));
    getDocs(q)
      .then((snap) => {
        if (cancelled) return;
        const list = snap.docs.map((d) => ({
          ...(d.data() as IntakeItem),
          id: d.id,
        }));
        cache.current.set(key, list);
        setItems(list);
        setHitLimit(key.startsWith("q:") && list.length >= SEARCH_LIMIT);
      })
      .catch(
        () =>
          !cancelled &&
          setError("Não foi possível carregar. Verifique a conexão."),
      )
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [user, parsed.indexToken, family]);

  const visible = useMemo(() => {
    if (!items) return [];
    return items
      .filter((i) => i.inLatestImport)
      .filter((i) => status === "todos" || i.status === status)
      .filter((i) => !family || !parsed.indexToken || i.family === family)
      .filter((i) => matchesQuery(i.searchText, parsed.terms))
      .sort((a, b) => b.priority - a.priority);
  }, [items, status, family, parsed]);

  const families = useMemo(
    () => (summary ? sortedFamilies(summary) : []),
    [summary],
  );

  if (authChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }
  if (!user) return null;

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      <header className="sticky top-0 z-30 space-y-3 border-b border-slate-200 bg-white px-4 pb-3 pt-3">
        <div className="mx-auto flex max-w-3xl items-center gap-2">
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
          <div className="min-w-0">
            <h1 className="font-bold text-slate-800">Lançamento de produtos</h1>
            {summary && (
              <p className="text-xs text-slate-500">
                {summary.byStatus.publicado.toLocaleString("pt-BR")} publicados
                · {summary.byStatus.pendente.toLocaleString("pt-BR")} pendentes
              </p>
            )}
          </div>
        </div>

        <div className="mx-auto max-w-3xl">
          <label className="relative block">
            <span className="sr-only">Buscar produto</span>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="search"
              inputMode="search"
              autoComplete="off"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Buscar: nome, cor, código…"
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 text-base outline-none focus:border-purple-400 focus:bg-white"
            />
            {text && (
              <button
                type="button"
                onClick={() => setText("")}
                aria-label="Limpar busca"
                className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-slate-400"
              >
                <X size={18} />
              </button>
            )}
          </label>
        </div>

        <div className="mx-auto flex max-w-3xl gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          {(Object.keys(STATUS_LABEL) as StatusFilter[]).map((s) => (
            <Chip key={s} active={status === s} onClick={() => setStatus(s)}>
              {STATUS_LABEL[s]}
            </Chip>
          ))}
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-4 p-4">
        {summary === null && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            A fila ainda está vazia. Peça para o administrador importar o
            cadastro do Noturno (Admin → ⋯ → Importar do Noturno).
          </p>
        )}

        {families.length > 0 && (
          <section aria-label="Corredores">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
              Corredor {family && "· toque de novo para sair"}
            </p>
            <div className="flex max-h-32 flex-wrap gap-2 overflow-y-auto">
              {families.map(([name, f]) => (
                <Chip
                  key={name}
                  active={family === name}
                  onClick={() => setFamily(family === name ? null : name)}
                  muted={!f.isCore}
                >
                  {name} <span className="opacity-60">{f.pending}</span>
                </Chip>
              ))}
            </div>
          </section>
        )}

        {!items && !loading && summary && (
          <p className="py-8 text-center text-sm text-slate-500">
            Escolha um corredor ou busque pelo nome do produto.
          </p>
        )}

        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-slate-400" size={28} />
          </div>
        )}

        {error && <p className="text-center text-sm text-red-600">{error}</p>}

        {items && !loading && (
          <section aria-label="Produtos">
            <p className="mb-2 text-xs text-slate-500">
              {visible.length.toLocaleString("pt-BR")} produto(s)
              {hitLimit &&
                " · muitos resultados, digite mais palavras para refinar"}
            </p>
            <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
              {visible.slice(0, shown).map((i) => (
                <IntakeRow key={i.id} item={i} onOpen={() => setSelected(i)} />
              ))}
            </ul>
            {visible.length > shown && (
              <Button
                variant="outline"
                className="mt-3 h-12 w-full"
                onClick={() => setShown((n) => n + PAGE_SIZE)}
              >
                Mostrar mais {Math.min(PAGE_SIZE, visible.length - shown)}
              </Button>
            )}
          </section>
        )}
      </div>

      <LaunchSheet
        item={selected}
        categories={categories}
        userEmail={user.email}
        onClose={() => setSelected(null)}
        onChanged={handleChanged}
      />
    </main>
  );
}

function IntakeRow({ item, onOpen }: { item: IntakeItem; onOpen: () => void }) {
  const discard = item.flags.map((f) => DISCARD_HINT[f]).filter(Boolean);
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="flex min-h-14 w-full items-center gap-3 px-3 py-2 text-left active:bg-slate-50"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-800">
            {item.name}
          </p>
          <p className="truncate text-xs text-slate-500">
            Cód. {item.sourceCode}
            {item.brand && ` · ${item.brand}`} ·{" "}
            {item.stock.toLocaleString("pt-BR")} em estoque
          </p>
        </div>
        {discard.length > 0 && (
          <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
            {discard.join(" · ")}
          </span>
        )}
        {item.status !== "pendente" && (
          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
            {STATUS_LABEL[item.status]}
          </span>
        )}
      </button>
    </li>
  );
}

function Chip({
  active,
  muted,
  onClick,
  children,
}: {
  active: boolean;
  muted?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-11 shrink-0 rounded-full border px-4 text-sm transition-colors ${
        active
          ? "border-purple-600 bg-purple-600 text-white"
          : muted
            ? "border-slate-200 bg-white text-slate-500"
            : "border-slate-300 bg-white text-slate-700"
      }`}
    >
      {children}
    </button>
  );
}
