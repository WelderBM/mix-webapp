# Chapter 7: Rendering

## Core Idea
Next.js rendering is not one choice — it's a per-component decision (App Router: Server/Client Components, Static/Dynamic/Streaming/PPR) or a per-page choice (Pages Router: SSR/SSG/ISR/CSR), and picking wrong on either axis is the single biggest performance and freshness trade-off in a Next.js app.

## Frameworks Introduced
- **Server Components vs. Client Components**: Server Components run exclusively on the server, sending HTML/JSON to the client with zero JS bundle cost; Client Components hydrate and run in the browser, carrying their dependencies into the client bundle.
  - When to use Server: data-heavy fetching, SEO-critical content, static content, direct DB/API access, anything not needing interactivity, state, or browser APIs.
  - When to use Client: forms, real-time features (WebSockets, polling), complex UI interaction (drag-and-drop), anything needing `useState`/`useEffect`/event handlers/`window`/`document`.
  - How: Server Components are the default in the App Router (no directive needed); add `'use client'` at the top of a file to opt a component (and everything it imports) into the client bundle.
- **Client Boundary**: the line — established by `'use client'` — where server rendering ends and client-side code begins for that file and its non-Server-Component children.
  - When to use: place it as deep in the tree as possible, wrapping only the interactive leaf, not its static ancestors.
  - How: pass Server Components as `children`/props into a Client Component rather than importing them inside a `'use client'` file — that's the only way to keep Server Components inside a Client Component's subtree.
- **Static Rendering**: pre-renders pages to HTML at build time; Next.js's default when a route doesn't opt into dynamic behavior (no `cookies()`, no `export const dynamic = "force-dynamic"`).
  - When to use: content identical for all users, determinable at build time, not needing frequent updates (marketing pages, docs, infrequently-changing listings).
- **Incremental Static Regeneration (ISR)**: static pages that regenerate in the background after a configured interval, serving the stale cached version while regeneration happens.
  - How (App Router): `export const revalidate = 60` (seconds). (Pages Router): return `revalidate: 60` from `getStaticProps`, or trigger on-demand via `res.revalidate('/path')` from an API route.
  - **Next 16 status**: this is compat-mode caching, not dead. It's live and correct as long as `cacheComponents` stays unset/`false` in `next.config.ts` — e.g. `src/app/natura/page.tsx` (`revalidate=60`) and `src/app/page.tsx` (`revalidate=0`) in this project run this way today. See "Cache Components" below for the model Next 16 recommends going forward.
- **Cache Components (Next 16 target model)**: caching becomes opt-in per function/component via the `use cache` directive instead of implicit via route-segment config; anything not marked `use cache` runs at request time by default. Invalidation is tag-based: call `cacheTag(tag)` inside the cached function, then `updateTag(tag)` or `revalidateTag(tag, 'max')` to invalidate (the second argument is now required — the book's-era `unstable_cache`/bare `revalidateTag(tag)` is deprecated in favor of `use cache`). PPR (below) is now integrated into this same model rather than a separate opt-in.
  - **When it applies here**: only once `cacheComponents: true` is set in `next.config.ts` — not the case in this project today. Don't propose migrating `natura/page.tsx`/`page.tsx` off `revalidate` unless that flag is part of the same change.
- **Dynamic Rendering**: generates content per-request on the server — needed whenever output depends on request-specific data (cookies, headers, auth session, real-time data).
  - How (App Router): reading `cookies()`/`headers()` or exporting `const dynamic = "force-dynamic"` opts a route out of static rendering automatically.
- **Streaming** (rendering-level, building on Ch 3): send the static shell immediately, stream in slower `<Suspense>`-wrapped sections as their data resolves — avoids a single slow fetch blocking the entire response's Time to First Byte.
- **Partial Pre-rendering (PPR)**: a hybrid that pre-renders a static shell at build time and streams dynamic "holes" (per-`<Suspense>` boundary) in at request time — static speed and dynamic freshness on the *same* page, decided per component rather than per route.
  - When to use: pages that are mostly static (header, nav, layout) but have a few genuinely dynamic regions (live pricing, inventory, personalized widgets) — the PPR shell/hole split lets you avoid making the *whole* page dynamic just because one part needs to be.

## Key Concepts
- **Request deduping via `cache()`**: wrapping a data-fetch function (e.g. `getUser`) in React's `cache()` lets multiple components call it in the same request without duplicate fetches.
- **Node.js Runtime**: default runtime, full Node API + npm ecosystem access, normal cold-boot time, suited to filesystem/complex-computation/full-package-compatibility needs.
- **Edge Runtime**: lightweight Web-API-based runtime, very low cold-boot time, lowest latency (executes geographically close to the user), but restricted I/O (`fetch` only, no `fs`) and only a subset of npm packages; does not support static generation at build time.
- **`proxy.ts` (formerly `middleware.ts`)**: Next 16 renamed the network-interception file/export — `middleware.ts` + `export function middleware()` is now `proxy.ts` + `export function proxy()`, same semantics, typically run on the Edge Runtime. This project has neither file today; N/A until one is introduced.

## Mental Models
- Ask "does this need to be different per-user or per-request?" first — if no, static + ISR is almost always the right default; if yes, the next question is "does *all* of this component need to be dynamic, or just one piece?" (→ PPR/Suspense-splitting vs. whole-route `force-dynamic`).
- Treat Client Boundary placement as a bundle-size decision, not a syntax detail: every file transitively imported by a `'use client'` file ships to the browser, so "poor boundary placement" (a heavy library imported inside a client file) silently bloats the client bundle even when the library itself never runs client-side logic.

## Anti-patterns
- **Large, high-level `'use client'` boundaries** (e.g. on a whole `Page` component wrapping `Header`/`Sidebar`/`MainContent`/`Footer`): pulls everything in that subtree into the client bundle, even parts that are purely static. Push the directive down to just the interactive leaf (e.g. `ClientSidebar`).
- **Importing a heavy library inside a `'use client'` file "just because" the file also has some client logic**: the entire library ships to the browser regardless of whether the client logic needs it.
- **Making a whole route `force-dynamic` because one component needs request-time data**: forces every other (otherwise-static) part of that page to also skip build-time generation — use Suspense-scoped dynamic fetching or PPR instead.
- **Data-fetching waterfalls** (`await fetch1(); await fetch2(); await fetch3();` sequentially when the calls don't depend on each other): serializes independent network round-trips. Use `Promise.all([fetch1(), fetch2(), fetch3()])` instead — this is the same rule as this project's own performance standard.
- **Choosing Edge Runtime for filesystem access, heavy npm dependencies, or build-time static generation**: Edge explicitly can't do any of these — Node.js Runtime is required.

## Reference Tables

**Node.js Runtime vs. Edge Runtime**

| Dimension | Node.js Runtime | Edge Runtime |
|---|---|---|
| Cold boot | Normal | Very low |
| I/O | Full (fs, DB drivers, etc.) | Network only (`fetch`) |
| npm package support | Virtually all | Subset (Web-API compatible only) |
| Scalability | Needs infra management (or serverless) | Highest, geographically distributed |
| Latency | Normal | Lowest (runs near the user) |
| Static generation at build time | Supported | Not supported |
| Choose when | Full Node API, complex computation, heavy filesystem/DB use | Simple logic, minimal latency is the priority |

**Pages Router rendering strategies**

| Strategy | API | Use when |
|---|---|---|
| SSG | `getStaticProps` (no `revalidate`) | Content static, known at build time |
| ISR | `getStaticProps` + `revalidate: N` | Static content that needs periodic freshness |
| SSR | `getServerSideProps` | Per-request data (cookies, personalization, real-time) |
| CSR | client-side `fetch` in `useEffect` | Data that must load client-side (dashboards behind auth-gated shells) |

## Code Examples
```tsx
// App Router — ISR: static shell regenerated every 60s in the background
export const revalidate = 60;
async function getBlogPosts() {
  const posts = await prisma.post.findMany({ where: { status: 'published' } });
  return posts;
}
export default async function BlogPage() {
  const posts = await getBlogPosts();
  return <article>{/* ... */}</article>;
}
```
- **What it demonstrates**: the entire ISR opt-in is one exported constant — no other code changes needed versus plain static rendering.

```tsx
// Client Boundary — optimized placement: only the interactive leaf is 'use client'
// app/page.tsx (Server Component, default)
import { HeavyServerComponent } from './HeavyServerComponent';
export function App() {
  return (
    <div>
      <HeavyServerComponent />
      <ClientInteractiveComponent />
    </div>
  );
}
// components/ClientInteractiveComponent.tsx
'use client';
export function ClientInteractiveComponent() {
  return <button onClick={() => alert('Clicked!')}>Click me</button>;
}
```
- **What it demonstrates**: `HeavyServerComponent` and anything it imports never reaches the client bundle, because the `'use client'` boundary starts one level lower, at the button only.

```tsx
// Pages Router — on-demand ISR revalidation from an API route
export default async function handler(req, res) {
  if (req.query.token !== process.env.REVALIDATION_TOKEN) {
    return res.status(401).json({ message: 'Invalid token' });
  }
  await res.revalidate('/path/to/page');
  return res.json({ revalidated: true });
}
```
- **What it demonstrates**: revalidating a specific static page on-demand (e.g. after a CMS webhook) instead of waiting for the next timed interval.

## Worked Example
Deciding the rendering strategy for an e-commerce product page with: a static header/nav, static product images/description, and live inventory + pricing that changes per request.

1. **Naive approach** — mark the whole route `force-dynamic` because inventory/pricing need request-time data. Cost: header, nav, images, and description all lose static-generation speed for no reason — every request now regenerates content that never changes.
2. **PPR approach** (the chapter's actual worked pattern) — keep the page itself static by default; wrap only the dynamic pieces:
   ```tsx
   export default function ProductPage({ params }) {
     return (
       <div className="product-layout">
         <ProductBreadcrumb category={params.category} />
         <ProductImageGallery id={params.id} />
         <Suspense fallback={<PricingSkeleton />}>
           <DynamicPricing id={params.id} />
         </Suspense>
         <Suspense fallback={<InventorySkeleton />}>
           <InventoryStatus id={params.id} />
         </Suspense>
         <ProductDescription id={params.id} />
         <Suspense fallback={<ReviewsSkeleton />}>
           <CustomerReviews id={params.id} />
         </Suspense>
       </div>
     );
   }
   ```
3. **Result**: the static shell (breadcrumb, gallery, description) is served instantly from the pre-rendered cache; `DynamicPricing`, `InventoryStatus`, and `CustomerReviews` stream in independently at request time. Same page, same freshness guarantees for the parts that need it, without paying the dynamic-rendering cost for the parts that don't.

This shell/hole split is the general answer whenever a page's "it needs live data" argument actually applies to only a fraction of its content.

## Key Takeaways
1. In the App Router, rendering strategy is a per-component decision (via Suspense + PPR), not a per-route one — resist collapsing a page to `force-dynamic` for one dynamic piece.
2. Client Boundary size is a direct bundle-size lever: push `'use client'` as far down the tree as possible, and pass Server Components in as children/props rather than importing them into client files.
3. ISR (`revalidate`) is the default answer for "mostly static, needs periodic freshness" in route-segment/compat mode (`cacheComponents` off — this project's current state) — in both routers, it's one line/prop, not a rewrite. Once `cacheComponents: true` is adopted, `use cache` + `cacheTag` becomes the answer instead.
4. Streaming + Suspense removes the "one slow fetch blocks the whole response" failure mode — apply it wherever independent data sources exist on the same page.
5. Edge Runtime trades capability (fs, full npm, build-time SSG) for latency and cold-boot speed — only choose it when the code's needs genuinely fit within Web APIs.
6. Parallel data fetching (`Promise.all`) is required wherever the App Router's own examples show independent fetches — sequential `await` chains are called out as an explicit anti-pattern (waterfall), not just a style preference.

## Connects To
- **Ch 3**: Streaming, Suspense & Hydration — this chapter's Streaming/PPR sections are a direct extension of Ch 3's Suspense-based selective hydration into the rendering-strategy layer.
- **Ch 2**: Code splitting — Client Boundary placement and dynamic imports both answer "what ships to the client," from different mechanisms.
- **Ch 8**: Web Vitals — rendering strategy choice is upstream of LCP (static/SSR beats CSR for first paint) and TTFB (static/ISR beats SSR-per-request).
- **project CLAUDE.md**: "`Promise.all` a `await` sequencial quando as chamadas não dependem uma da outra" is the same rule this chapter states as the Waterfall Prevention anti-pattern.
