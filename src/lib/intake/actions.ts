import {
  collection,
  deleteField,
  doc,
  documentId,
  FieldPath,
  getDocs,
  increment,
  query,
  runTransaction,
  serverTimestamp,
  where,
  writeBatch,
  type Transaction,
  type WriteBatch,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import type { IntakeItem, IntakeWorkflowStatus } from "@/types/intake";
import type { Product } from "@/types";
import {
  appendGroupVariants,
  buildGroupProductFromIntake,
  buildProductFromIntake,
  MAX_GROUP_SIZE,
  type GroupMember,
  type LaunchInput,
} from "./publish";
import { summaryDeltas } from "./summary";
import { isCatalogBalloon } from "./merge";
import { removeProductsFromSections } from "@/lib/sections";
import type { StoreSection } from "@/types";

// Balão do catálogo do montador nunca vira produto da loja (o montador já
// vende por tipo × tamanho × cor). Trava aqui também, além da fila.
function assertNotCatalogBalloon(items: Pick<IntakeItem, "family" | "name">[]) {
  if (items.some(isCatalogBalloon)) {
    throw new Error("Balão do catálogo é vendido pelo montador de balões, não como produto.");
  }
}

// Gravações do card de lançamento (#200). Produto, item da fila e placar
// vão no MESMO batch: ou tudo acontece, ou nada (sem produto publicado com
// item ainda "pendente", nem placar desencontrado).

function addSummaryDeltas(
  batch: WriteBatch | Transaction,
  items: IntakeItem[],
  to: IntakeWorkflowStatus,
  userEmail: string | null = null,
) {
  // Uma única gravação no resumo por batch, com os ajustes já somados
  // (limite de 500 transforms por documento, ver summaryDeltas).
  const updates = summaryDeltas(items, to, userEmail).flatMap(({ path, delta }) => [
    new FieldPath(...path),
    increment(delta),
  ]);
  if (updates.length === 0) return;
  const [field, value, ...rest] = updates;
  // Batch e transação têm o mesmo update(ref, campo, valor, ...).
  (batch as WriteBatch).update(
    doc(db, "intake_meta", "summary"),
    field as FieldPath,
    value,
    ...rest,
  );
}

export async function uploadIntakePhoto(
  item: IntakeItem,
  blob: Blob,
  index = 0,
): Promise<string> {
  const ext = blob.type === "image/webp" ? "webp" : "jpg";
  // index no nome: várias fotos sobem em paralelo no mesmo milissegundo.
  const path = `products/noturno/${item.sourceCode}-${Date.now()}-${index}.${ext}`;
  const snap = await uploadBytes(ref(storage, path), blob, {
    contentType: blob.type,
  });
  return getDownloadURL(snap.ref);
}

export async function publishIntakeItem(
  item: IntakeItem,
  input: LaunchInput,
  userEmail: string | null,
): Promise<string> {
  assertNotCatalogBalloon([item]);
  const productRef = doc(collection(db, "products"));
  const product = buildProductFromIntake(item, input);
  // Firestore rejeita `undefined` explícito.
  const clean = Object.fromEntries(
    Object.entries(product).filter(([, v]) => v !== undefined),
  );
  const batch = writeBatch(db);
  batch.set(productRef, {
    ...clean,
    id: productRef.id,
    createdAt: serverTimestamp(),
  });
  batch.update(doc(db, "intake_items", item.id), {
    status: "publicado",
    productId: productRef.id,
    publishedAt: serverTimestamp(),
    publishedBy: userEmail,
  });
  addSummaryDeltas(batch, [item], "publicado", userEmail);
  await batch.commit();
  return productRef.id;
}

export async function setIntakeStatus(
  item: IntakeItem,
  to: Exclude<IntakeWorkflowStatus, "publicado">,
  userEmail: string | null,
): Promise<void> {
  const batch = writeBatch(db);
  batch.update(doc(db, "intake_items", item.id), {
    status: to,
    statusChangedAt: serverTimestamp(),
    statusChangedBy: userEmail,
  });
  addSummaryDeltas(batch, [item], to);
  await batch.commit();
}

// Grupo (#201): UM produto com variações + todos os itens do grupo
// publicados apontando para ele, num batch só (tudo ou nada).
export async function publishIntakeGroup(
  members: GroupMember[],
  input: LaunchInput,
  userEmail: string | null,
): Promise<string> {
  assertNotCatalogBalloon(members.map((m) => m.item));
  const productRef = doc(collection(db, "products"));
  const product = buildGroupProductFromIntake(members, input);
  const clean = Object.fromEntries(
    Object.entries(product).filter(([, v]) => v !== undefined),
  );
  const batch = writeBatch(db);
  batch.set(productRef, {
    ...clean,
    id: productRef.id,
    createdAt: serverTimestamp(),
  });
  for (const { item } of members) {
    batch.update(doc(db, "intake_items", item.id), {
      status: "publicado",
      productId: productRef.id,
      publishedAt: serverTimestamp(),
      publishedBy: userEmail,
    });
  }
  addSummaryDeltas(batch, members.map((m) => m.item), "publicado", userEmail);
  await batch.commit();
  return productRef.id;
}

// Cor nova num produto já lançado em grupo (#253): variações acrescentadas
// + itens publicados apontando para o MESMO produto. Transação, não batch:
// a lista de variações é lida e regravada inteira, e outra atendente (ou a
// reimportação) gravando no mesmo produto ao mesmo tempo apagaria a cor
// nova. A transação refaz a leitura se o produto mudou no meio.
export async function addToGroupProduct(
  members: GroupMember[],
  productId: string,
  userEmail: string | null,
): Promise<void> {
  assertNotCatalogBalloon(members.map((m) => m.item));
  if (members.length > MAX_GROUP_SIZE) {
    throw new Error(
      `Grupo grande demais: acrescente no máximo ${MAX_GROUP_SIZE} opções de uma vez.`,
    );
  }
  const productRef = doc(db, "products", productId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(productRef);
    if (!snap.exists()) throw new Error("O produto não existe mais na loja.");
    const result = appendGroupVariants(
      (snap.data() as Product).variants,
      members,
    );
    if ("error" in result) throw new Error(result.error);
    tx.update(productRef, result);
    for (const { item } of members) {
      tx.update(doc(db, "intake_items", item.id), {
        status: "publicado",
        productId,
        publishedAt: serverTimestamp(),
        publishedBy: userEmail,
      });
    }
    addSummaryDeltas(tx, members.map((m) => m.item), "publicado", userEmail);
  });
}

// Pular / "não vender online" do grupo inteiro num batch só (tudo ou
// nada): gravando cor por cor, uma queda de rede no meio deixava parte
// gravada e o placar era descontado duas vezes na nova tentativa (#252).
export async function setIntakeStatusMany(
  items: IntakeItem[],
  to: Exclude<IntakeWorkflowStatus, "publicado">,
  userEmail: string | null,
): Promise<void> {
  const batch = writeBatch(db);
  for (const item of items) {
    batch.update(doc(db, "intake_items", item.id), {
      status: to,
      statusChangedAt: serverTimestamp(),
      statusChangedBy: userEmail,
    });
  }
  addSummaryDeltas(batch, items, to);
  await batch.commit();
}

// Fitas por linha (#259): cada cor vira um produto RIBBON e o item da fila
// fica publicado apontando para ele. Lotes de 150 cores (2 gravações por
// cor, limite do batch é 500). Cada lote é tudo-ou-nada; um lote que
// falhar não desfaz os anteriores — a tela relê e mostra o que sobrou.
export async function publishRibbonLine(
  entries: { item: IntakeItem; product: Omit<Product, "id" | "createdAt"> }[],
  userEmail: string | null,
  onProgress?: (done: number) => void,
): Promise<string[]> {
  const ids: string[] = [];
  for (let i = 0; i < entries.length; i += 150) {
    const batch = writeBatch(db);
    const chunk = entries.slice(i, i + 150);
    for (const { item, product } of chunk) {
      const productRef = doc(collection(db, "products"));
      const clean = Object.fromEntries(
        Object.entries(product).filter(([, v]) => v !== undefined),
      );
      batch.set(productRef, { ...clean, id: productRef.id, createdAt: serverTimestamp() });
      batch.update(doc(db, "intake_items", item.id), {
        status: "publicado",
        productId: productRef.id,
        publishedAt: serverTimestamp(),
        publishedBy: userEmail,
      });
      ids.push(productRef.id);
    }
    addSummaryDeltas(batch, chunk.map((e) => e.item), "publicado", userEmail);
    await batch.commit();
    onProgress?.(Math.min(entries.length, i + 150));
  }
  return ids;
}

// ── Exclusão de produto (#363) ───────────────────────────────────────
// Apagar só `products/{id}` deixava o item da fila "publicado" apontando
// para nada: some da fila e não dá para recadastrar. Agora o item volta
// para "pendente" (placar ajustado) junto com a exclusão.

const IN_LIMIT = 30; // máximo de valores num `where(..., "in", ...)`
const BATCH_OPS = 450; // folga sob o limite de 500 gravações por batch

async function itemsLinkedTo(productIds: string[]): Promise<IntakeItem[]> {
  const out: IntakeItem[] = [];
  for (let i = 0; i < productIds.length; i += IN_LIMIT) {
    const snap = await getDocs(
      query(collection(db, "intake_items"), where("productId", "in", productIds.slice(i, i + IN_LIMIT))),
    );
    snap.forEach((d) => out.push({ ...(d.data() as IntakeItem), id: d.id }));
  }
  return out;
}

function reopenItem(batch: WriteBatch, item: IntakeItem, userEmail: string | null) {
  batch.update(doc(db, "intake_items", item.id), {
    status: "pendente",
    productId: deleteField(),
    statusChangedAt: serverTimestamp(),
    statusChangedBy: userEmail,
  });
}

// Exclui os produtos, devolve os itens ligados para a fila e tira os ids
// das vitrines manuais. Lotes de até 450 gravações; cada lote leva o
// produto junto com os itens dele (tudo ou nada por produto).
export async function deleteProducts(
  productIds: string[],
  userEmail: string | null,
  onProgress?: (done: number) => void,
): Promise<{ reopened: number }> {
  const ids = [...new Set(productIds)];
  if (ids.length === 0) return { reopened: 0 };
  const byProduct = new Map<string, IntakeItem[]>();
  for (const item of await itemsLinkedTo(ids)) {
    const list = byProduct.get(item.productId!) ?? [];
    list.push(item);
    byProduct.set(item.productId!, list);
  }

  let batch = writeBatch(db);
  let ops = 0;
  let pending: IntakeItem[] = [];
  let done = 0;
  const flush = async () => {
    if (ops === 0) return;
    addSummaryDeltas(batch, pending, "pendente");
    await batch.commit();
    onProgress?.(done);
    batch = writeBatch(db);
    ops = 0;
    pending = [];
  };
  for (const id of ids) {
    const items = byProduct.get(id) ?? [];
    if (ops + 1 + items.length > BATCH_OPS) await flush();
    batch.delete(doc(db, "products", id));
    for (const item of items) reopenItem(batch, item, userEmail);
    pending.push(...items);
    ops += 1 + items.length;
    done++;
  }
  await flush();

  // Vitrine: lida na hora (não do estado da tela) para não regravar
  // outra mudança feita em paralelo.
  await runTransaction(db, async (tx) => {
    const ref = doc(db, "settings", "general");
    const snap = await tx.get(ref);
    const sections = (snap.data()?.homeSections ?? []) as StoreSection[];
    const next = removeProductsFromSections(sections, new Set(ids));
    if (next) tx.update(ref, { homeSections: next });
  });

  return { reopened: [...byProduct.values()].reduce((n, l) => n + l.length, 0) };
}

// Itens "publicado" cujo produto já foi apagado (antes do #363). Lê só
// os publicados e confere a existência dos produtos em lotes de 30.
export async function findOrphanedItems(): Promise<IntakeItem[]> {
  const snap = await getDocs(query(collection(db, "intake_items"), where("status", "==", "publicado")));
  const items = snap.docs.map((d) => ({ ...(d.data() as IntakeItem), id: d.id }));
  const productIds = [...new Set(items.map((i) => i.productId).filter((x): x is string => !!x))];
  const existing = new Set<string>();
  for (let i = 0; i < productIds.length; i += IN_LIMIT) {
    const found = await getDocs(
      query(collection(db, "products"), where(documentId(), "in", productIds.slice(i, i + IN_LIMIT))),
    );
    found.forEach((d) => existing.add(d.id));
  }
  return items.filter((i) => !!i.productId && !existing.has(i.productId));
}

export async function reopenItems(items: IntakeItem[], userEmail: string | null): Promise<void> {
  for (let i = 0; i < items.length; i += BATCH_OPS) {
    const chunk = items.slice(i, i + BATCH_OPS);
    const batch = writeBatch(db);
    for (const item of chunk) reopenItem(batch, item, userEmail);
    addSummaryDeltas(batch, chunk, "pendente");
    await batch.commit();
  }
}
