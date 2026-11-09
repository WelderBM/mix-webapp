import { afterEach, describe, expect, it, vi } from "vitest";

// SITE_URL é lido no carregamento do módulo: zera a variável e reimporta,
// para o teste não depender do NEXT_PUBLIC_BASE_URL do shell ou do CI.
async function load() {
  vi.stubEnv("NEXT_PUBLIC_BASE_URL", "");
  vi.resetModules();
  return import("./sitemapEntries");
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("sitemap", () => {
  it("usa o domínio real e inclui as landing pages (#400)", async () => {
    const { STATIC_PAGES } = await load();
    const urls = STATIC_PAGES.map((p) => p.url);
    expect(urls.every((u) => u.startsWith("https://www.mixnovidades.com"))).toBe(true);
    expect(urls).toContain("https://www.mixnovidades.com/natura");
    expect(urls).toContain("https://www.mixnovidades.com/baloes-boa-vista");
    expect(urls.some((u) => u.includes(".com.br"))).toBe(false);
  });

  it("deixa produto desativado de fora", async () => {
    const { productEntries } = await load();
    const now = new Date("2026-11-09T00:00:00Z");
    const entries = productEntries(
      [{ id: "a" }, { id: "b", disabled: true }, { id: "c", disabled: false }],
      now
    );
    expect(entries.map((e) => e.url)).toEqual([
      "https://www.mixnovidades.com/produto/a",
      "https://www.mixnovidades.com/produto/c",
    ]);
  });

  it("usa NEXT_PUBLIC_BASE_URL sem barra no fim quando definido", async () => {
    vi.stubEnv("NEXT_PUBLIC_BASE_URL", "https://exemplo.test/");
    vi.resetModules();
    const { STATIC_PAGES } = await import("./sitemapEntries");
    expect(STATIC_PAGES[0].url).toBe("https://exemplo.test");
    expect(STATIC_PAGES[1].url).toBe("https://exemplo.test/fitas");
  });
});
