import { describe, it, expect } from "vitest";
import { categoryMetadata } from "./categoryMetadata";
import { categoryEntries } from "./sitemapEntries";

describe("SEO das categorias (27/11)", () => {
  it("título com a cidade e canônico próprio", () => {
    const m = categoryMetadata({ id: "fitas", name: "Fitas" });
    expect(m.title).toBe("Fitas em Boa Vista");
    expect(m.alternates?.canonical).toBe("/categoria/fitas");
    expect(String(m.description)).toContain("Boa Vista");
  });
  it("sitemap leva só as categorias ativas", () => {
    const out = categoryEntries(
      [{ id: "fitas", active: true }, { id: "velha", active: false }, { id: "sem" }],
      new Date(0)
    );
    expect(out.map((e) => e.url)).toEqual([expect.stringMatching(/\/categoria\/fitas$/)]);
  });
});
