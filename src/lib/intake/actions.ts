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
  buildProductFromIntake,
  statusTransitionDeltas,
  type LaunchInput,
} from "./publish";
import { NO_FAMILY } from "./summary";

// Gravações do card de lançamento (#200). Produto, item da fila e placar
// vão no MESMO batch: ou tudo acontece, ou nada (sem produto publicado com
// item ainda "pendente", nem placar desencontrado).

function addSummaryDeltas(
  batch: WriteBatch,
  item: IntakeItem,
  to: IntakeWorkflowStatus,
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
): Promise<string> {
  const ext = blob.type === "image/webp" ? "webp" : "jpg";
  const path = `products/noturno/${item.sourceCode}-${Date.now()}.${ext}`;
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
  addSummaryDeltas(batch, item, "publicado");
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
