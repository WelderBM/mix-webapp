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
  // Grupo (#201): cores marcadas e nomes corrigidos, pelo código do Noturno.
  variantState?: { code: string; label: string; include: boolean }[];
  unit: Unit | null;
  packText: string;
  metersText: string;
}

// Versão do formato. v2 (#201): várias fotos. v1 (uma foto só) ainda é
// aceito e convertido em normalizeDraft; formato desconhecido é descartado.
export const DRAFT_VERSION = 2;

export interface LaunchDraft extends LaunchDraftFields {
  v: number;
  photos: Blob[]; // a primeira é a capa
  savedAt: number;
}

// Rascunho gravado antes do #201 tinha `photo` (uma só).
export function normalizeDraft(d: LaunchDraft & { photo?: Blob | null }): LaunchDraft {
  if (d.v === 1) {
    const { photo, ...rest } = d;
    return { ...rest, v: DRAFT_VERSION, photos: photo ? [photo] : [] };
  }
  return { ...d, photos: d.photos ?? [] };
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
  // JSON: compara por valor também a lista de cores do grupo.
  return (Object.keys(defaults) as (keyof LaunchDraftFields)[]).some(
    (k) => JSON.stringify(fields[k] ?? null) !== JSON.stringify(defaults[k] ?? null),
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
    (x.v === DRAFT_VERSION || x.v === 1) &&
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
// As fotos ficam numa chave própria: digitar no card regrava só o texto
// (registro pequeno), não até 5 Blobs a cada letra (revisão do #251).
const PHOTOS_SUFFIX = "#fotos";
const photosKey = (id: string) => id + PHOTOS_SUFFIX;

export async function loadDraft(id: string): Promise<LaunchDraft | null> {
  try {
    const d = await run<unknown>("readonly", (s) => s.get(id));
    if (!d) return null;
    if (!isUsable(d, Date.now())) {
      deleteDraft(id);
      return null;
    }
    const draft = normalizeDraft(d);
    if ((d as { v?: number }).v === 1) {
      // Migra de vez: foto para a chave própria + registro v2. Sem isso, a
      // primeira edição regravava o registro sem a foto (revisão do #251).
      const { photos, ...fields } = draft;
      await saveDraftPhotos(id, photos);
      await saveDraft(id, fields);
      return draft;
    }
    const photos = await run<Blob[] | undefined>("readonly", (s) => s.get(photosKey(id)));
    return { ...draft, photos: photos ?? [] };
  } catch {
    return null;
  }
}

// Campos do card (sem as fotos).
export async function saveDraft(
  id: string,
  draft: Omit<LaunchDraft, "photos">,
): Promise<void> {
  try {
    await run("readwrite", (s) => s.put(draft, id));
  } catch {
    /* sem rascunho, sem drama */
  }
}

export async function saveDraftPhotos(id: string, photos: Blob[]): Promise<void> {
  try {
    await run("readwrite", (s) =>
      photos.length > 0 ? s.put(photos, photosKey(id)) : s.delete(photosKey(id)),
    );
  } catch {
    /* idem */
  }
}

export async function deleteDraft(id: string): Promise<void> {
  try {
    await run("readwrite", (s) => s.delete(id));
    await run("readwrite", (s) => s.delete(photosKey(id)));
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
    const valid = new Set<string>();
    keys.forEach((k, i) => {
      const key = String(k);
      if (key.endsWith(PHOTOS_SUFFIX)) return;
      if (isUsable(values[i], now)) {
        ok.push(key);
        valid.add(key);
      } else deleteDraft(key);
    });
    // Fotos sem o registro do card (rascunho já apagado): limpa.
    for (const k of keys.map(String)) {
      if (k.endsWith(PHOTOS_SUFFIX) && !valid.has(k.slice(0, -PHOTOS_SUFFIX.length))) {
        run("readwrite", (s) => s.delete(k)).catch(() => {});
      }
    }
    return ok;
  } catch {
    return [];
  }
}
