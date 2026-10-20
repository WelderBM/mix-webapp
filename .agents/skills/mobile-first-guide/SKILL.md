---
name: mobile-first-guide
description: "Knowledge base from \"Mobile First\" by Luke Wroblewski. Use when applying Wroblewski's frameworks for mobile-first design strategy, touch target sizing, mobile IA/navigation, mobile form input, responsive/fluid layout, or device capabilities (location, orientation, touch); studying the book; or referencing its concepts."
---

<!-- argument-hint: [topic, framework name, or chapter number] -->

# Mobile First
**Author**: Luke Wroblewski | **Publisher**: A Book Apart (2011) | **Pages**: ~128 | **Chapters**: 7 | **Generated**: 2026-07-27

## How to Use This Skill

- **Without arguments** — load core frameworks for reference
- **With a topic** — ask about `touch targets`, `input masks`, `responsive layout`, or another indexed topic; I find and read the relevant chapter
- **With chapter** — ask for `ch05`; I load that specific chapter
- **Browse** — ask "what chapters do you have?" to see the full index

When you ask about a topic not covered in Core Frameworks below, I will read
the relevant chapter file before answering.

---

## Core Frameworks & Mental Models

**Mobile First** — design and build the mobile experience *before* the desktop one. Mobile's screen/network/attention constraints force prioritization decisions that then get applied consistently back to desktop, instead of desktop bloat being shrunk down for mobile as an afterthought. This is the book's namesake argument and the lens every other framework sits inside.

**Constraints as a design tool, not a limitation** — "design is the process of gradually applying constraints until an elegant solution remains." Embrace mobile's small screen, unreliable network, and fragmented attention rather than fighting them; they force the prioritization work that stakeholders otherwise avoid indefinitely on desktop (Flickr's 60+ nav options → 6; Southwest's cluttered desktop site → focused native app).

**Needs first, hardware second** — device capabilities (location, orientation, touch, camera, NFC...) are a means to solve a user need, never a goal in themselves. "The most important opportunities come from people's needs and not from any specific hardware feature." Use this as a guardrail against novelty-driven feature creep.

**"One eyeball, one thumb"** — the default mental model for mobile usage context: partial attention, one hand free, frequently interrupted. Use it to validate whether a flow is genuinely usable in real mobile conditions, not just visually adapted from desktop.

**Content over navigation** — on mobile, lead with the content/task people came for; reduce navigation chrome in the initial view to a single, clearly labeled trigger. Pivoting/exploring is still supported, but through minimal mechanisms (a bottom anchor-linked nav list, contextual per-content links) rather than stacked nav bars competing with content for the scarcest resource: vertical pixels.

**Four mobile usage modes** — Lookup/Find (urgent answer), Explore/Play (idle time), Check In/Status (recurring glances), Edit/Create (urgent task). Map your product's jobs onto these before wireframing; they determine what goes front-and-center.

**Go small by going big** — mobile touch targets must be *larger* than their desktop or proportionally-shrunk equivalents, because fingers are far less precise than a mouse pointer. Baseline: 44pt (Apple) / 9mm with 2mm spacing (Microsoft); escalate for frequent, high-consequence, edge-of-screen, or sequential-task controls. Keep the visual icon smaller (50–100% of touch target) via padding, not the reverse.

**Cover the hover** — every `:hover`-dependent desktop interaction must be explicitly redesigned for touch (no pointer, no hover state). Four replacement paths: reveal on-screen permanently, trigger on tap/swipe, move to a separate screen, or remove if it was never valuable. Never leave it unaddressed.

**Embrace input, don't avoid it** — reject the outdated "limit forms on mobile" guidance; people clearly want to contribute from mobile. Make the *specific* inputs easier (top-aligned labels, HTML5 input types, format-stable masks, smart defaults, capability-based shortcuts like one-tap current-location) rather than removing input opportunities.

**Three input layout scenarios** — Sequential (all fields, minimize count — checkout/signup), Non-linear (list + tap-to-edit — rarely-edited profile data), In-context (single inline field, no navigation away — comments). Match the scenario to the layout; mismatches are the most common input-design failure.

**Fluid → Responsive escalation** — fluid layouts (elements scale to available space) suffice for modest width variation; escalate to responsive breakpoints (CSS3 media queries) once spanning meaningfully different device classes. Always set the mobile baseline first, then progressively enhance upward — never start from desktop and squeeze down.

**Device-experience differentiation** — evaluate target devices on three axes: user posture, primary input method, average display size. When device classes diverge on most axes (e.g., 10-foot TV vs. palm-held phone), a single responsive layout forces real compromises — build genuinely separate interfaces instead (Netflix's TV/tablet/desktop/mobile pattern).

**Reduction** — the book's closing, overriding principle: across every layout and interaction decision, cutting down to the minimum necessary is the most reliable answer as device/context variety grows. Responsive design, touch-target sizing, and device-experience interfaces are all tools in service of reduction, not ends in themselves.

---

## Chapter Index

| # | Title | Key Frameworks |
|---|-------|----------------|
| [ch01](chapters/ch01-growth.md) | Growth | Mobile First, mobile web vs. native |
| [ch02](chapters/ch02-constraints.md) | Constraints | Constraints as design tool, "one eyeball, one thumb" |
| [ch03](chapters/ch03-capabilities.md) | Capabilities | Capability-driven reinvention, needs first/hardware second |
| [ch04](chapters/ch04-organization.md) | Organization | Four usage modes, content over navigation |
| [ch05](chapters/ch05-actions.md) | Actions | Go small by going big, cover the hover |
| [ch06](chapters/ch06-inputs.md) | Inputs | Embrace input, three input layout scenarios |
| [ch07](chapters/ch07-layout.md) | Layout | Fluid → responsive escalation, device-experience differentiation, reduction |

## Topic Index

- **Accelerometer / device orientation** → ch03
- **Anchor-link pivot navigation** → ch04
- **Autocapitalize / autocorrect** → ch06
- **Back button (redundancy)** → ch04
- **Breakpoints** → ch07
- **Constraints (screen/network/context)** → ch02
- **Content over navigation** → ch04
- **Device capabilities (location, touch, sensors)** → ch03
- **Device experience differentiation** → ch07
- **Fixed navigation placement (top vs. bottom)** → ch04
- **Fluid layout** → ch07
- **Gestures (touch vocabulary)** → ch05
- **Hover states, covering** → ch05
- **Input masks** → ch06
- **Input types (HTML5)** → ch06
- **Location detection techniques** → ch03
- **Meta viewport tag** → ch07
- **Mobile First (framework)** → ch01
- **Mobile usage modes (Lookup/Explore/Check-In/Edit)** → ch04
- **Mobile web vs. native** → ch01
- **Native user interface (NUI)** → ch05
- **Non-linear / sequential / in-context inputs** → ch06
- **Pixel density (ppi)** → ch07
- **Responsive web design** → ch07
- **Smart defaults** → ch06
- **Touch targets, sizing** → ch05

## Supporting Files

- [glossary.md](glossary.md) — all key terms with definitions
- [patterns.md](patterns.md) — all techniques and design patterns
- [cheatsheet.md](cheatsheet.md) — quick reference tables and decision guides

---

## Scope & Limits

This skill covers the book content only. For hands-on implementation in your codebase,
combine with project-specific tools. For topics beyond this book, check related skills
or ask the agent directly.

Note: the source PDF was extracted via `pdftotext` (Docling unavailable in this environment — the local Python lacks `pip`), so table/figure formatting in the original book was reconstructed by hand from the extracted text rather than parsed automatically. Cross-check figures/tables against the original if precision matters.
