# Chapter 8: Web Vitals

## Core Idea
Core Web Vitals (LCP, INP, CLS) are Google's standardized, weighted UX metrics — and because Lighthouse weights them unevenly (TBT 30%, LCP 25%, CLS 25%, FCP 10%, SI 10%), optimization effort should be prioritized by weight, not by whichever metric is easiest to move.

## Frameworks Introduced
- **Core Web Vitals**: LCP (loading), INP (interactivity), CLS (visual stability) — the subset of Web Vitals that are part of Google's Page Experience ranking signals.
  - When to use: as the default triage list for any performance work — every technique in this book maps back to moving one of these three.
- **Lighthouse metric weighting**: a concrete scoring formula (see table) for deciding where optimization effort pays off most in the aggregate performance score.
  - How: prioritize TBT and LCP first (highest combined weight), CLS second, treat FCP/SI as supportive.

## Key Concepts
- **LCP (Largest Contentful Paint)**: time until the largest visible content element (image, video, or large text block) finishes rendering.
- **INP (Interaction to Next Paint)**: delay between a user interaction and the browser's next paint in response — replaced FID because it measures *all* interactions across a session, not just the first.
- **CLS (Cumulative Layout Shift)**: tracks unexpected visual movement during load/interaction.
- **FCP (First Contentful Paint)**: time to the first rendered content of any kind; target ≤1.8s.
- **TBT (Total Blocking Time)**: total time the main thread is blocked by tasks >50ms between FCP and TTI, preventing input responsiveness.
- **TTFB (Time to First Byte)**: time from request to first response byte — covers redirect handling, DNS, TLS negotiation, and initial server processing.
- **Deprecated metrics**: TTI (removed from Lighthouse 10 — too sensitive to outlier network/task variance) and FID (replaced by INP for the reasons above).

## Mental Models
- Route every optimization decision through "which of LCP/INP/CLS does this move, and by how much given its Lighthouse weight" — this book's chapters on images, scripts, fonts, code splitting, and rendering are all instances of this one question answered differently per subsystem.

## Reference Tables

**Lighthouse metric weighting**

| Metric | Abbreviation | Weight |
|---|---|---|
| Total Blocking Time | TBT | 30% |
| Largest Contentful Paint | LCP | 25% |
| Cumulative Layout Shift | CLS | 25% |
| First Contentful Paint | FCP | 10% |
| Speed Index | SI | 10% |

**Optimization checklist by metric**

| Metric | Techniques |
|---|---|
| LCP | `next/image` WebP/AVIF + `priority` on the LCP image, preload critical resources, SSR, inline critical CSS, preconnect to critical third-party domains |
| INP | Selective hydration (Suspense), lazy loading, code-split JS, CSS-based animations (not JS), throttle/debounce frequent handlers, reduce DOM complexity, offload to Web Workers, `startTransition` for non-urgent updates |
| CLS | Explicit image dimensions, consistent Layout component, skeleton screens, reserved ad-container space, `next/font` / `font-display` handling, server-side styled-components (`babel-plugin-styled-components` + `ServerStyleSheet`), preload key fonts/critical CSS |

## Code Examples
```tsx
// Sending Web Vitals to Google Analytics 4, using Next.js's own hook
import { useReportWebVitals } from 'next/web-vitals';

useReportWebVitals(metric => {
  window.gtag('event', metric.name, {
    value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
    event_label: metric.id,
    non_interaction: true,
  });
});
```
- **What it demonstrates**: `useReportWebVitals` is deeply integrated with Next.js's own rendering pipeline, so it's likely more accurate than a generic analytics SDK's built-in web-vitals collection — CLS specifically needs ×1000 rounding since GA requires integer values.

## Worked Example
*(Illustration applying the author's own weighting table from 8.1.5 — not a numeric example given in the book itself.)* Given a Lighthouse report showing TBT=45, LCP=60, CLS=90, FCP=95, SI=90 (out of 100 each), where should effort go first? Weight each gap by its Lighthouse coefficient:
- TBT: (100−45) × 0.30 = 16.5 points recoverable
- LCP: (100−60) × 0.25 = 10.0 points recoverable
- CLS: (100−90) × 0.25 = 2.5 points recoverable
- FCP: (100−95) × 0.10 = 0.5 points recoverable
- SI: (100−90) × 0.10 = 1.0 points recoverable

TBT dominates the recoverable score even though CLS's raw gap looks larger — this operationalizes the book's own "High-Impact Metrics: TBT (30%) and LCP (25%) should be your primary focus" guidance (8.1.5): chase the largest *weighted* gap, not the largest *raw* one.

## Key Takeaways
1. LCP, INP, CLS are the three metrics to optimize for; FCP/SI/TBT/TTFB are supporting diagnostics that explain *why* the Core Web Vitals move.
2. Lighthouse's weighting (TBT 30%, LCP 25%, CLS 25%, FCP/SI 10% each) should directly steer where limited optimization time goes.
3. INP superseded FID because it captures the full interaction session, not just the first input — treat any FID-based guidance found elsewhere as outdated.
4. TTI is deprecated in Lighthouse 10+ — don't chase it as a target metric.

## Connects To
- **Ch 4**: Next/Image — nearly every LCP technique here is implemented through `next/image`'s `priority`/format/`sizes` behavior.
- **Ch 3 & Ch 7**: Selective hydration and PPR/streaming are the primary INP levers referenced here.
- **Ch 10**: Measuring performance — this chapter defines *what* to measure; Ch 10 covers *how* (Lighthouse, WebPageTest, PSI, Vercel Speed Insights).
