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
import { ArrowLeft, ArrowRight, Loader2, MapPin, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  IntakeFlag,
  IntakeItem,
  IntakeWorkflowStatus,
} from "@/types/intake";
import { matchesQuery, parseQuery } from "@/lib/intake/search";
import {
  coreProgress,
  stockValue,
  sortedFamilies,
  NO_FAMILY,
  type IntakeSummary,
} from "@/lib/intake/summary";
import { statusTransitionDeltas } from "@/lib/intake/publish";
import { useCategoryStore } from "@/store/categoryStore";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { LaunchSheet } from "@/components/admin/intake/LaunchSheet";
import { OrphanedItemsRepair } from "@/components/admin/intake/OrphanedItemsRepair";
import {
  attributePlural,
  buildGroups,
  groupKeyFor,
  publishedGroupsByKey,
  type VariantGroup,
} from "@/lib/intake/groups";
import { splitBowRibbons } from "@/lib/intake/ribbonLines";
import { splitCatalogBalloons } from "@/lib/intake/merge";
import {
  activeClaim,
  areaById,
  areaForItem,
  areaProgress,
  firstName,
  isAssignableFamily,
  nextArea,
  NO_AREA,
  RIBBON_FAMILY,
  STORE_AREAS,
  type AreaProgress,
} from "@/lib/intake/areas";
import {
  claimArea,
  releaseArea,
  setFamilyArea,
  subscribeAreasMeta,
  type AreasMeta,
} from "@/lib/intake/areasMeta";

// Fila de lançamento (issue #199): a atendente, na frente da prateleira,
// acha o item em segundos — por ÁREA da loja (#231) → família, ou busca
// tolerante. Cada atendente "pega" uma área; as outras veem quem está lá.
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
  catalogo: "No catálogo",
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
  const [area, setArea] = useState<number | null>(null);
  const [meta, setMeta] = useState<AreasMeta>({ claims: {}, overrides: {} });
  // Área ocupada por outra atendente: pede confirmação antes de entrar.
  const [busyArea, setBusyArea] = useState<{ id: number; name: string } | null>(null);
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
  const [selectedGroup, setSelectedGroup] =
    useState<VariantGroup<IntakeItem> | null>(null);
  const categories = useCategoryStore((s) => s.categories);
  const subscribeCategories = useCategoryStore((s) => s.subscribe);

  useEffect(() => {
    if (user) subscribeCategories();
  }, [user, subscribeCategories]);

  // Depois de publicar/pular: atualiza lista, cache e placar localmente,
  // sem reler o banco.
  function handleChanged(updated: IntakeItem) {
    if (selected) applyChanges([{ prev: selected, updated }]);
  }

  // Grupo (#201): vários itens mudam de uma vez.
  function handleGroupChanged(changes: { prev: IntakeItem; updated: IntakeItem }[]) {
    applyChanges(changes);
  }

  function applyChanges(changes: { prev: IntakeItem; updated: IntakeItem }[]) {
    const byId = new Map(changes.map((c) => [c.updated.id, c.updated]));
    const swap = (list: IntakeItem[]) => list.map((i) => byId.get(i.id) ?? i);
    for (const [k, list] of cache.current) cache.current.set(k, swap(list));
    setItems((list) => (list ? swap(list) : list));
    setSummary((current) => {
      if (!current) return current;
      const next: IntakeSummary = structuredClone(current);
      for (const { prev, updated } of changes) {
        const { byStatus, familyPending } = statusTransitionDeltas(
          prev.status,
          updated.status,
        );
        for (const [st, d] of Object.entries(byStatus)) {
          next.byStatus[st as IntakeWorkflowStatus] += d;
        }
        const fam = next.families[prev.family ?? NO_FAMILY];
        if (fam) fam.pending += familyPending;
        if (prev.family === RIBBON_FAMILY && next.ribbonAreas) {
          const r = next.ribbonAreas[String(areaForItem(prev))];
          if (r) r.pending += familyPending;
        }
        if (updated.status === "publicado" && prev.status !== "publicado") {
          next.publishedStockValue =
            (next.publishedStockValue ?? 0) + stockValue(prev);
          const who = user?.email || "(desconhecido)";
          next.publishedBy = {
            ...next.publishedBy,
            [who]: (next.publishedBy?.[who] ?? 0) + 1,
          };
        }
      }
      return next;
    });
    // Quem está trabalhando renova a reserva da área (vale 3 h).
    if (area != null && area !== NO_AREA && me) {
      const c = meta.claims[String(area)];
      if (c?.email === me && Date.now() - c.at > 30 * 60 * 1000) {
        claimArea(area, me, c.name).catch(() => {});
      }
    }
  }

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthChecking(false);
      if (!u) router.push("/admin");
    });
  }, [router]);

  const [summaryVersion, setSummaryVersion] = useState(0);
  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, "intake_meta", "summary"))
      .then((s) => setSummary(s.exists() ? (s.data() as IntakeSummary) : null))
      .catch(() => setSummary(null));
  }, [user, summaryVersion]);

  useEffect(() => {
    if (!user) return;
    return subscribeAreasMeta(setMeta);
  }, [user]);

  const progress = useMemo(
    () =>
      summary
        ? areaProgress(summary.families, meta.overrides, summary.ribbonAreas)
        : {},
    [summary, meta.overrides],
  );

  const me = user?.email ?? "";

  // Toque na grade: se outra atendente está na área, confirma antes.
  function pickArea(id: number) {
    const c = activeClaim(meta.claims[String(id)], Date.now());
    if (c && c.email !== me) setBusyArea({ id, name: c.name });
    else enterArea(id);
  }

  // claim=false: entrou numa área de outra pessoa sem tomar a reserva
  // (a reserva continua dela; ao sair não libera nada).
  function enterArea(id: number | null, claim = true) {
    const prev = area;
    if (prev != null && prev !== NO_AREA) {
      const c = meta.claims[String(prev)];
      if (c?.email === me) releaseArea(prev).catch(() => {});
    }
    setArea(id);
    setText("");
    const fams = id == null ? [] : (progress[id]?.families ?? []);
    setFamily(fams[0] ?? null);
    if (claim && id != null && id !== NO_AREA && me) {
      claimArea(id, me, firstName(user?.displayName || me)).catch(() => {});
    }
  }

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
      // FITA se divide em três áreas: mostra só os rolos desta área.
      .filter(
        (i) =>
          parsed.indexToken ||
          area == null ||
          i.family !== RIBBON_FAMILY ||
          areaForItem(i, meta.overrides) === area,
      )
      .filter((i) => matchesQuery(i.searchText, parsed.terms))
      .sort((a, b) => b.priority - a.priority);
  }, [items, status, family, parsed, area, meta.overrides]);
  // Fita plástica de laço pendente: cadastro por linha em Fitas (#259).
  // Balão do catálogo pendente: estoque vai para o montador (#259).
  const { listed, bowRibbons, catalogBalloons } = useMemo(() => {
    const { queue, bow } = splitBowRibbons(visible);
    const { queue: rest, balloons } = splitCatalogBalloons(queue);
    return { listed: rest, bowRibbons: bow, catalogBalloons: balloons };
  }, [visible]);

  // Lançamento em grupo (#201): pendentes com a mesma base e cores
  // diferentes viram UMA linha. Grupo sobe na lista pela maior prioridade.
  type Entry =
    | { kind: "item"; item: IntakeItem; priority: number }
    | { kind: "group"; group: VariantGroup<IntakeItem>; priority: number };
  const entries = useMemo<Entry[]>(() => {
    const pendingItems = listed.filter((i) => i.status === "pendente");
    const others = listed.filter((i) => i.status !== "pendente");
    const { groups, singles } = buildGroups(pendingItems);
    return [
      ...groups.map((g) => ({
        kind: "group" as const,
        group: g,
        priority: Math.max(...g.members.map((m) => m.item.priority)),
      })),
      ...[...singles, ...others].map((i) => ({
        kind: "item" as const,
        item: i,
        priority: i.priority,
      })),
    ].sort((a, b) => b.priority - a.priority);
  }, [listed]);

  // Produtos já lançados em grupo, por chave (#253): pendente da mesma base
  // ganha "acrescentar ao produto da loja" no card.
  const publishedGroups = useMemo(() => publishedGroupsByKey(items ?? []), [items]);
  const selectedPublishedGroup =
    selected?.status === "pendente"
      ? (publishedGroups.get(selectedGroup?.key ?? groupKeyFor(selected) ?? "") ?? null)
      : null;

  const families = useMemo(
    () => (summary ? sortedFamilies(summary) : []),
    [summary],
  );
  const areaFamilies = useMemo(() => {
    if (area == null) return [];
    const inArea = new Set(progress[area]?.families ?? []);
    return families.filter(([name]) => inArea.has(name));
  }, [area, progress, families]);
  const searching = !!parsed.indexToken;
  const now = Date.now();
  const next =
    area != null ? nextArea(area, progress, meta.claims, me, now) : null;

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
            className="size-11 shrink-0"
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

        <div className="mx-auto flex max-w-3xl flex-wrap gap-2 pb-1">
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

        {summary && <Scoreboard summary={summary} email={user.email} />}

        {summary && area == null && !searching && (
          <OrphanedItemsRepair
            email={user.email}
            onDone={() => {
              cache.current.clear();
              setSummaryVersion((v) => v + 1);
            }}
          />
        )}

        {summary && area == null && !searching && (
          <AreaGrid
            progress={progress}
            claims={meta.claims}
            me={me}
            now={now}
            onPick={pickArea}
          />
        )}

        {area != null && !searching && (
          <section aria-label="Área" className="space-y-3">
            <AreaBar
              area={area}
              progress={progress[area]}
              sharedWith={(() => {
                const c = activeClaim(meta.claims[String(area)], now);
                return c && c.email !== me ? c.name : null;
              })()}
              next={next}
              onBack={() => enterArea(null)}
              onNext={() => next != null && enterArea(next)}
            />
            {areaFamilies.length > 0 ? (
              <div className="flex max-h-32 flex-wrap gap-2 overflow-y-auto">
                {areaFamilies.map(([name, f]) => (
                  <Chip
                    key={name}
                    active={family === name}
                    onClick={() => setFamily(name)}
                    muted={f.pending === 0}
                  >
                    {name} <span className="opacity-60">{f.pending}</span>
                  </Chip>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-slate-500">
                Nada para lançar nesta área.
              </p>
            )}
            {area === NO_AREA && family && isAssignableFamily(family) && (
              <AssignFamily
                key={family}
                family={family}
                onAssign={(id) => {
                  setFamilyArea(family, id).catch(() => {});
                  const rest = areaFamilies
                    .map(([n]) => n)
                    .filter((n) => n !== family);
                  setFamily(rest[0] ?? null);
                }}
              />
            )}
          </section>
        )}

        {!items && !loading && summary && area != null && !searching && (
          <p className="py-8 text-center text-sm text-slate-500">
            Escolha uma família acima ou busque pelo nome do produto.
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
              {listed.length.toLocaleString("pt-BR")} produto(s)
              {hitLimit &&
                " · muitos resultados, digite mais palavras para refinar"}
            </p>
            {catalogBalloons.length > 0 && (
              <p className="mb-3 rounded-xl border border-purple-200 bg-purple-50 p-3 text-sm text-purple-900">
                {catalogBalloons.length.toLocaleString("pt-BR")} balão(ões) do
                catálogo não aparecem aqui: são vendidos pelo montador de
                balões, com o estoque do Noturno. Novas cores e tamanhos:{" "}
                <Link href="/admin?aba=baloes" className="font-medium underline">
                  Balões › Montar pelo Noturno
                </Link>
                .
              </p>
            )}
            {bowRibbons.length > 0 && (
              <p className="mb-3 rounded-xl border border-purple-200 bg-purple-50 p-3 text-sm text-purple-900">
                {bowRibbons.length.toLocaleString("pt-BR")} fita(s) de laço não
                aparecem aqui: são cadastradas por linha, todas as cores de uma
                vez, em{" "}
                <Link href="/admin?aba=fitas" className="font-medium underline">
                  Fitas › Cadastrar pelo Noturno
                </Link>
                .
              </p>
            )}
            <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
              {entries.slice(0, shown).map((e) =>
                e.kind === "group" ? (
                  <GroupRow
                    key={e.group.key}
                    group={e.group}
                    onOpen={() => {
                      setSelectedGroup(e.group);
                      setSelected(e.group.members[0].item);
                    }}
                  />
                ) : (
                  <IntakeRow
                    key={e.item.id}
                    item={e.item}
                    onOpen={() => {
                      setSelectedGroup(null);
                      setSelected(e.item);
                    }}
                  />
                ),
              )}
            </ul>
            {entries.length > shown && (
              <Button
                variant="outline"
                className="mt-3 h-12 w-full"
                onClick={() => setShown((n) => n + PAGE_SIZE)}
              >
                Mostrar mais {Math.min(PAGE_SIZE, entries.length - shown)}
              </Button>
            )}
          </section>
        )}
      </div>

      <ConfirmDialog
        open={!!busyArea}
        onOpenChange={(open) => !open && setBusyArea(null)}
        title={busyArea ? `${busyArea.name} está nessa área agora` : ""}
        description="Se entrar mesmo assim, vocês duas podem lançar o mesmo produto. Melhor escolher outra área."
        confirmLabel="Entrar mesmo assim"
        cancelLabel="Escolher outra"
        destructive={false}
        onConfirm={() => {
          const id = busyArea?.id;
          setBusyArea(null);
          if (id != null) enterArea(id, false);
        }}
      />

      <LaunchSheet
        item={selected}
        categories={categories}
        userEmail={user.email}
        group={selectedGroup}
        publishedGroup={selectedPublishedGroup}
        onClose={() => {
          setSelected(null);
          setSelectedGroup(null);
        }}
        onChanged={handleChanged}
        onGroupChanged={handleGroupChanged}
      />
    </main>
  );
}

// Uma linha para várias cores do mesmo produto (#201).
function GroupRow({
  group,
  onOpen,
}: {
  group: VariantGroup<IntakeItem>;
  onOpen: () => void;
}) {
  const stock = group.members.reduce((n, m) => n + m.item.stock, 0);
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="flex min-h-14 w-full items-center gap-3 px-3 py-2 text-left active:bg-slate-50"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-800">
            {group.base}
          </p>
          <p className="truncate text-xs text-slate-500">
            {group.members
              .slice(0, 4)
              .map((m) => m.label)
              .join(", ")}
            {group.members.length > 4 && "…"} · {stock.toLocaleString("pt-BR")} em
            estoque
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-medium text-purple-800">
          {group.members.length} {attributePlural(group.attribute)}
        </span>
      </button>
    </li>
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

function Scoreboard({
  summary,
  email,
}: {
  summary: IntakeSummary;
  email: string | null;
}) {
  const { done, total } = coreProgress(summary);
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const mine = email ? (summary.publishedBy?.[email] ?? 0) : 0;
  return (
    <section
      aria-label="Progresso"
      className="space-y-2 rounded-xl border border-slate-200 bg-white p-4"
    >
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-medium text-slate-800">Revenda</p>
        <p className="text-sm text-slate-600">
          {done.toLocaleString("pt-BR")} de {total.toLocaleString("pt-BR")}{" "}
          conferidos
        </p>
      </div>
      <div
        role="progressbar"
        aria-label="Revenda conferida"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 overflow-hidden rounded-full bg-slate-100"
      >
        <div
          className="h-full rounded-full bg-purple-600"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-slate-500">
        {(summary.publishedStockValue ?? 0).toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
          maximumFractionDigits: 0,
        })}{" "}
        em estoque já na loja online
        {mine > 0 && ` · você publicou ${mine.toLocaleString("pt-BR")}`}
      </p>
    </section>
  );
}

// Grade de áreas da loja (#231): a atendente escolhe onde está; cada
// área mostra o que falta e quem já está lá.
function AreaGrid({
  progress,
  claims,
  me,
  now,
  onPick,
}: {
  progress: Record<number, AreaProgress>;
  claims: AreasMeta["claims"];
  me: string;
  now: number;
  onPick: (id: number) => void;
}) {
  const unassigned = progress[NO_AREA];
  return (
    <section aria-label="Áreas da loja" className="space-y-2">
      <h2 className="text-lg font-bold text-slate-800">
        Em que área da loja você está?
      </h2>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {STORE_AREAS.map((a) => {
          const p = progress[a.id];
          const total = p?.total ?? 0;
          const pending = p?.pending ?? 0;
          const pct = total > 0 ? Math.round(((total - pending) / total) * 100) : 100;
          const c = activeClaim(claims[String(a.id)], now);
          const other = c && c.email !== me ? c : null;
          return (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => onPick(a.id)}
                className={`flex min-h-16 w-full flex-col gap-1.5 rounded-xl border bg-white p-3 text-left active:bg-slate-50 ${
                  other ? "border-amber-200" : "border-slate-200"
                }`}
              >
                <span className="flex items-baseline justify-between gap-2">
                  <span className="font-medium text-slate-800">
                    <span className="text-slate-400">{a.id}.</span> {a.name}
                  </span>
                  <span className="shrink-0 text-xs text-slate-500">
                    {pending > 0
                      ? `${pending.toLocaleString("pt-BR")} a lançar`
                      : "concluída"}
                  </span>
                </span>
                <span className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <span
                    className="block h-full rounded-full bg-purple-600"
                    style={{ width: `${pct}%` }}
                  />
                </span>
                <span className="truncate text-xs text-slate-500">
                  {other ? (
                    <span className="font-medium text-amber-700">
                      Com {other.name} agora
                    </span>
                  ) : (
                    a.hint
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {unassigned && unassigned.pending > 0 && (
        <button
          type="button"
          onClick={() => onPick(NO_AREA)}
          className="flex min-h-16 w-full items-center justify-between gap-3 rounded-xl border border-dashed border-slate-300 bg-white p-3 text-left text-sm active:bg-slate-50"
        >
          <span className="min-w-0 space-y-1">
            <span className="block font-medium text-slate-700">Sem área definida</span>
            <span className="block text-xs text-slate-500">
              Diga uma vez em que área fica cada família
            </span>
          </span>
          <span className="shrink-0 text-xs text-slate-500">
            {unassigned.families.length.toLocaleString("pt-BR")} famílias
          </span>
        </button>
      )}
    </section>
  );
}

function AreaBar({
  area,
  progress,
  sharedWith,
  next,
  onBack,
  onNext,
}: {
  area: number;
  progress: AreaProgress | undefined;
  sharedWith: string | null;
  next: number | null;
  onBack: () => void;
  onNext: () => void;
}) {
  const a = areaById(area);
  const pending = progress?.pending ?? 0;
  const nextArea = next != null ? areaById(next) : null;
  return (
    <div className="space-y-2 rounded-xl border border-purple-200 bg-purple-50 p-3">
      <div className="flex items-center gap-2">
        <MapPin size={18} className="shrink-0 text-purple-600" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-slate-800">
            {a ? `Área ${a.id} · ${a.name}` : "Sem área definida"}
          </p>
          <p className="text-xs text-slate-600">
            {pending > 0
              ? `${pending.toLocaleString("pt-BR")} a lançar nesta área`
              : "Área concluída 🎉"}
          </p>
          {sharedWith && (
            <p className="text-xs font-medium text-amber-700">
              {sharedWith} também está nesta área: combinem quem lança o quê.
            </p>
          )}
        </div>
        <Button variant="outline" size="sm" className="h-11 shrink-0" onClick={onBack}>
          Trocar área
        </Button>
      </div>
      {nextArea && (
        <Button
          variant={pending === 0 ? "default" : "ghost"}
          className="h-11 w-full justify-between"
          onClick={onNext}
        >
          <span className="truncate">
            Próxima: Área {nextArea.id} · {nextArea.name}
          </span>
          <ArrowRight size={16} className="shrink-0" />
        </Button>
      )}
    </div>
  );
}

function AssignFamily({
  family,
  onAssign,
}: {
  family: string;
  onAssign: (area: number) => void;
}) {
  return (
    <label className="block space-y-1 rounded-xl border border-slate-200 bg-white p-3">
      <span className="text-sm text-slate-700">
        Em que área ficam os produtos <strong>{family}</strong>?
      </span>
      <select
        defaultValue=""
        onChange={(e) => e.target.value && onAssign(Number(e.target.value))}
        className="h-12 w-full rounded-lg border border-slate-300 bg-white px-3 text-base"
      >
        <option value="" disabled>
          Escolha a área…
        </option>
        {STORE_AREAS.map((a) => (
          <option key={a.id} value={a.id}>
            {a.id}. {a.name}
          </option>
        ))}
      </select>
      <span className="block text-xs text-slate-500">
        Vale para todos os produtos dessa família, para todas as atendentes.
      </span>
    </label>
  );
}
