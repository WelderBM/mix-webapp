// Executor da vistoria semanal (workflow vistoria-ux.yml): aplica no GitHub
// o plano de `planSync` — cria, atualiza, fecha e reabre issues — e mantém a
// issue de resumo "🔎 Vistoria de UX". Só menciona o dono quando aparece
// problema NOVO.
//
// Uso: node scripts/ux/vistoria-run.mjs <prod-report.json> [dev-report.json]
// Env: GH_REPO, OWNER (gh já autenticado via GH_TOKEN). VISTORIA_DRY_RUN=1
// só imprime o plano.

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { groupProblems, planSync, summaryMarkdown } from "./vistoria.mjs";

const [prodPath, devPath] = process.argv.slice(2);
const read = (p) => (p && existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : null);
const prod = read(prodPath);
const dev = read(devPath);
const repo = process.env.GH_REPO;
const owner = process.env.OWNER;
const dry = !!process.env.VISTORIA_DRY_RUN;
const today = new Date().toISOString().slice(0, 10);
const SUMMARY_LABEL = "vistoria-resumo";

const gh = (args, input) =>
  execFileSync("gh", args, { encoding: "utf8", input, stdio: ["pipe", "pipe", "inherit"] });
const bodyFile = (text) => {
  const f = join(tmpdir(), `vistoria-${Math.random().toString(36).slice(2)}.md`);
  writeFileSync(f, text);
  return f;
};

// Produção = fonte das issues da loja. Telas /admin vêm de dev (staging),
// onde a conta de teste consegue entrar.
const isAdmin = (p) => p.route.startsWith("/admin");
const devPages = dev?.pages ?? [];
const reports = [
  { env: "produção", report: prod ?? { pages: [] } },
  { env: "dev/staging", report: { pages: devPages.filter(isAdmin) } },
];
const groups = groupProblems(reports);
const prodKeys = new Set(groups.map((g) => g.key));
const devOnly = groupProblems([{ env: "dev", report: { pages: devPages.filter((p) => !isAdmin(p)) } }]).filter(
  (g) => !prodKeys.has(g.key)
);

// Uma issue por linha (JSON compacto): funciona com qualquer número de páginas.
const existing = dry
  ? []
  : gh(["api", "--paginate", `repos/${repo}/issues?labels=vistoria&state=all&per_page=100`, "--jq", ".[] | select(.pull_request | not) | {number, state, body}"])
      .split("\n")
      .filter((l) => l.trim())
      .map((l) => JSON.parse(l));
const actions = planSync(groups, existing, today);

if (dry) {
  console.log(JSON.stringify({ groups: groups.map((g) => [g.severity, g.title]), actions: actions.map((a) => [a.type, a.key]) }, null, 2));
  process.exit(0);
}

const created = [];
for (const a of actions) {
  if (a.type === "create") {
    const url = gh(["issue", "create", "--repo", repo, "--title", a.title, "--body-file", bodyFile(a.body), ...a.labels.flatMap((l) => ["--label", l])]).trim();
    created.push({ ...a, url });
  } else if (a.type === "update") {
    gh(["issue", "edit", String(a.number), "--repo", repo, "--body-file", bodyFile(a.body)]);
  } else if (a.type === "reopen") {
    gh(["issue", "reopen", String(a.number), "--repo", repo, "--comment", a.comment]);
    gh(["issue", "edit", String(a.number), "--repo", repo, "--body-file", bodyFile(a.body)]);
  } else if (a.type === "close") {
    gh(["issue", "close", String(a.number), "--repo", repo, "--reason", "completed", "--comment", a.comment]);
  }
}

// Issue de resumo (uma só, fixada).
const summary = summaryMarkdown(groups, actions, today, devOnly);
let summaryIssue = JSON.parse(
  gh(["issue", "list", "--repo", repo, "--label", SUMMARY_LABEL, "--state", "open", "--json", "number", "--limit", "1"])
)[0]?.number;
if (!summaryIssue) {
  const url = gh(["issue", "create", "--repo", repo, "--title", "🔎 Vistoria de UX", "--label", SUMMARY_LABEL, "--body-file", bodyFile(summary)]).trim();
  summaryIssue = Number(url.split("/").pop());
  try {
    gh(["issue", "pin", String(summaryIssue), "--repo", repo]);
  } catch {}
} else {
  gh(["issue", "edit", String(summaryIssue), "--repo", repo, "--body-file", bodyFile(summary)]);
}

if (created.length > 0) {
  const lines = created.map((c) => `- ${c.url} — ${c.title}`).join("\n");
  gh(["issue", "comment", String(summaryIssue), "--repo", repo, "--body-file", bodyFile(`@${owner} a vistoria de ${today} achou ${created.length} problema(s) novo(s) de UX:\n\n${lines}\n\nEstão no backlog com a label \`vistoria\`.`)]);
}

writeFileSync(process.env.GITHUB_OUTPUT ?? join(tmpdir(), "gh-output"), `summary_issue=${summaryIssue}\n`, { flag: "a" });
console.log(`vistoria: ${groups.length} grupos, ${actions.length} ações, ${created.length} novos, resumo #${summaryIssue}`);
