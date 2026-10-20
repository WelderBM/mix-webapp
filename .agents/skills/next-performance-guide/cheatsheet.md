# Cheatsheet

## Decision rules

- **When a component needs interactivity, state, or a browser API** → make it a Client Component (`'use client'`), and push that boundary as deep in the tree as possible — because everything transitively imported past the boundary ships to the client bundle.
- **When a page's output is identical for all users and knowable at build time** → default (Static Rendering); do NOT add `force-dynamic` or read `cookies()`/`headers()` unless truly required.
- **When only part of a mostly-static page needs per-request data** → wrap just that part in `<Suspense>` (PPR), instead of making the whole route dynamic.
- **When static content needs periodic freshness** → add `revalidate: N` (ISR) before reaching for full SSR — because ISR keeps the speed of static serving and adds a freshness ceiling, while SSR pays a full render cost on every request. (Compat-mode answer, valid while `cacheComponents` is unset/false — this project's current state. If `cacheComponents: true`, use `use cache` + `cacheTag` instead.)
- **When two or more `await` calls don't depend on each other** → `Promise.all([...])`, never sequential `await` — because sequential awaits serialize network round-trips that could run concurrently (a "waterfall").
- **When adding a script tag** → classify it must-block / important-not-blocking / non-essential, then map to `beforeInteractive` / `afterInteractive` / `lazyOnload` respectively — because misclassifying a script as more critical than it is recreates the render-blocking problem `next/script` exists to remove.
- **When using `fill` on `next/image`** → always pass a `sizes` matching the real rendered width at each breakpoint — because omitting it makes the browser assume full-viewport width, and file size scales with width², so the real cost is up to 9× the necessary download, not a proportional 3×.
- **When considering a new dependency** → run the 5-step gate (native alternative? tree-shakeable? Bundlephobia cost? maintenance health?) before installing — because removing a bloated dependency later costs more than evaluating it up front.
- **When choosing Edge vs. Node.js runtime** → Edge only if the code needs nothing beyond `fetch`-based I/O and doesn't need build-time static generation; Node.js Runtime whenever filesystem, heavy npm packages, or complex computation are involved.
- **When you're about to add `useMemo`/`useCallback`/`React.memo`** → check `reactCompiler` in `next.config.ts` first; if it's `true` (this project's setting), skip manual memoization by default — the compiler already does it. Only memoize explicitly when an identity needs to escape React's render (e.g. a value handed to a non-React subscriber).

## Decision tree: which rendering strategy?

*(Assumes route-segment/compat caching — `cacheComponents` unset/false in `next.config.ts`, this project's current state. If `cacheComponents: true`, replace "ISR / revalidate" below with `use cache` + `cacheTag`.)*

- Does the output depend on request-specific data (cookies, auth, real-time)?
  - **No** → is it the same for all users and knowable at build time?
    - **Yes** → Static Rendering (+ ISR if it needs periodic freshness)
    - **No, but only small pieces are dynamic** → keep the page static, wrap the dynamic pieces in `<Suspense>` (PPR)
  - **Yes, the whole page genuinely needs it** → Dynamic Rendering / SSR (App Router: `force-dynamic` or `cookies()`/`headers()`; Pages Router: `getServerSideProps`)
  - **Yes, but it's just a small part of the page** → keep the rest static, isolate the dynamic part behind `<Suspense>` (PPR) instead of making the whole route dynamic

## Trade-off matrix: measurement tools

| Tool | Speed of feedback | Consistency | Real-user accuracy | Best for |
|---|---|---|---|---|
| Lighthouse (in-browser) | Fastest | Low (env-dependent) | None (lab only) | Quick local check |
| Lighthouse (CLI/CI) | Fast | High | None (lab only) | CI/CD gating |
| WebPageTest | Medium | High (multi-region) | None (lab only) | Cross-region/trend analysis |
| PageSpeed Insights | Medium | High | Some (CrUX, monthly refresh) | Balanced lab+field, SEO guidance |
| Vercel Speed Insights / RUM | Continuous | N/A (it *is* real traffic) | Full | Production monitoring |

## Thresholds & defaults

- FCP target: **≤ 1.8s**
- `next/image` default `quality`: **75**
- Lighthouse metric weights: **TBT 30% · LCP 25% · CLS 25% · FCP 10% · SI 10%** — optimize the largest *weighted* gap, not the largest raw gap.
- `next/image` `deviceSizes` default: `[640, 750, 828, 1080, 1200, 1920, 2048, 3840]`
- `next/image` `imageSizes` default: `[16, 32, 48, 64, 96, 128, 256, 384]`
- Long task threshold counted toward TBT: **> 50ms**
- Example performance budget targets used in the book's case study: page load **< 3s**, total page size **< 1.5MB**, **≤ 50** HTTP requests/page

## Tells & smells

- A component tree with `'use client'` at a high-level `Page`/`Layout` component → likely an oversized Client Boundary; check whether the directive can move down to just the interactive leaf.
- A route marked `force-dynamic` where only one small widget actually needs live data → candidate for PPR/Suspense-splitting instead.
- Sequential `await` calls with no data dependency between them → waterfall; convert to `Promise.all`.
- `fill` used on `next/image` without a `sizes` prop → guaranteed oversized image download (browser assumes full viewport width).
- A single utility function imported from a full library (e.g. `import _ from 'lodash'`) → check for a native JS equivalent or a modular/tree-shakeable import first.
- Analytics/chat/social scripts loaded with no `strategy` or with `beforeInteractive` by default → likely over-prioritized; re-classify by actual criticality.
- CLS complaints with no obvious image/ad culprit → check font loading (FOUT) and styled-components hydration timing before anything else.
- "We'll deal with tech debt when things calm down" as a stated team plan → the guide's explicit anti-pattern; schedule it after the next milestone instead of waiting for a lull that won't come.
- New `useMemo`/`useCallback`/`React.memo` added in a PR on a project with `reactCompiler: true` → likely redundant; ask whether it covers a case the compiler provably can't reach, not a default habit.
