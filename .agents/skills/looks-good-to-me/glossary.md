# Glossary — Looks Good to Me

**5P process** — Pause, Ponder, then Pass/Propose/Postpone a code review suggestion; forces objectivity before commenting (Ch 6).

**Approver pool** — the set of people with PR-approval permission on a team; deciding who's in it is itself a TWA guideline (Ch 3).

**Atomic PR/feature** — a change scoped to a single logical purpose, small enough to review well (Ch 8).

**AI hallucination** — an LLM confidently generating plausible but fabricated or wrong output (Ch 13).

**Break-glass procedure** — another name for an Emergency Playbook's bypass mechanism (Ch 4, Ch 10).

**Bus Factor / Vacation Factor** — the minimum number of team members who could disappear before a project stalls from lost knowledge (Ch 3).

**Change failure rate** — DORA metric: % of production changes that cause a failure (Ch 2).

**Change lead time** — DORA metric: time from commit to successful production run (Ch 2).

**Change churn** — lines added/deleted/reverted after a review; a signal, not a target (Ch 9).

**CODEOWNERS file** — a file mapping path patterns to required reviewers/teams for auto-assignment (Ch 5).

**Code churn** — see Change churn.

**Code review** — the process of inspecting a colleague's code against agreed standards, most commonly via a pull request (Ch 1).

**Code smell** — a structural or readability anti-pattern in code, distinct from a functional bug (Ch 4).

**Cohesive team** — one where every member can share opinions, raise concerns safely, and trust colleagues — no room for ego or favoritism (Ch 1).

**Comment signal** — a short label (`needs change:`, `nitpick:`, etc.) telling an author at a glance whether a comment requires action (Ch 6).

**Continuous delivery (CD)** — automated delivery pipeline paused for human sign-off before production (Ch 1).

**Continuous deployment** — fully automated pipeline with no human sign-off gate (Ch 1).

**Continuous integration (CI)** — automation of building, testing, and integrating changes in a shared repo (Ch 1).

**Conventional Comments** — an external standard (conventionalcomments.org) for formatting review comments with labels like `suggestion:`, `issue:`, `praise:` plus optional decorations (Ch 6).

**Deployment frequency** — DORA metric: how often a team deploys to production (Ch 2).

**DORA metrics** — the four Google-validated engineering performance metrics: deployment frequency, change lead time, mean time to restore, change failure rate (Ch 2).

**Draft PR** — a PR state signaling "not ready for full review yet" (Ch 2).

**Driver-navigator** — the most common pair-programming style: one writes code, one reviews in real time (Ch 11).

**Emergency Playbook** — a formal, pre-agreed procedure for bypassing code review in genuine emergencies (Ch 10).

**Emergency Procedure Execution Record (EPER)** — the mandatory audit-trail artifact for an invoked emergency bypass (Ch 10).

**Fagan inspection** — Michael Fagan's 1976 IBM formal code inspection process, the historical ancestor of the modern PR review (Ch 2).

**False positive / false negative (AI review)** — AI flagging a non-issue vs. AI missing a real issue outside its training data (Ch 13).

**Groupthink** — a group converging on agreement without weighing dissenting individual opinions (Ch 12).

**Human-led review** — a code review system based on synchronous, in-person or pairing-style inspection (Ch 2).

**Informational Reviewer (Optional Reviewer)** — someone added to a PR purely for knowledge-sharing exposure, without required approval (Ch 3).

**Issue triage: obvious/expected/tough** — the ch. 4 severity model for what should be caught by automation (obvious), by human review (expected), or earlier in planning (tough).

**Knowledge sharing** — the exchange of knowledge in a readily accessible environment (Ch 1).

**Knowledge transfer** — the deliberate process of moving knowledge from one person/group to another (Ch 1).

**LGTM ("looks good to me")** — the approval shorthand the book's title plays on; earnest when meant, a red flag when used lazily on an unreviewed diff (Ch 2, Ch 7).

**Linting** — inspecting code for syntactic/semantic faults (unused variables, deprecated calls) distinct from formatting (Ch 5).

**Loophole** — any gap (tooling, incentive, culture, process) that makes it easier to skip or hollow out review than to do one (Ch 9).

**Mean time to restore (MTTR)** — DORA metric: average time to recover from a production failure (Ch 2).

**Mob programming (mobbing)** — 3+ people (not necessarily all developers) working together on one problem, with a driver and multiple navigators (Ch 12).

**MoSCoW comments** — Must/Should/Could/Would comment prioritization borrowed from project management (Ch 6).

**MMG Exchange (Maintainable Middle Ground)** — a structured process for resolving disagreements between author and reviewer that feel subjective (Ch 6).

**Nitpick** — a trivial, preference-based comment that neither improves nor harms the codebase; should never block a PR (Ch 4, Ch 6).

**Playbook vs. runbook** — a playbook is broad and judgment-requiring (e.g., Emergency Playbook); a runbook is narrow, mechanical, and ideally automatable (Ch 10).

**Politeness Principles** — replace "you" with "we"; ask, don't command — two wording changes empirically linked to less toxic review comments (Ch 6).

**PR gate check (quality gate)** — an automated pass/fail condition that blocks a merge if unmet (Ch 5).

**PR template** — a preset Markdown checklist auto-populated when a PR opens (Ch 5, appendix C).

**PR validator** — automation that checks PR metadata/hygiene (title format, labels, size) as distinct from code gate checks (Ch 5).

**Pull request (PR) / merge request (MR)** — the mechanism for proposing reviewable code changes; PR is GitHub's term, MR is GitLab's (Ch 2).

**Refinement checkpoint** — a scheduled, dedicated time slot for proposing code-review process changes (Ch 3).

**Review creep** — extra changes or scope introduced during review that fall outside the PR's original intent (Ch 6).

**Review milestone** — a scheduled mid-development check-in, lighter than pair programming but more involved than a single final review (Ch 8).

**Signoff condition** — the condition (approvals, passing checks) that must be met before a review is considered complete (Ch 2).

**Single senior developer reviewer problem** — the bottleneck formed when one senior developer becomes the default required reviewer for everything (Ch 8).

**Static analysis** — deeper, line-by-line code inspection (complexity, security, performance) beyond linting, without executing the code (Ch 5).

**Style guide** — a team's codified ruleset for code style, the input a formatter mechanically enforces (Ch 5).

**Team Working Agreement (TWA)** — the document that turns implicit team expectations about code review into explicit, enforceable, living policy (Ch 4).

**Tool-facilitated review** — a code review system run through software (GitHub, GitLab, etc.) rather than synchronous human meetings (Ch 2).

**Transformation verb** — a concrete, state-changing verb (rename, remove, consolidate) that makes a review comment's requested action unambiguous (Ch 6).

**Triple-R pattern** — Request, Rationale, Result: a structure for composing a change-requesting review comment (Ch 6).
