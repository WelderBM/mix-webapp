# Chapter 9: Development Culture

## Core Idea
Performance degrades by default unless a team makes it a standing practice — via an explicit performance budget, a library-addition checklist, performance-aware code review, and dedicated (not "whenever there's time") tech-debt slots.

## Frameworks Introduced
- **Web performance budget**: a measurable ceiling on page weight/timing, settable per-file, per-file-type, per-page (all files), per-metric, per-custom-metric, or as a threshold-over-time trend.
  - When to use: as soon as a project has more than a handful of pages — budgets are what prevent slow drift, not a one-time audit.
  - How: Assess Needs/Goals → Baseline Testing (WebPageTest/Pingdom/GTmetrix) → Define Metrics → Allocate Budgets (quantitative limits, e.g. "images under 500KB/page") → Monitor and Adjust regularly as the site evolves.
- **New-library evaluation checklist**: a 5-step gate before adding any dependency.
  - How: (1) Assess functionality — can Next.js's built-ins already do this? (2) Explore native/smaller alternatives (e.g. native ES6+ over Lodash). (3) Check tree-shaking/modular-import support (e.g. `lodash-es` or single-function imports over the CommonJS `lodash` package). (4) Run a performance-impact check via Bundlephobia (size, download time cost) and check NPM for version/weekly-downloads/dependency count. (5) Review community support and maintenance history.
- **Performance-aware code review checklist**: six concrete smells to check on every PR, not just performance-labeled ones (detailed below).

## Key Concepts
- **Technical debt as a vicious circle**: the guide's framing — debt compounds until it becomes a full-team blocker, and by the time it's obviously worth fixing, it's maximally expensive and low-visibility to stakeholders (doesn't show up as a feature, doesn't show up as revenue).
- **Dedicated tech-debt time**: the guide's proposed break in that cycle — scheduled periodically (ideally right after a milestone: MVP release, feature completion), so cleanup happens without competing against a live deadline.

## Anti-patterns (code-review checklist, with the failure mode each catches)
- **Unnecessary libraries/dependencies**: adding a full library (e.g. Lodash) for one utility function — bloats the bundle for negligible functionality. Fix: native JS methods or single-function imports.
- **Manual memoization (superseded by React Compiler in this project)**: the book's original fix — "reserve `React.memo`/`useMemo`/`useCallback` for components with expensive renders" — assumed memoization is a manual, judgment-call optimization. With React Compiler stable and enabled (`reactCompiler: true` in this project's `next.config.ts`), that judgment call is automated: don't add manual memoization by default, and don't treat existing manual memoization as a positive code-review signal — it's compiler-redundant noise, not a bug, so leave it alone rather than adding more. The book's original concern still applies to the one case the compiler doesn't cover: identity handed to something outside React's render (e.g. a subscription callback stored on a non-React object) — that's where explicit memoization is still justified.
- **Lack of dynamic imports**: a new feature module bundled into the main chunk instead of split off — inflates the initial bundle for functionality not needed on first load. Fix: `next/dynamic` (Ch 2).
- **Functions defined inside components and passed as props**: recreates the function object on every render, causing unnecessary child re-renders — in a project *without* React Compiler. Fix (pre-Compiler): `useCallback` when the function is passed to children. In this project (`reactCompiler: true`), the Compiler stabilizes these function identities automatically — don't add `useCallback` for this reason; only pull a function out of the component when it doesn't need to close over props/state at all.
- **Large component trees**: deep nesting causes inefficient re-renders and slow initial rendering as state changes propagate. Fix: split into smaller, focused components.
- **Unoptimized images**: raw `<img>` tags with full-resolution images loaded eagerly — direct load-time and UX cost, especially on slow connections. Fix: `next/image` with lazy loading by default and `priority` reserved for the true LCP image (Ch 4).

## Worked Example
The guide's own e-commerce case study (sustainable outdoor gear site), walked through its 5-step budget process end to end:
1. **Assess Needs/Goals**: site must load quickly and feel smooth on product pages.
2. **Baseline Testing** (WebPageTest): measured page load time, total page size, HTTP request count.
3. **Set Targets**: load time <3s, total page size <1.5MB, ≤50 HTTP requests/page.
4. **Implement Changes**: `next/image` + modern formats + `priority` on critical images; code splitting + progressive hydration for JS; reduced component count in the DOM; only essential font files; API calls limited to necessary data with fetch-on-scroll instead of eager fetch-all.
5. **Monitor and Adjust**: ongoing — a new feature that regresses the budget gets optimized or reconsidered, not shipped as-is.

**Result**: load time 2.8s (under the 3s target), total size 1.2MB (under 1.5MB), 45 requests (under 50) — a concrete demonstration that the budget process, applied with tools already covered in Ch 2/4/6/7, produces a page that beats its own targets.

## Key Takeaways
1. A performance budget needs concrete numeric targets (KB, ms, request count) and a monitor-and-adjust loop — "keep it fast" without numbers isn't a budget.
2. Evaluate every new dependency through the 5-step checklist before installing, not after it's already in the bundle.
3. Code review should carry a standing performance checklist (the six smells above) even on PRs not explicitly about performance — that's how most regressions actually enter a codebase.
4. Tech debt is best handled on a recurring schedule tied to milestones, not squeezed in "when there's time" — the guide frames this as the only way to break the compounding-cost cycle.

## Connects To
- **Ch 2, Ch 4, Ch 6, Ch 7**: the budget worked example is literally an application of code splitting, `next/image`, font optimization, and parallel/scoped data fetching from those chapters.
- **project CLAUDE.md**: this project's own standing rules — "Performance é regra permanente, não pedido pontual," `Promise.all` over sequential `await`, `sizes` requirements — are the same practice this chapter argues for at the team-process level.
- **project next.config.ts**: `reactCompiler: true` is why this chapter's memoization anti-pattern is now "don't add it," not "add it carefully" — see SKILL.md's Next.js 16 Update Notes.
