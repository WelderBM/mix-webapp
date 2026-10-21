// Hook PostToolUse do Claude Code (.claude/settings.json): quando uma sessão
// abre um PR com `gh pr create`, dispara o REVISOR 1 (local) em segundo
// plano — `claude -p` com ferramentas só de leitura — sem travar a sessão.
// O comentário dele (marcado `<!-- revisao:1 -->`) dispara o revisor 2 no
// GitHub (.github/workflows/claude-pr-review.yml).
//
// Nunca falha a sessão: qualquer erro aqui só é registrado no log.

import { spawn, execFileSync } from "node:child_process";
import { openSync, appendFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const LOG = join(tmpdir(), "mix-revisor-pr.log");
const log = (msg) => {
  try {
    appendFileSync(LOG, `[${new Date().toISOString()}] ${msg}\n`);
  } catch {}
};

// Mesma lista do workflow do GitHub: só leitura + publicar o comentário.
const ALLOWED_TOOLS = [
  "Bash(gh pr view:*)",
  "Bash(gh pr diff:*)",
  "Bash(gh pr checks:*)",
  "Bash(gh pr comment:*)",
  "Bash(gh issue view:*)",
  "Bash(git fetch:*)",
  "Bash(git show:*)",
  "Bash(git log:*)",
  "Bash(git diff:*)",
  "Bash(git ls-tree:*)",
  "Bash(git grep:*)",
].join(",");

let raw = "";
process.stdin.on("data", (c) => (raw += c));
process.stdin.on("end", () => {
  try {
    const input = JSON.parse(raw || "{}");
    const command = String(input?.tool_input?.command ?? "");
    if (!/\bgh\s+pr\s+create\b/.test(command)) return;

    const m = /https:\/\/github\.com\/[^/\s]+\/[^/\s]+\/pull\/(\d+)/.exec(
      JSON.stringify(input.tool_response ?? ""),
    );
    if (!m) return log(`gh pr create sem URL de PR na saída — ignorado`);
    const pr = m[1];
    const cwd = input.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd();
    if (process.env.MIX_REVIEW_DRY_RUN) {
      return process.stdout.write(`DRY_RUN revisaria PR #${pr} em ${cwd}\n`);
    }

    // Avisa o workflow do GitHub que a revisão 1 é local (ele espera por ela
    // em vez de revisar sozinho).
    try {
      execFileSync("gh", ["pr", "edit", pr, "--add-label", "revisao-local"], {
        cwd,
        stdio: "ignore",
        timeout: 20_000,
      });
    } catch (e) {
      log(`PR #${pr}: falha ao marcar label revisao-local: ${e.message}`);
    }

    const prompt =
      `ETAPA 1. Revise o PR #${pr}. Leia o arquivo .claude/agents/revisor-pr.md ` +
      `(via \`git fetch origin dev\` e \`git show origin/dev:.claude/agents/revisor-pr.md\`; ` +
      `se não existir em dev, leia do próprio PR) e siga as instruções da Etapa 1.`;
    const out = openSync(join(tmpdir(), `mix-revisor-pr-${pr}.log`), "a");
    const child = spawn(
      "claude",
      ["-p", prompt, "--allowedTools", ALLOWED_TOOLS],
      { cwd, detached: true, stdio: ["ignore", out, out], windowsHide: true },
    );
    child.on("error", (e) => log(`PR #${pr}: não consegui iniciar o claude: ${e.message}`));
    child.unref();
    log(`PR #${pr}: revisor 1 iniciado (log em mix-revisor-pr-${pr}.log)`);
  } catch (e) {
    log(`erro no hook: ${e.message}`);
  }
});
