// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from "vitest";
import { shouldAutoReload } from "./staleDeploy";

const chunkError = () =>
  Object.assign(new Error("Loading chunk 123 failed."), { name: "ChunkLoadError" });

describe("shouldAutoReload", () => {
  beforeEach(() => sessionStorage.clear());

  it("recarrega em erro de chunk de deploy antigo", () => {
    expect(shouldAutoReload(chunkError(), 100_000)).toBe(true);
  });

  it("reconhece import dinâmico que falhou (Vite/Safari/Firefox)", () => {
    expect(
      shouldAutoReload(new TypeError("Failed to fetch dynamically imported module: /x.js"), 100_000)
    ).toBe(true);
  });

  it("não recarrega em erro comum de aplicação", () => {
    expect(shouldAutoReload(new TypeError("x is undefined"), 100_000)).toBe(false);
  });

  it("não entra em loop: segunda falha dentro de 30s mostra o fallback", () => {
    expect(shouldAutoReload(chunkError(), 100_000)).toBe(true);
    expect(shouldAutoReload(chunkError(), 110_000)).toBe(false);
  });

  it("volta a recarregar depois que a janela de 30s passa", () => {
    expect(shouldAutoReload(chunkError(), 100_000)).toBe(true);
    expect(shouldAutoReload(chunkError(), 140_000)).toBe(true);
  });
});
