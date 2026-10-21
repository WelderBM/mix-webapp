// Etapa de decisão da cadeia de revisão (sem IA): decide se um PR revisado
// pode entrar sozinho em `dev` ou precisa do dono do repositório.
//
// Merge automático só quando TUDO vale:
//   - revisor 2 publicou veredito com zero bloqueantes e zero importantes
//   - CI ("Run Tests & Build") verde
//   - base `dev` (produção/master é sempre manual)
//   - até MAX_CHANGED_LINES linhas alteradas (fora lockfile)
//   - nenhum arquivo de alto risco
//
// Uso no workflow: node scripts/ci/pr-gate.mjs <arquivo-de-entrada.json>
// (imprime JSON com a decisão). A lógica pura é `evaluateGate`, testada.

import { readFileSync } from "node:fs";

export const MAX_CHANGED_LINES = 150;

// Mexer nestes caminhos sempre exige o dono: dinheiro, acesso, dados,
// infraestrutura e as próprias regras da revisão.
export const HIGH_RISK = [
  /^firestore\.rules$/,
  /^storage\.rules$/,
  /^firebase\.json$/,
  /^package(-lock)?\.json$/,
  /^next\.config\./,
  /^\.github\//,
  /^\.claude\/(settings\.json|agents\/)/,
  /^scripts\/(ci|hooks)\//,
  /^src\/lib\/(ribbon-pricing|cart-pricing|firebase|env)\.ts$/,
  /^src\/store\/(cartStore|authStore)\.ts$/,
  /^src\/components\/features\/CartSidebar\.tsx$/,
  /^src\/components\/admin\/(AdminLogin|SystemPasswordGate|SuperAdminZone)\.tsx$/,
  /^src\/app\/admin\/page\.tsx$/,
  /^src\/app\/api\//,
];

const LOCKFILE = /(^|\/)package-lock\.json$/;

// Última linha do comentário do revisor 2:
//   <!-- veredito: {"bloqueantes":0,"importantes":1,"menores":2} -->
export function parseVerdict(body) {
  const m = /<!--\s*veredito:\s*(\{[^}]*\})\s*-->/.exec(body ?? "");
  if (!m) return null;
  try {
    const v = JSON.parse(m[1]);
    if (!Number.isInteger(v.bloqueantes) || !Number.isInteger(v.importantes)) {
      return null;
    }
    return v;
  } catch {
    return null;
  }
}

/**
 * @param {{
 *   verdict: {bloqueantes:number, importantes:number} | null,
 *   base: string,
 *   ciConclusion: string | null,   // conclusão do check "Run Tests & Build"
 *   files: {path:string, additions:number, deletions:number}[],
 * }} input
 * @returns {{ autoMerge: boolean, review: "approve"|"request-changes"|"comment", reasons: string[] }}
 */
export function evaluateGate({ verdict, base, ciConclusion, files }) {
  const reasons = [];

  if (!verdict) {
    reasons.push("o revisor não publicou um veredito legível");
  } else {
    if (verdict.bloqueantes > 0) {
      reasons.push(`${verdict.bloqueantes} achado(s) 🔴 bloqueante(s)`);
    }
    if (verdict.importantes > 0) {
      reasons.push(`${verdict.importantes} achado(s) 🟡 importante(s)`);
    }
  }

  if (ciConclusion !== "success") {
    reasons.push(`CI não está verde (${ciConclusion ?? "sem resultado"})`);
  }

  if (base !== "dev") {
    reasons.push(`destino é \`${base}\` — só \`dev\` entra sozinho`);
  }

  const changed = files
    .filter((f) => !LOCKFILE.test(f.path))
    .reduce((n, f) => n + f.additions + f.deletions, 0);
  if (changed > MAX_CHANGED_LINES) {
    reasons.push(`${changed} linhas alteradas (limite ${MAX_CHANGED_LINES})`);
  }

  const risky = files
    .map((f) => f.path)
    .filter((p) => HIGH_RISK.some((re) => re.test(p)));
  if (risky.length > 0) {
    reasons.push(`arquivo(s) de alto risco: ${risky.map((p) => `\`${p}\``).join(", ")}`);
  }

  const review =
    !verdict || verdict.bloqueantes > 0
      ? verdict
        ? "request-changes"
        : "comment"
      : verdict.importantes > 0
        ? "comment"
        : "approve";

  return { autoMerge: reasons.length === 0, review, reasons };
}

if (process.argv[1] && process.argv[1].endsWith("pr-gate.mjs") && process.argv[2]) {
  const input = JSON.parse(readFileSync(process.argv[2], "utf8"));
  const result = evaluateGate({ ...input, verdict: parseVerdict(input.reviewBody) });
  process.stdout.write(JSON.stringify(result));
}
