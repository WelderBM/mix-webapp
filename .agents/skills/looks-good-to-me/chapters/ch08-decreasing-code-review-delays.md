# Chapter 8: Decreasing code review delays

## Core Idea
Almost every category of code review delay traces back to a lack of clarity or due diligence somewhere *before* the review — the fix for a slow review is almost never "review harder," it's fixing the planning, PR-prep, or team-structure gap that made the review slow in the first place.

## Frameworks Introduced
- **The "single senior developer reviewer" problem, and its fix**: bottleneck forms when one senior developer is the de facto required reviewer for everything. Fix has three parts: (1) *anyone* on the team should be able to approve a PR, with equal weight — backed by automation/safeguards (ch. 5), not seniority, as the actual safety net; (2) not all PRs should default to the senior developer — route routine changes to spread expertise; (3) if assigned a PR outside your familiarity but within your team's real or plausible-future scope, treat it as a forced learning opportunity rather than reassigning it away — reassigning it just perpetuates the bottleneck.
- **The offline-conversation protocol**: once a review has generated too much back-and-forth (a pile of questions, a major-rework finding, or comments the author's update still doesn't address), stop replying asynchronously — take it to a real-time conversation instead. Mandatory bookends: (1) leave a PR comment stating an offline conversation is starting, (2) after it, leave a second PR comment summarizing the *outcome* — otherwise the resolution becomes siloed knowledge invisible to the rest of the team.
  - When to use: as soon as you notice you're writing more question-comments than it would take to just message the person, or a second round of feedback still hasn't landed.
- **Feature-breakdown strategies** (for "the feature itself is too large" before a PR ever gets opened): spell out acceptance criteria explicitly (vague scope grows scope); separate UI from business logic (frontend/backend as separate stories); use feature flags to ship atomic slices of an otherwise-indivisible feature safely; separate integration-detail work from the final "wire it all together" PR; separate refactoring from feature work entirely (never mix them in one PR).
- **Review milestones**: a middle path between full pair programming and a single final review — scheduled check-ins at team-defined intervals (after initial implementation, halfway to deadline, right before the final PR, or every commit for someone needing heavy guidance) to catch drift early, especially for developers new to the team's conventions or to programming itself.

## Key Concepts
- **Atomic PR/feature**: a change scoped to a single logical purpose — the target state that acceptance-criteria clarity and UI/business-logic separation are both aiming to produce.
- **Cherry-pick / rebase as after-the-fact fixes**: if a large PR has *already* been opened, `git cherry-pick` can extract self-contained atomic commits into their own branch/PR after the fact; `git rebase` can reorganize history into more meaningful atomic chunks — both are recommended as a recovery path, not a substitute for planning smaller from the start.
- **Impromptu mob code review**: calling the whole team together to jointly review an unavoidably large or critical PR, with the author first giving a guided "tour" of what's critical vs. safely skippable.

## Mental Models
- Treat a slow review as a symptom, not the disease — trace it back to its actual source: missing acceptance criteria (design-phase gap), an unprimed PR (author-diligence gap), an oversized feature (planning-phase gap), or a bottlenecked reviewer pool (team-structure gap).
- "If not now, when?" — the book's explicit framing for why you shouldn't reassign an unfamiliar-but-in-scope PR away from yourself: the learning curve you're avoiding today is one you'll face eventually anyway, on a worse timeline.
- Treat "due diligence is part of the job" as the antidote to "I just write code" — properly preparing a PR (context, atomic scope, clear commit story) is professional work, not overhead layered on top of the real work.

## Anti-patterns
- **Letting confusion fester asynchronously**: piling up clarifying questions in PR comments rather than just calling the author — the async back-and-forth costs more total time than a single real-time conversation would.
- **Forgetting to update the PR after an offline conversation**: the conversation might resolve the confusion, but if the outcome isn't written back into the PR, the decision becomes tribal knowledge only the two participants have — a direct contributor to the "Vacation/Bus Factor" (ch. 3).
- **Mixing refactoring into a feature PR**: makes an already-hard-to-review change harder, and obscures which changes are "cleanup" vs. "new behavior" — always split them into separate PRs.
- **Discovering a feature is too large only at review time**: by then, the work is already done and harder to break apart — the fix belongs in the planning/design phase, not as a review-time scramble.

## Worked Example
**Splitting sorting-and-filtering.** A team habitually bundles "add sorting and filtering" into one feature because the two feel related. When the resulting PR turns out too large to review well, the fix isn't a better reviewer or more review time — it's recognizing, after the fact, that sorting and filtering were never actually one atomic unit of work. Splitting them into two tasks (and, if still too large, splitting further by sort/filter *style*) produces two reviewable, atomic PRs instead of one unreviewable one. The same lens — "did we bundle this only because it *felt* related, not because it's actually indivisible?" — generalizes to most oversized-feature situations the chapter describes.

## Key Takeaways
1. Spread PR-approval authority across the whole team, backed by automation/safeguards rather than seniority — the "single senior reviewer" bottleneck is a team-structure problem, not an inevitability.
2. When a PR generates a pile of back-and-forth, stop and have a real-time conversation — then post two PR comments (starting it, then summarizing the outcome) so the resolution isn't lost to two people's private memory.
3. Fix oversized-feature problems in the planning/design phase (clear acceptance criteria, UI/logic separation, feature flags, refactor-vs-feature separation) — by code-review time, the work is already too entangled to cheaply split.
4. If already stuck with a huge PR, cherry-pick or rebase into smaller atomic pieces, or call an impromptu mob review with the author guiding a "tour" of what matters.
5. Recurring rework cycles are usually a design/acceptance-criteria clarity problem or an onboarding gap, not a reviewer-diligence problem — use review milestones to catch drift early for developers new to the team or to programming.

## Connects To
- **Ch 2**: The author's contract (make the PR manageable and understandable) is the direct root-cause fix for "too many files" and "I don't understand the PR."
- **Ch 3/4**: Acceptance-criteria clarity and blocking/non-blocking guidelines are set at the process/TWA level, and this chapter shows what happens when they're skipped.
- **Ch 5**: The safeguards (CI, tests, automation) that make "anyone can approve" actually safe are built here.
- **Ch 11**: Review milestones sit adjacent to pair programming as a lighter-weight, scheduled alternative.
