# Chapter 3: Streaming, Suspense & Hydration

## Core Idea
Hydration is the process that turns server-rendered HTML into an interactive React app on the client; wrapping components in `<Suspense>` lets Next.js hydrate the critical parts first instead of blocking on the whole page, trading all-or-nothing interactivity for progressive interactivity.

## Frameworks Introduced
- **Selective Hydration**: prioritizes hydration by Suspense boundary, based on the order the user actually interacts with the page.
  - When to use: any page with independently-loadable regions (sidebar, comments, recommendations) where one slow data source shouldn't delay the rest becoming interactive.
  - How: wrap each independent region in its own `<Suspense fallback={...}>`; React hydrates the boundary nearest the user's interaction first, and the rest proceeds asynchronously.
- **Progressive Hydration**: a broader, developer-set priority order for which UI hydrates first, based on known application priorities rather than live user interaction.

## Key Concepts
- **Streaming**: sending the page in chunks as they become ready, instead of waiting for the full render.
- **Hydration**: reusing server-rendered HTML on the client, attaching event handlers and running lifecycle effects (e.g. `useEffect`) to make it interactive.
- **Hydration mismatch**: thrown when server-rendered and client-rendered output differ; forces a fallback to full client rendering, causing a content flash and slower time-to-interactive. In production the error is minified, so it's easy to miss despite the impact.
- **Suspense boundary**: the unit Selective Hydration hydrates independently; nesting boundaries lets inner content stream in after outer content is already interactive.

## Anti-patterns
- **`typeof window` conditional rendering in JSX**: a classic hydration-mismatch source — server has no `window`, client does, so the two renders diverge.
- **Locale-dependent date formatting without pinning locale**: if server and client resolve different date-formatting rules, the rendered text differs → mismatch.
- **Non-deterministic values in render** (e.g. `Math.random()`): guarantees a different value each call, so server and client output can never match.

## Code Examples
```tsx
import { Suspense } from 'react';

export const PageContent = () => (
  <main>
    <h1>Welcome to the Blog</h1>
    <Suspense fallback={<Spinner />}>
      <Sidebar />
    </Suspense>
    <article>
      <h2>Main Article</h2>
      <p>Content of the main article...</p>
    </article>
    <Suspense fallback={<Spinner />}>
      <Comments />
    </Suspense>
  </main>
);
```
- **What it demonstrates**: independent Suspense boundaries let `Sidebar` and `Comments` stream and hydrate on their own timelines while the main article renders immediately — neither blocks the other.

## Worked Example
Contrast the two hydration models directly:
- **Pages Router (pre-App-Router)**: all JavaScript must load and execute before *any* part of the page is interactive — one slow bundle blocks everything, with no built-in way to prioritize.
- **App Router + Suspense**: each `<Suspense>` boundary is its own hydration unit. A `Sidebar` behind a slow API call no longer delays the main `<article>` from being interactive; React hydrates whichever boundary the user actually touches first.

The practical upshot: when migrating a Pages Router page that has one slow data dependency blocking the whole page's interactivity, wrapping just that slow piece in `<Suspense>` (App Router) is the direct fix — no other code changes needed to get progressive interactivity.

## Key Takeaways
1. Hydration cost is real: it re-executes rendering work already done on the server, and large apps can accumulate enough JavaScript to delay interactivity noticeably.
2. `<Suspense>` boundaries are the unit of both streaming and selective hydration in the App Router — one mechanism, two payoffs.
3. Hydration mismatches are silent-looking (minified error, full page still visible) but expensive (forces full client re-render) — audit `typeof window`, locale-dependent formatting, and random values first when debugging one.
4. The Pages Router has no equivalent to selective hydration — it's an App Router-specific win.

## Connects To
- **Ch 7**: Rendering — Suspense boundaries reappear as the mechanism for both Streaming and Partial Pre-rendering (PPR); this chapter's hydration model is the foundation those build on.
- **Ch 8**: Web Vitals — selective hydration is a direct lever for INP, since it avoids blocking all interactivity on the slowest data source.
