import { describe, it, expect } from "vitest";
import { groupProblems, planSync, priorityLabels, issueBody, parseIssue, summaryMarkdown, MISSES_TO_CLOSE } from "./vistoria.mjs";

const page = (o) => ({
  route: "/",
  viewport: "celular",
  errors: [],
  console: [],
  axe: [],
  metrics: { small: [], overflowPx: 0 },
  ...o,
});
const prod = (pages) => [{ env: "produção", report: { pages } }];

describe("groupProblems", () => {
  it("mesma regra de acessibilidade em várias telas vira UM grupo com as telas listadas", () => {
    const axe = [{ id: "button-name", impact: "critical", help: "Botão sem nome", nodes: 2, example: "button" }];
    const groups = groupProblems(prod([page({ axe }), page({ route: "/fitas", axe })]));
    const a11y = groups.filter((g) => g.key === "a11y:button-name");
    expect(a11y).toHaveLength(1);
    expect(a11y[0].occurrences).toHaveLength(2);
    expect(a11y[0].severity).toBe("P2");
  });

  it("axe moderado não vira issue; sério vira P3", () => {
    const groups = groupProblems(
      prod([
        page({
          axe: [
            { id: "region", impact: "moderate", help: "", nodes: 1, example: "" },
            { id: "color-contrast", impact: "serious", help: "Contraste", nodes: 4, example: ".x" },
          ],
        }),
      ])
    );
    expect(groups.map((g) => g.key)).toEqual(["a11y:color-contrast"]);
    expect(groups[0].severity).toBe("P3");
  });

  it("alvo de toque em 2+ telas vira o grupo compartilhado; o resto, por tela", () => {
    const groups = groupProblems(
      prod([
        page({ metrics: { small: [{ label: "Menu", w: 36, h: 36 }, { label: "Ver mais", w: 80, h: 30 }], overflowPx: 0 } }),
        page({ route: "/fitas", metrics: { small: [{ label: "Menu", w: 36, h: 36 }], overflowPx: 0 } }),
      ])
    );
    const keys = groups.map((g) => g.key);
    expect(keys).toContain("toque:compartilhado");
    expect(keys).toContain("toque:/");
    expect(groups.find((g) => g.key === "toque:compartilhado").occurrences[0]).toMatch(/"Menu".*`\/`.*`\/fitas`/);
    expect(groups.find((g) => g.key === "toque:/").occurrences).toEqual(['"Ver mais" 80×30px']);
  });

  it("estouro de layout é P2 por tela e tamanho; tela que não abriu é ignorada", () => {
    const groups = groupProblems(
      prod([page({ metrics: { small: [], overflowPx: 40 } }), page({ route: "/x", errors: ["timeout"], metrics: { small: [], overflowPx: 99 } })])
    );
    expect(groups.map((g) => [g.key, g.severity])).toEqual([["layout:/:celular", "P2"]]);
  });
});

const group = (key, occ = ["`/` (celular, produção)"]) => ({
  key,
  title: `Título ${key}`,
  kind: "acessibilidade",
  severity: "P2",
  detail: "x",
  occurrences: occ,
});

describe("planSync", () => {
  it("problema novo cria issue com labels de vistoria, prioridade e tipo", () => {
    const [a] = planSync([group("a11y:button-name")], [], "2026-10-21");
    expect(a).toMatchObject({ type: "create", key: "a11y:button-name" });
    expect(a.labels).toEqual(["vistoria", "P2", "acessibilidade", "frontend", "ux", "backlog", "o:2", "s:2", "a:3", "e:p", "autonomo", "frente:home-rodape"]);
    expect(a.body).toMatch(/<!-- vistoria:a11y:button-name -->/);
  });

  it("issue existente igual não gera ação; com telas diferentes é atualizada", () => {
    const g = group("a11y:x");
    const issue = { number: 7, state: "open", body: issueBody(g, 0, "2026-10-21") };
    expect(planSync([g], [issue], "2026-10-21")).toEqual([]);
    const changed = planSync([group("a11y:x", ["`/` (celular, produção)", "`/fitas` (celular, produção)"])], [issue], "2026-10-21");
    expect(changed).toMatchObject([{ type: "update", number: 7 }]);
  });

  it("problema que sumiu: 1ª ausência só conta; na 2ª fecha", () => {
    const g = group("a11y:x");
    const issue = { number: 7, state: "open", body: issueBody(g, 0, "d") };
    const first = planSync([], [issue], "d");
    expect(first).toMatchObject([{ type: "update", number: 7 }]);
    expect(first[0].body).toMatch(/vistoria-faltas:1/);

    const again = planSync([], [{ ...issue, body: first[0].body }], "d");
    expect(MISSES_TO_CLOSE).toBe(2);
    expect(again).toMatchObject([{ type: "close", number: 7 }]);
  });

  it("problema que voltou reabre a issue fechada", () => {
    const g = group("a11y:x");
    const closed = { number: 7, state: "closed", body: issueBody(g, 2, "d") };
    expect(planSync([g], [closed], "d")).toMatchObject([{ type: "reopen", number: 7 }]);
  });

  it("issue sem marcador de vistoria é ignorada (nunca mexe em issue humana)", () => {
    const human = { number: 9, state: "open", body: "issue escrita por gente" };
    expect(parseIssue(human)).toBeNull();
    expect(planSync([], [human], "d")).toEqual([]);
  });
});

describe("priorityLabels (#290)", () => {
  it("alcance e frente pela rota", () => {
    expect(priorityLabels(group("toque:/natura", ["\"x\" 10×10px — `/natura` (celular, produção)"]))).toContain("a:1");
    const fitas = priorityLabels(group("toque:/fitas", ["`/fitas` (celular, produção)"]));
    expect(fitas).toEqual(expect.arrayContaining(["a:2", "frente:fitas"]));
    const muitas = priorityLabels(group("a11y:x", ["`/` (c)", "`/fitas` (c)", "`/baloes` (c)"]));
    expect(muitas).toEqual(expect.arrayContaining(["a:3", "frente:acessibilidade"]));
    expect(priorityLabels({ ...group("toque:compartilhado"), kind: "toque" })).toContain("frente:cabecalho");
  });
});

describe("summaryMarkdown", () => {
  it("resume contagens, novos e o que só existe em dev", () => {
    const groups = [group("a11y:x")];
    const md = summaryMarkdown(groups, planSync(groups, [], "d"), "d", [group("layout:/admin:celular")]);
    expect(md).toMatch(/\*\*1\*\* problema/);
    expect(md).toMatch(/Novos: \*\*1\*\*/);
    expect(md).toMatch(/Só em `dev`/);
  });
});
