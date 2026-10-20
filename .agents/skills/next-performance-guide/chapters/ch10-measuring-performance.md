# Chapter 10: Measuring Performance

## Core Idea
No single measurement tool covers both "fast local feedback" and "accurate real-world signal" — Lighthouse gives quick lab data, WebPageTest/PageSpeed Insights add consistency and field data, and RUM (Vercel Speed Insights or similar) is the only source of truth for what real users actually experience.

## Frameworks Introduced
- **Lab data vs. field data**: lab data (Lighthouse, WebPageTest) is a synthetic, controlled-environment snapshot; field data (PageSpeed Insights' CrUX integration, Vercel Speed Insights, other RUM) reflects actual user sessions across real devices/networks.
  - When to use lab data: fast local iteration, CI/CD gating, accessibility/SEO audits alongside performance.
  - When to use field data: production monitoring, understanding real-world variability, comparing against competitors, catching regressions actual users hit that lab conditions don't reproduce.

## Key Concepts
- **Lighthouse**: Google's audit tool (performance, accessibility, SEO); integrates into Chrome DevTools for quick local checks. Limitation: in-browser runs vary with local hardware/network/background processes — use the CLI version or CI integration for consistent results, since a single run is a snapshot, not a trend.
- **WebPageTest**: runs from multiple real-world locations via dedicated test agents, supports scripted multi-step transactions, provides visual filmstrip/video comparisons, and retains historical results for trend analysis — the tool of choice when Lighthouse's in-browser variability is a problem.
- **PageSpeed Insights (PSI)**: combines Lighthouse's lab methodology with real-user field data from the Chrome UX Report (CrUX); simpler interface than WebPageTest but with fewer configuration options; CrUX data refreshes monthly and only covers sites with sufficient traffic.
- **Vercel Speed Insights**: built-in RUM for Vercel-deployed Next.js apps — tracks Real Experience Score (RES), FCP, LCP, etc. across all deployment environments (preview + production) without extra scripts; supports P75/P90/P95/P99 percentile views, device/environment filtering, and geographic breakdowns.
- **`useReportWebVitals`**: the Next.js hook (from `next/web-vitals`) for piping real-world Web Vitals data to any analytics backend — see the code example in Ch 8.

## Mental Models
- Match the tool to the question: "is my code fast in this exact environment right now?" → Lighthouse CLI/local. "Is my code consistently fast across regions and connection types?" → WebPageTest. "What are real users, aggregated across the world, actually experiencing?" → PSI/CrUX or Vercel Speed Insights/other RUM.

## Reference Tables

| Tool | Data type | Best for | Key limitation |
|---|---|---|---|
| Lighthouse | Lab (synthetic) | Quick local iteration, CI/CD gating, accessibility+SEO | In-browser runs vary with local conditions; single-point-in-time snapshot |
| WebPageTest | Lab (synthetic, multi-region) | Consistent cross-region testing, scripted user journeys, historical trend data | More setup/configuration than Lighthouse |
| PageSpeed Insights | Lab + Field (CrUX) | Balanced view combining synthetic + real-user data, Google-specific SEO guidance | CrUX refreshes monthly; requires sufficient site traffic to have field data at all |
| Vercel Speed Insights | Field (RUM) | Real-time production monitoring on Vercel, per-route/per-region breakdowns | Vercel-deployment specific |
| Other RUM (New Relic, Datadog, Sentry, CDN-provided) | Field (RUM) | Custom metrics, multi-platform/non-Vercel hosting, compliance requirements | Requires separate integration/cost |

## Code Examples
```tsx
import { useReportWebVitals } from 'next/web-vitals';

useReportWebVitals(metric => {
  window.gtag('event', metric.name, {
    value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
    event_label: metric.id,
    non_interaction: true,
  });
});
```
- **What it demonstrates**: piping Next.js's own Web Vitals reporting directly into Google Analytics 4 as a custom event, with the CLS-specific integer scaling GA requires.

## Key Takeaways
1. Use Lighthouse (CLI or CI-integrated, not ad-hoc in-browser) for fast local/CI feedback; don't treat a single in-browser run as representative.
2. Use WebPageTest when consistency across regions/networks or historical trend data matters more than speed of iteration.
3. Use PageSpeed Insights when you want both lab and real-user (CrUX) signal in one report, especially for SEO-adjacent guidance.
4. Production monitoring requires field data (Vercel Speed Insights or another RUM) — lab tools alone cannot substitute for real-user telemetry, since they can't capture the actual device/network diversity of a live audience.
5. `useReportWebVitals` is the direct pipe from Next.js's rendering internals to whatever analytics backend a team already uses.

## Connects To
- **Ch 8**: Web Vitals — this chapter is "how to measure" the metrics Ch 8 defines as "what to measure."
- **Ch 9**: Development culture — baseline testing (WebPageTest/Pingdom/GTmetrix) is step 2 of the performance-budget process in Ch 9.
