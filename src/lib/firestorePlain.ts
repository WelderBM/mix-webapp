// Server Component só pode passar objeto simples para Client Component.
// Documento do Firestore traz `Timestamp` (classe com toJSON): em dev o
// React acusa "Only plain objects can be passed to Client Components", e em
// produção ele vira {seconds, nanoseconds} sem ninguém perceber. Converte
// para texto ISO, o mesmo formato do `createdAt` dos pedidos; quem lê data
// de produto no cliente (`toEpochMillis`, productTags.ts) aceita esse texto.
// Só converte Timestamp: outra classe do Firestore (DocumentReference,
// GeoPoint) passaria direto — hoje nenhum produto/config tem esses campos.

type TimestampLike = { toDate: () => Date; seconds: number; nanoseconds: number };

function isTimestamp(v: unknown): v is TimestampLike {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as TimestampLike).toDate === "function" &&
    typeof (v as TimestampLike).seconds === "number" &&
    typeof (v as TimestampLike).nanoseconds === "number"
  );
}

export function toPlain<T>(value: T): T {
  if (isTimestamp(value)) return value.toDate().toISOString() as unknown as T;
  if (Array.isArray(value)) return value.map((v) => toPlain(v)) as unknown as T;
  if (value !== null && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = toPlain(v);
    return out as T;
  }
  return value;
}
