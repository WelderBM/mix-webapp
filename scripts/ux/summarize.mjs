// Revisão visual de UX: decide quais telas abrir a partir dos arquivos do PR
// e transforma as medições (visual-check.mjs) em achados objetivos.
// Lógica pura, testada em summarize.test.mjs.
//
// Uso no workflow:
//   node scripts/ux/summarize.mjs routes <files.json>        → rotas (JSON)
//   node scripts/ux/summarize.mjs report <ux-report.json>    → { markdown, importantes }

import { readFileSync } from "node:fs";

export const STORE_ROUTES = ["/", "/fitas", "/baloes", "/meu-pedido"];
export const ADMIN_ROUTES = ["/admin", "/admin/lancamento"];
const SHARED = /^src\/(components\/(ui|layout)\/|app\/(layout|globals)|styles\/)|tailwind|postcss/;

export function isUiChange(files) {
  return files.some(
    (f) =>
      /^src\/(app|components)\/.*\.tsx$/.test(f) ||
      /\.css$/.test(f) ||
      SHARED.test(f)
  );
}

// Rotas a visitar: as tocadas diretamente + o conjunto da área afetada.
export function routesFor(files) {
  const routes = new Set();
  let store = false;
  let admin = false;
  for (const f of files) {
    if (SHARED.test(f)) store = admin = true;
    else if (/^src\/(app|components)\/admin\//.test(f) || /^src\/components\/admin\//.test(f)) admin = true;
    else if (/^src\/(app|components)\//.test(f)) store = true;
    // src/app/<rota>/page.tsx → /<rota> (ignora rotas dinâmicas e grupos)
    const m = /^src\/app\/(.+)\/page\.tsx$/.exec(f);
    if (m && !/[[(]/.test(m[1])) routes.add(`/${m[1]}`);
    if (f === "src/app/page.tsx") routes.add("/");
  }
  if (store) STORE_ROUTES.forEach((r) => routes.add(r));
  if (admin) ADMIN_ROUTES.forEach((r) => routes.add(r));
  return [...routes];
}

const SERIOUS = new Set(["serious", "critical"]);

// Cada problema medido vira um item com CHAVE estável. A chave serve para:
//  - juntar o mesmo problema visto no celular e no desktop (axe, console);
//  - comparar com a versão de antes do PR (base) e reportar só o que o PR
//    PIOROU — problema que já existia em dev não é culpa do PR e não deve
//    notificar o dono a cada PR que toca na mesma tela.
export function collectIssues(report) {
  const issues = new Map();
  const notes = [];
  const add = (key, group, text) => {
    if (!issues.has(key)) issues.set(key, { key, group, text });
  };
  for (const p of report?.pages ?? []) {
    const where = `\`${p.route}\` (${p.viewport})`;
    if (p.errors?.length) {
      notes.push(`${where}: não foi possível abrir — ${p.errors[0]}`);
      continue;
    }
    if (p.status && p.status >= 400) {
      add(`http|${p.route}|${p.status}`, p.route, `\`${p.route}\`: respondeu HTTP ${p.status}`);
    }
    const m = p.metrics ?? {};
    for (const s of m.small ?? []) {
      add(`touch|${p.route}|${s.label}`, `touch|${p.route}`, `"${s.label}" ${s.w}×${s.h}px`);
    }
    if (m.overflowPx > 1) {
      add(
        `overflow|${p.route}|${p.viewport}`,
        `overflow|${p.route}|${p.viewport}`,
        `${where}: layout estoura ${m.overflowPx}px para a direita (rolagem lateral)${m.offenders?.length ? ` — ${m.offenders.join(", ")}` : ""}`
      );
    }
    for (const v of p.axe ?? []) {
      if (!SERIOUS.has(v.impact)) continue;
      add(
        `axe|${p.route}|${v.id}`,
        `axe|${p.route}|${v.id}`,
        `\`${p.route}\`: acessibilidade **${v.impact}** \`${v.id}\` — ${v.help} (${v.nodes} elemento(s), ex.: \`${v.example.slice(0, 80)}\`)`
      );
    }
    const minor = (p.axe ?? []).filter((v) => !SERIOUS.has(v.impact)).map((v) => v.id);
    if (minor.length) notes.push(`${where}: acessibilidade menor — ${minor.join(", ")}`);
    for (const c of p.console ?? []) {
      add(`console|${p.route}|${c.slice(0, 80)}`, `console|${p.route}|${c.slice(0, 80)}`, `\`${p.route}\`: erro no console — ${c}`);
    }
  }
  return { issues, notes };
}

// Achados (🟡) = problemas do PR que NÃO existiam na base. Sem base, todos.
export function findingsFrom(report, baseline = null) {
  const { issues, notes } = collectIssues(report);
  const before = baseline ? collectIssues(baseline).issues : new Map();
  const fresh = [...issues.values()].filter((i) => !before.has(i.key));
  const preexisting = [...issues.values()].filter((i) => before.has(i.key)).length;

  // Alvos de toque: uma linha por tela, listando os novos.
  const findings = [];
  const touch = new Map();
  for (const i of fresh) {
    if (i.group.startsWith("touch|")) {
      const route = i.group.slice(6);
      touch.set(route, [...(touch.get(route) ?? []), i.text]);
    } else {
      findings.push(i.text);
    }
  }
  for (const [route, items] of touch) {
    findings.push(
      `\`${route}\` (celular): ${items.length} alvo(s) de toque menor(es) que 44×44px — ${items.slice(0, 4).join(", ")}${items.length > 4 ? "…" : ""}`
    );
  }
  if (baseline && preexisting > 0) {
    notes.push(`${preexisting} problema(s) medido(s) já existiam antes deste PR (não contam aqui).`);
  }
  if (!baseline) notes.push("Sem comparação com a versão anterior: todos os problemas medidos foram listados.");
  return { findings, notes };
}

export function toMarkdown(report, prNumber, baseline = null) {
  const { findings, notes } = findingsFrom(report, baseline);
  const pages = new Set((report?.pages ?? []).map((p) => p.route)).size;
  const lines = [
    "<!-- revisao:ux-medicoes -->",
    "## Revisão visual — medições automáticas",
    "",
    `${pages} tela(s) abertas no preview em **celular (360px)** e **desktop**, comparadas com a versão anterior. Medições objetivas, sem opinião.`,
    "",
    "### Achados (o que este PR piorou)",
    ...(findings.length ? findings.map((f) => `- 🟡 ${f}`) : ["- Nenhum problema novo. ✅"]),
  ];
  if (notes.length) lines.push("", "### Observações", ...notes.map((n) => `- ⚪ ${n}`));
  lines.push(
    "",
    `Prints e relatório completo: artefato **ux-visual-pr-${prNumber}** na execução do workflow.`,
    "",
    "<sub>Revisão depois do merge em `dev`: não segura nenhum PR. Achado 🟡 aqui vira issue de correção.</sub>",
    `<!-- veredito-ux-medicoes: {"importantes":${findings.length}} -->`
  );
  return { markdown: lines.join("\n"), importantes: findings.length };
}

if (process.argv[1]?.endsWith("summarize.mjs")) {
  const [cmd, file, pr] = process.argv.slice(2);
  const data = JSON.parse(readFileSync(file, "utf8"));
  if (cmd === "routes") process.stdout.write(JSON.stringify({ ui: isUiChange(data), routes: routesFor(data) }));
  // report <pr.json> <pr#> [base.json]
  const base = process.argv[5] ? JSON.parse(readFileSync(process.argv[5], "utf8")) : null;
  if (cmd === "report") process.stdout.write(JSON.stringify(toMarkdown(data, pr ?? "?", base)));
}
