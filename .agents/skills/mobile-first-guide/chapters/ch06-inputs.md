# Chapter 6: Inputs

## Core Idea
The old mobile-design consensus ("avoid forms on mobile") is wrong — people clearly want to contribute from mobile devices (billions of texts sent daily, a $265,000 plane bought via eBay's iPhone app) — so the real job is making input *easy*: clear top-aligned labels, the right input types/attributes/masks, layouts matched to the input scenario, and capabilities that replace typing entirely where possible.

## Frameworks Introduced
- **Embrace input, don't avoid it**: reject the older "limit the use of forms in the mobile context" guidance (Brian Fling, 2009) in favor of actively designing good mobile input, since avoidance just pushes people toward painful workarounds they'll use anyway.
  - When to use: whenever a team defaults to cutting form fields or entire input flows "because mobile."
  - How: instead of removing input opportunities, invest in making the specific inputs easier — better labels, input types, masks, smart defaults, and capability-based shortcuts.
- **Three input layout scenarios**: sequential, non-linear, and in-context — each needs a different layout strategy.
  - When to use: at the point of deciding how a set of related inputs should be presented on screen.
  - How: use **sequential** layout (all fields visible, minimized in count) for one-time flows like registration/checkout; use **non-linear** layout (list of current values, tap-to-edit individual fields in a dialog/separate screen) for rarely-edited profile-style data; use **in-context** layout (a single inline field, no navigation away) for lightweight, frequent contributions like a comment.

## Key Concepts
- **Top-aligned labels**: the standard mobile form-label placement — left/right-aligned labels don't fit narrow screens, and top-aligned labels stay visible even when a virtual keyboard consumes roughly half the screen height.
- **Labels-in-field (placeholder) pattern**: labels placed inside the input itself (native-app-common, requires custom work on the web); risks include the label text being mistaken for an answer, an actual answer being mistaken for the label, and losing the question entirely once an answer is entered or once all fields are filled in.
- **Input masks**: constrain what characters can be typed and reveal the expected format up front (e.g., `___-___-____` for a phone number) — reduce error rates and typing effort, but must stay consistent with what they promised up front (the chapter's phone-mask counterexample gradually reveals `(XXX) XXX-XXXX` instead of showing that format from the start).
- **Smart defaults**: pre-filled values reflecting the majority case (e.g., Kayak's hotel search defaulting to "1 room") — a controlled study found people were roughly four times faster completing pre-filled forms than empty ones.
- **HTML5 input types**: `url`, `email`, `number`, etc. trigger context-specific virtual keyboards on supporting browsers and degrade harmlessly to plain text on browsers that don't support them.
- **Input attributes**: `autocapitalize` and `autocorrect` — toggle based on field semantics (off for email/password/URL/case-sensitive fields, on for proper nouns and free text) and degrade harmlessly when unsupported.

## Mental Models
- Treat every additional required field in a sequential form as a direct tax on mobile completion rate — "the fewer questions you ask, the better" is not a soft preference, it's the single highest-leverage lever the chapter identifies (the Boingo five-screen-to-one-screen redesign is the proof case).
- When choosing between a standard HTML control and a custom touch control (e.g., `<select>` vs. a spinner), count taps: a standard select menu for a small numeric range can cost four taps (open, swipe/scroll, tap value, tap done); a purpose-built spinner can cost one (tap +/−). Use custom controls when the tap-cost gap is large and the input range is small/bounded.
- For anything beyond simple picks, ask "does this capability (Ch 3) let me skip the form entirely?" — location-detection icons that fill a field with "current location" in one tap, or a camera-based lookup (Google Goggles), remove input burden altogether rather than just streamlining it.

## Anti-patterns
- **Avoiding mobile forms altogether based on outdated guidance**: the 2009-era "limit forms on mobile" advice ignored that people were already typing constantly on far worse feature-phone keypads — the fix is better input design, not less input.
- **Using `placeholder` as if it were a persistent label**: per spec, `placeholder` is meant for a *tip*, not a label — it disappears exactly when it's most needed (mid-entry and after completion), which is the chapter's core critique of naive labels-in-field implementations (MailChimp's sign-in form is the concrete example).
- **Long `<select>` dropdowns on mobile**: platform "zoomed" select controls typically show only 4–5 options at a time on a device like the iPhone, and long option lists get visually cut off — better handled as a dedicated full-screen picker page.
- **Input masks that change format mid-entry**: the chapter's phone-number mask example promises `XXX-XX-XXXX` up front, then silently switches to a parenthesized format as soon as the first digit is typed — breaks the trust the mask is supposed to establish. A mask should show the *exact* final format from the first character onward (the chapter suggests `___-___-____` style placeholders specifically because they read as a question, not a half-formed answer).

## Reference Tables
Standard web input types the chapter recommends defaulting to before reaching for custom controls:

| Input type | HTML |
|---|---|
| Checkbox | `<input type="checkbox">` |
| Radio button | `<input type="radio">` |
| Password field | `<input type="password">` |
| Dropdown list | `<select><option>...</option></select>` |
| File picker | `<input type="file">` |
| Submit button | `<input type="submit">` |
| Plain text | `<input type="text">` |

HTML5 types that trigger context-specific virtual keyboards where supported: `url` (adds `.`, `/`, `.com` keys), `email` (adds `.`, `@` keys), `number` (numeric keypad). All degrade to plain text input on unsupporting browsers — safe to adopt immediately with no fallback penalty.

## Worked Example
**The Boingo "Get Online" form redesign**, the chapter's concrete before/after for the sequential-input scenario:
- **Before**: the original flow spread required inputs across five separate screens to get a user connected to WiFi — a textbook case of a sequential task made needlessly long by over-segmenting the questions.
- **Diagnosis**: applying "the fewer questions you ask, the better" plus the three-scenario framework (this is clearly sequential — a one-time task that must complete before the goal, connectivity, is reached) means the fix is aggressive consolidation, not better labels on five screens.
- **After**: Wroblewski's redesign collapses the flow to a single screen that gets people online fast — same underlying required data, restructured so the *quantity of separate steps*, not just each step's clarity, is what gets optimized.
- **Generalizable rule extracted**: before improving labels, masks, or input types on a multi-screen sequential form, first ask whether the *screen count* itself is the actual problem — polishing five screens is often the wrong fix when the real win is merging them into one.

## Key Takeaways
1. Default to top-aligned labels for mobile forms; only reach for labels-in-field if you can solve the disappearing-label and answer-confusion problems explicitly.
2. Adopt HTML5 input types and `autocapitalize`/`autocorrect` attributes immediately — they degrade harmlessly and cost nothing on unsupporting browsers.
3. Reduce required-field count aggressively in sequential forms before optimizing anything else — it has the largest measured impact (Boingo case, smart-defaults study).
4. Match layout to scenario: sequential (all fields, minimized), non-linear (list + tap-to-edit), in-context (single inline field) — don't force one pattern onto all three.
5. Input masks must reveal their true final format from the very first character — never gradually change format mid-entry.
6. Before building a custom touch control, count the tap-cost of the standard HTML control; only build custom (spinner, date picker) when the savings are clear and the range is bounded.
7. Look for capability-based shortcuts (location, camera, NFC) that let people skip typing altogether, not just make typing faster.

## Connects To
- **Ch 3 (Capabilities)**: location detection and camera input reappear here explicitly as ways to go "beyond forms and input fields."
- **Ch 5 (Actions)**: touch-target sizing and gesture vocabulary from Ch 5 directly govern how custom input controls (spinners, date pickers, select replacements) should be built.
- **Ch 4 (Organization)**: Gmail's contextual action menu (Ch 4) and this chapter's in-context input scenario share the same underlying principle — keep interaction local to the content it acts on.
