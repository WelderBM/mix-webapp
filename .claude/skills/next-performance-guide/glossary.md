# Glossary

**Cache Components** — Next 16's opt-in caching model: functions/components marked `use cache` are cached, everything else runs at request time by default; supersedes implicit route-segment ISR and folds PPR into the same system. Only active once `cacheComponents: true` is set in `next.config.ts` (Ch 7).

**Client Boundary** — the point (marked by `'use client'`) where server rendering ends and client-side code begins; everything transitively imported past it ships to the browser (Ch 7).

**Client Component** — a React component that hydrates and runs in the browser, with full access to state, effects, and browser APIs (Ch 7).

**CLS (Cumulative Layout Shift)** — Core Web Vital tracking unexpected visual movement during load/interaction (Ch 8).

**Code splitting** — breaking an app's JS into separately-loadable chunks instead of one bundle (Ch 2).

**Core Web Vitals** — Google's standardized UX metric subset (LCP, INP, CLS) that feeds into search ranking (Ch 8).

**CrUX (Chrome UX Report)** — Google's real-user field dataset, aggregated from actual Chrome users, refreshed monthly (Ch 10).

**CSR (Client-Side Rendering)** — rendering content entirely in the browser after JS loads, typically via client-side `fetch` in `useEffect` (Ch 7).

**Dynamic Rendering** — generating page content per-request on the server, for request-specific/personalized/real-time data (Ch 7).

**Edge Runtime** — lightweight, Web-API-based Next.js execution environment: low cold-boot time, lowest latency, but restricted I/O (`fetch` only) and no build-time static generation (Ch 7).

**FCP (First Contentful Paint)** — time to the first rendered content of any kind; target ≤1.8s (Ch 8).

**FID (First Input Delay)** — deprecated metric, replaced by INP for capturing session-wide interaction responsiveness rather than just the first input (Ch 8).

**FOIT (Flash of Invisible Text)** — text stays invisible while a web font downloads asynchronously (Ch 6).

**FOUT (Flash of Unstyled Text)** — fallback font renders first, then swaps to the web font, causing a visible layout shift (Ch 6).

**Hydration** — the process of attaching event handlers/state to server-rendered HTML on the client, making it interactive (Ch 3).

**Hydration mismatch** — thrown when server-rendered and client-rendered output differ, forcing a full client-render fallback (Ch 3).

**INP (Interaction to Next Paint)** — Core Web Vital measuring delay between user interaction and the browser's next paint (Ch 8).

**ISR (Incremental Static Regeneration)** — static pages that regenerate in the background after a configured interval (`revalidate`), serving the stale cache meanwhile (Ch 7).

**Lab data** — synthetic, controlled-environment performance measurement (Lighthouse, WebPageTest), as opposed to field data (Ch 10).

**LCP (Largest Contentful Paint)** — Core Web Vital measuring time until the largest visible content element finishes rendering (Ch 8).

**Lighthouse** — Google's local/CI performance+accessibility+SEO audit tool; in-browser runs vary with local conditions, CLI/CI runs are more consistent (Ch 10).

**Next/dynamic** — Next.js's dynamic-import wrapper for components, deferring their load until actually rendered (Ch 2).

**Next/font** — Next.js's build-time font self-hosting and optimization system, eliminating runtime font requests and reducing layout shift (Ch 6).

**Next/image** — Next.js's built-in image component: responsive sizing, lazy loading, format conversion, layout-shift prevention (Ch 4).

**Next/script** — Next.js's script-loading component with named strategies (`beforeInteractive`/`afterInteractive`/`lazyOnload`) replacing manual `<script>` attribute management (Ch 5).

**Node.js Runtime** — the default, full-capability Next.js execution environment: complete Node API/npm access, normal cold-boot time (Ch 7).

**Partial Pre-rendering (PPR)** — hybrid rendering that pre-renders a static shell and streams dynamic per-component "holes" in at request time (Ch 7).

**Performance budget** — a measurable ceiling (file size, load time, request count) that keeps a site from growing slower over time (Ch 9).

**PSI (PageSpeed Insights)** — Google tool combining Lighthouse lab data with CrUX real-user field data (Ch 10).

**Progressive Hydration** — developer-prioritized order for which UI hydrates first, based on known application priorities (Ch 3).

**proxy.ts** — Next 16's renamed `middleware.ts`; exports a `proxy()` function with the same network-interception semantics as the old `middleware()` (Ch 7).

**React Compiler** — stable React/Next.js optimization that auto-memoizes components and stabilizes function/value identities, making most manual `useMemo`/`useCallback`/`React.memo` redundant when enabled (Ch 9).

**RUM (Real User Monitoring)** — field performance data collected from actual user sessions (Vercel Speed Insights, New Relic, Datadog, etc.) (Ch 10).

**Selective Hydration** — hydration prioritized by Suspense boundary based on actual user interaction order (Ch 3).

**Server Component** — a React component that runs exclusively on the server, sent to the client as HTML/JSON with zero client JS cost (Ch 7).

**SI (Speed Index)** — Lighthouse metric measuring how quickly page content is visually populated (Ch 8).

**SSG (Static Site Generation)** — pre-rendering pages to HTML at build time (Pages Router: `getStaticProps`; App Router: default Static Rendering) (Ch 7).

**SSR (Server-Side Rendering)** — generating HTML per-request on the server (Pages Router: `getServerSideProps`; App Router: Dynamic Rendering) (Ch 7).

**Static Rendering** — Next.js App Router's default: pre-renders at build time unless a route opts into dynamic behavior (Ch 7).

**Streaming** — sending a page/response in progressively-ready chunks instead of waiting for the full render (Ch 3, Ch 7).

**Suspense boundary** — the `<Suspense>`-wrapped unit that streams and hydrates independently of the rest of the page (Ch 3).

**TBT (Total Blocking Time)** — total time the main thread is blocked by long tasks between FCP and TTI (Ch 8).

**TTFB (Time to First Byte)** — time from request to first response byte, covering redirects, DNS, TLS, and initial server processing (Ch 8).

**TTI (Time to Interactive)** — deprecated Lighthouse metric, removed in Lighthouse 10 for excessive variance (Ch 8).

**Turbopack** — Next.js's Rust-based bundler; stable and the default in Next 16, replacing Webpack (Ch 2).

**`use cache`** — the directive that opts a function/component into Cache Components' caching, paired with `cacheTag`/`updateTag` (or `revalidateTag(tag, 'max')`) for invalidation (Ch 7).

**Variable Fonts** — a single font file encoding a continuous range of weights/widths/styles, replacing multiple separate font files (Ch 6).

**WebPageTest** — multi-region, scriptable performance testing tool with historical trend data and visual filmstrip comparisons (Ch 10).
