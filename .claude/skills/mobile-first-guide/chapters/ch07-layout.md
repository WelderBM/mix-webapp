# Chapter 7: Layout

## Core Idea
Because the mobile device landscape will keep fragmenting (new screen sizes, pixel densities, and device classes indefinitely), mobile layout can't target a fixed set of dimensions — it has to be fluid, responsive, and explicitly aware of pixel density, while every layout decision defaults toward reduction rather than accommodation.

## Frameworks Introduced
- **Fluid → Responsive, as a progression, not a binary choice**: fluid/flexible layouts (elements that expand/contract to available space) are necessary but not sufficient once the range of screen widths grows large; responsive web design (fluid layouts + flexible media + CSS3 media queries + optional JS, applied at defined breakpoints) is the next layer up.
  - When to use: fluid alone is enough for modest width variation (e.g., orientation change on one device); responsive breakpoints are needed once you're spanning meaningfully different device classes (e.g., 320px phone vs. 768px tablet).
  - How: set a mobile baseline experience first, then use breakpoints (conditional width thresholds) to progressively enhance layout, image size, and element visibility as more space becomes available — never the reverse (don't start from desktop and squeeze down).
- **Device experience differentiation**: distinct device classes (connected TV, desktop, tablet, smartphone, feature phone) each have a characteristic user posture, primary input method, and display size — and sometimes deserve genuinely distinct interfaces, not just breakpoint variations of one design.
  - When to use: when a single responsive layout would force meaningful compromises for at least one device class (e.g., a 10-foot lean-back TV interface vs. a palm-held touch interface).
  - How: evaluate whether device classes differ enough in posture/input/size that unifying them costs more in compromise than maintaining separate interfaces costs in engineering (Netflix's distinct TV/tablet/desktop/mobile HTML5 interfaces is the chapter's reference case).

## Key Concepts
- **Meta viewport tag**: `<meta name="viewport" content="width=device-width">` tells the mobile browser to use the device's actual width as the layout viewport instead of a vendor-chosen desktop-oriented default width — the single most basic "we designed for you" signal a mobile page can send.
- **Pixel density (ppi)**: the number of physical pixels per inch; two devices can share the same CSS pixel "device-width" (e.g., 320px) while having very different physical pixel densities (164ppi original iPhone vs. 252ppi Nexus One vs. 329ppi iPhone 4) — text and browser-rendered elements adapt automatically, but raster images do not, and appear soft/jagged at higher densities unless served at higher resolution.
- **Breakpoint**: a conditional width threshold (e.g., "minimum width 600px") at which a different set of layout rules and media assets is applied, typically via CSS3 media queries.
- **Reduction**: the chapter's closing layout principle — across every layout decision (touch target sizing, responsive breakpoints, device-specific interfaces), less is the more reliable answer as complexity grows, not more accommodation logic.

## Mental Models
- Treat the meta viewport tag as a floor, not a ceiling — it's necessary but trivial; the real layout work is everything that follows (fluidity, breakpoints, density-aware images).
- When two devices share a CSS device-width but differ in ppi, assume text/CSS-rendered UI is fine by default, and treat *images specifically* as the piece that needs deliberate density handling (2x asset + CSS/JS/media-query selection, or lean on CSS3-rendered effects like gradients/rounded corners instead of image assets wherever possible).
- Use the "10-foot vs. palm-sized" framing to decide fast whether you need one responsive layout or genuinely separate device-experience interfaces: if the posture and input method differ this drastically (TV remote/gestures vs. touch in one hand), a single breakpoint-driven layout is very likely the wrong tool.
- When customers start asking for the *desktop* experience to be simplified "like the mobile one," treat that as validation the reduction principle worked — not as scope creep to resist.

## Anti-patterns
- **Skipping the meta viewport tag**: leaves the browser guessing a vendor-default desktop-oriented viewport width, undermining every other layout decision downstream.
- **Maintaining two full image sets as the default density strategy**: technically works (serve 1x/2x pairs via media query/JS/server logic) but the chapter explicitly flags this as the *heavier* option — prefer CSS3-rendered visual effects (gradients, rounded corners, shadows) wherever they can substitute for images, since CSS scales cleanly across densities and degrades gracefully (solid background / square corners) on browsers without CSS3 support.
- **Overusing CSS3 effects as the "free" alternative to images**: the chapter's own caution — excessive shadows/gradients can measurably slow rendering on some devices, so "prefer CSS3 over images" isn't a license for unlimited effects.
- **Forcing one interface across device classes that differ too much in posture/input/size**: a text list built for feature phones dropped onto a connected TV, or a desktop-dense UI forced onto touch, both produce a technically-functional but poorly-fitted experience; the chapter's implicit rule is that "works everywhere" and "fits every device experience well" are not the same claim.
- **Treating responsive design as the endpoint instead of reduction**: breakpoints that just rearrange the *same amount* of content/functionality across screen sizes miss the chapter's actual closing argument — the goal is cutting down to the minimum necessary, with responsive layout as the mechanism, not the goal itself.

## Reference Tables
Pixel-density comparison the chapter uses to establish why device-width alone doesn't tell you everything:

| Device | Resolution | Screen size | Pixel density |
|---|---|---|---|
| Original iPhone | 320×480px | 3.5in | 164ppi |
| Google Nexus One | 480×800px | 3.7in | 252ppi |
| iPhone 4 | — | — | 329ppi |
| Apple Cinema Display (reference desktop) | — | — | ~94ppi |
| Nokia N900 | — | — | 266ppi |

Key fact from the table: the original iPhone, Nexus One, and iPhone 4 all used the *same* 320px CSS device-width despite ppi ranging from 164 to 329 — CSS-pixel layout consistency is preserved across density by design, which is exactly why raster images (which don't get this automatic normalization) are the one piece needing explicit density handling.

## Code Examples
```html
<meta name="viewport" content="width=device-width">
```
- **What it demonstrates**: the minimum viable "designed for mobile" signal — forces the layout viewport to match the device's actual width instead of a vendor-assumed desktop-style default width. Every other technique in this chapter (fluid layout, breakpoints, density-aware assets) assumes this tag is already in place.

## Worked Example
**Netflix's device-experience-specific interfaces**, the chapter's reference case for when *not* to force one responsive layout across everything:
- Netflix built distinct HTML5 interfaces for connected TVs, tablets, desktop browsers, and mobile devices — all on the same underlying web technology stack, but with genuinely different interface designs per device class.
- **Why not just one responsive layout with breakpoints**: the device classes differ on all three of the chapter's differentiation axes simultaneously — posture (10-foot lean-back TV vs. palm-held mobile vs. desk-bound desktop), input method (remote/gestures vs. touch vs. mouse/keyboard), and display size (wall-sized vs. palm-sized). A single breakpoint-driven layout optimized for touch target sizes would be unusable with a TV remote's directional input; a layout optimized for 10-foot readability would waste most of a phone screen.
- **Trade-off acknowledged directly**: maintaining multiple distinct interfaces costs more engineering and design effort than one responsive layout — the chapter frames this as a deliberate, justified trade when the device-experience differences are large enough, not as a default recommendation for every product.
- **Generalizable check**: before defaulting to "one responsive design for everything," run the three-axis test (posture / input / display size) across your actual target devices — if two device classes diverge on most axes, evaluate a dedicated interface for each rather than stretching one breakpoint system to cover both.

## Key Takeaways
1. Always include `<meta name="viewport" content="width=device-width">` as the baseline — it's necessary before any other layout technique matters.
2. Use fluid layouts for modest width variation; escalate to responsive breakpoints (CSS3 media queries) once you're spanning meaningfully different device widths.
3. Handle pixel density deliberately for images specifically — either maintain 1x/2x asset pairs or shift rendering to CSS3 (gradients, rounded corners, shadows) where it can substitute for image assets, but don't overuse CSS3 effects either.
4. Evaluate device experiences on three axes — posture, input method, display size — before deciding whether one responsive layout suffices or a distinct interface per device class is justified.
5. Treat "reduce to the minimum necessary" as the closing, overriding layout principle — responsive design and breakpoints are tools in service of that goal, not the goal itself.
6. Expect the device landscape to keep changing indefinitely — build layout principles that hold up under continuous change rather than targeting today's specific device list.

## Connects To
- **Ch 2 (Constraints)**: "reduce to the minimum" closes the loop back to the constraints-as-design-tool argument that opened the book.
- **Ch 5 (Actions)**: responsive breakpoints need to adjust touch-target sizing and spacing (Ch 5's guidance) as available screen space changes, not just reflow content.
- **External**: Ethan Marcotte's *Responsive Web Design* (the term's origin, referenced directly); Peter-Paul Koch's viewport/pixel-density writing (cited as the technical source for the viewport-tag and ppi explanations).
