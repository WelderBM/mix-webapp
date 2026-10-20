# Chapter 4: Next/Image Component

## Core Idea
`next/image` bundles responsive sizing, lazy loading, format conversion, and layout-shift prevention into one component — but each of those behaviors (`priority`, `placeholder`, `sizes`, `quality`) is a deliberate choice per image, not a single global switch.

## Frameworks Introduced
- **`priority` vs. lazy loading**: `priority` preloads an image via a `<link preload>` injected before HTML parsing even finishes — stronger than plain `loading="eager"`, which only fetches immediately once the browser reaches that HTML.
  - When to use: images contributing to LCP (typically the largest above-the-fold image). Everything else should lazy-load (the `next/image` default).
- **Three approaches to image sizing**: static import (auto-sized), explicit `width`/`height` (fixed/remote images), `fill` + `sizes` (dynamic/unknown container size).
  - How: pick based on whether the image is a build-time static asset, a remote image with known dimensions, or a container-relative fill — never leave `fill` without a matching `sizes`.

## Key Concepts
- **`placeholder="blur"`**: shows a blurred preview during load; requires `blurDataURL` for dynamic/remote images unless the host provides one automatically.
- **`sizes` attribute**: tells the browser which image width to request at a given viewport width — mandatory whenever `fill` is used, since without it the browser has no way to know the rendered size and defaults to the largest.
- **`deviceSizes` / `imageSizes`** (next.config): breakpoints Next.js picks from when generating responsive image variants — `deviceSizes` for full-width images, `imageSizes` for anything smaller than the viewport (used with `sizes`).
- **`unoptimized` prop**: skips Next.js's format conversion/resizing pipeline entirely — for SVGs, already-optimized images, or cost control on optimization-billed hosts (e.g. Vercel charges per optimized image).
- **`quality`**: default 75; raising it trades bandwidth/load time for visual fidelity, lowering it does the reverse. Not applicable to SVG (unaffected by resizing) — the default loader also disables optimization automatically when `src` ends in `.svg`.

## Anti-patterns
- **`fill` without `sizes`**: the concrete failure mode the book quantifies — omitting a size hint that reflects real layout (e.g. `33vw`) means the browser assumes the image is 3× wider than needed; since file size scales with width², that's **9× the necessary download**, not 3×.
- **Blanket `priority` on multiple images**: defeats its own purpose — `priority` is for the LCP-contributing image specifically, not "all above-the-fold images."
- **Using `next/image`'s `loading` prop instead of `priority`**: the guide calls this an advanced-use-case-only path that "typically worsens performance" for ordinary cases — prefer `priority`.
- **Optimizing SVGs through the default pipeline**: raster-style optimization removes the scalability advantage vector formats exist for; use `unoptimized` for SVGs (or rely on the automatic `.svg` bypass).

## Reference Tables

| Sizing approach | Use when |
|---|---|
| Static import (`import img from '../public/x.jpg'`) | Local image, dimensions known at build time |
| Explicit `width`/`height` | Remote image or fixed-dimension slot |
| `fill` + `sizes` | Container-relative sizing, dimensions vary by layout |

| Attribute | Purpose | Default |
|---|---|---|
| `priority` | Preload before HTML parse completes | off |
| `placeholder` | `empty` or `blur` during load | `empty` |
| `quality` | 0–100 compression trade-off | 75 |
| `unoptimized` | Skip Next.js image pipeline | off |

## Code Examples
```tsx
// LCP-critical image: preload aggressively
<Image src="/images/lcp-image.png" alt="LCP Image" priority width={1000} height={500} />
```
- **What it demonstrates**: `priority` reserved for the one image that actually gates LCP.

```tsx
// fill layout — sizes is not optional here
<div style={{ width: '100%', height: '400px', position: 'relative' }}>
  <Image
    src="/banner.jpg"
    alt="Promotional banner image"
    fill
    style={{ objectFit: 'cover' }}
    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  />
</div>
```
- **What it demonstrates**: matching `sizes` to the actual rendered width at each breakpoint — this exact snippet is the guide's canonical `fill` pattern, directly aligned with the "always pass real `sizes`" rule for `fill` images.

## Worked Example
The guide's own arithmetic on why `sizes` matters: a `fill` image rendered at 33% viewport width (`33vw`) on a container laid out at 1/3 the viewport. Omit `sizes` and the browser can't infer the render width, so it requests the largest configured `deviceSizes` variant — full viewport width, i.e. **3× the needed width**. Because raster file size grows roughly with the square of linear width, that 3× width difference becomes a **9× larger file download** than necessary. Adding `sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"` collapses that gap back down to the correct size per breakpoint.

## Key Takeaways
1. `sizes` is mandatory with `fill` — its absence isn't a minor inefficiency, it's a ~9× overdownload on that image.
2. `priority` belongs on the single LCP-contributing image, not as a general "load this fast" flag.
3. Default `quality={75}` is a reasonable starting point; tune per use case (photography portfolio vs. high-volume blog) rather than leaving untested.
4. `unoptimized` is the deliberate escape hatch for SVGs, pre-optimized assets, and per-image-billed optimization costs.

## Connects To
- **Ch 8**: Web Vitals — nearly every LCP optimization strategy listed there (`priority`, WebP/AVIF, `srcset` sizing) is implemented via this chapter's `next/image` API.
- **project CLAUDE.md**: "toda imagem com `fill` do `next/image` leva `sizes` correto pro layout real" is exactly this chapter's core anti-pattern, independently arrived at.
