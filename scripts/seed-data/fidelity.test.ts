import { describe, it, expect } from "vitest";
import { assertFidelityRegistryValid } from "./fidelity";

describe("assertFidelityRegistryValid", () => {
  it("não lança com o registro real do dataset (default do parâmetro)", () => {
    // Não trava o estado do registro em "vazio pra sempre" — só confirma
    // que o que estiver lá hoje passa na validação. Uma entrada nova e
    // válida (com issue de admin-gap) não deveria quebrar este teste.
    expect(() => assertFidelityRegistryValid()).not.toThrow();
  });

  it("não lança quando toda entrada tem issue válida", () => {
    const entries = [
      { field: "settings/general.foo", issue: 42, reason: "sem UI ainda" },
    ];
    expect(() => assertFidelityRegistryValid(entries)).not.toThrow();
  });

  it("lança com mensagem clara quando uma entrada não tem issue válida", () => {
    const entries = [
      { field: "settings/general.foo", issue: 0, reason: "sem UI ainda" },
    ];
    expect(() => assertFidelityRegistryValid(entries)).toThrow(
      /admin-gap.*settings\/general\.foo/
    );
  });

  it("lança quando issue está ausente (undefined)", () => {
    const entries = [
      {
        field: "settings/general.bar",
        issue: undefined as unknown as number,
        reason: "sem UI ainda",
      },
    ];
    expect(() => assertFidelityRegistryValid(entries)).toThrow();
  });

  it("lança quando field ou reason estão vazios", () => {
    expect(() =>
      assertFidelityRegistryValid([{ field: "", issue: 1, reason: "x" }])
    ).toThrow();
    expect(() =>
      assertFidelityRegistryValid([{ field: "x", issue: 1, reason: "" }])
    ).toThrow();
  });
});
