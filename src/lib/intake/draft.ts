import type { Unit } from "@/types";

// Rascunho do card de lançamento (issue #233): se a tela fecha, a
// internet cai ou o celular bloqueia no meio, o que a atendente digitou
// (e a foto) volta quando ela reabrir o item. Fica NO APARELHO, em
// IndexedDB (a foto é um Blob, grande demais pra localStorage) — nada vai
// pro Firestore, então não gasta cota. Some ao publicar/pular/descartar
// ou depois de DRAFT_TTL_MS.

export interface LaunchDraftFields {
  name: string;
  priceText: string;
  categoryName: string;
  // #232. Pode faltar em rascunho gravado antes (fica "").
  subcategoryName?: string;
  unit: Unit | null;
  packText: string;
  metersText: string;
}

// Versão do formato: quando ele mudar (ex.: várias fotos, #201), rascunho
// antigo é descartado em vez de voltar quebrado.
export const DRAFT_VERSION = 1;

export interface LaunchDraft extends LaunchDraftFields {
  v: number;
  photo: Blob | null;
  savedAt: number;
}

export const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// Só vale guardar se a atendente fez algo além do que o card já abre
// preenchido (nome, categoria, metros e pacote vêm do Noturno).
export function isWorthSaving(
  fields: LaunchDraftFields,
  defaults: LaunchDraftFields,
  hasPhoto: boolean,
): boolean {
  if (hasPhoto) return true;
  return (Object.keys(defaults) as (keyof LaunchDraftFields)[]).some(
    (k) => (fields[k] ?? null) !== (defaults[k] ?? null),
  );
}

export function isExpired(draft: Pick<LaunchDraft, "savedAt">, now: number): boolean {
  return now - draft.savedAt > DRAFT_TTL_MS;
}

// Rascunho utilizável: formato atual e dentro do prazo.
export function isUsable(d: unknown, now: number): d is LaunchDraft {
  const x = d as Partial<LaunchDraft> | null;
  return (
    !!x &&
    x.v === DRAFT_VERSION &&
    typeof x.savedAt === "number" &&
    typeof x.priceText === "string" &&
    !isExpired(x as LaunchDraft, now)
  );
}

// ── IndexedDB (mínimo, sem dependência) ──────────────────────────────

const DB_NAME = "mix-intake";
const STORE = "drafts";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("sem IndexedDB"));
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function run<T>(
  mode: IDBTransactionMode,
  fn: (s: IDBObjectStore) => IDBRequest,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const req = fn(tx.objectStore(STORE));
        tx.oncomplete = () => {
          db.close();
          resolve(req.result as T);
        };
        tx.onerror = tx.onabort = () => {
          db.close();
          reject(tx.error);
        };
      }),
  );
}

// Falhas (aba anônima, armazenamento cheio) nunca atrapalham o lançamento:
// sem rascunho, o card só funciona como antes.
export async function loadDraft(id: string): Promise<LaunchDraft | null> {
  try {
    const d = await run<unknown>("readonly", (s) => s.get(id));
    if (!d) return null;
    if (!isUsable(d, Date.now())) {
      deleteDraft(id);
      return null;
    }
    return d;
  } catch {
    return null;
  }
}

export async function saveDraft(id: string, draft: LaunchDraft): Promise<void> {
  try {
    await run("readwrite", (s) => s.put(draft, id));
  } catch {
    /* sem rascunho, sem drama */
  }
}

export async function deleteDraft(id: string): Promise<void> {
  try {
    await run("readwrite", (s) => s.delete(id));
  } catch {
    /* idem */
  }
}

// Ids com rascunho válido (aviso ao sair, #235). Aproveita pra apagar os
// vencidos ou de formato antigo, que senão ficariam no aparelho.
export async function draftIds(): Promise<string[]> {
  try {
    const [keys, values] = await Promise.all([
      run<IDBValidKey[]>("readonly", (s) => s.getAllKeys()),
      run<unknown[]>("readonly", (s) => s.getAll()),
    ]);
    const now = Date.now();
    const ok: string[] = [];
    keys.forEach((k, i) => {
      if (isUsable(values[i], now)) ok.push(String(k));
      else deleteDraft(String(k));
    });
    return ok;
  } catch {
    return [];
  }
}
