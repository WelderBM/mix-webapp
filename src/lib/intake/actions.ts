import {
  collection,
  doc,
  FieldPath,
  increment,
  serverTimestamp,
  writeBatch,
  type WriteBatch,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import type { IntakeItem, IntakeWorkflowStatus } from "@/types/intake";
import {
  buildGroupProductFromIntake,
  buildProductFromIntake,
  statusTransitionDeltas,
  type GroupMember,
  type LaunchInput,
} from "./publish";
import { NO_FAMILY, stockValue } from "./summary";
import { areaForItem, RIBBON_FAMILY } from "./areas";

// Gravações do card de lançamento (#200). Produto, item da fila e placar
// vão no MESMO batch: ou tudo acontece, ou nada (sem produto publicado com
// item ainda "pendente", nem placar desencontrado).

function addSummaryDeltas(
  batch: WriteBatch,
  item: IntakeItem,
  to: IntakeWorkflowStatus,
  userEmail: string | null = null,
) {
  const { byStatus, familyPending } = statusTransitionDeltas(item.status, to);
  const updates: unknown[] = [];
  for (const [status, delta] of Object.entries(byStatus)) {
    updates.push(new FieldPath("byStatus", status), increment(delta));
  }
  if (familyPending !== 0) {
    updates.push(
      new FieldPath("families", item.family ?? NO_FAMILY, "pending"),
      increment(familyPending),
    );
    if (item.family === RIBBON_FAMILY) {
      updates.push(
        new FieldPath("ribbonAreas", String(areaForItem(item)), "pending"),
        increment(familyPending),
      );
    }
  }
  // Placar (#202): valor em estoque publicado e contagem por atendente.
  if (to === "publicado" && item.status !== "publicado") {
    updates.push(
      new FieldPath("publishedStockValue"),
      increment(stockValue(item)),
    );
    updates.push(
      new FieldPath("publishedBy", userEmail || "(desconhecido)"),
      increment(1),
    );
  }
  if (updates.length === 0) return;
  const [field, value, ...rest] = updates;
  batch.update(
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
  addSummaryDeltas(batch, item, "publicado", userEmail);
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
  addSummaryDeltas(batch, item, to);
  await batch.commit();
}

// Grupo (#201): UM produto com variações + todos os itens do grupo
// publicados apontando para ele, num batch só (tudo ou nada).
export async function publishIntakeGroup(
  members: GroupMember[],
  input: LaunchInput,
  userEmail: string | null,
): Promise<string> {
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
    addSummaryDeltas(batch, item, "publicado", userEmail);
  }
  await batch.commit();
  return productRef.id;
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
    addSummaryDeltas(batch, item, to);
  }
  await batch.commit();
}
