---
name: accessibility-test
description: Use quando for adicionar teste de acessibilidade novo, auditar conformidade WCAG 2.2 AA, corrigir contraste, ou validar navegação por teclado/leitor de tela numa tela ou fluxo específico — gera testes com axe-core (Playwright + vitest-axe) e reporta violações por severidade com referência ao critério WCAG. NÃO instala dependências novas sem te mostrar a lista antes; proponha, não instale silenciosamente. NÃO use pra auditoria visual mais ampla (tema, anti-padrão) — isso é `design-audit`.
---

## Proveniência

Origem: catálogo comunitário de agent skills (skills-hub.ai / registro público), path `test/accessibility-test/SKILL.md`, versão 2.0.0, obtida em 2026-07-27. Titularidade do registro (se `tinh2/skills-hub-registry` — repositório GitHub que se apresenta como "daily-synced to skills-hub.ai" — é de fato o mantenedor oficial por trás do site, ou um espelho/fork homônimo) **não verificada** — ver #122.
Auditada e adaptada em 2026-07-27 (PR `chore/hub-skills-batch`): mérito do conteúdo avaliado item a item, independente da proveniência ainda não confirmada acima — ver modificações abaixo.
Primeiro alvo real: issue #105 (manifest icons, `sizes` do banner, `DialogContent` sem `aria-describedby`, `scroll-behavior` sem guard de `prefers-reduced-motion`).

Modificações aplicadas nesta cópia:
- **Baseline elevado de WCAG 2.1 AA pra WCAG 2.2 AA** — o original mirava 2.1; herdei os critérios novos de 2.2 (2.4.11 Focus Not Obscured, 2.5.7/2.5.8 Dragging/Target Size, 3.3.7 Redundant Entry, 3.3.8 Accessible Authentication) da checklist já presente no `design-audit`, pra não instalar duas skills com baseline diferente pro mesmo padrão.
- Removido o framing "AUTONOMOUS MODE. Do NOT ask questions" e a instalação silenciosa de dependências (`npm install -D @axe-core/playwright` etc.) — a skill detecta e recomenda, mas mostra a lista de pacotes antes de instalar. Fica no fluxo fatiado normal (PR próprio, `tsc`/`vitest`/`build` + `auditoria-de-pr`).
- Removida a seção "SELF-EVOLUTION TELEMETRY" do original — escrevia em `~/.claude/projects/.../skill-telemetry.md`, fora do repo e fora do nosso sistema de memória.
- Stack local já é Vitest — vitest-axe é o caminho padrão aqui, jest-axe fica só como referência pra quem reusar a skill fora deste repo.

---

You detect the frontend framework, set up accessibility testing with axe-core and Lighthouse CI, generate a11y tests for all pages/routes, and produce a violations report organized by severity. You propose dependency installs and test files — you don't install or commit without showing what changed.

INPUT:
$ARGUMENTS

If arguments are provided, focus on those specific pages, components, or WCAG criteria. If no arguments are provided, test ALL pages and routes for WCAG 2.2 AA compliance.

============================================================
PHASE 1: FRONTEND DISCOVERY
============================================================

Step 1.1 -- Detect Frontend Framework

| Indicator | Framework |
|---|---|
| next.config.* | Next.js |
| nuxt.config.* | Nuxt |
| angular.json | Angular |
| svelte.config.* | SvelteKit |
| vite.config.* + React | React + Vite |
| vite.config.* + Vue | Vue + Vite |
| package.json with react-scripts | Create React App |
| pubspec.yaml with flutter | Flutter |
| package.json with expo | React Native (Expo) |
| astro.config.* | Astro |

Neste repo é sempre Next.js (App Router) — a tabela acima é herdada do skill original pra reuso fora daqui.

Step 1.2 -- Detect Existing A11y Tools

| Indicator | Tool |
|---|---|
| jest-axe in package.json | jest-axe |
| @axe-core/playwright in package.json | Playwright axe |
| cypress-axe in package.json | Cypress axe |
| @axe-core/react in package.json | React axe (dev overlay) |
| pa11y in package.json | Pa11y |
| lighthouserc.* or @lhci/cli | Lighthouse CI |
| .a11yrc or a11y.config.* | Custom a11y config |
| vitest-axe in package.json | vitest-axe |

Step 1.3 -- Discover All Routes and Pages

Build the page inventory:

| # | Route | Page Name | Auth Required | Interactive Elements | Forms |
|---|-------|-----------|--------------|---------------------|-------|

Identify component-level testing targets:
- Reusable UI components (buttons, inputs, modals, navbars)
- Custom interactive widgets (date pickers, sliders, autocomplete)
- Dynamic content areas (accordions, tabs, carousels, tooltips)

============================================================
PHASE 2: TOOL SETUP (PROPOSTA, NÃO INSTALAÇÃO SILENCIOSA)
============================================================

Step 2.1 -- Recomendar ferramentas de teste de a11y

FOR WEB PROJECTS (React, Next.js, Vue, Angular, Svelte, Astro):

Primary tool -- Playwright + axe-core (page-level testing):
- `npm install -D @axe-core/playwright`
- Provides: Full page a11y scanning with Playwright browser automation

Secondary tool -- vitest-axe (component-level testing, stack local):
- `npm install -D vitest-axe`
- Provides: A11y checks on rendered components in unit tests

Reporting tool -- Lighthouse CI (opcional):
- `npm install -D @lhci/cli`
- Provides: Automated Lighthouse scores including accessibility score

**Antes de rodar qualquer `npm install`, liste os pacotes propostos e espere confirmação** — não é uma decisão que essa skill toma sozinha.

Step 2.2 -- Configure Lighthouse CI (se adotado)

Create lighthouserc.js (or .lighthouserc.json):

Configuration must include:
- URLs to test (all discovered routes)
- Assertions for accessibility score:
  - minScore: 0.9 (WCAG 2.2 AA target = 90%+)
- Number of runs: 3 (for stability)
- Preset: "lighthouse:no-pwa" (focus on accessibility, not PWA)
- Categories to audit: accessibility, best-practices

Step 2.3 -- Configure axe-core Rules

Set up axe-core with WCAG 2.2 AA as the baseline:

Rule tags to enable:
- wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa
- best-practice: Additional best practice rules

Rules to explicitly verify:
- color-contrast: Text has sufficient contrast ratio (4.5:1 normal, 3:1 large)
- image-alt: All images have alt text
- label: All form inputs have labels
- link-name / button-name: discernible text
- document-title / html-has-lang
- landmark-one-main / region
- aria-required-attr / aria-valid-attr-value
- heading-order
- tabindex: No tabindex > 0 (disrupts tab order)
- focus-visible

============================================================
PHASE 3: TEST GENERATION
============================================================

Step 3.1 -- Page-Level A11y Tests (Playwright + axe)

FOR EACH page in scope, generate a test file:

```
test('[page-name] - accessibility', async ({ page }) => {
  // Navigate and wait for page to be fully loaded
  // Inject axe-core
  // Run full page scan with WCAG 2.2 AA tags
  // Assert zero violations
})
```

Each page test must:
1. Navigate to the page (with authentication if required)
2. Wait for all content to load (network idle, fonts, images)
3. Run axe-core scan with wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa tags
4. Capture all violations with:
   - Rule ID and description
   - Impact level (critical, serious, moderate, minor)
   - Affected HTML element
   - WCAG success criterion violated
   - Fix suggestion

Test interactive states for each page:
- Default state (page loaded)
- After opening a modal/dialog (check focus trap, aria attributes, `aria-describedby`)
- After expanding an accordion/dropdown (check aria-expanded)
- After triggering an error state (check error messages are announced)
- After form validation failure (check error association with inputs)

Step 3.2 -- Keyboard Navigation Tests

FOR EACH page, generate keyboard navigation tests:

TAB ORDER:
1. Press Tab repeatedly from the top of the page
2. Verify focus moves in a logical reading order
3. Verify no element is skipped
4. Verify no focus trap (except intentional ones in modals)
5. Verify focus is visible on every focused element
6. **WCAG 2.2 — 2.4.11 Focus Not Obscured**: verify the focused element is not fully hidden behind a sticky header, modal, or other overlay

KEYBOARD INTERACTIONS:
- Buttons: Enter and Space activate
- Links: Enter activates
- Checkboxes: Space toggles
- Radio buttons: Arrow keys move between options
- Dropdowns/Select: Arrow keys navigate options, Enter selects
- Modals: Escape closes, Tab stays within modal (focus trap)
- Menus: Arrow keys navigate, Escape closes
- Tabs: Arrow keys switch tabs
- Accordions: Enter/Space toggles

FOCUS MANAGEMENT:
- When a modal opens, focus moves to the first focusable element inside
- When a modal closes, focus returns to the trigger element
- After deleting an item, focus moves to a sensible element (next item or heading)
- Skip-to-content link works (first Tab stop, jumps to main content)

Step 3.3 -- Component-Level A11y Tests

FOR reusable components, generate unit-level a11y tests using vitest-axe:
1. Render the component in isolation
2. Run axe on the rendered output
3. Assert zero violations

Test each component variant:
- Default state
- Disabled state
- Error state
- Loading state
- With different prop combinations

Verify semantic HTML:
- Buttons use <button>, not <div onclick>
- Links use <a href>, not <span onclick>
- Headings use <h1>-<h6> in order
- Lists use <ul>/<ol>/<li>
- Tables use <table>/<thead>/<tbody>/<th> with scope
- Forms use <form> with <label> elements linked to inputs

Step 3.4 -- Screen Reader Compatibility Tests

Generate tests to verify screen reader announcements:

ARIA LIVE REGIONS:
- Dynamic status messages use aria-live="polite"
- Error alerts use aria-live="assertive" or role="alert"
- Loading indicators announce state changes
- Toast/snackbar notifications are announced

ARIA LABELS:
- Icon-only buttons have aria-label
- Complex widgets have aria-labelledby or aria-describedby
- Decorative images have aria-hidden="true" or empty alt=""
- Navigation landmarks have aria-label when multiple exist

FORM ACCESSIBILITY:
- Each input has an associated <label> (htmlFor/for attribute)
- Required fields are marked with aria-required="true"
- Error messages are linked with aria-describedby
- Fieldsets group related inputs with <legend>
- Error state uses aria-invalid="true"

Step 3.5 -- Novos critérios WCAG 2.2 a checar explicitamente

- **2.4.11 Focus Not Obscured (AA)**: elemento focado nunca fica totalmente escondido atrás de header sticky/modal/overlay.
- **2.5.7 Dragging Movements (AA)**: qualquer interação de arrastar tem alternativa sem arrastar (clique, teclado).
- **2.5.8 Target Size Minimum (AA)**: alvos interativos com pelo menos 24x24px CSS (ou espaçamento suficiente se menor).
- **3.3.7 Redundant Entry (AA)**: informação já digitada num passo anterior do fluxo não é pedida de novo sem auto-preencher ou permitir seleção.
- **3.3.8 Accessible Authentication (AA)**: login/autenticação não depende de teste cognitivo (sem exigir memorizar/recalcular algo sem alternativa).

============================================================
PHASE 4: EXECUTION
============================================================

Step 4.1 -- Start the Application

Start the frontend dev server (`npm run dev`) and wait for it to be ready.

Step 4.2 -- Run axe-core Tests

| Tool | Command |
|---|---|
| Playwright + axe | npx playwright test a11y-tests/ --reporter=list |
| vitest-axe | npx vitest run tests/a11y/ |

Step 4.3 -- Run Lighthouse CI (se configurado)

```
lhci autorun --config=lighthouserc.js
```

Or for individual pages:
```
lhci collect --url=http://localhost:PORT/page1 --url=http://localhost:PORT/page2
lhci assert
```

Record the accessibility score for each page.

Step 4.4 -- Compile Violations

Merge results from axe-core and Lighthouse into a unified violations list.
Deduplicate violations that appear in both tools.

============================================================
SELF-HEALING VALIDATION (max 3 iterações, só no código de teste)
============================================================

After generating and running tests, validate:

1. All generated test files compile/parse without syntax errors.
2. Run the generated tests — capture pass/fail results.
3. If tests fail due to test code bugs (not application bugs), fix the test code.
4. Se a falha é da aplicação (ex: um `DialogContent` de verdade sem `aria-describedby`), **não edite o componente sozinho** — reporte como violação, com o fix sugerido, pra virar uma fatia própria de correção.
5. Re-run to confirm tests pass or legitimately fail on application issues.
6. Repeat up to 3 iterations.

============================================================
OUTPUT
============================================================

## Accessibility Test Report

### Setup
- **Framework:** Next.js (App Router)
- **A11y tools:** [axe-core, Lighthouse CI, vitest-axe, etc.]
- **WCAG level:** 2.2 AA (baseline)
- **Pages tested:** [count]
- **Components tested:** [count]

### Lighthouse Accessibility Scores

| Page | Score | Status |
|------|-------|--------|
| [page] | [0-100] | [PASS >= 90 / FAIL < 90] |
| **Average** | **N** | **[verdict]** |

### Violations by Severity

#### Critical (must fix immediately)
| # | Rule | WCAG Criterion | Page | Element | Description | Fix |
|---|------|---------------|------|---------|-------------|-----|

#### Serious (should fix before release)
| # | Rule | WCAG Criterion | Page | Element | Description | Fix |
|---|------|---------------|------|---------|-------------|-----|

#### Moderate (fix in next sprint)
| # | Rule | WCAG Criterion | Page | Element | Description | Fix |
|---|------|---------------|------|---------|-------------|-----|

#### Minor (improvement opportunity)
| # | Rule | WCAG Criterion | Page | Element | Description | Fix |
|---|------|---------------|------|---------|-------------|-----|

### Violation Summary
- Critical: N
- Serious: N
- Moderate: N
- Minor: N
- **Total violations:** N

### Keyboard Navigation Results

| Page | Tab Order | Focus Visible | Focus Not Obscured (2.4.11) | Keyboard Operable | Focus Management |
|------|----------|--------------|------------------------------|-------------------|-----------------|

### WCAG 2.2 AA Compliance Checklist

| Criterion | Description | Status | Notes |
|-----------|------------|--------|-------|
| 1.1.1 | Non-text Content (alt text) | PASS/FAIL | |
| 1.3.1 | Info and Relationships (semantic HTML) | PASS/FAIL | |
| 1.4.3 | Contrast (Minimum) 4.5:1 | PASS/FAIL | |
| 1.4.11 | Non-text Contrast 3:1 | PASS/FAIL | |
| 2.1.1 | Keyboard accessible | PASS/FAIL | |
| 2.4.3 | Focus Order logical | PASS/FAIL | |
| 2.4.7 | Focus Visible | PASS/FAIL | |
| 2.4.11 | Focus Not Obscured | PASS/FAIL | |
| 2.5.7 | Dragging Movements | PASS/FAIL | |
| 2.5.8 | Target Size Minimum | PASS/FAIL | |
| 3.3.1 | Error Identification | PASS/FAIL | |
| 3.3.2 | Labels or Instructions | PASS/FAIL | |
| 3.3.7 | Redundant Entry | PASS/FAIL | |
| 3.3.8 | Accessible Authentication | PASS/FAIL | |
| 4.1.2 | Name, Role, Value (ARIA) | PASS/FAIL | |

### Accessibility Grade
- **AAA READY:** Zero violations, score 95+, all keyboard tests pass
- **AA COMPLIANT:** Zero critical/serious, score 90+, keyboard navigable
- **PARTIAL:** Some serious violations, score 70-89, keyboard issues
- **NON-COMPLIANT:** Critical violations, score < 70, keyboard broken

NEXT STEPS:

- "Critical violations found? Reporte como achado prioritário — não corrija o componente dentro desta skill."
- "Run `/e2e` (se existir) pra confirmar que fix de a11y não quebra funcionalidade."
- "Considere teste manual com VoiceOver (macOS), NVDA (Windows), ou TalkBack (Android)."

DO NOT:

- Do NOT lower the WCAG target below AA. AA is the legal and ethical minimum.
- Do NOT suppress axe-core rules without a documented justification.
- Do NOT skip keyboard navigation testing. Mouse-only interfaces exclude users.
- Do NOT add aria-label to elements that already have visible text labels.
- Do NOT use aria-hidden="true" on interactive or informative elements.
- Do NOT generate tests for non-visual projects (CLIs, APIs, backend services).
- Do NOT treat a passing Lighthouse score as complete a11y compliance. Automated tools catch ~30% of issues.
- Do NOT add role="presentation" or role="none" to meaningful content.
- Do NOT ignore color contrast. It is the most common a11y violation.
- Do NOT edit application components to fix a violation without it going through its own fatia/PR.
