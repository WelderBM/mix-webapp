# Chapter 4: The Team Working Agreement

## Core Idea
The Team Working Agreement (TWA) is the mechanism that turns a team's implicit, individually-varying expectations about code review ("what's a reasonable response time," "do nitpicks block a PR," "can I approve my own code") into an explicit, version-controlled, collectively-owned document — most code review interpersonal conflict traces back to an expectation that was never made explicit, not to bad faith.

## Frameworks Introduced
- **TWA scope rule**: "Anything that can be automated, should be — the TWA is for everything else." Automation (ch. 5) handles the objective and enforceable; the TWA handles the social and behavioral.
  - How: before adding a policy to the TWA, ask "could a linter/CI check/tool setting enforce this instead?" If yes, automate it and don't put it in the TWA.
- **Issue-severity triage: obvious / expected / tough**: obvious issues (TODOs, lint, forgotten `console.log`, style) should *never* reach a human reviewer — catch them with prechecks; expected issues (readability, naming, edge cases, test coverage) are what reviewers should actually spend their time on; tough issues (PR too large, wrong architecture, misunderstood requirements) should ideally be prevented before the PR even exists via earlier discussion, because finding them at review time forces a costly rework-vs-accept-debt decision.
  - How: if the same "obvious" issue recurs 3+ times despite prechecks, that's the signal to add a new lint rule rather than keep relying on human reviewers to catch it.
- **Discussion → Decision → Dissemination for the TWA itself**: propose changes via a PR to the TWA's own repo; unlike regular code PRs, TWA changes need the *whole team's* approval, not the usual approver count — because everyone is bound by it.
- **DORA-informed response-time setting**: use deployment frequency, change lead time, and change failure rate (ch. 2) to decide whether your review turnaround is actually a bottleneck worth codifying a stricter response time for, rather than picking a number arbitrarily.

## Key Concepts
- **Living document**: the TWA is deliberately never "finished" — ease of revision is a design requirement, not an afterthought, because a TWA that's hard to change gets ignored and then neglected.
- **Nitpick**: "to criticize by focusing on inconsequential details" — a comment that neither improves nor harms the codebase (spacing, personal naming taste). Should be labeled as such and must never block approval.
- **Self-approving a PR**: skipping the review entirely by approving your own code — allowed *only* as a documented, logged, Emergency-Playbook-linked exception, never a norm.
- **Bookend meetings**: two touchpoints a day (one per team's morning) used by distributed/offshore teams with less than ~7 hours of time-zone offset, to keep a same-day feedback loop alive across the gap.

## Mental Models
- Treat the TWA as "our team's constitution for how we treat each other during review" rather than a technical spec — its hardest, most valuable content is behavioral (response times, nitpick handling, code of conduct), not technical.
- When a scenario feels like "everyone should just know this," that feeling is itself the signal it belongs in the TWA — implicit expectations vary wildly between individuals even on the same team.

## Anti-patterns
- **Blocking approval over nitpicks**: the book takes an unusually firm stance here — never withhold approval for something that "neither improves nor deteriorates the codebase." A reviewer using a nitpick to gatekeep unrelated to code quality erodes trust (see Worked Example).
- **Treating self-approval as "no big deal"**: teams without a documented exception process drift toward normalizing it, which quietly defeats the entire review process — the fix is a *narrow*, logged, Emergency-Playbook-linked exception, not a blanket allowance.
- **A TWA that's hard to change**: if updating it requires ceremony disproportionate to a normal code change, teams stop bothering, and an unmaintained TWA is worse than no TWA (it looks authoritative but is stale).

## Worked Example
**Scenario 3: to approve or not to approve.** Jimmy reviews Jana's PR and leaves 35 comments, mostly nitpicks (a missing line break, indentation). Jana accepts most but ignores the nitpicks; Jimmy restores those comments and refuses to approve until his style preferences are met. Jana is (rightfully) frustrated — Jimmy is using reviewer influence to enforce personal taste, not team-agreed standards.

The TWA fix has three parts: (1) a **style guide + auto-formatter** eliminates most of this class of comment before a human ever sees the diff; (2) an explicit TWA policy stating **nitpicks never block approval** — label them as nitpicks, and address-or-ignore is the author's call; (3) a clear distinction in the TWA between *withholding approval* (a delay, still fixable) and *rejecting a PR outright* (a harder no), so "I won't approve until my personal style is honored" is recognizable as a violation of the reviewer's contract (ch. 2), not a valid use of reviewer influence.

The book cites a real experiment (Dan Lew) where a team banned nitpick comments entirely for a month: the signal-to-noise ratio of PR comments improved, and so did people's relationship with code review — because a PR with 4 nitpicks + 1 real bug tends to bury the bug under the noise of fixing trivia first.

## Key Takeaways
1. Automate everything that can be automated (ch. 5); reserve the TWA for what genuinely needs human agreement — behavior, response times, and judgment calls.
2. Triage review-time issues into obvious (should never reach review — precheck it), expected (what reviewers should actually spend time on), and tough (should ideally be prevented earlier via better upfront discussion, not found at review time).
3. Nitpicks should never block a PR — label them, let the author decide, and let automation (formatter/linter) catch most of them before a human ever sees them.
4. Self-approval is a documented, narrow, Emergency-Playbook-linked exception, never a norm — the moment it's "no big deal," the review process is already compromised.
5. A TWA only works if it's genuinely easy to change (version-controlled, PR-based, whole-team-approved) — friction to update it is friction toward neglecting it entirely.

## Connects To
- **Ch 3**: The guidelines document built there (workflow, review focus, blocking/non-blocking, approver policy) is the literal first draft of the TWA.
- **Ch 5**: Automation is the TWA's complement — everything the TWA *doesn't* need to say because a tool already enforces it.
- **Ch 8**: Response-time bottlenecks and single-approver dependency get a full deep dive there.
- **Ch 10**: The Emergency Playbook is where the self-approval exception process gets formally documented.
