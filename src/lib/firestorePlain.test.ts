import { describe, expect, it } from "vitest";
import { Timestamp } from "firebase/firestore";
import { toPlain } from "./firestorePlain";

describe("toPlain", () => {
  it("troca Timestamp por texto ISO, inclusive aninhado e em lista", () => {
    const ts = Timestamp.fromMillis(Date.UTC(2026, 10, 9, 12, 0, 0));
    const out = toPlain({
      name: "Fita",
      price: 0,
      createdAt: ts,
      variants: [{ id: "v1", updatedAt: ts }],
      meta: { last: ts, tags: ["a"] },
    });
    expect(out).toEqual({
      name: "Fita",
      price: 0,
      createdAt: "2026-11-09T12:00:00.000Z",
      variants: [{ id: "v1", updatedAt: "2026-11-09T12:00:00.000Z" }],
      meta: { last: "2026-11-09T12:00:00.000Z", tags: ["a"] },
    });
  });

  it("não mexe em null, undefined, número, texto nem booleano", () => {
    expect(toPlain({ a: null, b: undefined, c: 0, d: "", e: false })).toEqual({
      a: null,
      b: undefined,
      c: 0,
      d: "",
      e: false,
    });
  });

  it("o resultado é objeto simples (sem toJSON escondido)", () => {
    const out = toPlain({ createdAt: Timestamp.now() });
    expect(typeof out.createdAt).toBe("string");
    expect(JSON.parse(JSON.stringify(out))).toEqual(out);
  });
});
