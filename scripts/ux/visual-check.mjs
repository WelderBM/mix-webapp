// Revisão visual de UX (paralela, não bloqueante): abre o preview da Vercel
// num navegador real, em celular (360px) e desktop, e mede o que dá para
// medir sem opinião — alvo de toque, estouro de layout, acessibilidade
// (axe-core) e erros de console — além de tirar prints para a IA olhar.
//
// Roda no workflow ux-visual-review.yml. Playwright e axe são instalados lá,
// fora do package.json (UX_DEPS aponta para essa instalação).
//
// Uso: node scripts/ux/visual-check.mjs <baseUrl> <rotas.json> <saida/>
// Env: VERCEL_BYPASS (proteção do preview), UX_ADMIN_EMAIL/UX_ADMIN_PASSWORD
//      (conta de teste do staging, para rotas /admin), UX_DEPS, UX_CHROMIUM.

import { createRequire } from "node:module";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";

const req = createRequire(join(process.env.UX_DEPS ?? process.cwd(), "package.json"));
const { chromium } = req("playwright");
const { default: AxeBuilder } = req("@axe-core/playwright");

const [baseUrl, routesFile, outDir] = process.argv.slice(2);
const routes = JSON.parse(readFileSync(routesFile, "utf8"));
mkdirSync(outDir, { recursive: true });

export const MIN_TARGET = 44;
const VIEWPORTS = [
  { name: "celular", width: 360, height: 740, isMobile: true, hasTouch: true },
  { name: "desktop", width: 1280, height: 800, isMobile: false, hasTouch: false },
];
// Ruído conhecido de console que não é bug da página.
const CONSOLE_IGNORE = [/favicon/i, /Download the React DevTools/i, /\[Fast Refresh\]/i];

const slug = (r) => (r === "/" ? "home" : r.replace(/^\//, "").replace(/[^a-z0-9]+/gi, "-"));

async function login(page) {
  if (!process.env.UX_ADMIN_EMAIL) return false;
  await page.goto(new URL("/admin", baseUrl).toString(), { waitUntil: "load" });
  await page.waitForTimeout(2000);
  const email = page.locator('input[type="email"]');
  if (!(await email.count())) return true; // já logado
  await email.fill(process.env.UX_ADMIN_EMAIL);
  const pass = page.locator('input[type="password"]');
  await pass.fill(process.env.UX_ADMIN_PASSWORD ?? "");
  // Enter envia o formulário mesmo quando o botão não declara type="submit".
  await pass.press("Enter");
  await page.waitForFunction(() => !document.querySelector('input[type="password"]'), null, {
    timeout: 20_000,
  });
  return true;
}

// Mede no navegador: alvos de toque pequenos e estouro horizontal.
function measure(minTarget) {
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none";
  };
  const label = (el) =>
    (el.getAttribute("aria-label") || el.textContent || el.getAttribute("title") || el.tagName)
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 60);
  const small = [];
  for (const el of document.querySelectorAll(
    'button, a[href], [role="button"], input:not([type="hidden"]), select, textarea, summary'
  )) {
    if (!visible(el)) continue;
    // Link dentro de parágrafo de texto é exceção aceita (WCAG 2.5.8).
    if (el.tagName === "A" && el.closest("p, li") && !el.closest("nav")) continue;
    const r = el.getBoundingClientRect();
    if (r.width < minTarget || r.height < minTarget) {
      small.push({ label: label(el), w: Math.round(r.width), h: Math.round(r.height) });
    }
  }
  const doc = document.documentElement;
  const overflowPx = Math.max(0, doc.scrollWidth - window.innerWidth);
  const offenders = [];
  if (overflowPx > 1) {
    for (const el of document.body.querySelectorAll("*")) {
      const r = el.getBoundingClientRect();
      if (r.right > window.innerWidth + 1 && r.width > 0 && offenders.length < 5) {
        offenders.push(`${el.tagName.toLowerCase()}${el.className && typeof el.className === "string" ? "." + el.className.split(" ").slice(0, 2).join(".") : ""}`);
      }
    }
  }
  return { small, overflowPx, offenders };
}

const report = { baseUrl, generatedAt: new Date().toISOString(), pages: [] };
// UX_CHROMIUM: usar um Chromium já instalado (teste local); no CI o
// workflow instala o navegador da versão fixada.
const browser = await chromium.launch(
  process.env.UX_CHROMIUM ? { executablePath: process.env.UX_CHROMIUM } : {}
);
try {
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile: vp.isMobile,
      hasTouch: vp.hasTouch,
      locale: "pt-BR",
      extraHTTPHeaders: process.env.VERCEL_BYPASS
        ? { "x-vercel-protection-bypass": process.env.VERCEL_BYPASS, "x-vercel-set-bypass-cookie": "true" }
        : {},
    });
    const page = await ctx.newPage();
    let loggedIn = false;

    for (const route of routes) {
      const entry = { route, viewport: vp.name, errors: [], console: [] };
      const onConsole = (m) => {
        if (m.type() === "error" && !CONSOLE_IGNORE.some((re) => re.test(m.text()))) {
          entry.console.push(m.text().slice(0, 300));
        }
      };
      page.on("console", onConsole);
      page.on("pageerror", (e) => entry.console.push(`pageerror: ${e.message.slice(0, 300)}`));
      try {
        if (route.startsWith("/admin") && !loggedIn) loggedIn = await login(page);
        // Não usar "networkidle": o Firestore mantém conexão aberta em tempo
        // real e a rede nunca fica parada. Espera o "load" + estabilização.
        const res = await page.goto(new URL(route, baseUrl).toString(), { waitUntil: "load", timeout: 45_000 });
        entry.status = res?.status() ?? null;
        await page.waitForTimeout(2500); // dados do Firestore + animações de entrada
        if (vp.name === "celular") entry.metrics = await page.evaluate(measure, MIN_TARGET);
        else entry.metrics = { ...(await page.evaluate(measure, MIN_TARGET)), small: [] };
        const axe = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze();
        entry.axe = axe.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          help: v.help,
          nodes: v.nodes.length,
          example: v.nodes[0]?.target?.join(" ") ?? "",
        }));
        const shot = `${slug(route)}-${vp.name}.png`;
        await page.screenshot({ path: join(outDir, shot), fullPage: true });
        entry.screenshot = shot;
      } catch (e) {
        // Só a primeira linha, sem códigos de cor do terminal.
        entry.errors.push(
          String(e.message ?? e)
            .replace(/\u001b\[[0-9;]*m/g, "")
            .split(/\r?\n/)[0]
            .slice(0, 200),
        );
      }
      page.off("console", onConsole);
      page.removeAllListeners("pageerror");
      report.pages.push(entry);
    }
    await ctx.close();
  }
} finally {
  await browser.close();
}

writeFileSync(join(outDir, "ux-report.json"), JSON.stringify(report, null, 2));
console.log(`ok: ${report.pages.length} telas medidas`);
