import { describe, it, expect } from "vitest";
import { evaluateGate, parseVerdict, MAX_CHANGED_LINES } from "./pr-gate.mjs";

const clean = { bloqueantes: 0, importantes: 0, menores: 1 };
const ok = (o = {}) => ({
  verdict: clean,
  base: "dev",
  ciConclusion: "success",
  files: [{ path: "src/components/features/ProductCard.tsx", additions: 10, deletions: 4 }],
  ...o,
});

describe("evaluateGate", () => {
  it("PR pequeno, limpo, verde, para dev → merge automático com aprovação", () => {
    expect(evaluateGate(ok())).toEqual({ autoMerge: true, review: "approve", reasons: [] });
  });

  it("achado importante segura o merge e não aprova", () => {
    const r = evaluateGate(ok({ verdict: { bloqueantes: 0, importantes: 1 } }));
    expect(r.autoMerge).toBe(false);
    expect(r.review).toBe("comment");
    expect(r.reasons.join()).toMatch(/importante/);
  });

  it("achado bloqueante pede mudanças", () => {
    const r = evaluateGate(ok({ verdict: { bloqueantes: 2, importantes: 0 } }));
    expect(r).toMatchObject({ autoMerge: false, review: "request-changes" });
  });

  it("sem veredito legível nunca entra e não aprova", () => {
    const r = evaluateGate(ok({ verdict: null }));
    expect(r).toMatchObject({ autoMerge: false, review: "comment" });
  });

  it("produção (master) é sempre manual, mesmo limpo", () => {
    const r = evaluateGate(ok({ base: "master" }));
    expect(r.autoMerge).toBe(false);
    expect(r.review).toBe("approve");
  });

  it("CI vermelho ou pendente segura", () => {
    expect(evaluateGate(ok({ ciConclusion: "failure" })).autoMerge).toBe(false);
    expect(evaluateGate(ok({ ciConclusion: null })).autoMerge).toBe(false);
  });

  it("acima do limite de linhas segura; lockfile não conta", () => {
    const big = [{ path: "src/a.tsx", additions: MAX_CHANGED_LINES, deletions: 1 }];
    expect(evaluateGate(ok({ files: big })).autoMerge).toBe(false);
    const lock = [
      { path: "src/a.tsx", additions: 5, deletions: 0 },
      { path: "package-lock.json", additions: 900, deletions: 900 },
    ];
    // lockfile não conta no tamanho, mas package-lock é alto risco por si só
    expect(evaluateGate(ok({ files: lock })).reasons.join()).not.toMatch(/linhas alteradas/);
  });

  it.each([
    "firestore.rules",
    "package.json",
    ".github/workflows/ci.yml",
    ".claude/agents/revisor-pr.md",
    "scripts/ci/pr-gate.mjs",
    "src/lib/ribbon-pricing.ts",
    "src/store/cartStore.ts",
    "src/store/authStore.ts",
    "src/app/admin/page.tsx",
    "src/app/api/admin/verify-system-password/route.ts",
  ])("arquivo de alto risco %s sempre precisa do dono", (path) => {
    const r = evaluateGate(ok({ files: [{ path, additions: 1, deletions: 0 }] }));
    expect(r.autoMerge).toBe(false);
    expect(r.reasons.join()).toMatch(/alto risco/);
  });

  it("arquivos comuns de tela e docs não são alto risco", () => {
    for (const path of ["src/app/admin/lancamento/page.tsx", "docs/claude-lessons.md", "src/lib/intake/pack.ts"]) {
      expect(evaluateGate(ok({ files: [{ path, additions: 3, deletions: 1 }] })).autoMerge).toBe(true);
    }
  });
});

describe("parseVerdict", () => {
  it("lê o veredito do fim do comentário", () => {
    expect(parseVerdict('texto\n<!-- veredito: {"bloqueantes":0,"importantes":2,"menores":1} -->')).toEqual({
      bloqueantes: 0,
      importantes: 2,
      menores: 1,
    });
  });

  it("veredito ausente ou malformado → null (nunca aprova por engano)", () => {
    expect(parseVerdict("sem veredito")).toBeNull();
    expect(parseVerdict("<!-- veredito: {quebrado} -->")).toBeNull();
    expect(parseVerdict('<!-- veredito: {"bloqueantes":"0","importantes":0} -->')).toBeNull();
    expect(parseVerdict(undefined)).toBeNull();
  });
});
