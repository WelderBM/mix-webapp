# Chapter 6: Font Optimization

## Core Idea
`next/font` self-hosts and bundles fonts at build time — eliminating the runtime network request to Google (or another font host) and the layout shift that comes from swapping a fallback font for the real one.

## Frameworks Introduced
- **`next/font`**: downloads font + CSS files at build time and serves them from the same origin as the app, applying `size-adjust` automatically to reduce layout shift during font swap.
  - When to use: essentially always, in place of a `<link>` to Google Fonts or manual `@font-face` — it subsumes `font-display: swap`, preloading, and self-hosting concerns.
  - How: `Inter({ subsets: ['latin'], display: 'swap' })` from `next/font/google`, applied via `className` on the root layout.

## Key Concepts
- **FOIT (Flash of Invisible Text)**: text stays invisible while a web font downloads asynchronously, delaying readable content.
- **FOUT (Flash of Unstyled Text)**: fallback font shows first, then swaps to the web font once loaded — causes a visible (and CLS-counted) layout shift.
- **Variable Fonts**: a single font file encoding a continuous range of weights/widths/styles (introduced 2016, still underused per the guide), replacing multiple separate font-weight files.

## Anti-patterns
- **Relying on a `<link>` to Google Fonts at runtime**: every page load sends a request to Google's servers — `next/font` removes this entirely by self-hosting at build time.
- **Manually tuning `font-display`, preloading, and system-font fallbacks by hand**: the guide calls this "rarely worth it" once `next/font` is available, since it automates the same outcomes.
- **Shipping a separate font file per weight/style**: multiplies file count and bytes; a Variable Font collapses them into one cacheable file, also reducing FOUT since all styles are available simultaneously.

## Code Examples
```tsx
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const RootLayout = ({ children }: { children: React.ReactNode }) => (
  <html lang="en" className={inter.className}>
    <body>{children}</body>
  </html>
);
```
- **What it demonstrates**: the complete `next/font` setup — subset selection plus `display: swap`, applied once at the root layout for the whole app.

## Key Takeaways
1. `next/font` addresses layout shift (via automatic `size-adjust`), network overhead (via build-time self-hosting), and the manual `font-display` tuning problem in one component — reach for it before any manual font-loading strategy.
2. Self-hosting Google Fonts through `next/font` means the browser never contacts Google — a privacy and performance win simultaneously.
3. Variable Fonts are worth adopting for apps using multiple weights/styles of the same family — one cacheable file instead of many, and reduced FOUT since all styles load together.

## Connects To
- **Ch 8**: Web Vitals — font loading behavior directly affects CLS (FOUT-driven shifts) and is explicitly listed among CLS optimization steps ("Correct Handling of Fonts").
