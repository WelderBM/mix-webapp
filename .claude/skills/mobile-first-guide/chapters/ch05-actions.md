# Chapter 5: Actions

## Core Idea
Touch turns the entire device surface into an interactive control, but human fingers are imprecise, so mobile action design means going *bigger* (not smaller) on touch targets, learning the small consistent vocabulary of touch gestures, deliberately replacing hover-dependent interactions, and still accounting for the non-touch and hybrid devices that coexist with touchscreens.

## Frameworks Introduced
- **"Go small by going big"**: the counterintuitive rule that smaller screens require *larger* interactive elements, not smaller ones, because finger contact is imprecise while a mouse pointer is pixel-accurate.
  - When to use: any time a mobile layout is adapted by proportionally shrinking desktop-sized controls to fit — this is the mistake the framework corrects.
  - How: size touch targets to physical finger dimensions, not to visual/pixel proportions of the shrunk desktop layout; use padding/margin so the *visual* icon can stay smaller than the *touch* target underneath it.
- **Cover the hover**: any interaction relying on `:hover` (desktop mouse-over) has no direct equivalent on a touch-only device and must be explicitly redesigned, not left to fail silently.
  - When to use: auditing any existing desktop interaction pattern before porting it to mobile.
  - How: choose one of four replacements per case — reveal the content directly on-screen, trigger it on tap/swipe, move it to a separate screen, or remove it entirely if it was never valuable.

## Key Concepts
- **Touch target sizing standards**: Apple recommends 44×44 points; Microsoft recommends 9mm targets (7mm minimum, 2mm minimum spacing); MIT's Touch Lab measured average finger pads at 10–14mm and fingertips at 8–10mm. Points/physical units are used (not raw pixels) specifically to normalize across differing screen densities.
- **Core touch gesture set**: tap, double tap, drag, swipe, pinch, spread, press, press-and-tap, press-and-drag, and rotate variants — found broadly consistent across iOS, Android, Windows Phone/Surface, WebOS, Flash (GestureWorks), and even the Wacom Bamboo tablet. For mobile *web* specifically (weaker multi-touch support, reserved system gestures), the safe subset narrows to **tap, drag, and swipe**.
- **Natural User Interface (NUI)**: an interaction philosophy that makes content itself the interface (e.g., pinch-to-zoom directly on a photo) rather than routing every action through chrome — windows, icons, menus, pointers (WIMP). The chapter frames the mobile era as a transition period between GUI and NUI, not a clean cutover.
- **Right-thumb bias**: because ~70–90% of people are right-handed and commonly operate a phone one-handed with the thumb, primary actions belong in the thumb's comfortable middle/bottom-to-left-to-right arc; destructive actions (delete/cancel) are safer placed in the harder-to-reach upper-left corner, where an accidental tap is less likely.

## Mental Models
- Treat every touch target as needing a *touch* size and a (potentially smaller) *visual* size — Microsoft's guidance that the visible representation can be 50–100% of the actual touch target is the concrete ratio to apply.
- Escalate target size further ("bigger than the baseline") whenever: the element is touched frequently, a touch error is severe/frustrating, the element sits near a screen edge (harder to hit precisely), or it's part of a sequential task like a dial pad.
- When in doubt about whether to add a gesture-based interaction, default to an explicit button for the *primary* action and reserve gestures for secondary/advanced shortcuts — NUI is the direction of travel, but full discoverability isn't there yet.

## Anti-patterns
- **Shrinking desktop controls proportionally to fit mobile**: produces targets far below any of the 44pt/9mm/2mm-spacing guidelines — Quora's login screen (Cancel and Login placed too close together) and Flickr's advanced search options are the chapter's concrete failure cases; almost half of mobile ad taps in one study were accidental, directly attributable to undersized/crowded targets.
- **Leaving desktop `:hover` interactions unaddressed on mobile**: silently breaks any interaction that depended on mouse-over (e.g., Barnes & Noble's hover-triggered book-info popup) since there is no hover state on a touch-only device.
- **Relying on gestures with no visible affordance and no fallback**: ESPN's mobile scoreboard visually implied swipeability but required tapping arrows instead — a mismatch between implied and actual interaction; any content revealed only by a non-obvious gesture (like swipe) should also be reachable another way (Yahoo! Mail duplicates swipe-revealed actions on the full message screen).
- **Designing exclusively for touch and ignoring hybrid/non-touch devices**: trackpads, trackballs, keypads, and physical keyboards still needed explicit `:focus` and (as a practical fallback, since many sites never define `:focus`) `:hover` states — browsers like Opera Mini use `:hover` to indicate the currently focused element via indirect input.

## Reference Tables
Touch target sizing guidance by source (as compiled in the chapter):

| Source | Recommended size | Minimum | Notes |
|---|---|---|---|
| Apple iOS HIG | 44×44 points | — | Points (not pixels) to normalize density |
| Microsoft Windows Phone 7 | 9mm | 7mm, 2mm spacing | Escalate for frequent/severe/edge/sequential-task targets |
| MIT Touch Lab (measured) | Finger pad 10–14mm, fingertip 8–10mm | — | Basis for the above guidelines converging in the same range |

## Worked Example
**Redesigning a crowded touch target layout (Quora login pattern), reconstructed from the chapter's diagnosis:**
1. **Symptom**: "Cancel" and "Login" sit close enough together that a slightly imprecise tap can trigger the wrong one — exactly the scenario the 2mm-minimum-spacing guidance exists to prevent.
2. **Diagnosis using the framework**: check both dimensions — is each target ≥ the 7–9mm/44pt baseline, and is the *gap* between adjacent targets ≥ 2mm? A failure on either axis produces the same symptom (accidental wrong taps), so both have to be checked, not just target size alone.
3. **Escalation check**: Login/Cancel is a "severe consequence" pair (accidentally canceling out of a login you meant to submit, or vice versa) — per Microsoft's guidance this is exactly the category of control that should size *above* the baseline minimum, not just meet it.
4. **Fix pattern**: increase inter-target spacing to ≥2mm, keep visual icon/label size proportionate (50–100% of the touch target, per the visual-vs-touch-size ratio) so the layout doesn't look oversized even though the tappable area is generous, and consider placing the more destructive/irreversible action (Cancel) further from the natural thumb landing zone.

## Key Takeaways
1. Increase touch target size when adapting desktop layouts for mobile — don't scale down proportionally.
2. Separate visual size from touch size: keep the icon/label compact, keep the tappable hit-area generous (50–100% ratio).
3. For mobile web specifically, design gestures around the safe core set (tap, drag, swipe) — richer gestures have inconsistent mobile-browser support.
4. Explicitly redesign every `:hover`-dependent interaction using one of four paths: on-screen, on-tap/swipe, separate screen, or remove.
5. Never make an action reachable *only* via a non-obvious gesture — provide a visible fallback control.
6. Place primary actions within right-thumb reach; place destructive actions in the harder-to-reach zone as a soft guard against mistakes.
7. Define explicit `:focus` (and `:hover` as fallback) states for every actionable element to support trackball/trackpad/keypad devices, not just touchscreens.

## Connects To
- **Ch 3 (Capabilities)**: touch was introduced there as an emerging capability; this chapter is the full interaction-design treatment of it.
- **Ch 4 (Organization)**: the right-thumb-reach rationale for bottom-placed navigation controls is grounded in this chapter's touch-target and hand-ergonomics analysis.
- **Ch 6 (Inputs)**: touch-target and gesture guidance here directly determines the sizing and interaction patterns for custom form controls (spinners, date pickers) discussed next.
