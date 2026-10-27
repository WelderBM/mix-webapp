// Vistoria periódica de UX do PRODUTO (não de PR): transforma as medições
// de visual-check.mjs em issues de backlog — agrupadas, atualizadas a cada
// vistoria e fechadas sozinhas quando o problema some.
//
// Cada grupo tem uma CHAVE estável gravada no corpo da issue
// (<!-- vistoria:CHAVE -->). É assim que a vistoria seguinte acha a issue
// certa para atualizar em vez de abrir outra.
//
// Lógica pura, testada em vistoria.test.mjs. O workflow vistoria-ux.yml
// executa as ações que `planSync` devolve.

const SERIOUS = new Set(["serious", "critical"]);
export const MISSES_TO_CLOSE = 2;

const ROUTE_LABEL = (r) => `\`${r}\``;

// Títulos em pt-BR para as regras do axe mais comuns (o resto usa o texto
// do axe, em inglês).
const AXE_TITLES = {
  "button-name": "Botões sem nome acessível (leitor de tela não anuncia o botão)",
  "link-name": "Links sem texto acessível",
  "color-contrast": "Contraste de cor abaixo do mínimo (texto difícil de ler)",
  "frame-title": "Iframe sem título acessível (ex.: mapa)",
  "image-alt": "Imagens sem texto alternativo",
  label: "Campos de formulário sem rótulo",
  "select-name": "Caixa de seleção sem rótulo",
  "nested-interactive": "Elemento clicável dentro de outro clicável",
  "target-size": "Alvo de toque menor que o mínimo",
  "document-title": "Página sem título",
  "html-has-lang": "Página sem idioma declarado",
  "heading-order": "Ordem de títulos pulando níveis",
};

// Agrupa problemas medidos em "issues candidatas".
//  - acessibilidade: por regra do axe (a correção costuma ser num componente
//    compartilhado), listando as telas;
//  - alvo de toque: elemento que aparece em 2+ telas vira um grupo
//    "compartilhado" (cabeçalho/menu); o resto, um grupo por tela;
//  - estouro de layout e erro de console: por tela.
export function groupProblems(reports) {
  const groups = new Map();
  const get = (key, init) => {
    if (!groups.has(key)) groups.set(key, { key, occurrences: [], ...init });
    return groups.get(key);
  };

  const touchByLabel = new Map();
  for (const { env, report } of reports) {
    for (const p of report?.pages ?? []) {
      if (p.errors?.length) continue;
      const where = `${ROUTE_LABEL(p.route)} (${p.viewport}, ${env})`;

      for (const v of p.axe ?? []) {
        if (!SERIOUS.has(v.impact)) continue;
        const g = get(`a11y:${v.id}`, {
          title: `Acessibilidade: ${AXE_TITLES[v.id] ?? v.help}`,
          kind: "acessibilidade",
          severity: v.impact === "critical" ? "P2" : "P3",
          detail: `Regra axe \`${v.id}\` (${v.impact}).`,
        });
        g.occurrences.push(`${where} — ${v.nodes} elemento(s), ex.: \`${v.example.slice(0, 100)}\``);
      }

      for (const s of p.metrics?.small ?? []) {
        const k = s.label;
        if (!touchByLabel.has(k)) touchByLabel.set(k, { size: `${s.w}×${s.h}px`, routes: new Set(), envs: new Set() });
        touchByLabel.get(k).routes.add(p.route);
        touchByLabel.get(k).envs.add(env);
      }

      if (p.metrics?.overflowPx > 1) {
        const g = get(`layout:${p.route}:${p.viewport}`, {
          title: `Layout estoura a tela em ${p.route} (${p.viewport})`,
          kind: "layout",
          severity: "P2",
          detail: "A página rola para o lado: algum elemento é mais largo que a tela.",
        });
        g.occurrences.push(`${where} — ${p.metrics.overflowPx}px${p.metrics.offenders?.length ? `, ${p.metrics.offenders.join(", ")}` : ""}`);
      }

      for (const c of p.console ?? []) {
        const msg = c.slice(0, 80);
        const g = get(`console:${p.route}:${msg}`, {
          title: `Erro no console em ${p.route}: ${msg.slice(0, 60)}`,
          kind: "erro",
          severity: "P2",
          detail: "Erro de JavaScript ao abrir a tela.",
        });
        g.occurrences.push(`${where} — ${c}`);
      }
    }
  }

  const shared = [];
  const perRoute = new Map();
  for (const [label, t] of touchByLabel) {
    if (t.routes.size >= 2) shared.push(`"${label}" ${t.size} — em ${[...t.routes].map(ROUTE_LABEL).join(", ")}`);
    else {
      const r = [...t.routes][0];
      perRoute.set(r, [...(perRoute.get(r) ?? []), `"${label}" ${t.size}`]);
    }
  }
  if (shared.length) {
    get("toque:compartilhado", {
      title: "Alvos de toque pequenos em componentes compartilhados (cabeçalho/menu)",
      kind: "toque",
      severity: "P3",
      detail: "Elementos com menos de 44×44px que aparecem em várias telas — provavelmente o mesmo componente.",
    }).occurrences.push(...shared.sort());
  }
  for (const [route, items] of perRoute) {
    get(`toque:${route}`, {
      title: `Alvos de toque pequenos em ${route}`,
      kind: "toque",
      severity: "P3",
      detail: "Elementos clicáveis com menos de 44×44px no celular.",
    }).occurrences.push(...items.sort());
  }

  for (const g of groups.values()) g.occurrences = [...new Set(g.occurrences)];
  return [...groups.values()].sort((a, b) => a.key.localeCompare(b.key));
}

export function issueBody(group, misses = 0, today = "") {
  return [
    `<!-- vistoria:${group.key} -->`,
    `<!-- vistoria-faltas:${misses} -->`,
    `**Achado pela vistoria semanal de UX** (medição automática, sem opinião).`,
    "",
    group.detail,
    "",
    `### Onde (${group.occurrences.length})`,
    ...group.occurrences.slice(0, 40).map((o) => `- ${o}`),
    ...(group.occurrences.length > 40 ? [`- … e mais ${group.occurrences.length - 40}`] : []),
    "",
    `<sub>Atualizado pela vistoria de ${today}. Fecha sozinha após ${MISSES_TO_CLOSE} vistorias seguidas sem o problema.</sub>`,
  ].join("\n");
}

export function parseIssue(issue) {
  const key = /<!-- vistoria:(.+?) -->/.exec(issue.body ?? "")?.[1];
  if (!key) return null;
  const misses = Number(/<!-- vistoria-faltas:(\d+) -->/.exec(issue.body ?? "")?.[1] ?? 0);
  return { number: issue.number, state: issue.state, key, misses, body: issue.body };
}

const LABELS_BY_KIND = {
  acessibilidade: ["acessibilidade", "frontend", "ux"],
  toque: ["mobile", "frontend", "ux"],
  layout: ["mobile", "frontend", "ux"],
  erro: ["bug", "frontend"],
};

// Pontuação de prioridade de achado automático (docs/fluxo/prioridade.md).
// A issue já nasce com ela e com `backlog`: issue criada pelo GITHUB_TOKEN
// não dispara o sync-backlog-label.yml (#290).
const FRENTE_BY_ROUTE = { "/": "home-rodape", "/fitas": "fitas", "/baloes": "montador", "/admin/lancamento": "lancamento" };

export function priorityLabels(g) {
  const routes = new Set([...g.occurrences.join(" ").matchAll(/`(\/[^`]*)`/g)].map((m) => m[1]));
  // Grupos `toque:<rota>` não repetem a rota nas ocorrências: ela vem da chave.
  const keyRoute = /^toque:(\/.*)$/.exec(g.key)?.[1];
  if (keyRoute) routes.add(keyRoute);
  const one = routes.size === 1 ? [...routes][0] : null;
  const shared = g.key === "toque:compartilhado" || routes.size >= 3;
  // Alcance: 3 = várias telas ou a home · 2 = uma tela muito usada · 1 = /natura e afins.
  const alcance = shared || one === "/" ? 3 : one === "/natura" ? 1 : 2;
  const frente =
    g.key === "toque:compartilhado" ? "cabecalho"
    : g.kind === "acessibilidade" && routes.size > 1 ? "acessibilidade"
    : FRENTE_BY_ROUTE[one] ?? "loja-paginas";
  return ["backlog", "o:2", "s:2", `a:${alcance}`, "e:p", "autonomo", `frente:${frente}`];
}

// Compara a vistoria atual com as issues existentes e devolve o que fazer.
export function planSync(groups, existingIssues, today = "") {
  const existing = new Map();
  for (const i of existingIssues.map(parseIssue).filter(Boolean)) existing.set(i.key, i);
  const actions = [];
  const seen = new Set();

  for (const g of groups) {
    seen.add(g.key);
    const labels = ["vistoria", g.severity, ...(LABELS_BY_KIND[g.kind] ?? []), ...priorityLabels(g)];
    const body = issueBody(g, 0, today);
    const prev = existing.get(g.key);
    if (!prev) {
      actions.push({ type: "create", key: g.key, title: g.title, body, labels });
    } else if (prev.state === "closed") {
      actions.push({ type: "reopen", number: prev.number, key: g.key, body, comment: "O problema voltou a aparecer na vistoria — reaberta." });
    } else if (prev.body !== body) {
      actions.push({ type: "update", number: prev.number, key: g.key, body });
    }
  }

  for (const i of existing.values()) {
    if (i.state !== "open" || seen.has(i.key)) continue;
    const misses = i.misses + 1;
    if (misses >= MISSES_TO_CLOSE) {
      actions.push({
        type: "close",
        number: i.number,
        key: i.key,
        comment: `Não apareceu em ${misses} vistorias seguidas — fechada como resolvida. Reabre sozinha se voltar.`,
      });
    } else {
      actions.push({
        type: "update",
        number: i.number,
        key: i.key,
        body: i.body.replace(/<!-- vistoria-faltas:\d+ -->/, `<!-- vistoria-faltas:${misses} -->`),
      });
    }
  }
  return actions;
}

export function summaryMarkdown(groups, actions, today, devOnly = []) {
  const created = actions.filter((a) => a.type === "create");
  const closed = actions.filter((a) => a.type === "close");
  const reopened = actions.filter((a) => a.type === "reopen");
  const bySev = (s) => groups.filter((g) => g.severity === s).length;
  return [
    `## Vistoria de UX — ${today}`,
    "",
    `**${groups.length}** problema(s) agrupado(s) em produção: ${bySev("P2")} P2, ${bySev("P3")} P3.`,
    `Novos: **${created.length}** · Resolvidos: **${closed.length}** · Voltaram: **${reopened.length}**`,
    ...(created.length ? ["", "### Novos", ...created.map((a) => `- ${a.title}`)] : []),
    ...(devOnly.length
      ? ["", "### Só em `dev` (chegam à produção na próxima promoção)", ...devOnly.map((g) => `- ${g.title}`)]
      : []),
    "",
    "Issues com a label `vistoria`. Só os problemas medidos viram issue; o olhar da IA sobre os prints vem em comentário separado.",
  ].join("\n");
}
