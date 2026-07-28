#!/usr/bin/env node
// scripts/wt-new.mjs
//
// Cria um worktree novo pra isolar uma sessão de agente que encontrou o
// diretório principal ocupado por outra (HEAD alheio, mudança não commitada
// de outra sessão). Ver CLAUDE.md — "Fluxo de git": worktree é por
// CONCORRÊNCIA, não por sessão nem por fatia — a sessão primária usa o
// diretório principal normalmente, worktree só quando ele já está ocupado.
// Invocação deliberada, sem hook automático.
//
// Uso:
//   node scripts/wt-new.mjs <branch>                  checkout de branch já existente
//   node scripts/wt-new.mjs <branch> --new             cria branch nova a partir de --from (default: dev)
//   node scripts/wt-new.mjs <branch> --new --from dev
//
// Efeitos: git worktree add, cópia do .env do worktree principal (nunca
// commitado — já coberto pelo .gitignore), npm ci. Não mexe no worktree
// principal, não commita nada.

import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, copyFileSync } from "node:fs";
import path from "node:path";

function git(args) {
  return execFileSync("git", args, { encoding: "utf-8" });
}

function abort(message) {
  console.error(`\n❌ ${message}\n`);
  process.exit(1);
}

const args = process.argv.slice(2);
const branch = args.find((a) => !a.startsWith("--"));
const isNew = args.includes("--new");
const fromIdx = args.indexOf("--from");
const fromRef = fromIdx !== -1 ? args[fromIdx + 1] : "dev";

if (!branch) {
  abort(
    "Uso: node scripts/wt-new.mjs <branch> [--new] [--from <ref>]\n" +
      "  <branch> sem --new: checkout de branch já existente num worktree novo.\n" +
      "  --new: cria a branch a partir de --from (default: dev)."
  );
}

// ── Descobrir worktree principal e worktrees já existentes ────────────────

let worktreeListRaw;
try {
  worktreeListRaw = git(["worktree", "list", "--porcelain"]);
} catch (err) {
  abort(`Não consegui listar worktrees (rode isto de dentro do repo): ${err.message}`);
}

const worktrees = worktreeListRaw
  .split("\n\n")
  .filter((block) => block.trim())
  .map((block) => {
    const lines = block.split("\n");
    const worktreePath = lines[0].replace(/^worktree /, "").trim();
    const branchLine = lines.find((l) => l.startsWith("branch "));
    const branchName = branchLine
      ? branchLine.replace("branch refs/heads/", "").trim()
      : null;
    return { path: worktreePath, branch: branchName };
  });

// Branch já em uso noutro worktree — o git recusaria de qualquer forma
// (não dá pra ter a mesma branch checked out em dois lugares ao mesmo
// tempo), mas aqui a mensagem já vem traduzida ANTES de tentar.
const collision = worktrees.find((w) => w.branch === branch);
if (collision) {
  abort(
    `A branch "${branch}" já está checked out em outro worktree:\n` +
      `  ${collision.path}\n` +
      `Abra esse diretório direto — não dá pra ter a mesma branch em dois worktrees ao mesmo tempo.`
  );
}

const gitCommonDir = git([
  "rev-parse",
  "--path-format=absolute",
  "--git-common-dir",
]).trim();
const mainWorktreePath = path.dirname(gitCommonDir);
const mainWorktreeName = path.basename(mainWorktreePath);

// Índice livre: <nome-do-repo>-wt<N>, N = 1 em diante.
const wtPattern = new RegExp(`^${mainWorktreeName}-wt(\\d+)$`);
const usedIndexes = worktrees
  .map((w) => {
    const name = path.basename(w.path);
    const m = name.match(wtPattern);
    return m ? Number(m[1]) : null;
  })
  .filter((n) => n !== null);
const nextIndex = usedIndexes.length ? Math.max(...usedIndexes) + 1 : 1;

const newWorktreePath = path.join(
  path.dirname(mainWorktreePath),
  `${mainWorktreeName}-wt${nextIndex}`
);

if (existsSync(newWorktreePath)) {
  abort(
    `${newWorktreePath} já existe no disco mas não está registrado como worktree — ` +
      `resolva manualmente (confira "git worktree list" e o conteúdo do diretório) antes de rodar de novo.`
  );
}

// ── git worktree add ───────────────────────────────────────────────────

const addArgs = ["worktree", "add", newWorktreePath];
if (isNew) {
  addArgs.push("-b", branch, fromRef);
} else {
  addArgs.push(branch);
}

console.log(
  `\n🌳 Criando worktree em ${newWorktreePath} (branch: ${branch}${
    isNew ? `, nova a partir de ${fromRef}` : ""
  })...`
);
try {
  execFileSync("git", addArgs, { stdio: "inherit" });
} catch (err) {
  abort(
    `git worktree add falhou: ${err.message}\n` +
      (isNew
        ? `Se a branch "${branch}" já existir, rode sem --new.`
        : `Confira se a branch "${branch}" existe ("git branch -a").`)
  );
}

// ── Copiar .env ─────────────────────────────────────────────────────────

const mainEnvPath = path.join(mainWorktreePath, ".env");
const newEnvPath = path.join(newWorktreePath, ".env");
if (existsSync(mainEnvPath)) {
  copyFileSync(mainEnvPath, newEnvPath);
  console.log(
    `✅ .env copiado do worktree principal (nunca commitado — já coberto pelo .gitignore).`
  );
} else {
  console.warn(
    `⚠️  .env não encontrado em ${mainWorktreePath} — copie manualmente antes de rodar o app.`
  );
}

// ── npm ci ──────────────────────────────────────────────────────────────

console.log(`\n📦 Rodando npm ci em ${newWorktreePath}...`);
const npmResult = spawnSync("npm", ["ci"], {
  cwd: newWorktreePath,
  stdio: "inherit",
  shell: true,
});
if (npmResult.status !== 0) {
  abort(
    `npm ci falhou (status ${npmResult.status}) — worktree criado, mas dependências não instaladas.`
  );
}

// ── Resultado ───────────────────────────────────────────────────────────

const suggestedPort = 3000 + nextIndex;
console.log(`\n✅ Worktree pronto.`);
console.log(`   Caminho:  ${newWorktreePath}`);
console.log(`   Branch:   ${branch}`);
console.log(
  `   Porta sugerida (evita colisão com o principal): ${suggestedPort}`
);
console.log(`\nAbrir no VS Code:\n  code "${newWorktreePath}"\n`);
