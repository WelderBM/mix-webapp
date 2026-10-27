import { describe, it, expect } from "vitest";
import { isUiChange, routesFor, findingsFrom, toMarkdown, STORE_ROUTES, ADMIN_ROUTES } from "./summarize.mjs";

describe("isUiChange", () => {
  it("telas e estilos contam; lógica pura, docs e testes não", () => {
    expect(isUiChange(["src/components/features/ProductCard.tsx"])).toBe(true);
    expect(isUiChange(["src/app/globals.css"])).toBe(true);
    expect(isUiChange(["src/lib/intake/pack.ts", "docs/claude-lessons.md"])).toBe(false);
    expect(isUiChange(["src/lib/cart-pricing.test.ts"])).toBe(false);
  });
});

describe("routesFor", () => {
  it("tela do admin abre só as rotas do admin (+ a própria)", () => {
    const r = routesFor(["src/app/admin/lancamento/page.tsx"]);
    expect(r).toEqual(expect.arrayContaining([...ADMIN_ROUTES, "/admin/lancamento"]));
    expect(r).not.toContain("/fitas");
  });

  it("componente da loja abre as rotas da loja", () => {
    expect(routesFor(["src/components/features/CartSidebar.tsx"])).toEqual(expect.arrayContaining(STORE_ROUTES));
  });

  it("componente compartilhado (ui/layout/globals) abre tudo", () => {
    const r = routesFor(["src/components/ui/button.tsx"]);
    expect(r).toEqual(expect.arrayContaining([...STORE_ROUTES, ...ADMIN_ROUTES]));
  });

  it("página estática tocada entra; rota dinâmica não", () => {
    expect(routesFor(["src/app/natura/page.tsx"])).toContain("/natura");
    expect(routesFor(["src/app/produto/[id]/page.tsx"]).some((r) => r.includes("["))).toBe(false);
  });
});

const page = (o) => ({ route: "/", viewport: "celular", status: 200, errors: [], console: [], axe: [], metrics: { small: [], overflowPx: 0 }, ...o });

describe("findingsFrom", () => {
  it("tela limpa não gera achado", () => {
    expect(findingsFrom({ pages: [page({})] }).findings).toEqual([]);
  });

  it("alvo de toque pequeno, estouro, axe sério e erro de console viram achados", () => {
    const { findings } = findingsFrom({
      pages: [
        page({
          metrics: { small: [{ label: "Fechar", w: 32, h: 32 }], overflowPx: 48, offenders: ["div.grid"] },
          axe: [{ id: "color-contrast", impact: "serious", help: "Contraste", nodes: 3, example: ".x" }],
          console: ["TypeError: x is undefined"],
        }),
      ],
    });
    expect(findings).toHaveLength(4);
    expect(findings.join("\n")).toMatch(/"Fechar" 32×32px/);
    expect(findings.join("\n")).toMatch(/estoura 48px/);
    expect(findings.join("\n")).toMatch(/color-contrast/);
  });

  it("axe moderado/menor é só observação", () => {
    const r = findingsFrom({ pages: [page({ axe: [{ id: "region", impact: "moderate", help: "", nodes: 1, example: "" }] })] });
    expect(r.findings).toEqual([]);
    expect(r.notes.join()).toMatch(/region/);
  });

  it("tela que não abriu é observação, não achado (não acusa o PR por falha do robô)", () => {
    const r = findingsFrom({ pages: [page({ errors: ["timeout"] })] });
    expect(r.findings).toEqual([]);
    expect(r.notes.join()).toMatch(/não foi possível abrir/);
  });
});

describe("toMarkdown", () => {
  it("leva marcador, contagem e veredito legível por máquina", () => {
    const { markdown, importantes } = toMarkdown(
      { pages: [page({ metrics: { small: [{ label: "x", w: 20, h: 20 }], overflowPx: 0 } })] },
      42
    );
    expect(importantes).toBe(1);
    expect(markdown).toMatch(/^<!-- revisao:ux-medicoes -->/);
    expect(markdown).toMatch(/<!-- veredito-ux-medicoes: \{"importantes":1\} -->/);
    expect(markdown).not.toMatch(/revisao:1/);
  });
});

describe("comparação com a versão anterior (base)", () => {
  const withIssues = (extra = {}) =>
    page({
      metrics: { small: [{ label: "Menu", w: 36, h: 36 }], overflowPx: 0 },
      axe: [{ id: "button-name", impact: "critical", help: "Botão sem nome", nodes: 2, example: "button" }],
      ...extra,
    });

  it("problema que já existia em dev não conta contra o PR", () => {
    const base = { pages: [withIssues()] };
    const pr = { pages: [withIssues()] };
    const r = findingsFrom(pr, base);
    expect(r.findings).toEqual([]);
    expect(r.notes.join()).toMatch(/2 problema\(s\) medido\(s\) já existiam/);
  });

  it("só o que o PR piorou vira achado", () => {
    const base = { pages: [withIssues()] };
    const pr = {
      pages: [
        withIssues({
          metrics: { small: [{ label: "Menu", w: 36, h: 36 }, { label: "Publicar", w: 120, h: 32 }], overflowPx: 30 },
        }),
      ],
    };
    const { findings } = findingsFrom(pr, base);
    expect(findings).toHaveLength(2);
    expect(findings.join("\n")).toMatch(/"Publicar" 120×32px/);
    expect(findings.join("\n")).not.toMatch(/"Menu"/);
    expect(findings.join("\n")).toMatch(/estoura 30px/);
  });

  it("mesmo erro de acessibilidade no celular e no desktop vira uma linha", () => {
    const axe = [{ id: "color-contrast", impact: "serious", help: "Contraste", nodes: 1, example: ".x" }];
    const { findings } = findingsFrom({
      pages: [page({ axe }), page({ viewport: "desktop", axe })],
    });
    expect(findings.filter((f) => f.includes("color-contrast"))).toHaveLength(1);
  });
});
