# Chapter 5: Third-Party Scripts

## Core Idea
`next/script`'s `strategy` prop replaces manual `<script>` placement/attribute juggling (`async`/`defer`/head vs. body) with a small, named set of loading priorities matched to how critical each script actually is.

## Frameworks Introduced
- **`next/script` loading strategies**: `beforeInteractive` → `afterInteractive` → `lazyOnload`, ordered from most to least render-blocking priority.
  - When to use `beforeInteractive`: scripts that must run before the page is interactive — critical third-party SDKs (payment gateways like Stripe/PayPal) or security scripts (CSP setup) that need to establish behavior immediately.
  - When to use `afterInteractive`: important-but-not-blocking scripts — analytics (Google Analytics, Facebook Pixel), live chat (Intercom, Drift), feedback tools (Hotjar).
  - When to use `lazyOnload`: non-essential scripts loaded during browser idle time via `requestIdleCallback` — social widgets, ad scripts, embedded maps/galleries.
  - How: `<Script strategy="..." src="..." onLoad={...} onReady={...} onError={...} />` — callbacks give explicit hooks into each loading stage instead of polling script state manually.

## Key Concepts
- **Render-blocking script**: any script without `async`/`defer` — the browser halts HTML parsing until it downloads and executes, worse the larger/slower the script or the earlier it's placed (especially inside `<head>`).
- **Main thread contention**: heavy scripts monopolize the same thread that parses HTML and renders content — this is the mechanism by which bad script loading degrades both LCP and INP.
- **`@next/third-parties`**: a companion library with pre-built, pre-optimized components (`GoogleTagManager`, `GoogleAnalytics`, `YouTubeEmbed`) built on top of `<Script>`, including utilities like `sendGTMEvent`.

## Reference Tables

| Traditional approach | Priority | `next/script` equivalent |
|---|---|---|
| `<script>` in `<head>` | Highest — blocks DOM structure | `beforeInteractive` |
| `<link rel="preload">` + `<script async>` | Medium-high | (custom preload + `afterInteractive`) |
| `<script async>` | Non-critical | `afterInteractive` |
| `<script defer>` | Low | `lazyOnload` |
| `<script>` at end of `<body>` | Lowest | `lazyOnload` |

## Code Examples
```tsx
// Critical, must-run-before-interactive script
<Script strategy="beforeInteractive" src="/path/to/bot-detector.js" />

// Analytics — important but shouldn't block initial render
<Script
  strategy="afterInteractive"
  src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"
/>

// Non-essential widget — load during idle time
<Script strategy="lazyOnload" src="/path/to/social-media-widget.js" />
```
- **What it demonstrates**: the same `<Script>` API differentiated purely by `strategy`, matched to the three-tier criticality model above.

```tsx
<Script
  src="https://example.com/important-script.js"
  strategy="beforeInteractive"
  onLoad={() => console.log("Script loaded successfully!")}
  onReady={() => console.log("Script is ready to execute!")}
  onError={(e) => console.error("Script failed to load!", e)}
/>
```
- **What it demonstrates**: explicit lifecycle hooks (`onLoad`/`onReady`/`onError`) for controlling behavior at each loading stage, including graceful error fallback.

## Worked Example
Deciding strategy for a page that needs Stripe (payment), Google Analytics, and a Facebook "Like" widget simultaneously:
1. **Stripe SDK** → `beforeInteractive`: a failed/delayed payment SDK blocks the core transaction feature, so it must be ready before the page is interactive.
2. **Google Analytics** → `afterInteractive`: valuable but not core functionality — load it right after hydration so tracking starts promptly without delaying first interactivity.
3. **Facebook Like widget** → `lazyOnload`: purely engagement-enhancing, safe to defer to idle time with zero impact on the page's actual functionality.

This three-way split is the pattern to reuse whenever a page mixes scripts of clearly different criticality — sort each script into one of the three tiers before writing any `<Script>` tags.

## Key Takeaways
1. `next/script`'s three strategies map directly onto "must block," "should follow hydration," and "can wait for idle" — classify each script before choosing a strategy.
2. `beforeInteractive` is reserved for scripts whose absence breaks core functionality or security, not merely "important" scripts.
3. `@next/third-parties` should be checked first for common integrations (GTM, GA, YouTube) before hand-rolling a `<Script>` wrapper.
4. `onError` enables graceful degradation (fallback functionality, alternate script) instead of silent third-party failures.

## Connects To
- **Ch 8**: Web Vitals — script strategy choice is a direct lever on INP (main-thread contention) and indirectly on LCP if scripts are render-blocking.
- **Ch 2**: Code splitting — both chapters solve the same underlying problem (don't ship/execute more JS than the current moment needs) from different angles.
