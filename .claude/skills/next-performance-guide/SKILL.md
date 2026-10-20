---
name: next-performance-guide
description: "Knowledge base from \"The Expert Guide to Next.js Performance Optimization\" by Blazity (Wojciech Wrotek, Jakub Jabloski, Adam Dziubinski, Karol Chudzik, Igor Klepacki). Use when applying rendering-strategy choices (SSG/SSR/ISR/PPR/streaming), next/image sizing and priority, next/script loading strategies, next/font optimization, code splitting, Core Web Vitals (LCP/INP/CLS) triage, or performance-budget/code-review practices for Next.js apps; studying the book; or referencing its concepts."
---

<!-- argument-hint: [topic, framework name, or chapter number] -->

# The Expert Guide to Next.js Performance Optimization
**Author**: Blazity team (Wojciech Wrotek, Jakub Jabloski, Adam Dziubinski, Karol Chudzik, Igor Klepacki) | **Pages**: ~108 | **Chapters**: 10 | **Generated**: 2026-07-25

## How to Use This Skill

- **Without arguments** — load core frameworks for reference
- **With a topic** — ask about `rendering`, `images`, `code splitting`, `web vitals`, or another indexed topic; I find and read the relevant chapter
- **With chapter** — ask for `ch07`; I load that specific chapter
- **Browse** — ask "what chapters do you have?" to see the full index

When you ask about a topic not covered in Core Frameworks below, I will read
the relevant chapter file before answering.

---

## Core Frameworks & Mental Models

**Rendering strategy is per-component in the App Router, not per-page.** The single biggest lever in this book: Server Components (server-only, zero client JS) vs. Client Components (`'use client'`, hydrated, interactive) is a per-file decision; Static/Dynamic/Streaming/PPR is a per-region-of-a-page decision via `<Suspense>`. Never mark a whole route `force-dynamic` because one small widget needs live data — isolate that widget behind `<Suspense>` (Partial Pre-rendering) and keep everything else static.

**Client Boundary placement is a bundle-size decision.** Everything transitively imported inside a `'use client'` file ships to the browser — including heavy libraries that never touch client logic. Push `'use client'` as deep as possible (the actual interactive leaf, e.g. one button), and pass Server Components into Client Components as `children`/props rather than importing them into a client file.

**`next/dynamic` for conditional/heavy UI, not for everything.** Reserve dynamic imports for large third-party libraries, rarely-visible UI (modals/dialogs), and device/auth/locale-conditional branches. Applying it to above-the-fold or small always-visible components actively hurts CLS/LCP instead of helping.

**`fill` + `sizes` on `next/image` is not optional.** Omitting `sizes` on a `fill` image makes the browser assume full-viewport width; since raster file size scales with width², a 3× width overestimate becomes a **9× larger download**. `priority` belongs on the single LCP-contributing image only — not a general "load fast" flag.

**`next/script` strategy = criticality tier.** Classify every third-party script as must-block (`beforeInteractive`: payment SDKs, security/CSP), important-but-non-blocking (`afterInteractive`: analytics, chat), or non-essential (`lazyOnload`: social widgets, ads) — before writing the `<Script>` tag, not after.

**`next/font` replaces manual font tuning almost entirely.** Self-hosts at build time (no runtime request to Google), applies `size-adjust` automatically to reduce FOUT-driven layout shift. Manual `font-display`/preload tuning is "rarely worth it" once `next/font` is in place.

**Parallel data fetching is a strict improvement, not a style choice.** Any two `await` calls that don't depend on each other should be `Promise.all([...])`. Sequential awaits on independent calls are an explicit anti-pattern ("waterfall") called out repeatedly across chapters — the same rule this project's own CLAUDE.md states independently.

**Core Web Vitals are weighted, not equal.** Lighthouse: TBT 30%, LCP 25%, CLS 25%, FCP 10%, SI 10%. Chase the largest *weighted* gap, not the largest raw one. INP replaced FID (session-wide interaction coverage); TTI is deprecated (removed Lighthouse 10, too variance-prone).

**Performance is a process, not a one-time audit.** A performance budget needs concrete numeric targets (KB/ms/request-count) and a monitor-and-adjust loop. New dependencies go through a 5-step gate (native alternative? tree-shakeable? Bundlephobia cost? maintenance health?) before installing. Code review carries a standing performance checklist even on non-performance PRs — that's how most regressions actually enter a codebase. Tech debt gets dedicated, scheduled time (post-milestone), not "whenever there's time."

**Measurement tool ≠ one-size-fits-all.** Lighthouse (CLI/CI, not ad-hoc in-browser) for fast local/CI feedback; WebPageTest for cross-region consistency and historical trends; PageSpeed Insights for combined lab+field (CrUX) data; Vercel Speed Insights/RUM for what real users on real devices/networks actually experience — lab tools alone can't substitute for field data in production.

---

## Next.js 16 Update Notes (book predates Next 16 — read before applying Ch 2/7/9)

This guide was generated from a book written against Next.js 15 (Webpack-era). This project
(`next` ^16.2.1, `react`/`react-dom` 19.2.1) has since moved to Next.js 16. Four areas below are
superseded or reframed — everything else in the book (Core Web Vitals, `next/image`, `next/font`,
the Server/Client Component split, code splitting mechanics, measurement tools) still applies as
written.

- **Bundler (Ch 2)**: Turbopack is the stable, default bundler in Next 16, not Webpack. Nothing
  in this book's code-splitting guidance actually depends on a specific bundler — `next/dynamic`
  and automatic route splitting are bundler-agnostic — so the techniques don't change; drop any
  Webpack-specific build tuning from an audit checklist, it's not the relevant lever anymore.
- **Caching / ISR (Ch 7)**: this project has `cacheComponents` **unset** in `next.config.ts` —
  route-segment `export const revalidate` / `dynamic` (the book's ISR model) is live and correct
  today. `src/app/natura/page.tsx` (`force-dynamic` + `revalidate=60`) and `src/app/page.tsx`
  (`force-dynamic` + `revalidate=0`) are real examples running in this compat mode. Next 16's
  target model is Cache Components (`use cache` + `cacheTag`/`updateTag`, and
  `revalidateTag(tag, 'max')` — the second argument is now required). Treat the book's ISR
  chapter as correct for this project's current config, and Cache Components as the direction
  for new work or if `cacheComponents: true` is ever turned on (at which point uncached routes
  become dynamic by default and `use cache` stops being optional).
- **Memoization (Ch 9)**: this project has `reactCompiler: true`. Ch 9's "overuse of memoization"
  anti-pattern is superseded, not just extended — don't recommend adding manual `useMemo`/
  `useCallback`/`React.memo` by default, and don't treat existing manual memoization as a
  positive review signal; the compiler automates this class of optimization. Manual memoization
  is still justified only where the compiler provably doesn't reach — e.g. an identity handed to
  something outside React's render (a non-React subscriber, an imperative ref target).
- **`middleware.ts` → `proxy.ts`**: Next 16 renamed the network-interception file/export —
  `export function middleware()` is now `export function proxy()` in `proxy.ts`, same semantics.
  This project has neither file today; N/A for now, but if one is added later it belongs in
  `proxy.ts`.
- **Node.js version**: Next 16 requires Node 20.9+ (Node 18 support dropped) — not a performance
  concern by itself, but worth knowing if a build fails on an older runtime. This project has no
  `engines` field pinning it.

## Chapter Index

| # | Title | Key Frameworks |
|---|-------|----------------|
| [ch01](chapters/ch01-introduction.md) | Introduction to Next.js Performance Optimization | Guide structure (Overview→Implementation→Keypoints) |
| [ch02](chapters/ch02-code-splitting.md) | Code splitting | `next/dynamic`, automatic route splitting |
| [ch03](chapters/ch03-streaming-suspense-hydration.md) | Streaming, Suspense & Hydration | Selective Hydration, Progressive Hydration, hydration mismatch |
| [ch04](chapters/ch04-next-image.md) | Next/Image Component | `priority`, `sizes`+`fill`, `placeholder`, `quality`, `unoptimized` |
| [ch05](chapters/ch05-third-party-scripts.md) | Third-Party Scripts | `next/script` strategies (`beforeInteractive`/`afterInteractive`/`lazyOnload`), `@next/third-parties` |
| [ch06](chapters/ch06-font-optimization.md) | Font optimization | `next/font`, Variable Fonts, FOIT/FOUT |
| [ch07](chapters/ch07-rendering.md) | Rendering | Server/Client Components, Client Boundary, Static/Dynamic/ISR, Streaming, PPR, Node.js/Edge Runtimes |
| [ch08](chapters/ch08-web-vitals.md) | Web Vitals | LCP/INP/CLS, Lighthouse weighting, FCP/TBT/TTFB |
| [ch09](chapters/ch09-development-culture.md) | Development culture | Performance budget, library-evaluation checklist, code-review checklist |
| [ch10](chapters/ch10-measuring-performance.md) | Measuring performance | Lighthouse, WebPageTest, PageSpeed Insights, Vercel Speed Insights, RUM |

## Topic Index

- **Bundle size** → ch02, ch07, ch09
- **Client Boundary** → ch07
- **Client Components** → ch07
- **Code review checklist** → ch09
- **Code splitting** → ch02
- **Core Web Vitals** → ch08
- **CSR (Client-Side Rendering)** → ch07
- **Dynamic imports (`next/dynamic`)** → ch02, ch07
- **Edge Runtime** → ch07
- **Fonts (`next/font`, FOIT/FOUT, Variable Fonts)** → ch06
- **Hydration** → ch03, ch07
- **Images (`next/image`, `sizes`, `priority`)** → ch04
- **ISR (Incremental Static Regeneration)** → ch07
- **Lighthouse** → ch08, ch10
- **Node.js Runtime** → ch07
- **Partial Pre-rendering (PPR)** → ch07
- **Performance budget** → ch09
- **Rendering strategies (SSR/SSG/ISR/CSR)** → ch07
- **RUM / Vercel Speed Insights** → ch10
- **Server Components** → ch07
- **Streaming** → ch03, ch07
- **Suspense** → ch03, ch07
- **Third-party scripts (`next/script`)** → ch05
- **Tech debt management** → ch09
- **Web Vitals measurement tools** → ch10

## Supporting Files

- [glossary.md](glossary.md) — all key terms with definitions
- [patterns.md](patterns.md) — all techniques and design patterns
- [cheatsheet.md](cheatsheet.md) — quick reference tables and decision guides

---

## Scope & Limits

This skill covers the book content only. For hands-on implementation in your codebase,
combine with project-specific tools. For topics beyond this book, check related skills
or ask the agent directly.
