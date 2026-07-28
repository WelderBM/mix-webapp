#!/usr/bin/env node
// scripts/wt-clean.mjs
//
// Remove worktrees cuja fatia já terminou. DRY-RUN por padrão: lista o que
// removeria e por quê, e o que NÃO removeria com o motivo de cada. Remoção
// de verdade só com --yes. Idempotente (rodar sem nada pra limpar não dá
// erro) e sob demanda — NUNCA amarrado a "fim de sessão" (não dá pra
// detectar isso com confiança).
//
// 5 guardas obrigatórias, nenhuma dispensável:
//   a. não é o worktree principal
//   b. working tree limpo (sem mudança não commitada / untracked)
//   c. branch mergeada em dev (git branch --merged dev)
//   d. sem PR aberto pra ela (gh pr list --head <branch>)
//   e. branch fora de scripts/wt-keep.txt (exceções manuais)
//
// Uso:
//   node scripts/wt-clean.mjs           # dry-run (padrão)
//   node scripts/wt-clean.mjs --yes     # remove de verdade os elegíveis

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

function git(args, opts = {}) {
  return execFileSync("git", args, { encoding: "utf-8", ...opts });
}

const DO_IT = process.argv.includes("--yes");

const gitCommonDir = git([
  "rev-parse",
  "--path-format=absolute",
  "--git-common-dir",
]).trim();
const mainWorktreePath = path.dirname(gitCommonDir);

// ── Keep-list (guard e) ────────────────────────────────────────────────────
// Vive commitada em scripts/wt-keep.txt (dev), compartilhada entre todos os
// worktrees. NÃO auto-cria o arquivo se estiver ausente — o worktree
// principal pode estar checked out numa branch antiga que ainda não tem
// este arquivo tracked, e escrever ali poluiria o working tree de uma
// branch sem relação nenhuma com esta fatia. Ausente = lista vazia (guard e
// nunca bloqueia sozinho); só avisa.

const keepListPath = path.join(mainWorktreePath, "scripts", "wt-keep.txt");
let keepList = [];
if (existsSync(keepListPath)) {
  keepList = readFileSync(keepListPath, "utf-8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
} else {
  console.warn(
    `⚠️  ${keepListPath} não encontrado — nenhuma exceção manual será respeitada até ele existir (rode a partir de uma branch que já tenha esse arquivo, ex. dev).`
  );
}

// ── Worktrees existentes (exceto o principal) ─────────────────────────────

const worktreeListRaw = git(["worktree", "list", "--porcelain"]);
const worktrees = worktreeListRaw
  .split("\n\n")
  .filter((b) => b.trim())
  .map((block) => {
    const lines = block.split("\n");
    const worktreePath = lines[0].replace(/^worktree /, "").trim();
    const branchLine = lines.find((l) => l.startsWith("branch "));
    const branchName = branchLine
      ? branchLine.replace("branch refs/heads/", "").trim()
      : null;
    return { path: worktreePath, branch: branchName };
  });

const others = worktrees.filter(
  (w) => path.resolve(w.path) !== path.resolve(mainWorktreePath)
);

if (others.length === 0) {
  console.log("Nenhum worktree além do principal — nada a avaliar.");
  process.exit(0);
}

// ── Guard c: branches mergeadas em dev ────────────────────────────────────

let mergedBranches = [];
try {
  // "git branch" prefixa com "* " a branch atual e com "+ " qualquer branch
  // checked out noutro worktree — os dois precisam ser removidos, senão o
  // nome nunca bate com o "branch" que git worktree list --porcelain
  // reporta (sem prefixo nenhum).
  mergedBranches = git(["branch", "--merged", "dev"])
    .split("\n")
    .map((l) => l.replace(/^[*+]\s*/, "").trim())
    .filter(Boolean);
} catch (err) {
  console.warn(
    `⚠️  Não consegui checar branches mergeadas em dev (${err.message}) — tratando todas como não-mergeadas.`
  );
}

// ── Guard d: PR aberto ─────────────────────────────────────────────────────

function hasOpenPr(branch) {
  try {
    const out = execFileSync(
      "gh",
      ["pr", "list", "--head", branch, "--state", "open", "--json", "number"],
      { encoding: "utf-8" }
    );
    return JSON.parse(out).length > 0;
  } catch {
    return null; // gh indisponível/sem auth — "não sei" trata como recusa, guard erra pro lado seguro
  }
}

// ── Guard b: working tree limpo ───────────────────────────────────────────

function isWorkingTreeClean(worktreePath) {
  return git(["status", "--porcelain"], { cwd: worktreePath }).trim() === "";
}

const eligible = [];
const rejected = [];

for (const wt of others) {
  if (!wt.branch) {
    rejected.push({
      wt,
      reason: "HEAD destacado (sem branch) — não mexo, resolva manualmente.",
    });
    continue;
  }

  let clean;
  try {
    clean = isWorkingTreeClean(wt.path);
  } catch (err) {
    rejected.push({
      wt,
      reason: `não consegui checar o working tree (${err.message}) — assumindo sujo por segurança.`,
    });
    continue;
  }
  if (!clean) {
    rejected.push({
      wt,
      reason:
        "working tree tem mudança não commitada ou arquivo untracked — pode ser trabalho em andamento.",
    });
    continue;
  }

  if (!mergedBranches.includes(wt.branch)) {
    rejected.push({
      wt,
      reason: `branch "${wt.branch}" ainda não foi mergeada em dev.`,
    });
    continue;
  }

  const openPr = hasOpenPr(wt.branch);
  if (openPr === null) {
    rejected.push({
      wt,
      reason: `não consegui checar PR aberto pra "${wt.branch}" (gh indisponível?) — recusando por segurança.`,
    });
    continue;
  }
  if (openPr) {
    rejected.push({ wt, reason: `existe PR aberto pra "${wt.branch}".` });
    continue;
  }

  if (keepList.includes(wt.branch)) {
    rejected.push({
      wt,
      reason: `branch "${wt.branch}" está em scripts/wt-keep.txt (exceção manual).`,
    });
    continue;
  }

  eligible.push(wt);
}

console.log(`\n📋 Worktrees avaliados: ${others.length}\n`);

if (eligible.length > 0) {
  console.log(
    `✅ Elegíveis pra remoção${DO_IT ? " (removendo agora)" : ""}:`
  );
  eligible.forEach((wt) => console.log(`   - ${wt.path}  [${wt.branch}]`));
} else {
  console.log("✅ Nenhum worktree elegível pra remoção agora.");
}

if (rejected.length > 0) {
  console.log(`\n🚫 Mantidos (com motivo):`);
  rejected.forEach(({ wt, reason }) =>
    console.log(`   - ${wt.path}  [${wt.branch ?? "detached"}] — ${reason}`)
  );
}

if (!DO_IT) {
  console.log(
    `\n(dry-run — nada foi removido; rode com --yes pra remover os elegíveis)\n`
  );
  process.exit(0);
}

for (const wt of eligible) {
  console.log(`\n🗑️  Removendo ${wt.path}...`);
  try {
    git(["worktree", "remove", wt.path]);
    console.log(`   ✅ removido.`);
  } catch (err) {
    console.error(`   ❌ falhou: ${err.message}`);
  }
}

console.log(`\n🧹 git worktree prune...`);
git(["worktree", "prune"]);
console.log(`✅ Concluído.\n`);
