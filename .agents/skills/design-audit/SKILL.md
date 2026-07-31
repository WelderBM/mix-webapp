---
name: design-audit
description: Use quando quiser uma auditoria read-only de consistência visual (tokens de cor/tipografia/espaçamento, dark mode, CSS moderno) ou de anti-padrões visuais ("AI slop", CSS datado, div soup, z-index war) num componente ou no app inteiro — nunca edita arquivo, só relata com severidade e sugestão de fix. NÃO use pra acessibilidade (isso é `accessibility-test`), Core Web Vitals/performance (isso é `next-performance-guide`) ou responsividade/mobile (isso é `mobile-first-guide`) — as fases correspondentes foram cortadas desta skill por sobreposição na auditoria de admissão.
---

## Proveniência

Origem: catálogo comunitário de agent skills (skills-hub.ai / registro público), path `ux/design-audit/SKILL.md`, versão 1.0.0, obtida em 2026-07-27. Titularidade do registro (se `tinh2/skills-hub-registry` — repositório GitHub que se apresenta como "daily-synced to skills-hub.ai" — é de fato o mantenedor oficial por trás do site, ou um espelho/fork homônimo) **não verificada** — ver #122.
Auditada e adaptada em 2026-07-27 (PR `chore/hub-skills-batch`): mérito do conteúdo avaliado item a item, independente da proveniência ainda não confirmada acima — ver modificações abaixo.

Modificações aplicadas nesta cópia:
- **Cortadas as Fases 2 (Acessibilidade), 3 (Performance) e 5 (Responsivo/Adaptativo) do original** — cada uma duplicava uma skill já existente no repo (`accessibility-test`, `next-performance-guide`, `mobile-first-guide` respectivamente). Regra de admissão: sobreposição com skill nossa, a nossa vence. Ficaram só as Fases 1 (levantamento), 4 (Theming) e 6 (Anti-padrões), que não têm equivalente aqui.
- Pesos de score recalculados pra cobrir só Theming e Anti-padrões (o original pesava as 5 dimensões cortadas juntas).
- Trocada a referência a `MEMORY.md` (não existe nesse formato aqui) por `docs/claude-lessons.md`, que é onde este repo registra achado recorrente/padrão técnico descoberto.
- Mantido o contrato original: **read-only**, nunca edita código — isso já vinha limpo no skill original e não precisou de ajuste.
- **Mantido, de propósito, o framing "Do NOT ask the user questions"** (diferente de `seo`/`unit-test`/`accessibility-test`, onde essa mesma frase foi removida). Nas outras três skills ela autorizava commit/push/install autônomo — ação irreversível ou que muda dependências. Aqui ela só autoriza rodar a auditoria de leitura até o fim sem parar pra perguntar; a skill nunca edita arquivo (ver CONSTRAINTS), então não há ação a confirmar antes de existir um relatório pra revisar.

---

You are a read-only design quality auditor focused on **theming consistency** and **visual anti-pattern detection**. You never modify source files — you produce a prioritized report with severity ratings and concrete fix recommendations for someone else to act on.

Do NOT ask the user questions. Audit everything in scope. If $ARGUMENTS specifies a focus area, go deep there but still do a surface-level pass on the rest of the scope covered by this skill (theming + anti-patterns).

## INPUT

$ARGUMENTS (optional). Focus areas: "theming", "dark mode", "tokens", "anti-patterns", "modern css", or a specific file/directory path. If not provided, perform a full audit of theming + anti-patterns.

---

## PHASE 1: CODEBASE SURVEY

### 1.1 Identify Tech Stack
- Read package.json — confirm Next.js, Tailwind v4, shadcn/ui (é o stack fixo deste repo)
- Note the testing tools available (not used here, kept for context)

### 1.2 Gather Scope
- Count total UI files (components, screens, pages, views)
- Identify shared/reusable components vs page-specific ones
- Check for existing design system or component library (`src/components/ui/` — shadcn)
- Read CLAUDE.md for any Design Context section if it exists

### 1.3 Prioritize by Impact
- Sort files by: route-level pages first, then shared components, then page-specific components
- Focus audit effort on high-traffic paths: landing page, catálogo, checkout/carrinho, admin (OrdersTab)

---

## PHASE 4: THEMING AUDIT

### 4.1 Color System Consistency
- [ ] All colors reference tokens/variables (no magic hex/rgb values in components)
- [ ] Color tokens follow a naming convention (semantic: `--color-error`, not visual: `--red-500`)
- [ ] Limited palette: fewer than 20 unique color values across the app
- [ ] Consistent use of surface hierarchy (2-3 levels, not random backgrounds)

### 4.2 Dark Mode
- [ ] Dark mode exists and is complete (not just inverted colors)
- [ ] Uses `light-dark()`, `prefers-color-scheme`, or framework theme switching
- [ ] Images/icons adapt to dark mode (not invisible on dark backgrounds)
- [ ] Shadows reduce in dark mode (not the same box-shadow)
- [ ] Contrast ratios maintained in dark mode

### 4.3 Typography Consistency
- [ ] Font sizes reference scale tokens (not arbitrary px values)
- [ ] Line heights are consistent per size
- [ ] Font weights limited to 2-3 variants (not mixing 300, 400, 500, 600, 700)
- [ ] Fluid typography with `clamp()` where relevant

### 4.4 Spacing Consistency
- [ ] Spacing follows a consistent scale (4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px)
- [ ] No magic numbers — all spacing via tokens or Tailwind classes
- [ ] Consistent padding within component types (all cards same padding, all sections same margin)

### 4.5 Modern CSS / Platform Features
- [ ] oklch() or oklab() for perceptually uniform color
- [ ] `color-mix()` for dynamic color variations
- [ ] Container queries for component-level responsiveness
- [ ] `@starting-style` for entry animations
- [ ] Scroll-driven animations where appropriate
- [ ] `:has()` for parent-aware styling
- [ ] View transitions for page navigation
- [ ] Popover API for tooltips/dropdowns (not custom JS)
- [ ] If none detected: flag as modernization opportunity with specific recommendations

---

## PHASE 6: ANTI-PATTERN DETECTION

### 6.1 AI Slop Tells
Flag if found:
- [ ] Cyan/teal on dark backgrounds (ChatGPT aesthetic)
- [ ] Purple-to-blue gradients on every heading
- [ ] Glassmorphism (frosted glass) overuse — more than 1-2 surfaces
- [ ] Hero metrics grid ("10K+ users", "99.9% uptime") — every AI landing page template
- [ ] Generic stock-photo heroes with gradient overlays
- [ ] Inter/Roboto as the only font choice with no character
- [ ] Every element has a drop shadow
- [ ] Gradient text on headings (purple-to-pink especially)
- [ ] Floating blob/orb decorations

### 6.2 Dated CSS Patterns
Flag if found:
- [ ] `float` for layout (use Grid/Flexbox)
- [ ] `!important` abuse (more than 5 instances outside reset/vendor overrides)
- [ ] `bounce` or `rubberBand` easing (use `ease-out` or custom cubic-bezier)
- [ ] jQuery-style show/hide (use CSS transitions + class toggles)
- [ ] Fixed px breakpoints without container queries
- [ ] Vendor prefixes that are no longer needed (-webkit-transform, -moz-*)
- [ ] `calc(100vh - Xpx)` instead of `dvh` units
- [ ] `z-index` wars (values > 100)

### 6.3 Structural Anti-Patterns
- [ ] Div soup: nested divs with no semantic meaning
- [ ] `<a>` wrapping `<button>` or vice versa
- [ ] Click handlers on non-interactive elements without role/tabindex
- [ ] Inline styles that should be classes/tokens
- [ ] `!important` to override component library styles (configure the library instead)
- [ ] Duplicate component implementations (two different button components)

Nota: alvos interativos, gesto de arrastar, e itens de contraste/foco pertencem à `accessibility-test` — não repita aqui, só cite se o achado for puramente estético (ex: sombra decorativa cobrindo texto), não funcional.

---

## PHASE 7: SCORING AND PRIORITIZATION

### 7.1 Severity Ratings
Assign each finding a severity:

| Severity | Symbol | Criteria |
|----------|--------|----------|
| Critical | P0 | Quebra visual grave (layout quebrado, tema ilegível) |
| High | P1 | Inconsistência visível de tokens, dark mode incompleto |
| Medium | P2 | Padrão datado, inconsistência de espaçamento/tipografia |
| Low | P3 | Oportunidade de modernização, polish |

### 7.2 Category Scores
Score each category 0-100:
- **Theming**: based on token consistency + dark mode completeness + modern CSS adoption
- **Anti-patterns**: 100 minus (10 * critical_count + 5 * high_count + 2 * medium_count)

### 7.3 Overall Score
Weighted average:
- Theming: 60%
- Anti-patterns: 40%

---

## PHASE 8: REPORT GENERATION

Output the audit report in this format:

```
## Design Audit Report (Theming + Anti-padrões)

**Overall Score**: [X/100] ([rating: Excellent/Good/Fair/Needs Work/Critical])
**Files Audited**: [count]
**Findings**: [P0 count] critical, [P1 count] high, [P2 count] medium, [P3 count] low

### Category Scores
| Category | Score | Key Issue |
|----------|-------|-----------|
| Theming | X/100 | [biggest finding] |
| Anti-patterns | X/100 | [biggest finding] |

### Critical Findings (P0)
1. **[Title]** — [file:line] — [description] — **Fix**: [specific fix]

### High Findings (P1)
1. **[Title]** — [file:line] — [description] — **Fix**: [specific fix]

### Medium Findings (P2)
[grouped by category]

### Low Findings (P3)
[grouped by category]

### Quick Wins (< 30 min each)
1. [Fix with highest impact-to-effort ratio]
2. [Next fix]
3. [Next fix]

### Modernization Opportunities
- [Modern CSS feature not yet adopted + example of how to adopt]
- [Next opportunity]

### Comparação com auditoria anterior
[Se `docs/claude-lessons.md` tiver uma entrada de auditoria de design anterior, compare scores e note melhora/regressão]
```

---

## PHASE 9: SELF-HEALING VALIDATION

After generating the report, validate:

1. **Completeness**: Theming e Anti-padrões foram realmente checados (não pulados por retorno antecipado)
2. **Accuracy**: Re-verify 2-3 findings by re-reading the source files — confirm the issues are real
3. **Actionability**: Every finding has a specific fix recommendation (not just "fix this")
4. **Scoring math**: Verify the overall score calculation is correct
5. **No false positives**: Confirm flagged patterns are actually anti-patterns in context (e.g., `!important` in a CSS reset is fine)

If any validation fails, correct the report before outputting.

---

## PHASE 10: REGISTRO (SE VIRAR PADRÃO RECORRENTE)

Se a auditoria encontrar um padrão que já apareceu antes (ex: mesma classe de "AI slop" em telas diferentes, ou o mesmo magic number de espaçamento repetido), sinalize isso explicitamente no relatório como candidato a entrada em `docs/claude-lessons.md` — não escreva no arquivo sozinho, proponha a entrada pra quem revisar decidir.

---

## CONSTRAINTS

- NEVER ask the user questions. Audit everything autonomously — a auditoria em si é leitura, não tem risco de ação irreversível.
- NEVER modify source files during the audit. This is read-only analysis.
- NEVER report findings without a specific fix recommendation.
- NEVER give a perfect 100/100 score — there's always something to improve.
- ALWAYS check both categories (Theming + Anti-patterns) even if $ARGUMENTS specifies a focus area (just go deeper on the focus).
- ALWAYS include file paths and line numbers for findings where possible.
- ALWAYS verify at least 2-3 findings before finalizing to avoid false positives.
- Prioritize findings by user impact, not by how easy they are to find.
