# Cheatsheet — Looks Good to Me

## Decision rules

- When a suggestion pops into your head → run the 5P process. If you can't articulate an objective reason, **Pass**, don't post it.
- When a comment requests a change → use Triple-R (Request/Rationale/Result). No Result = the author can't tell when they're done.
- When you're about to write "you" at the start of a sentence → stop, rewrite as "we," and check if it's a command — rephrase as a question.
- When back-and-forth on a PR exceeds ~2 rounds without convergence → stop replying async, have a real-time conversation, bookend it with two PR comments (starting it, then the outcome).
- When a PR exceeds ~500 LOC or ~20 files → split it before requesting review, not after.
- When an "emergency" is proposed → check it against your decision tree first. Deadlines and planned PTO are **not** valid emergency triggers by default; security incidents, active revenue loss, and compliance deadlines usually are.
- When a metric (review time, approval rate, PR count) is used to judge an **individual** → stop. Metrics are a team-level trend signal, never an individual compliance target.
- When adopting an AI review tool → start at Low confidence (non-blocking suggestions only); only promote to Medium once correctness is tracked and roughly ≥90%; only reach High once the team would actually block a PR on its findings.

## Thresholds & defaults

| Thing | Default / threshold |
|---|---|
| PR size | < 500 lines of code, < 20 files changed |
| Reviewer approvals required | 2 minimum (never the author) |
| Reviewer session length | 25–45 min bursts, never past 60 min |
| Pair programming session | 3–4 hours/day max; start with 30–60 min |
| Mob programming group | 3+ to count as mobbing; whole dev team as starting point |
| AI tool trust promotion | ~90% correctness before Low → Medium |
| PR response time | team-specific (2–4h co-located; 24–36h distributed; ~48h fully remote) — set explicitly in the TWA |
| Recurring "obvious issue" | 3+ occurrences → add a lint/gate-check rule instead of tolerating manual catches |

## Trade-off matrix: pairing vs. mobbing vs. code review

| Dimension | Pair programming | Mob programming | Code review |
|---|---|---|---|
| Speed of knowledge sharing | Real-time, 2 people | Real-time, whole group | Slow, async |
| Historical record produced | No | No | Yes (the durable artifact) |
| Unbiased perspective | Weak (2 agree with each other) | Weaker still (groupthink risk) | Strong (neutral reviewer) |
| Scope of review | Narrow (task at hand) | Narrow-to-medium | Can assess wider codebase fit |
| Best for | Complex/unclear problems, onboarding | Team-wide unfamiliar problems, major design alignment | Every change, always |

## Blocking vs. non-blocking issues (default split)

| Blocks the PR | Does not block |
|---|---|
| Core functionality gap | Style preference |
| Security vulnerability | Minor formatting |
| Major convention violation | Documentation nitpick |
| Code smell / anti-pattern | Missing optional feature |
| Regression | Minor refactor opportunity (separate PR) |
| Performance issue | Unrelated improvement (separate PR) |
| Failing tests | — |

## Tells & smells

- Reviewer gives an unsupported "I would have done it differently" → it's a nitpick/preference, not a valid suggestion — needs an objective backing (convention, metric, ticket) or it doesn't belong in the review.
- A PR keeps growing new commits mid-review ("moving target") → stop reviewing, ask the author to signal true readiness before continuing.
- Approvals landing within minutes of every PR opening → check for a "buddy system" or chat-based rubber-stamp loophole, not genuine review.
- The same "obvious" issue (stray `console.log`, missing space) recurring → automation gap, not a reviewer-diligence gap.
- A comment starts with "You..." → highest-correlation marker of a toxic review comment in the cited research — rewrite before posting.
- Team can't agree on what a Must vs. a Should comment is → sign the category system (MoSCoW) isn't fitting your team; consider comment signals instead.
- "It's OK, it's an emergency" said more than once about the same kind of situation → the bypass is becoming a habit; tighten the Emergency Playbook's decision tree.
