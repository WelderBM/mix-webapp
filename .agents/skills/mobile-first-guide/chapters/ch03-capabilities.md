# Chapter 3: Capabilities

## Core Idea
Constraints are only half the mobile-first argument — mobile devices also carry sensors and context desktop never had (location, orientation, touch, and more), and starting mobile-first means these capabilities shape the design from day one instead of being bolted on as an afterthought.

## Frameworks Introduced
- **Capability-driven reinvention**: instead of asking "how do we shrink the desktop feature to fit mobile," ask "what does this device know or sense that lets us solve the same user need in a fundamentally different way."
  - When to use: whenever a desktop feature feels awkward or verbose when ported to mobile as-is (e.g., "find the nearest X" search forms).
  - How: identify what device capability maps to the underlying need (location → "near me," orientation → "which way am I facing," touch → "direct manipulation") and redesign around it rather than transliterating the desktop UI.
- **Needs first, hardware second**: "the most important opportunities come from people's needs and not from any specific hardware feature" — capabilities are a means, not a goal.
  - When to use: as a guardrail against novelty-driven feature creep ("we have an accelerometer, let's use it somewhere").
  - How: start from the user need identified in constraints/organization work, then check which capability serves it — never the reverse.

## Key Concepts
- **Location detection**: multiple techniques (GPS, WiFi beacon, cell tower triangulation, IP lookup) each with different accuracy/speed/battery trade-offs; browsers expose the most accurate available without the developer choosing the method.
- **Device orientation / accelerometer**: senses how the device is held, moved, or rotated — from simple portrait/landscape detection to continuous tilt-based interaction.
- **Touch**: direct manipulation via fingers, replacing indirect mouse/pointer interaction; the largest unexplored capability space at the time of writing.
- **Emerging capabilities** (early-stage or native-only at time of writing): digital compass, gyroscope, microphone/audio input, camera, dual cameras, Bluetooth, proximity sensors, ambient light sensors, NFC.

## Mental Models
- Use the **Nearest Tube vs. Transport for London desktop site** comparison as the reference case for "same need, radically different solution": both solve "where's the nearest Tube station," but the desktop flow is a multi-step search-and-navigate pattern while the capability-driven mobile flow is "open the app and look" — location + compass + camera + accelerometer collapse several steps into an interface that requires zero typing.
- Treat "browser support lags native" as a standing fact, not a blocker: at the time of writing, location and orientation were mostly available in mobile browsers while camera and magnetometer were mostly native-only — build for what's available in-browser now, and expect the gap to keep closing.
- Frame capabilities as **removing input burden**, not just adding novelty: every capability example in this chapter (location, orientation, touch) replaces typing or manual navigation with something the device already knows or senses.

## Reference Tables
Table 3.1 — location-detection techniques and trade-offs (as assembled by Rahul Nair, reproduced from the chapter):

| Technique | Accuracy | Positioning Time | Battery Impact |
|---|---|---|---|
| GPS | ~10m | 2–10 min (degrades indoors) | 5–6 hrs battery life impact on most phones |
| WiFi | 50m (improves with density) | Almost instant (server lookup) | No additional effect |
| Cell tower triangulation (single tower) | 100–1,400m (density-based) | Almost instant | Negligible |
| IP | Country 99%, City 46% US/53% intl, Zip 0% | Almost instant | Negligible |

**Practical rule from the chapter**: iPhones relied on WiFi beacons for roughly two-thirds to three-quarters of location lookups (indoor-capable, low battery cost, near-instant) — reach for GPS/cell only when you need the higher accuracy and can tolerate the time/battery cost. In practice, don't pick a technique yourself: browser geolocation APIs already return the best available estimate for the device.

## Anti-patterns
- **Porting a desktop interaction 1:1 instead of reinventing it around capabilities**: the London Transport site example does everything "right" by 2011 desktop IA standards (clear links, visual cues, labeled file sizes) yet still requires a multi-step search-find-open-PDF flow that a capability-aware mobile design can collapse entirely.
- **Building for a hardware feature because it exists, not because it serves a need**: explicitly warned against — "building things just because we can usually doesn't help our customers."
- **Assuming native-only capabilities are permanently out of browser reach**: the chapter frames the native/browser capability gap as temporary and shrinking, not a permanent architectural limit — don't over-invest in native specifically to chase a capability that browser APIs are actively catching up on.

## Worked Example
**Finding the nearest Tube station, two ways**, reconstructed from the chapter's central case study:
- *Desktop path*: search → land on Transport for London homepage → find the "Maps" link → find "Standard Tube Map" → open a PDF → visually locate your position and the nearest station yourself. Every step in this flow follows textbook web usability practice (clear link labeling, PDF icons with file sizes, visual section cues) — the *execution* isn't the problem.
- *Capability-driven mobile path (Nearest Tube app)*: open the app, point the phone. Location detection places you on a map; the digital compass determines which direction you're facing; the camera feed becomes the background; the accelerometer adjusts what's shown based on how you tilt the device (pointed down = nearby detail, tilted up = farther stations). The entire task — "where's the nearest station and which way do I walk" — is answered by looking at the screen, with zero typing and zero page navigation.
- **The lesson Wroblewski draws**: this isn't a claim that the native augmented-reality app is objectively better (he notes both have real usability issues) — it's that the two approaches are *categorically different solutions to the same need*, and that difference only becomes available once you design starting from what the device can sense rather than starting from the desktop page structure and shrinking it.

## Key Takeaways
1. Treat location, orientation, and touch as first-class design inputs, not enhancements added after the core flow is built.
2. Match location technique expectations to context: instant-but-coarse (WiFi/cell/IP) vs. slower-but-precise (GPS) — but let the browser's geolocation API pick, don't hand-roll technique selection.
3. Anchor every capability decision in a user need first; novelty-driven use of sensors doesn't help customers and adds maintenance cost.
4. Expect the native/browser capability gap to narrow over time — design mobile web ambitiously rather than assuming browser limitations are permanent.
5. When a desktop flow feels clunky on mobile even after visual adaptation, the fix is often reinvention around a capability, not further UI simplification of the same steps.

## Connects To
- **Ch 2 (Constraints)**: capabilities and constraints are presented as the two forces that together define mobile design — constraints narrow what you show, capabilities expand what you can do instead of showing it.
- **Ch 5 (Actions)**: touch, introduced here as a capability, is expanded into full interaction-design guidance (touch targets, gestures) in Chapter 5.
- **Ch 6 (Inputs)**: location detection and other capabilities reappear as ways to replace manual form input ("beyond forms and input fields").
