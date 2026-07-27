# Chapter 11: Code reviews and pair programming

## Core Idea
Pair programming and code review aren't substitutes for each other — pairing gets you to the best solution in the moment (real-time, two-perspective feedback), while code review communicates what changed to the whole team and leaves a durable record; a mature process does both, not one instead of the other.

## Frameworks Introduced
- **Pairing complements review, four ways**: earlier problem detection (two perspectives catch more before the PR even opens), faster onboarding to review participation (a new hire pairs with an experienced dev in tour-guide style to skip the learning curve), faster resolution of review feedback (pair live on addressing comments instead of a slow async back-and-forth), better design decisions from the start (a pair catches "this needs a rewrite" during development, not after a PR is already merged under deadline pressure).
- **Why pairing can't replace review, four reasons**: no historical/documented artifact is created (the single most important reason, per the book); knowledge stays limited to the two paired developers rather than reaching the team; lack of unbiased perspective (a pair that developed code together tends to agree with itself, similar in effect to the "buddy-reviewer system" bias from ch. 7); limited scope (a pair's focus mirrors a single developer's — zoomed into the task, not the wider codebase/architecture fit that a neutral reviewer checks for).
- **Six pairing styles**, each suited to different needs: **driver-navigator** (default/most common — one writes, one reviews in real time); **driving school/strong style** (navigator gives tactical, detailed instructions — useful post-design-discussion, but risks steamrolling a timid partner); **pomodoro** (25 min coding / 5 min break, then switch — enforces equal participation, but the ticking clock can add anxiety); **tour guide** (one drives and narrates, others passively listen — good for onboarding/knowledge-sharing walkthroughs only, not sustainable long-term since passive listeners disengage); **ping-pong** (paired with TDD — one writes a failing test, the other makes it pass and writes the next test, repeat — highly active, works across skill levels); **tag-team** (free-form, switch whenever the pair feels like it — casual, but an imbalanced pair may just never switch).
  - How: start with driver-navigator, matched skill levels, small time-boxed sessions (30–60 min), and treat it as opt-in/experimental before deciding whether to formalize it.

## Key Concepts
- **Co-authored commit**: `Co-authored-by: Name <email>` trailer (two blank lines before it in the commit message) — solves the "who gets credit" worry by attributing a paired commit to both developers on GitHub/GitLab.
- **Skill-level matching**: pairing two juniors or two seniors together tends to work better than junior+senior — a mismatched pair often collapses into the senior driving the whole time and the junior passively watching, unless deliberately avoided.
- **Personality matching**: introvert/extrovert, collaborative/independent working styles strongly affect whether pairing feels productive or exhausting for a given person — cited by multiple practitioners as more decisive than skill level.

## Mental Models
- Treat pair programming and code review as operating at different *times* in the development cycle with different *audiences*: pairing serves the two people in the room, right now; review serves the whole team, indefinitely (via the durable PR record).
- The "no historical artifact" argument is the load-bearing one — even a perfect pairing session produces zero institutional memory unless its outcome eventually passes through a documented review.
- Never mandate pair programming universally — the book's own repeated finding is that adoption succeeds when voluntary/task-scoped and fails (or breeds resentment) when forced across the whole team or the whole day.

## Anti-patterns
- **Treating pairing as a review replacement to "save time"**: skips the durable record, the wider-team knowledge transfer, and the unbiased-perspective check — three things a neutral, separate code review still uniquely provides.
- **Pairing all day, every day**: multiple practitioners cited in the book cap effective pairing at 3–4 focused hours; beyond that, fatigue erodes the value pairing is supposed to add.
- **Pairing on routine/repetitive/simple tasks**: one engineer explicitly reports giving this up — "we didn't get any added value... pair programming did prove too expensive" — reserve pairing for critical systems, complex/unclear problems, new architecture, and complex refactors.
- **Forcing an unwilling team member into pairing**: the book's Reddit-sourced counter-story (a junior "steamrolled" by a senior who narrated and sighed at questions) shows how a mismatched, mandatory pairing can actively damage confidence rather than build it — the fix is voluntary adoption, matched skill/personality, and room to opt out.

## Worked Example
**The legacy-bug refactor.** The author was assigned a bug in a legacy system full of dependency-injection layers, inconsistent naming, and almost no tests — estimated at one sprint, it took one sprint just to *debug* and two more to fix, requiring constant pairing with a colleague who held the historical context the author lacked. The payoff: after pairing through the fix and using code review to broadcast the *why* of the refactor to the rest of the team, the application's health measurably improved — bugs became less frequent and far easier to locate, and the team's dependency on the "tenured" colleague dropped because everyone now understood the refactored system. Neither practice alone would have produced this: pairing supplied the real-time historical context needed to actually solve the problem; the subsequent code review is what spread that understanding past the two people in the room.

## Key Takeaways
1. Do both pairing and code review — they solve different problems (best solution now vs. team-wide durable record), not the same problem twice.
2. Pairing's fatal gap as a review substitute is documentation: without a PR, the "why" behind a change lives only in two people's memory.
3. Match pairing partners by skill level and personality before worrying about which pairing *style* to use — mismatch is a more common failure cause than style choice.
4. Reserve pairing for genuinely hard, high-stakes, or knowledge-transfer-heavy tasks (critical systems, complex refactors, new architecture, onboarding) — skip it for routine/boilerplate work where it adds no value.
5. Never mandate pairing team-wide; introduce it as a scoped, voluntary experiment (a single sprint, a single task, a capped session length) and let the retro decide whether to continue.

## Connects To
- **Ch 2**: Knowledge transfer/sharing as a code-review goal is exactly what pairing accelerates but cannot fully substitute for.
- **Ch 7**: The "biased buddy system" pain point is structurally the same bias risk this chapter flags for paired-developer self-review.
- **Ch 8**: Review milestones (scheduled, lighter-weight check-ins) sit adjacent to pairing as another way to catch drift early for less experienced developers.
- **Ch 12**: Mob programming extends the same "more eyes earlier" logic to the whole team at once.
