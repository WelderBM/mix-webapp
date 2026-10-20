# Chapter 2: Dissecting the code review

## Core Idea
A code review has four moving parts (new code, reviewer(s), a reviewing mechanism, a signoff condition) and five stakeholders (reviewer, author, team, those in charge, organization), each with an implicit "contract" of responsibilities — most review dysfunction traces back to one of these contracts being ignored, not to a missing tool.

## Frameworks Introduced
- **Human-led vs. tool-facilitated vs. hybrid review systems**: human-led (synchronous, in-person/pairing) is fast and great for mentoring but weak on documentation and distributed teams; tool-facilitated (PR-based) scales across distributed teams and integrates with CI/CD but is slower (async) and can introduce tool-friction; hybrid is what most real teams land on.
  - When to use: pick based on team size/location/regulatory needs, not habit — re-evaluate as the team grows or goes remote.
- **The 4-part modern code review workflow**: new/changed code → review requested → during-review feedback/resolution cycle → signoff. Everything in the book's PR-based workflow maps onto this.
  - How: use it as a checklist when a review process feels broken — which of the 4 parts is missing or badly defined?
- **PR title categorization prefixes** (`feat:`, `fix:`, `docs:`, `chore:`, `breaking:`, optionally with a `(component)` scope): puts the reviewer in the right mindset before they read a line of code, enables changelog automation, and makes PR history searchable.
  - How: enforce a small, fixed prefix vocabulary as a team; keep titles under ~80 chars (a legibility guideline dating to punch cards/VT52 terminals, still relevant for truncation in narrow UI columns).
- **The five participant contracts** (reviewer, author, team, those in charge, organization) — see cheatsheet.md for the full tables. Two principles anchor the reviewer's: *you have influence* (so leave ego out, question the code not the person) and *you are responsible for what passes through your review* (so no rubber-stamp LGTMs). Two anchor the author's: *be your own first reviewer* and *make your PR manageable* (see PR-size numbers below).
- **DORA's four metrics** (deployment frequency, mean change lead time, mean time to restore, change failure rate): the standard, industry-validated way to argue "our review process needs to change" with numbers instead of vibes, and to benchmark a team as elite/high/medium/low performing.
  - When to use: when a team or organization is skeptical that code review process changes are worth the time — measure before/after on these four axes.

## Key Concepts
- **Fagan inspection**: Michael Fagan's 1976 IBM formal code inspection — 3-6 people in fixed roles (moderator, reviewer, reader, author, optional observer), in-person, reviewing up to 250 LOC; historical ancestor of the modern PR review, cut IBM's defect rate by two-thirds.
- **PR / MR**: pull request (GitHub term) / merge request (GitLab term) — same concept, the mechanism for proposing reviewable changes.
- **Draft PR state**: signals "not ready to review yet" — either genuinely WIP, or a deliberate early request for feedback on a prototype/approach.
- **LGTM ("looks good to me")**: the approval shorthand the book's title plays on — used earnestly when meant, used lazily when a reviewer rubber-stamps without real review.
- **Break-glass procedure**: a team's sanctioned steps for bypassing the normal review process in a genuine emergency (formalized further as the Emergency Playbook, ch. 10).

## Mental Models
- Think of the PR title as an "elevator pitch" — if a reviewer needs the description to know *what* changed, the title has failed; the description's job is only the *why*.
- Use "would I need to be contacted on vacation to explain this?" as the bar for "PR is ready for review" — if yes, add more context before requesting review.
- Treat review size limits (below) as a proxy for reviewer attention, not a bureaucratic rule: attention measurably drops off a cliff past certain thresholds, so the numbers exist to protect review *quality*, not to satisfy a policy.

## Anti-patterns
- **Vague PR titles** (`bug fix for invoice issue`, `fix issue #1462`): force the reviewer to do research (open a linked ticket, guess at scope) before they can even start reviewing — cognitive overhead spent before the review begins.
- **The instant-approve / rubber-stamp LGTM**: often driven by real pressures (huge PRs, end-of-sprint rush, reviewer burnout) but doesn't transfer responsibility — "how did I miss that?" is still the reviewer's question to answer when approved code breaks production.
- **Gargantuan or perpetually-changing PRs**: the larger a PR, the *lower* the reviewer's incentive to actually engage with it — this is an empirically observed inverse relationship (see Worked Example), not just an impression.
- **Suggesting a "better" implementation with no backing**: a reviewer's influence is for convention/standard/context-backed suggestions; an alternative offered purely because "I'd have written it differently" is a preferential nitpick the author can reasonably decline.

## Worked Example
**The PR-title-improvement ladder.** The book walks one bug title through five revisions to show what "good" costs and buys:
1. `bug fix for invoice issue` — no info beyond "it's a fix."
2. `fix issue #1462` — reviewer must open another tab to learn anything.
3. `fix incorrect invoice calculation (issue #1462)` — better, but still needs research to picture the actual defect.
4. `fix: invoice calculates incorrectly because of decimal point being in the wrong place, causing subtotal to be wrong` — fully descriptive, but 115 characters, over the ~80-char guideline, risking truncation.
5. `fix: misplaced decimal point miscalculates invoice subtotal` — under 80 chars, categorized, and a reviewer can mentally prepare for the diff *before opening it*.

The lesson generalizes past titles: each revision trades vagueness for a small amount of authoring effort, and the entire cost is paid once by the author instead of repeatedly by every reviewer who opens the PR.

## Key Takeaways
1. A code review process is only as strong as its weakest stakeholder contract — when a review "isn't working," diagnose which of the five (reviewer/author/team/those-in-charge/organization) is failing its obligations before changing tools.
2. PR size has a measured, inverse relationship with review quality: keep PRs under ~500 LOC and ~20 files changed; budget review sessions in 25–45 minute bursts (never past 60).
3. A reviewer's two non-negotiables: leave ego out (review the code, not the person) and take responsibility for what you approve — "I was busy/tired" doesn't transfer blame for a rubber-stamped bug.
4. An author's job starts before the PR opens: self-review first, keep it small, and make it context-complete enough that "you are not your code" is easy to actually believe when feedback lands.
5. DORA's four metrics turn "our reviews need to change" from an opinion into a measurable, benchmarkable claim (elite/high/medium/low performance bands exist for all four).

## Connects To
- **Ch 4**: The Team Working Agreement is where a team codifies review states, size limits, and tempo decisions from this chapter into an explicit, living document.
- **Ch 6**: Comment craft is the practical "how" behind the reviewer's contract's "leave your ego at the door, focus on the code."
- **Ch 8**: Directly extends the PR-size guidance here into concrete tactics for shrinking/splitting large reviews.
- **Ch 10**: The Emergency Playbook formalizes the "break-glass procedure" mentioned under the team's contract.
