import {
  deleteField,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  FieldPath,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { AreaClaim, AreaOverrides } from "./areas";

// `intake_meta/areas` (issue #231): um documento só, ouvido em tempo real
// pela tela de lançamento — quem está em cada área e as famílias que a
// atendente colocou numa área à mão. Barato: 1 leitura por mudança.

export interface AreasMeta {
  claims: Record<string, AreaClaim | undefined>;
  overrides: AreaOverrides;
}

const ref = () => doc(db, "intake_meta", "areas");

export function subscribeAreasMeta(cb: (m: AreasMeta) => void): () => void {
  return onSnapshot(
    ref(),
    (s) => {
      const d = (s.data() ?? {}) as Partial<AreasMeta>;
      cb({ claims: d.claims ?? {}, overrides: d.overrides ?? {} });
    },
    () => cb({ claims: {}, overrides: {} }),
  );
}

export function claimArea(area: number, email: string, name: string) {
  return setDoc(
    ref(),
    { claims: { [String(area)]: { email, name, at: Date.now() } } },
    { merge: true },
  );
}

export function releaseArea(area: number) {
  return updateDoc(ref(), new FieldPath("claims", String(area)), deleteField());
}

export function setFamilyArea(family: string, area: number) {
  return setDoc(ref(), { overrides: { [family]: area } }, { merge: true });
}
