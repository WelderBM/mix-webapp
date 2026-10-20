# Chapter 4: Organization

## Core Idea
Mobile information architecture still rests on classic IA fundamentals (clear labeling, balanced breadth/depth, sound mental models), but it must additionally align with how and why people actually reach for their phones, put content ahead of navigation chrome, and offer just enough pivoting to explore without burying the primary task.

## Frameworks Introduced
- **Four mobile usage modes** (synthesized from Josh Clark's *Tapworthy* micro-tasking/"I'm local"/"I'm bored" categories and Google's urgent-now/repetitive-now/bored-now research):
  - **Lookup/Find** — "I need an answer now," often location-relevant.
  - **Explore/Play** — "I have time to kill," idle browsing.
  - **Check In/Status** — "something I care about keeps changing," recurring glances.
  - **Edit/Create** — "I need to get this done now," can't-wait micro-tasks.
  - When to use: at the IA/structure stage of any mobile experience, before wireframing screens.
  - How: map your product's core jobs onto these four modes (a product may serve more than one) and let the mode determine what's front-and-center — e.g., Flickr organizes around Check-In (friends' recent activity) and Explore (interesting/nearby photos); Basecamp organizes around Check-In and Edit/Create.
- **Content over navigation**: on mobile, content precedence beats navigation precedence — get people to what they came for before showing them where else they could go.
  - When to use: designing the landing/home experience of any mobile page or app screen.
  - How: lead with the actual content or task (ESPN's scores, YouTube's videos) and reduce the header to a single, clearly labeled way to reach navigation — not a menu-first layout.

## Key Concepts
- **Pivot and explore**: the ability to move to other parts of a site *without* front-loading navigation chrome that crowds out content — achieved through minimal, well-placed nav triggers rather than persistent menu bars.
- **Contextual navigation**: navigation or actions relevant only to the current content/task (e.g., Gmail's per-message action menu), placed near that content rather than in a global menu.
- **Fixed-position menus**: fixed bottom nav bars work well in native apps (no browser chrome competing for space) but are risky in mobile web because of variable browser chrome and physical hardware buttons near the bottom of many devices — fixing to the *top* is the safer default for mobile web.
- **"Back" button redundancy**: many devices already provide back navigation (hardware button or persistent browser toolbar control) — adding another "back" link in the page header creates ambiguous, duplicated controls.

## Mental Models
- Treat every navigation element as competing directly with content for the scarcest resource on mobile: vertical pixels. Facebook and Google Finance's stacked navigation bars are the chapter's cautionary example — three and five nav bars respectively pushed the actual content (what users came for) below the fold.
- Use "one eyeball, one thumb" (from Ch 2) as the filter for how much navigation chrome is tolerable: hurried, partially-attentive users need the fewest possible decisions between them and their task.
- When deciding whether a control belongs at the top or bottom of the screen, split by function: primary content-adjacent triggers can go at the bottom (easier one-handed reach, per Ch 5's touch guidance), but persistent global chrome is safer at the top, where it won't collide with browser toolbars or hardware buttons.

## Anti-patterns
- **Leading with a navigation menu instead of content**: forces every visitor through a decision tree before reaching what they wanted — the opposite of the four usage modes' "get me the answer now" intent.
- **Copying "back" buttons from native iOS conventions into mobile web headers**: iOS lacks a hardware back button so native apps need one in-app; most other platforms (Android, Blackberry, Windows Phone) *do* have a hardware or browser-toolbar back control, so a duplicate on-page "back" link just creates the question "do both of these do the same thing?"
- **Fixing navigation bars to the bottom of a mobile web page**: works in native (no browser chrome), but on the web, variable browser toolbars plus physical device buttons near the bottom multiply the risk of accidental taps — Yahoo! Mail's stacked browser + fixed menus left almost no visible inbox content as the chapter's negative example.
- **Duplicating the same menu in multiple places "just in case"**: a bottom-of-page pivot menu that exactly re-lists the top-of-page menu adds weight without adding value — YouTube's approach (separate full navigation page reached via a header icon) works but creates a dead end at the bottom of content since there's no pivot option there at all; Bagcheck's approach (single anchor link jumping to a nav list placed after content, with a "top" link back) achieves pivoting with zero extra navigation elements or JavaScript.

## Worked Example
**Bagcheck's anchor-link navigation pattern**, reconstructed as the chapter's recommended solution to "how do I let people pivot without duplicating menus or adding chrome":
1. The page header contains exactly one navigation element: a link that anchors down to a navigation list placed *after* the main content, at the bottom of the same page.
2. Because it's a same-page anchor (`#nav` style link), there's no additional page load, no JavaScript, and no overlay — "that's like HTML 0," as the chapter puts it.
3. Content pages also carry a *unique*, contextual related-navigation list specific to that content, so people who want to go deeper on the current topic can, without leaving for the global nav.
4. At the bottom, alongside the global nav list, a "top" link scrolls back to the start of the content, so pivoting to explore never strands the user away from what they were reading.
5. **Net result**: minimum markup (one anchor link), zero duplicated menus, content stays first, and both global and contextual pivoting are available exactly where someone would look for them — at the end of the content they just consumed.

## Key Takeaways
1. Map your product's core interactions onto Lookup/Find, Explore/Play, Check-In/Status, and Edit/Create before designing screens — it determines what goes first.
2. Content beats navigation for the opening view of any mobile page or screen — resist leading with a menu.
3. Prefer contextual, in-place actions (Gmail's per-message menu) over global menus for anything tied to specific content.
4. Default to top-fixed (not bottom-fixed) navigation in mobile web to avoid browser-chrome and hardware-button collisions that native apps don't have to worry about.
5. Don't port native conventions (like an in-page "back" button) to mobile web without checking whether the platform already provides that control natively.
6. A single anchor link can solve pivot/explore needs with zero JavaScript — check for the simplest possible mechanism before reaching for a menu component.

## Connects To
- **Ch 2 (Constraints)**: "content over navigation" and reduced nav-option counts are direct applications of the screen-size constraint discussed there (Flickr's 60→6 nav collapse is referenced again here).
- **Ch 5 (Actions)**: bottom-placement guidance here (easier one-handed reach) is grounded in the touch-target and thumb-reach analysis of the next chapter.
- **Ch 6 (Inputs)**: Gmail's contextual action menu (introduced here) reappears as an example of context-appropriate interaction placement.
