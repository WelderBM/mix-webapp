# Patterns

## Dynamic Import for Conditional/Heavy UI
**When to use**: modals, tabs, dialogs, device/auth/locale-conditional UI, or any large third-party library not needed for first paint.
**How**: `dynamic(() => import('./Component'))`; add `{ ssr: false }` for client-only/browser-API-dependent code; add `{ loading: () => <Fallback/> }` to prevent layout shift.
**Trade-offs**: reduces initial bundle size at the cost of a load delay when the component is first needed — wrong for above-the-fold or small always-visible components (hurts CLS/LCP instead of helping).

## Preload-on-Intent for Heavy External Modules
**When to use**: a large library (e.g. a PDF generator) only needed after a specific user action.
**How**: start the dynamic `import()` on a low-cost early signal (e.g. `onFocus`) rather than on mount or on the final action; cache the loaded module in a `useRef` to avoid re-importing on re-render.
**Trade-offs**: adds a small amount of complexity (ref management) for a real head-start on load time versus importing only at the moment of use.

## Minimal Client Boundary Placement
**When to use**: any component tree mixing static/server content with a small interactive piece.
**How**: keep `'use client'` on the smallest, deepest component (e.g. just a button), and pass Server Components into Client Components as `children`/props rather than importing them inside a client file.
**Trade-offs**: requires more deliberate component splitting up front; the payoff is that heavy dependencies and static markup never enter the client bundle.

## Suspense-Scoped Streaming
**When to use**: a page with multiple independent, differently-slow data sources (sidebar, comments, recommendations).
**How**: wrap each independent section in its own `<Suspense fallback={...}>`; critical content stays outside any Suspense boundary so it renders immediately.
**Trade-offs**: needs a fallback/skeleton per boundary (extra UI work) but prevents one slow fetch from blocking the whole page's TTFB or hydration.

## Partial Pre-rendering (Shell + Holes)
**When to use**: a page that's mostly static (header, nav, layout, descriptions) but has a few genuinely per-request-dynamic regions (live pricing, inventory, personalized widgets).
**How**: leave the page static by default; wrap only the dynamic pieces in `<Suspense>` rather than marking the whole route `force-dynamic`.
**Trade-offs**: requires identifying exactly which sub-pieces are truly dynamic; in exchange, the static shell keeps build-time-generation speed instead of losing it to one dynamic requirement.

## Parallel Data Fetching (Waterfall Prevention)
**When to use**: any place with two or more `await` calls that don't depend on each other's results.
**How**: `const [a, b, c] = await Promise.all([fetch1(), fetch2(), fetch3()])` instead of sequential `await fetch1(); await fetch2(); await fetch3();`.
**Trade-offs**: none, when the calls are truly independent — this is a strict improvement; only keep sequential `await` when a later call genuinely depends on an earlier result.

## Request-Level Fetch Deduping via `cache()`
**When to use**: multiple components in the same request tree need the same data (e.g. current user).
**How**: wrap the fetch function in React's `cache()`; every call within that request reuses the same result instead of re-fetching.
**Trade-offs**: scoped to a single request — doesn't replace a persistent cache (e.g. Redis) for cross-request reuse.

## ISR with On-Demand Revalidation
**When to use**: content that's mostly static but needs to reflect occasional updates (CMS edits, price changes) faster than a fixed timer allows.
**How**: set `revalidate: N` for the baseline timer, and additionally expose a token-protected API route calling `res.revalidate('/path')` (Pages Router) to force immediate regeneration on a webhook/event.
**Trade-offs**: adds an authenticated endpoint to maintain, but avoids either over-fetching (SSR every request) or under-freshness (long fixed `revalidate` intervals).
**Next 16 note**: valid while `cacheComponents` is unset/false (this project's current state); the Next 16 target replacement is `use cache` + `cacheTag`/`updateTag`, with `revalidateTag(tag, 'max')` for on-demand invalidation instead of a custom API route.

## Script Loading by Criticality Tier
**When to use**: any page loading third-party scripts (analytics, payment SDKs, chat widgets, ad/social embeds).
**How**: classify each script as must-run-before-interactive (`beforeInteractive`), important-but-not-blocking (`afterInteractive`), or purely non-essential (`lazyOnload`); use `@next/third-parties` pre-built components for common integrations (GTM, GA, YouTube) before hand-rolling `<Script>`.
**Trade-offs**: requires an honest criticality assessment per script — over-classifying scripts as `beforeInteractive` recreates the render-blocking problem `next/script` exists to solve.

## Performance Budget Loop
**When to use**: any project past the prototype stage, to prevent silent performance drift.
**How**: Assess Needs/Goals → Baseline Testing (WebPageTest/Pingdom/GTmetrix) → Define Metrics → Allocate quantitative limits (KB, ms, request count) → Monitor and Adjust on a recurring cadence.
**Trade-offs**: ongoing process overhead, but the alternative (no budget) reliably leads to unbounded bloat with no objective trigger to intervene.

## New-Library Evaluation Gate
**When to use**: before adding any new npm dependency to a Next.js project.
**How**: (1) check if Next.js already covers the need natively; (2) look for a smaller/native alternative; (3) verify tree-shaking/modular-import support; (4) check Bundlephobia size/cost and NPM download/maintenance stats; (5) review community support.
**Trade-offs**: slows down dependency addition slightly; prevents the far larger cost of removing/replacing a bloated dependency later.
