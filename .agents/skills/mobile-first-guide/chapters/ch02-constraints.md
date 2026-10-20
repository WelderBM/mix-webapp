# Chapter 2: Constraints

## Core Idea
Mobile's three core constraints — small screens, unreliable/slow networks, and fragmented attention (time and place) — aren't obstacles to design around, they're a forcing function that produces better products, because "design is the process of gradually applying constraints until an elegant solution remains."

## Frameworks Introduced
- **Constraints as a design tool, not a limitation**: embrace constraints rather than fight them, because they force prioritization decisions that stakeholders otherwise avoid.
  - When to use: any time competing internal stakeholders keep adding features/promotions/navigation to a shared surface (the Southwest Airlines desktop-site problem).
  - How: use the mobile screen's literal lack of room as leverage to force a single answer to "what matters most to our customers and our business" — then apply that same prioritization back to desktop instead of letting desktop stay bloated.
- **"One eyeball, one thumb"**: a mental model for how people actually use mobile devices — partial attention, single-handed, easily interrupted.
  - When to use: whenever evaluating whether a mobile interaction is genuinely usable, not just visually adapted.
  - How: design every core flow assuming the user has one thumb free and is only glancing at the screen, not sitting focused at a desk.

## Key Concepts
- **Screen size constraint**: early smartphones (320×480px) exposed roughly 20% of the pixel area of a standard 1024×768 desktop viewport — 80% of desktop content has to be cut, reprioritized, or relocated.
- **Performance constraint**: mobile networks are slower, spottier, and often metered — every HTTP request has a real latency and monetary cost to the user.
- **Context (time and place)**: unlike desktop's fairly uniform "seated, powered, private" context, mobile is used anywhere and constantly — at home, in transit, in line, watching TV — and usage times cluster around specific daily moments (commute, lunch, evening) rather than spreading evenly like desktop use does.
- **"Diving" vs. "snorkeling"** (Rachel Hinman, Nokia): desktop sessions are longer and more focused ("diving"); mobile sessions are short, frequent bursts ("snorkeling").

## Mental Models
- Use the Southwest Airlines vs. Flickr comparisons as a gut-check: if your product's desktop navigation has grown past what a customer could name from memory (Flickr had 60+ top-level nav items), the mobile constraint is telling you the desktop version already has a prioritization problem — mobile just makes it undeniable.
- Treat "content over chrome" implicitly here (formalized in Ch 4): a small screen has no room for content of "questionable value," so anything that isn't a top customer/business priority has to go, not just shrink.
- Treat performance work done for mobile's spotty networks as a free win for desktop too — Google's data showed even 100ms desktop delays measurably reduce activity, and the effect persists for weeks after the delay is fixed.

## Anti-patterns
- **Adding stakeholder features to a shared surface because "there's room"**: desktop's abundant pixels make it easy to keep saying yes to internal requests (Southwest Airlines' desktop site is the book's example of "everything including the kitchen sink"); the constraint of mobile is the only thing that reliably stops this.
- **Assuming mobile use only happens "on the go"**: the survey data in this chapter shows 84% of mobile use happens *at home* — design for glances during downtime, not just a hurried commuter stereotype.
- **Shipping unoptimized asset pipelines because "it works on wifi in the office"**: heavy JS libraries used for one or two functions, unbundled/unminified CSS/JS, missing HTTP caching headers, and oversized CSS3 effects all compound badly on real mobile networks even though they're invisible in a fast local dev environment.

## Reference Tables
Performance techniques the chapter recommends for reducing HTTP requests and payload size on constrained networks:

| Technique | Why it helps |
|---|---|
| Image sprites | Combine multiple images into one encoded file → fewer HTTP requests (watch decoded size) |
| Bundle + minify CSS/JS | Fewer requests, smaller payloads |
| Limit/remove heavy JS libraries | Especially when used for only one or two functions |
| Limit CSS grid systems | Reduces unnecessary CSS weight |
| Proper HTTP cache headers | Avoids re-downloading unchanged assets |
| HTML5 Canvas / AppCache | Modern browser capabilities that can replace heavier techniques |
| CSS3 (rounded corners, gradients, shadows) | Replaces images with rendered CSS — but don't overuse; too many effects can hurt render performance |

## Worked Example
**Flickr's navigation collapse, reconstructed:** Flickr's desktop top-level menu had grown to over 60 navigation options through years of incremental feature additions — a textbook case of "everything gets added because adding things is easy." When Flickr's team had to build the mobile web experience, the 320×480px screen made it physically impossible to carry all 60+ options forward. Rather than trying to cram a scaled-down version of the full menu onto the small screen, the team went back to first principles: what do people actually come to Flickr to do? The answer distilled to checking in on your own recent photo activity, seeing new photos from people you follow, and exploring interesting/popular images. Those three jobs mapped to just six navigation options in the mobile experience — a 90%+ reduction driven entirely by the constraint, not by an aesthetic minimalism preference. The chapter's implied next step (made explicit in Ch 4) is that this same six-option prioritization is *also* the right answer for desktop; the constraint just made the answer undeniable first on mobile.

## Key Takeaways
1. Small screens force real prioritization — use that pressure deliberately instead of resenting it, even on desktop redesigns.
2. Treat every mobile network request as costly (money and time) — sprite, minify, bundle, cache, and prefer CSS3 over images where reasonable.
3. Mobile context is dominated by partial attention ("one eyeball, one thumb") — validate flows against that, not against a seated-at-a-desk assumption.
4. Usage timing clusters around specific daily moments (commute, lunch, evening) — check analytics for your own product's peaks rather than assuming uniform usage.
5. Performance and simplicity work done for mobile's constraints pays off on desktop too — this isn't "the cheap version," it's the disciplined version.

## Connects To
- **Ch 1 (Growth)**: constraints are the reason mobile-first produces *better* products, not just smaller ones — this is the mechanism behind the growth chapter's argument.
- **Ch 4 (Organization)**: "content over navigation" and reducing nav-option count directly extend the Flickr/Southwest constraint lessons into concrete IA guidance.
- **Ch 7 (Layout)**: "reduce to the minimum" reappears as the closing layout principle — constraints-driven reduction is a theme that spans the whole book, not just this chapter.
