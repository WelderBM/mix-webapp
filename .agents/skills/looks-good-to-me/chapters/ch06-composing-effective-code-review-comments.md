# Chapter 6: Composing effective code review comments

## Core Idea
Effective code review comments are objective (traceable to a fact, not a preference), specific (clear about what needs to change and where), and outcome-focused (clear about what "done" looks like) — and the book gives named, reusable frameworks for each of the three.

## Frameworks Introduced
- **The 5P process** (objectivity, before commenting): Pause → Ponder → then **Pass** (suggestion doesn't hold up, drop it), **Propose** (it's valid, write it), or **Postpone** (worth discussing, but not now — note it for a team discussion or take it offline). Forces a reviewer to justify a suggestion to themselves before posting it.
  - When to use: every time you're about to leave a "wouldn't it be nice if..." or "I would have done X" comment.
- **MMG Exchange (Maintainable Middle Ground)** — for resolving disputes where both author and reviewer have a defensible but opposing "objective" opinion (e.g., "your naming is confusing" vs. "no it isn't"): (1) tone stays professional regardless of disagreement, (2) acknowledge the concern and open a discussion, (3) both sides explain their reasoning/goals, (4) look for a combined or modified solution, (5) escalate to the wider team if no middle ground emerges, (6) the team (including future readers) decides, not either original party.
  - How: use once a back-and-forth on a subjective-feeling disagreement has gone in circles — it's the escalation path *before* it becomes a stalemate.
- **Comment signals**: a small, team-defined label vocabulary that tells the author, at a glance, whether action is required. The book's own team settled on: `needs change:` (small fix, single commit), `needs rework:` (larger rework, likely needs an offline discussion), `align:` (technically valid but violates team convention — blocks by default), `levelup:` (nonblocking improvement suggestion for a future PR), `nitpick:` (pure preference, never blocks).
- **MoSCoW comments** (`M:`/`S:`/`C:`/`W:` = Must/Should/Could/Would): borrowed from project-management prioritization. The book explicitly reports this system *failing* for the author's own team — the Must/Should and Should/Could boundaries were too blurry and caused arguments about categorization instead of about the code. Reported as a real, own-team failure, not just a "consider this" option.
- **Conventional Comments** (`<label> [decorations]: <subject>` + optional discussion, from conventionalcomments.org): a more elaborate external standard with labels `suggestion`, `issue`, `praise`, `todo`, `question`, `thought`, `chore`, `note`, `nitpick`, plus decorations like `(blocking)`, `(non-blocking)`, `(if-minor)`, or an area-of-focus tag like `(security)`/`(ux)`. More granular than the book's own comment-signal system; useful for teams with a wider stack or that want an established external standard rather than inventing their own.
- **The Triple-R pattern** (for requesting a change): **Request** (one sentence, what you want done) → **Rationale** (why, with links/references) → **Result** (a measurable end state to compare against). Directly combats vague, unjustified "please change this" comments.
- **The two Politeness Principles**: (1) replace "you" with "we" ("We should move the Vehicle class" vs. "You should move...") — reframes code quality as shared team responsibility, not a personal jab; (2) ask, don't command ("Can we move..." vs. "Move..."). Grounded in a real research finding: the second-person pronoun "you", especially *sentence-initial* "you", is statistically over-represented in comments independently labeled "toxic."

## Key Concepts
- **Subjective comment**: feedback that can't be traced to a ticket, convention, or objective standard — pure personal preference dressed up as a code suggestion. The chapter's central thing to eliminate.
- **Review creep**: extra changes or scope introduced during the review that fall outside the PR's original intent — one of the costs the 5P process and MMG Exchange are designed to prevent.
- **Transformation verbs**: concrete, state-changing verbs (rename, remove, consolidate, rewrite, move) that make a request's action unambiguous — contrasted with vague verbs that don't specify an end state. Comments rich in transformation verbs were empirically found more "useful" in a cited study.
- **Code compliment**: genuine, specific positive feedback ("what an elegant solution") — the book explicitly recommends using these in moderation (over-praising dilutes impact) except for interns/juniors, where generous praise is explicitly the right call.

## Mental Models
- Before any suggestion, ask "why do I want this?" — if you can't articulate an objective reason (ticket, convention, measurable benefit), it's a Pass, not a Propose.
- Treat "we" instead of "you" as a structural fix, not just politeness — it encodes that codebase quality is a team property, consistent with ch. 1's framing of code review as a team sport.
- A comment without a clear result to check against is an unfinished thought — the Triple-R's "Result" step is what actually lets an author know when they're done.

## Anti-patterns
- **Leaving an unsupported "better implementation" suggestion**: if you can't explain *why* your alternative is better (faster, more conventional, more testable) with something concrete, it's a preference, not a suggestion — the same principle as ch. 2's reviewer contract ("influence backed by fact, not taste").
- **Vague top-level comments for a repeated problem**: if the same 3 lines of repeated code appear in 5 places, comment on each instance individually rather than one abstract top-level note — precision over convenience.
- **Sentence-initial "you"**: the single most reliable textual marker the cited research found for toxic code-review comments — worth treating as close to a hard rule to avoid.
- **Adopting MoSCoW without testing the fit first**: the book's own team tried it, found the categories didn't map cleanly onto their actual comment types, and it produced *more* arguments (about categorization) rather than fewer — evaluate fit before committing, and be willing to abandon a borrowed system that isn't working (as they did, switching to home-grown comment signals).

## Worked Example
**The `AuthenticateUser()` move, told three ways.** The chapter shows the same kind of request (move a method into a shared library) composed at increasing quality:
- *Vague/unhelpful*: "This could go somewhere else." (no reason, no target, no verb)
- *Objective but plain*: "The `SanitizeCustomerInput()` method could go into our utils library. Since it's reused more than three times, it should probably go into our utils library with our other reusable methods. This also follows our coding convention for repeating methods." — traceable to a rule (reuse threshold) and a TWA convention.
- *Full Triple-R*: **Request** — "Can we move `AuthenticateUser()` into our `AuthenticationUtilities` library?" **Rationale** — "Similar methods already live there (`ReauthenticateUser()`, `AuthenticateThirdPartyUser()`); it's called more than a few times; our TWA [link] requires authentication behavior to live in that library." **Result** — "After this change, calls to `AuthenticateUser()` should go through the library rather than a standalone declaration."

The pattern generalizes: an effective comment answers *what* (request), *why* (rationale, ideally with a link), and *how will we know it's done* (result) — skipping any one of the three is what creates back-and-forth and delay.

## Key Takeaways
1. Before posting a suggestion, run the 5P process — Pause, Ponder, then Pass/Propose/Postpone — to filter out unjustified preference dressed as feedback.
2. Adopt *some* comment-labeling system (comment signals, MoSCoW, or Conventional Comments) so authors instantly know if action is required — but pilot it and be willing to abandon it if the categories don't fit your team's actual comments (as the book's own team did with MoSCoW).
3. Use the Triple-R pattern (Request/Rationale/Result) for any comment requesting a change — it's the concrete recipe behind "be objective, specific, and outcome-focused."
4. Swap "you" for "we" and commands for questions — small wording changes with an actual empirical link to reduced toxicity in review comments.
5. When a disagreement over a "clarity"-style judgment call stalls, use the MMG Exchange rather than letting either side simply outlast the other — and don't hesitate to bring in the wider team as a tiebreaker.
6. Genuine code compliments are underused — use them sparingly for real standouts (to keep signal strong) and generously for juniors/interns (where the goal is confidence-building, not signal).

## Connects To
- **Ch 2**: The reviewer's contract ("don't abuse your influence," "back suggestions with facts") is the principle this chapter operationalizes into concrete comment patterns.
- **Ch 4**: Comment-signal vocabularies and nitpick handling should be codified in the TWA so the whole team uses them consistently.
- **Ch 7**: Poor comment tone/quality is a direct contributor to the "mean code review" pain point discussed there.
