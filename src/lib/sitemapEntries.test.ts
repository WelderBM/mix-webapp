import { describe, expect, it } from "vitest";
import { STATIC_PAGES, productEntries } from "./sitemapEntries";

describe("sitemap", () => {
  it("usa o domínio real e inclui as landing pages (#400)", () => {
    const urls = STATIC_PAGES.map((p) => p.url);
    expect(urls.every((u) => u.startsWith("https://www.mixnovidades.com"))).toBe(true);
    expect(urls).toContain("https://www.mixnovidades.com/natura");
    expect(urls).toContain("https://www.mixnovidades.com/baloes-boa-vista");
    expect(urls.some((u) => u.includes(".com.br"))).toBe(false);
  });

  it("deixa produto desativado de fora", () => {
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
});
