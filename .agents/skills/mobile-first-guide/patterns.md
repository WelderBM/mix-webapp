# Patterns & Techniques

## Mobile First (design order)
**When to use**: at the start of any new product, feature, or redesign.
**How**: design and build the mobile experience before the desktop one. Let mobile's screen/network/attention constraints force prioritization decisions, then apply that same prioritized structure back to desktop.
**Trade-offs**: requires stakeholders to agree on priorities up front instead of deferring hard calls to "we have room on desktop" — politically harder early, but prevents desktop bloat and produces a coherent cross-device IA.

## Four Usage Modes for IA (Lookup/Find, Explore/Play, Check In/Status, Edit/Create)
**When to use**: structuring information architecture before wireframing.
**How**: map your product's core jobs onto the four modes; let the dominant mode(s) determine what's front-and-center on the primary screen.
**Trade-offs**: a product can serve multiple modes (Flickr: Check-In + Explore) — don't force a single mode if the data doesn't support it, but avoid trying to front-load all four at once, which recreates the navigation-heavy anti-pattern this framework exists to prevent.

## Content Over Navigation
**When to use**: designing the landing view of any mobile screen or page.
**How**: lead with actual content/task; reduce the header to a single, clearly labeled way to reach fuller navigation (menu button, not a stacked nav bar).
**Trade-offs**: makes deep navigation slightly less discoverable up front — mitigate with contextual/related links near content and a lightweight pivot mechanism (see Anchor-Link Pivot below), not by restoring nav bars.

## Anchor-Link Pivot Navigation
**When to use**: need to let people explore/pivot to other site sections without duplicating menus or adding chrome.
**How**: single anchor link in the header jumps to a navigation list placed after the main content at the bottom of the same page; include a "top" link to scroll back. No JavaScript or extra page load required.
**Trade-offs**: only works well for content-first pages with a natural "end"; less suited to app-like screens with no clear content boundary.

## Top-Fixed (Not Bottom-Fixed) Navigation for Mobile Web
**When to use**: any persistent/global navigation bar in a mobile *web* (not native) context.
**How**: fix global chrome to the top of the viewport rather than the bottom.
**Trade-offs**: bottom placement is more thumb-friendly in native apps (no competing browser chrome), but on mobile web, variable browser toolbars and physical hardware buttons near the bottom create real risk of accidental taps and layout collisions — top placement avoids both.

## Go Small By Going Big (Touch Target Sizing)
**When to use**: adapting any desktop-sized control (button, link, icon) for touch.
**How**: size the *touch* target to 44pt (Apple) / 9mm with 2mm spacing (Microsoft) minimum, independent of the *visual* icon size, which can be 50–100% of the touch target. Escalate size further for frequent, high-consequence, edge-of-screen, or sequential-task controls.
**Trade-offs**: generous touch targets consume more screen space — reconcile with Ch 2's reduction principle by cutting the *number* of on-screen controls rather than shrinking each one below the safe minimum.

## Cover the Hover (Four Replacement Paths)
**When to use**: auditing any desktop pattern relying on `:hover` before porting it to mobile.
**How**: pick one — (1) place the hover content directly on-screen permanently, (2) trigger it on tap/swipe with a visible affordance, (3) move it to a separate screen if it's extensive, or (4) remove it entirely if it was never valuable.
**Trade-offs**: "on-screen permanently" uses more space; "on tap/swipe" adds a discoverability cost that should be paired with a visible hint or fallback; "separate screen" adds a navigation step. Choose based on how essential and how large the hidden content is.

## Explicit `:focus`/`:hover` States for Hybrid Devices
**When to use**: any actionable link, button, or menu item, regardless of whether the primary target device is touch.
**How**: define explicit `:focus` styles (and `:hover` as a practical fallback, since many sites never define `:focus`) so trackball/trackpad/keypad/physical-keyboard users get visible feedback on the currently focused element.
**Trade-offs**: small additional CSS cost; skipping it silently breaks usability for a real (if shrinking) population of non-touch and hybrid mobile devices.

## Three-Scenario Input Layout (Sequential / Non-linear / In-context)
**When to use**: deciding how to present a set of related form inputs.
**How**: **Sequential** — show all fields, minimize field count, for one-time task flows (checkout, registration). **Non-linear** — show a list of current values, tap-to-edit individual fields in a dialog/separate screen, for rarely-edited data (profile settings). **In-context** — a single inline field with no navigation away, for lightweight frequent contributions (comments).
**Trade-offs**: mismatching the scenario to the layout is the most common input-design failure — e.g., using a sequential all-fields-visible layout for rarely-edited profile data clutters the screen with fields nobody is touching that session.

## Tap-Cost Comparison (Standard Control vs. Custom Control)
**When to use**: deciding whether to build a custom touch control (spinner, date picker) instead of a standard HTML control (`<select>`).
**How**: count taps for the standard control (open, scroll/swipe, select, confirm ≈ 4 taps for a `<select>`) versus the custom alternative (e.g., a +/− spinner ≈ 1 tap per increment). Build custom only when the input range is small/bounded and the tap-cost gap is meaningful.
**Trade-offs**: custom controls cost more development time and must still meet touch-target and hybrid-device (`:focus`) requirements — not worth it for large or rarely-used option sets, where a dedicated full-screen picker page is often better than either.

## Smart Defaults
**When to use**: any input field where a majority-case answer exists (quantity fields, common selections).
**How**: pre-fill the field with the most common value rather than leaving it empty.
**Trade-offs**: must be a genuine majority case, not a business-favorable default disguised as a convenience — the trust cost of a self-serving default outweighs the completion-speed benefit.

## Format-Stable Input Masks
**When to use**: any field requiring a specific format (phone, tax ID, date).
**How**: reveal the complete expected format from the very first character typed (e.g., `___-___-____`) and never change that format mid-entry.
**Trade-offs**: requires more careful mask design up front than a naive progressive-reveal implementation, but a mask that changes format mid-entry actively erodes user trust — worse than no mask at all.

## Capability-Based Input Replacement
**When to use**: any form field that could be filled from a device capability instead of typed (location, camera/NFC scan).
**How**: offer a one-tap capability shortcut (e.g., a location icon that fills "current location") alongside — not instead of — the manual input path, for devices/browsers where the capability isn't available.
**Trade-offs**: capability APIs (camera, NFC) had inconsistent mobile-browser support at time of writing — always provide the manual fallback.

## Fluid → Responsive Escalation
**When to use**: laying out any mobile web page across more than one target width.
**How**: start with a fluid layout (elements scale to available space) for modest variation (e.g., single-device orientation change); escalate to responsive breakpoints (CSS3 media queries defining layout rules per width threshold) once spanning meaningfully different device classes (phone vs. tablet).
**Trade-offs**: pure fluid layouts alone break down or look awkward across very different width ranges; jumping straight to complex breakpoint systems for small width variation is unnecessary engineering overhead.

## Device-Experience-Specific Interfaces (vs. One Responsive Layout)
**When to use**: when target device classes differ substantially on posture, input method, *and* display size simultaneously (e.g., connected TV vs. mobile).
**How**: evaluate the three axes explicitly; if most diverge, build genuinely separate interfaces per device class (Netflix's TV/tablet/desktop/mobile HTML5 interfaces) rather than stretching one breakpoint system across all of them.
**Trade-offs**: higher engineering/design maintenance cost for multiple interfaces — justified only when a single responsive layout would force real usability compromises on at least one device class, not as a default choice.

## Density-Aware Image Strategy
**When to use**: any raster image asset in a layout targeting devices with varying pixel density (ppi).
**How**: either maintain 1x/2x image pairs served conditionally (CSS media query, JS, or server-side), or substitute CSS3-rendered effects (gradients, rounded corners, shadows) for images wherever visually equivalent — CSS scales cleanly across density and degrades gracefully on unsupporting browsers.
**Trade-offs**: dual image sets add asset-management overhead; CSS3 effects are lighter but overuse can measurably slow rendering on some devices — don't treat "prefer CSS3" as license for unlimited effects.
