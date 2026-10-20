# Chapter 7: How code reviews can suck

## Core Idea
A code review process doesn't stay healthy by default — over time it tends to drift into one of four recognizable failure modes (lazy, mean, shape-shifting, or stringent), and most of them trace back to the same root causes: no shared understanding of expectations, no clarity on participant responsibilities, missing automation, or poor communication — all things earlier chapters (2–6) already give the fix for.

## Frameworks Introduced
- **The four failure modes of a code review**: lazy (rubber-stamped/skipped), mean (personal, harsh, demeaning), shape-shifting (the reviewed target keeps changing underneath the reviewer), stringent (so heavy with steps/approvals that people route around it). Useful as a diagnostic vocabulary — naming which failure mode you're in points directly at which earlier chapter's fix applies.
  - How: when a team's code review "just isn't working anymore," match the symptom to one of these four categories before prescribing a fix — a mean-review problem needs ch. 6's comment craft, a stringent-review problem needs ch. 5's automation or a TWA policy trim, etc.

## Key Concepts
- **Lazy code review**: a review technically happens, but is hollow. Sub-patterns: **LGTM syndrome** (approving a huge, effectively unreviewed diff out of fatigue), **emergency bypass creep** (one justified hotfix-bypass normalizes skipping process going forward), **the biased buddy system** (friends rubber-stamping each other's PRs), **the misused chat system** (approvals farmed out to whoever replies fastest in a chat channel, not whoever actually read the diff).
- **Mean code review**: comments that attack the person, not the code — the book cites a real, unedited public PR comment as an example of what should never be written, and notes that a new contributor's first bad experience with a mean review often means they never contribute again.
- **Shape-shifting code review**: the review target itself is unstable — **stacking PRs** (a PR built on a PR built on a PR, so the reviewer can't tell what's actually in scope) and **the moving target** (new commits keep landing mid-review, repeatedly resetting the reviewer's progress and the PR's status).
- **Stringent code review**: too many mandatory steps, manual links, or approval layers turn the process into its own bottleneck — e.g. requiring manually-regenerated staging links after every fix-round, or requiring a project manager's and CTO's sign-off at every environment promotion stage. The failure mode here isn't too little rigor, it's rigor with no automation behind it.

## Mental Models
- Treat each of the four failure modes as a lagging indicator of a missing foundation, not a standalone problem to patch locally: lazy reviews point at missing team-level accountability (ch. 2's team contract) or a manager tolerating the behavior (ch. 2's "those in charge" contract); mean reviews point at missing comment-craft norms (ch. 6) and code-of-conduct guidelines (ch. 4); shape-shifting reviews point at missing PR-readiness discipline (ch. 2's author contract — "make your PR manageable/understandable"); stringent reviews point at missing automation (ch. 5) or an overloaded TWA that never got trimmed (ch. 4's "living document" principle).
- A single justified emergency bypass is not neutral — the book frames it as actively establishing precedent ("if something is urgent enough, a process can be ignored"), which is why ch. 10's Emergency Playbook insists bypasses stay rare, documented, and exceptional rather than becoming a habit.

## Anti-patterns
- **Farming out approvals to "whoever replies fastest in chat"**: satisfies the letter of an approval-count policy while completely defeating its purpose — a policy without genuine reviewer engagement is worse than no policy, because it creates false confidence.
- **Approving stacked or still-changing PRs just to "be done with it"**: a reviewer who can't tell what's actually in scope should say so and ask for the PR to be stabilized/unstacked, rather than rubber-stamping out of exhaustion.
- **Adding approval layers without automating anything else**: the "everything here goes through me" story shows that stacking more human sign-offs onto an already-manual process multiplies delay without multiplying quality — automation and trimming precede adding approvers, not the other way around.

## Worked Example
**The single-agent staging-link bottleneck.** At one of the author's past roles, deploying anything required manually running scripts to self-acknowledge checks, then generating and pasting three links per PR (a staging preview, a report log, and a separate ticket-system link, because the version-control and task-management tools weren't integrated) — and *every* round of review feedback meant regenerating and re-pasting these links from scratch. A single agent, for an organization of 120+ people, was responsible for generating those staging links, and that service would routinely time out or error. The team grew to despise the process — not because review itself was too rigorous, but because every fix-round re-triggered a slow, manual, single-point-of-failure chore that had nothing to do with actual code quality.

The generalizable diagnosis: when a process feels "too strict," check whether the friction is actually coming from *review rigor* or from unrelated manual busywork that automation (ch. 5: PR templates, linking, gate checks) should have absorbed long ago.

## Key Takeaways
1. Name the failure mode (lazy / mean / shape-shifting / stringent) before trying to fix it — each one has a different root cause and a different chapter's remedy.
2. An emergency process bypass is never "just this once" for free — it sets precedent, which is exactly why it needs to be rare, documented, and funneled through a real Emergency Playbook (ch. 10) rather than repeated ad hoc.
3. A review process that "feels too strict" is often actually a process with too much unautomated manual busywork bolted onto it, not too much genuine scrutiny — look for automation opportunities (ch. 5) before adding more approval layers.
4. Mean reviews cause disproportionate, sometimes irreversible damage — especially to new contributors and juniors, who may simply leave rather than push back.
5. A reviewer who can't tell what's actually being reviewed (stacked PRs, constantly-moving target) should say so explicitly rather than trying to power through an unstable diff.

## Connects To
- **Ch 2**: The reviewer/author/team/those-in-charge contracts are the direct antidote to lazy and mean reviews.
- **Ch 5**: Automation is the fix for stringent, manual-busywork-driven bottlenecks.
- **Ch 6**: Comment craft (objectivity, tone, the Politeness Principles) is the direct fix for mean reviews.
- **Ch 10**: The Emergency Playbook formalizes how a bypass should work so it doesn't quietly become the new normal, as in the "it's OK, it's an emergency" scenario here.
