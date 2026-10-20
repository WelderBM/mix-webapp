# Chapter 2: Code Splitting

## Core Idea
Code splitting breaks a Next.js app into on-demand chunks instead of one upfront bundle; `next/dynamic` is the manual lever for it, layered on top of Next.js's automatic per-route splitting.

## Frameworks Introduced
- **`next/dynamic`**: dynamic-import wrapper for components. Loads a component only when it's actually rendered, keeping it out of the initial bundle.
  - When to use: heavy third-party libraries (charts, maps, editors), rarely-visible UI (modals, dialogs, tooltips), device/auth/locale-conditional UI, or anything not needed for the very first paint.
  - How: `dynamic(() => import('./Component'))`; add `{ ssr: false }` to skip server rendering entirely (client-only libs, browser-API-dependent code); add `{ loading: () => <Fallback/> }` to avoid a layout shift while the chunk loads.

## Key Concepts
- **Static import**: bundled at build time — always in the initial JS payload.
- **Dynamic import**: `import()` — code-split at build time, fetched at runtime only when reached.
- **Automatic code splitting**: Next.js splits by route/page by default, independent of manual `dynamic()` use; App Router also auto-splits Server Components. This is bundler-agnostic — as of Next 16, Turbopack is the stable, default bundler (replacing Webpack), but nothing about `next/dynamic` or route-level splitting changes with the bundler swap; drop any Webpack-specific build tuning from an audit, it's not the relevant lever anymore.
- **Client Boundary interaction**: dynamically importing a Server Component doesn't lazy-load the server work itself — it only defers loading of any Client Components nested inside it.

## Mental Models
- Think of `next/dynamic` as "pay for it when you use it" — reserve it for code that is conditionally rendered or large enough to matter; using it on small, always-visible components adds overhead for no bundle-size win.
- Use `ssr: false` as the answer to "this needs `window`/`document` or breaks during SSR," not as a default.

## Anti-patterns
- **Dynamic-importing above-the-fold or small independent components**: hurts CLS/LCP instead of helping — the loading gap itself becomes the regression.
- **Setting `ssr: true` on a conditionally-rendered component expecting it to pre-render**: Next.js still won't SSR it if the render condition depends on client-only state; it will only load on the client when the condition is met.

## Reference Tables

| Segmentation strategy | Example |
|---|---|
| Pages | Separate bundle per route (Next.js default) |
| Components | Individual/grouped components as chunks |
| Libraries | Distinct chunk per third-party library |
| Features | Feature-flagged code loaded conditionally |
| User interactions | Loaded on scroll-into-view or similar triggers |

## Code Examples
```tsx
// Modal loaded only when opened — not in the initial bundle
import dynamic from 'next/dynamic';
const Modal = dynamic(() => import('../components/Modal'));

// Client-only component, no SSR, with a loading fallback
const HeavyComponent = dynamic(() => import('../components/header'), {
  ssr: false,
  loading: () => <div>Loading...</div>,
});
```
- **What it demonstrates**: the two core dials on `next/dynamic` — `ssr` and `loading` — used together to defer non-critical UI without a layout shift.

```tsx
// Preload a heavy external module (jsPDF) on user intent, not on mount
const handleInputFocus = async () => {
  if (!pdfLibRef.current) {
    const jsPdfModule = await import('jspdf');
    pdfLibRef.current = jsPdfModule.default;
  }
};
```
- **What it demonstrates**: preloading a heavy library on a low-cost signal (focus) before the user commits to the action that needs it, combined with a ref to avoid re-importing on every render.

## Worked Example
A tabbed UI where only the active tab's component should ever be fetched:
```tsx
const DynamicTabs = {
  Tab1: dynamic(() => import('./Tab1')),
  Tab2: dynamic(() => import('./Tab2')),
  Tab3: dynamic(() => import('./Tab3')),
};
const [activeTab, setActiveTab] = useState<keyof typeof DynamicTabs>('Tab1');
const TabContent = DynamicTabs[activeTab];
// render: <TabContent />
```
Viewing Tab1 never fetches Tab2/Tab3's code — each tab's chunk downloads only the first time it's selected. This is the canonical shape for "conditional UI branch → dynamic import," reusable for accordions, wizards, and modal-driven flows.

## Key Takeaways
1. `next/dynamic` trades a small loading delay for a smaller initial bundle — apply it to conditional, heavy, or rarely-used UI, not to everything.
2. Next.js already code-splits by route/page automatically; manual dynamic imports are for finer-grained control within a page.
3. `ssr: false` is for browser-API-only or client-only-library components, not a general performance toggle.
4. Server Components dynamically imported still execute server-side; the dynamic import only defers their nested Client Components.
5. Preloading on a low-cost intent signal (hover/focus) beats loading on mount for expensive, conditionally-used libraries.
6. Turbopack (stable, default since Next 16) replaced Webpack as the bundler — this chapter's splitting guidance is unaffected, since it's expressed at the `next/dynamic`/route level, not the bundler-config level.

## Connects To
- **Ch 7**: Rendering — Client Boundary rules determine what actually ends up in the client bundle when combined with dynamic imports.
- **Ch 8**: Web Vitals — code splitting is a primary lever for INP (less JS to parse/execute) and indirectly for LCP.
