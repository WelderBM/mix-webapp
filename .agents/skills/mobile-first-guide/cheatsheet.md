# Cheatsheet — Mobile First

## Decision Rules

- **When scoping native vs. mobile web**: default to mobile web. Only choose native when you need ≥1 of: deep hardware access, background processes, app-store discovery/monetization, or native-only UI transition smoothness. Reason: mobile web often carries equal or greater usage than native for the same product (Twitter: 14% web vs. 8%/7% native; Facebook: ~19% web vs. ~4% per native app).
- **When a stakeholder wants to add another nav item/promo/module**: if it can't survive being placed on a 320px-wide screen without pushing out higher-priority content, it doesn't belong on the primary view — full stop, regardless of device.
- **When porting a `:hover` interaction to mobile**: never leave it unaddressed. Pick exactly one of: on-screen permanently / on-tap-or-swipe / separate screen / remove. Never default to "it'll just become tap automatically and that's fine" without checking.
- **When sizing a touch target**: is it ≥44pt / 9mm, with ≥2mm spacing from neighbors? If either fails → fix before shipping, not after a bug report. Escalate above baseline if: frequently touched, high-consequence on error, near a screen edge, or part of a sequential task (dial pad, stepper).
- **When a form is spread across multiple screens**: before touching labels/copy on any individual screen, ask "can this be one screen instead of five?" — screen-count reduction usually beats per-screen polish (Boingo case: 5 screens → 1).
- **When picking an input control**: count taps. Standard `<select>` ≈ 4 taps. If a custom control (spinner, etc.) gets it to 1–2 taps AND the range is small/bounded, build custom. Otherwise, use the standard control — don't build custom controls for large/unbounded option sets (use a full-screen picker page instead).
- **When choosing fixed-nav placement on mobile web**: top, not bottom. Bottom-fixed works in native (no competing chrome); on mobile web, variable browser toolbars + physical buttons near the bottom create collision risk.
- **When deciding fluid vs. responsive**: single device, modest width change (e.g. rotation) → fluid layout is enough. Spanning device *classes* (phone vs. tablet width) → add responsive breakpoints.
- **When deciding one responsive layout vs. separate device-experience interfaces**: score the target devices on posture / input method / display size. Diverge on most axes (e.g., TV vs. phone) → build separate interfaces. Diverge on few/none → one responsive layout is fine.

## Trade-off Matrix — Native vs. Mobile Web

| Dimension | Native app | Mobile web |
|---|---|---|
| Hardware/sensor access | Full | Partial, browser-dependent, improving over time |
| UI transition smoothness | Best | Can lag/hiccup |
| Reach across platforms | Rebuild per OS (Obj-C, Java, Silverlight, C++...) | One build, all platforms |
| Update velocity | App-store review cycle | Instant (server-side fix) |
| A/B testing | Harder | Easy |
| Discoverability via shared links | None (links open browser) | Direct |
| Background processes / app-store monetization | Yes | No |

## Trade-off Matrix — Input Layout Scenario

| Scenario | Use when | Layout |
|---|---|---|
| Sequential | One-time task that must complete before goal (checkout, signup) | All fields visible, minimize count |
| Non-linear | Rarely-edited data (profile settings) | List of current values, tap-to-edit in dialog/screen |
| In-context | Lightweight, frequent contribution (comment) | Single inline field, no navigation away |

## Trade-off Matrix — Location Detection Technique

| Technique | Accuracy | Speed | Battery |
|---|---|---|---|
| GPS | ~10m | 2–10 min, degrades indoors | High impact |
| WiFi | ~50m | Near-instant | None |
| Cell tower | 100–1,400m | Near-instant | Negligible |
| IP | Country-level only | Near-instant | Negligible |

Rule of thumb: don't hand-pick a technique — let the browser geolocation API return its best available estimate. iPhones used WiFi for ~⅔–¾ of lookups specifically because it balances speed/accuracy/battery best for typical use.

## Thresholds & Defaults

- Touch target: **44pt** (Apple) or **9mm** (Microsoft), minimum **7mm**, minimum **2mm** spacing between adjacent targets.
- Visual icon size can be **50–100%** of the actual touch target size (padding/margin fills the rest).
- Original smartphone viewport: **320×480px** ≈ only ~20% of a 1024×768 desktop viewport's pixel area — expect ~80% of desktop content to need cutting/relocating.
- Smart defaults: pre-filled forms completed **~4× faster** than empty forms in the study cited.
- Right-handed thumb bias: **~70–90%** of users — place primary actions in the right-thumb comfortable arc (middle/bottom), destructive actions (delete/cancel) in the harder-to-reach zone (upper-left).
- Safe mobile-web gesture set: **tap, drag, swipe** (the fuller native gesture vocabulary — pinch, spread, rotate, press-and-drag — has inconsistent mobile browser support).
- Virtual keyboard height: budget roughly **half the screen height** when designing input/dialog layouts.

## Tells & Smells

- **"It has room on desktop"** used to justify adding a feature/promo/nav item → sign the desktop IA already has a prioritization problem; mobile will just make it visible.
- **A form spans multiple screens and the fix proposed is "better copy/labels on each screen"** → sign the real fix is reducing screen count, not polishing screens.
- **An interaction "looks" swipeable/tappable but a bug report says users can't find how to trigger it** → sign of an affordance/actual-behavior mismatch (see ESPN scoreboard case) — add a visible control, don't just document the gesture better.
- **A `placeholder` attribute is being used as the only label for a field** → sign of the labels-in-field anti-pattern; the "label" will vanish exactly when the user needs it (mid-entry, post-completion).
- **An input mask's displayed format changes as you type** → sign of a progressive-reveal mask bug; the mask should show its final format from character one.
- **A bottom-fixed nav bar is being ported from a native app spec to a mobile web page** → sign of a native-convention leak; re-evaluate for top-fixed instead given mobile-web browser chrome.
- **A "back" button is being added to a mobile web page header** → check first whether the platform/browser already provides one (most non-iOS devices and even Apple's mobile browser toolbar do) before adding a redundant one.
- **A single responsive layout is struggling to serve a TV interface and a phone interface well** → sign the device-experience gap (posture/input/display size) is too large for one breakpoint system; consider separate interfaces (Netflix pattern).
