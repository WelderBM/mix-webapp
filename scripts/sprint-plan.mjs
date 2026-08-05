#!/usr/bin/env node
// scripts/sprint-plan.mjs
//
// Apoio pro ritual de planejamento de sprint (Marco N) — lista o backlog
// (issues sem milestone, label `backlog`) ordenado por prioridade, pra não
// precisar filtrar/ordenar na mão toda vez que for escolher o que entra no
// próximo Marco.
//
// Este script NUNCA atribui milestone sozinho — a escolha do que entra em
// sprint é deliberadamente manual (ver .github/workflows/sync-backlog-label.yml).
// Ele só acelera a parte de "que opções eu tenho", não decide por você.
//
// Uso:
//   node scripts/sprint-plan.mjs                       lista o backlog inteiro
//   node scripts/sprint-plan.mjs --label admin          filtra por label extra
//   node scripts/sprint-plan.mjs --assign 55,104 --to "Marco 1 — Próximos incrementos"
//                                                        atribui o milestone às issues listadas (único modo que escreve)

import { execFileSync } from "node:child_process";

const PRIORITY_ORDER = ["P0", "P1", "P2", "P3"];

function gh(args) {
  return execFileSync("gh", args, { encoding: "utf-8" });
}

function priorityOf(labels) {
  const found = labels.find((l) => PRIORITY_ORDER.includes(l));
  return found ?? "—";
}

function priorityRank(labels) {
  const idx = PRIORITY_ORDER.indexOf(priorityOf(labels));
  return idx === -1 ? PRIORITY_ORDER.length : idx;
}

const args = process.argv.slice(2);
const extraLabelIdx = args.indexOf("--label");
const extraLabel = extraLabelIdx !== -1 ? args[extraLabelIdx + 1] : null;

const assignIdx = args.indexOf("--assign");
const toIdx = args.indexOf("--to");

if (assignIdx !== -1) {
  const numbers = (args[assignIdx + 1] ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const milestone = toIdx !== -1 ? args[toIdx + 1] : null;

  if (numbers.length === 0 || !milestone) {
    console.error(
      '\n❌ Uso: node scripts/sprint-plan.mjs --assign 55,104 --to "Marco 1 — Próximos incrementos"\n'
    );
    process.exit(1);
  }

  console.log(`\n📌 Atribuindo "${milestone}" a ${numbers.length} issue(s)...\n`);
  for (const n of numbers) {
    try {
      gh(["issue", "edit", n, "--milestone", milestone]);
      console.log(`  ✅ #${n}`);
    } catch (err) {
      console.error(`  ❌ #${n}: ${err.message}`);
    }
  }
  console.log(
    "\nA label `backlog` sai sozinha dessas issues (GitHub Action " +
      "sync-backlog-label.yml, dispara no evento `milestoned`).\n"
  );
  process.exit(0);
}

// ── Modo padrão: listar o backlog ──────────────────────────────────────

const raw = gh([
  "issue",
  "list",
  "--state",
  "open",
  "--label",
  "backlog",
  "--json",
  "number,title,labels,url",
  "--limit",
  "200",
]);

let issues = JSON.parse(raw).map((issue) => ({
  ...issue,
  labelNames: issue.labels.map((l) => l.name),
}));

if (extraLabel) {
  issues = issues.filter((issue) => issue.labelNames.includes(extraLabel));
}

issues.sort((a, b) => priorityRank(a.labelNames) - priorityRank(b.labelNames));

if (issues.length === 0) {
  console.log("\n✅ Backlog vazio (ou nenhuma issue bate com o filtro).\n");
  process.exit(0);
}

console.log(
  `\n📋 Backlog${extraLabel ? ` (label: ${extraLabel})` : ""} — ${issues.length} issue(s), por prioridade:\n`
);
for (const issue of issues) {
  const priority = priorityOf(issue.labelNames).padEnd(3);
  const otherLabels = issue.labelNames
    .filter((l) => l !== "backlog" && !PRIORITY_ORDER.includes(l))
    .join(", ");
  console.log(`  ${priority} #${issue.number} — ${issue.title}`);
  if (otherLabels) console.log(`      ${otherLabels}`);
}
console.log(
  '\nPra mover pro próximo sprint: node scripts/sprint-plan.mjs --assign <n,n,n> --to "Marco N — <tema>"\n'
);
