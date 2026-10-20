# Patterns — Looks Good to Me

## 5P Process (Pause, Ponder, Pass/Propose/Postpone)
**When to use**: any time you're about to leave a review suggestion and aren't 100% sure it's warranted.
**How**: Pause before writing the comment. Ponder — what prompted this, can you justify it objectively? Then choose: Pass (drop it), Propose (write it, now justified), or Postpone (note it for a team discussion or an offline chat, don't block this PR on it).
**Trade-offs**: adds a beat of friction to commenting, but prevents "review creep" and unjustified preference dressed as feedback. (Ch 6)

## Triple-R Comment Pattern (Request, Rationale, Result)
**When to use**: composing any review comment that asks for a change.
**How**: Request — one sentence, what you want done. Rationale — why, ideally with a link (ticket, convention, TWA section). Result — a measurable end state the author can check their change against.
**Trade-offs**: more upfront writing effort for the reviewer, but reduces back-and-forth and misinterpretation; pays for itself on anything beyond a trivial fix. (Ch 6)

## MMG Exchange (Maintainable Middle Ground)
**When to use**: an author/reviewer disagreement over something that feels subjective (naming, clarity) where both sides have a defensible position.
**How**: keep tone professional → acknowledge and open a direct discussion → both explain reasoning/goals → look for a combined/modified solution → escalate to the wider team if still stuck → team (including future readers) decides.
**Trade-offs**: takes real synchronous time; skipping it in favor of "just outlasting" the other side reliably breeds resentment instead. (Ch 6)

## Comment Signals
**When to use**: any team wanting a lightweight, at-a-glance way to tell authors whether a comment blocks the PR.
**How**: adopt a small label vocabulary (e.g., `needs change:`, `needs rework:`, `align:`, `levelup:`, `nitpick:`), define what each means and whether it blocks by default, and put it in the TWA.
**Trade-offs**: simpler and more customizable than MoSCoW or Conventional Comments, but only works if the team actually agrees on and uses the definitions consistently. (Ch 6)

## Politeness Principles (we not you; ask don't command)
**When to use**: every review comment, especially ones requesting a change.
**How**: replace "you should move the Vehicle class" with "can we move the Vehicle class?" — reframe as team-owned, and phrase as a question not an order.
**Trade-offs**: none really — cheap wording change with a direct empirical link to reduced review toxicity. (Ch 6)

## Baseline-Workflow Exercise
**When to use**: suspecting "the process" means different things to different people on a team, or hunting for hidden loopholes.
**How**: draw the assumed workflow → team confirms/adjusts at a high level → observe against it for a set period, noting friction → consolidate duplicate observations into named weaknesses → walk through weaknesses one at a time, deciding and recording a fix before moving to the next.
**Trade-offs**: takes a full observation cycle (a sprint/quarter) and several discussions; skipping straight to a fix without this tends to miss the real, hidden weakness. (Ch 9)

## Discussion → Decision → Dissemination
**When to use**: any change to an established code review process, guideline, or TWA entry.
**How**: Discussion at a scheduled refinement checkpoint (sprint/quarter/post-incident) → Decision once every concern's been heard and the whole team is comfortable → Dissemination: update the TWA, reconfigure tooling, update automation, announce it, patiently remind stragglers.
**Trade-offs**: slower than one person unilaterally changing the rule, but the alternative (silent process drift) is what causes loopholes and inconsistent enforcement. (Ch 3, Ch 9)

## Feature-Breakdown Strategies
**When to use**: a feature or its resulting PR is turning out too large to review well.
**How**: spell out acceptance criteria explicitly; separate UI from business logic into their own stories; use feature flags to ship atomic slices safely; separate integration/"wire it together" work from isolated detail work; never mix refactoring with feature work in the same PR.
**Trade-offs**: requires planning-phase discipline — these fixes are cheap before work starts and expensive to retrofit once a giant PR already exists (cherry-pick/rebase are the fallback, not the plan). (Ch 8)

## Offline-Conversation Protocol
**When to use**: a review has generated a pile of unresolved questions, a major-rework finding, or a second round of feedback that still isn't addressed.
**How**: stop replying async; leave a PR comment stating an offline conversation is starting; have the real-time conversation; leave a second PR comment summarizing the outcome.
**Trade-offs**: forgetting the "bookend" comments turns the resolution into siloed tribal knowledge — the two comments are not optional. (Ch 8)

## Automation Split: Before-the-Review / During-the-Review
**When to use**: deciding where to invest automation effort first.
**How**: before — formatting, linting, static analysis, automated testing, all running during development. During — PR templates, PR validators, CODEOWNERS-based assignment, PR gate checks, automated reminders/escalations.
**Trade-offs**: before-the-review automation has the best ROI and should come first; during-the-review automation matters more as team/PR volume scales. (Ch 5)

## Emergency Playbook 4-Part Structure
**When to use**: building a bypass procedure for genuine emergencies, before one is ever needed.
**How**: (1) a strict decision tree biased toward "no"; (2) a short, named authorization list + invocation steps; (3) an explicit, time-boxed bypass mechanism (single approver → manager approver → justified self-approval → no approver, least to most risky); (4) mandatory next steps: documentation (EPER), communication, postincident analysis.
**Trade-offs**: deliberately "intentionally tedious" by design — friction is the safeguard against the bypass becoming a habit. (Ch 10)

## AI Confidence Graduation (Low → Medium → High)
**When to use**: adopting any AI-powered code review tool.
**How**: Low — lenient, non-blocking first-pass suggestions only, track accuracy. Medium — suggestions taken seriously but human-overridable, graduate once correctness passes ~90%. High — accurate enough that flagged issues can legitimately block a PR.
**Trade-offs**: skipping straight to High trust before the tool has learned your codebase's conventions is how false positives/negatives cause real damage (blocked PRs on non-issues, missed real ones). (Ch 13)

## Mob-Programming Integration Approaches
**When to use**: deciding how to fold mob programming into a workflow without over-committing.
**How**: "Agree and then split" (mob on design agreement, split into individually-reviewed work) for major refactors/architecture; "Into the void" (mob only when the whole team is unfamiliar with the problem) for new domains; "Capture and chronicle" (mob as default, lightweight PR to document why) when mobbing is the norm; "Mob code review" (team reviews together) for oversized/urgent PRs or junior-author PRs.
**Trade-offs**: each approach trades meeting time for either better initial design, faster ramp-up on the unknown, or spread-out review load — pick based on which bottleneck you actually have. (Ch 12)
