# Chapter 3: Building your team's first code review process

## Core Idea
Building (or overhauling) a code review process from scratch is a 4-stage, team-decided process — establish goals, choose tools, set guidelines, refine over time — and every later chapter in the book plugs into one of these four stages.

## Frameworks Introduced
- **The 4-stage process**: (1) Establish goals → (2) Choose tools/workflow → (3) Set guidelines → (4) Refine.
  - How: run each stage as an explicit team conversation with a documented "outcome," not an implicit assumption. Pilot on small changes first.
- **Five candidate code review goals**: finding bugs (debated — most defects reviewers actually catch are the kind unit tests miss, e.g. right-shaped-but-wrong-source-of-data bugs, not the kind test suites are built to catch), codebase stability/maintainability (the recommended starting goal for most teams), knowledge transfer + knowledge sharing (transfer = deliberate, sharing = ambient/accessible), mentoring, recordkeeping/chronicling.
  - When to use: pick 1 (codebase stability/maintainability is the suggested first goal), add a second (recordkeeping) once the first is habitual — don't try to optimize for all 5 simultaneously from day one.
  - How to pick per goal: use your team's DORA rating (ch. 2) as a diagnostic — Low/Medium teams should prioritize bug-finding and stability; High/Elite teams may already have those covered and can focus on knowledge transfer or mentoring instead.
- **Blocking vs. non-blocking issues**: decide *in advance*, as a team, which categories of problem are allowed to stop a merge. Non-blocking (typically): style preference, minor formatting, doc nitpicks, missing-but-optional features, minor refactors, unrelated improvements. Blocking (typically): core functionality gaps, security issues, major convention violations, code smells, regressions, performance issues, failing tests.
  - Why it works: pre-agreeing the boundary turns "should this block the PR?" from a live argument into a lookup, which is exactly what prevents review-time friction and disagreement.
- **Discussion → Decision → Dissemination**: the only sanctioned way to change an established review process. Discussion happens at scheduled "refinement checkpoints" (end of sprint, end of major feature, end of quarter/year, post-incident); Decision requires the whole team comfortable with the change (no one blindsided later); Dissemination is 5 concrete steps: update the TWA, reconfigure tooling, update automation, announce it, and patiently remind stragglers.
  - When to use: any time a part of the process "no longer works" — this is the sanctioned channel, not an individual unilaterally deciding to skip a step.

## Key Concepts
- **Vacation Factor (a.k.a. Bus Factor)**: the minimum number of team members who could disappear before a project stalls from lost tacit knowledge. Knowledge transfer/sharing as a review goal directly reduces this risk.
- **Informational Reviewer (a.k.a. Optional Reviewer)**: someone added to a PR purely for knowledge-sharing exposure — their approval is optional, but they're expected to acknowledge they looked. A staged path (informational → full approver after ~2-4 months) is a concrete onboarding mechanism.
- **Refinement checkpoint**: a scheduled, dedicated time slot for proposing process changes (vs. relying on someone remembering to bring it up ad hoc).
- **Reviewer pool**: the set of people with PR-approval permission — deciding who's in it (juniors? managers? other teams?) is itself a guideline worth setting explicitly.

## Mental Models
- Use "does figuring this out in advance save us an argument later?" as the test for what belongs in your guidelines (blocking/non-blocking issues, approver count, workflow steps) — guidelines exist to convert live disagreements into lookups.
- Treat your first guideline document as a draft of the Team Working Agreement (ch. 4), not a separate artifact — it graduates rather than getting replaced.

## Anti-patterns
- **Artificially inflating the reviewer pool "for coverage"**: reviewers without context or ownership buy-in are less motivated to prioritize the review, and a large pool makes it easier for any one developer to pass the review off to someone else.
- **Treating tool limitations as process requirements**: e.g. accepting a rigid 2-approver policy that can't flex for emergencies just because the tool can't express a conditional policy — the Worked Example below is exactly this trap, solved instead of accepted.
- **Skipping "Dissemination"**: a decision the whole team agreed to still fails if it isn't written into the TWA, the tooling, and announced — silent process changes reliably reintroduce the friction the change was meant to fix.

## Worked Example
**Scenario 2: requiring a minimum of two approvers, hit by an emergency.** A team's policy (2 approvers required, tool-enforced) starts causing real delays when key teammates are out during a string of production incidents — the 2-person minimum can't always be met. The team is split: relax to 1 approver generally (feels too drastic, weakens the process for the 95% of PRs that aren't emergencies) vs. keep it as-is (real, recurring delay cost).

- **Discussion** surfaces the real constraint: the tool can't express "2 approvers normally, 1 in emergencies" as a single policy — one policy must be chosen for all PRs.
- **Decision**: allow the *author* to count as a second approver, but only on PRs tagged `emergency`, with a mandatory logged justification (a bug-report link suffices in emergencies; anywhere else, the justification is a permanent record, which itself discourages misuse). This is a narrowly-scoped exception, not a blanket policy relaxation.
- **Dissemination**: the TWA is updated with the new rule and its justification; the tool is reconfigured (new `emergency` tag, self-approval allowed only with the justification prompt); the Emergency Playbook (ch. 10) gets a new entry documenting the exact steps for next time.

The generalizable move: when a tool's limitation forces an all-or-nothing choice, look for a narrowly-scoped, auditable exception (a tag + a mandatory justification trail) instead of either accepting the status quo or loosening the rule for everyone.

## Key Takeaways
1. Pick one starting goal (codebase stability/maintainability, for most teams) rather than trying to satisfy all five goals from day one; add a second goal only once the first is habitual.
2. Decide blocking vs. non-blocking issues *before* they come up in a real review — this single guideline prevents the most common category of review-time argument.
3. A minimum-two-approvers policy is a reasonable, commonly-cited default, but build in an explicit, audited emergency exception rather than letting real incidents force an ad hoc, unrecorded workaround.
4. Process changes go through Discussion → Decision → Dissemination, always — a decision the whole team agreed to still needs updated docs, updated tooling, and an announcement, or it quietly stops applying.
5. Refinement checkpoints (sprint end, quarter end, post-incident) turn "we should really fix that someday" into a scheduled, recurring conversation instead of a complaint that never gets addressed.

## Connects To
- **Ch 2**: DORA metrics (Low/Medium/High/Elite) are the diagnostic this chapter uses to help a team pick which of the 5 goals to prioritize first.
- **Ch 4**: The guidelines document from this chapter (workflow, review focus, blocking issues, approver policy) is the direct precursor to the Team Working Agreement.
- **Ch 10**: The Emergency Playbook is where an emergency-approval exception like the Worked Example gets formally documented for reuse.
