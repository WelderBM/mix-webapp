---
name: looks-good-to-me
description: "Knowledge base from \"Looks Good to Me: Constructive Code Reviews\" by Adrienne Braganza. Use when applying the author's frameworks for code review process design, Team Working Agreements, writing review comments, PR sizing, pair/mob programming vs. code review, Emergency Playbooks, or AI-assisted review, studying the book, or referencing its concepts."
---

<!-- argument-hint: [topic, framework name, or chapter number] -->

# Looks Good to Me: Constructive Code Reviews
**Author**: Adrienne Braganza (Manning, 2025) | **Chapters**: 13 + 4 appendices | **Generated**: 2026-07-21

## How to Use This Skill

- **Without arguments** — load core frameworks for reference
- **With a topic** — ask about `team working agreement`, `PR size`, `emergency playbook`, `pair programming vs mob programming`, `AI code review`, or another indexed topic; I find and read the relevant chapter
- **With a chapter** — ask for `ch04` or `ch14`; I load that specific chapter/appendix
- **Browse** — ask "what chapters do you have?" to see the full index

When you ask about a topic not covered in Core Frameworks below, I will read
the relevant chapter file before answering.

---

## Core Frameworks & Mental Models

**The book's throughline**: code review is a distinct practice from pairing/mobbing (it produces the only durable historical artifact) and needs an explicit, living process — not implicit assumptions — built in four stages: establish goals → choose tools/workflow → set guidelines → refine over time (Ch 3). Almost every review pain point (lazy, mean, shape-shifting, or stringent reviews — Ch 7) traces back to a missing piece of that foundation, not a need for a different tool.

**Team Working Agreement (TWA)** (Ch 4): a living document turning implicit expectations (response times, nitpick handling, blocking vs. non-blocking issues, approval policy) into explicit, version-controlled, team-owned policy. Rule of thumb: automate anything that *can* be automated (Ch 5); the TWA is for everything else — the social/behavioral layer. Nitpicks never block a PR; self-approval is only allowed as a documented, Emergency-Playbook-linked exception.

**PR sizing and structure** (Ch 2, Ch 8): keep PRs under ~500 LOC / ~20 files; a great PR has a clear title (the "what," under ~80 chars, with a categorization prefix like `feat:`/`fix:`) and a description (the "why," with context/justification, use cases, testing steps). Break oversized features apart *during planning* (clear acceptance criteria, separate UI from business logic, feature flags, separate refactoring from features) — by review time, it's already too late to cheaply split.

**Effective comments** (Ch 6): objective (traceable to a fact, not preference — use the **5P process**: Pause, Ponder, then Pass/Propose/Postpone), specific (comment signals, MoSCoW, or Conventional Comments to flag what needs action), and outcome-focused (the **Triple-R pattern**: Request/Rationale/Result). Tone matters structurally, not just socially — swap "you" for "we," commands for questions (the **Politeness Principles**); sentence-initial "you" is the strongest textual marker of toxic review comments in cited research.

**Automation split** (Ch 5): before-the-review (style guide → formatting → linting → static analysis → automated testing, all during development) has the best ROI and comes first; during-the-review (PR templates, PR validators, CODEOWNERS-based reviewer assignment, PR gate checks, automated reminders) comes next. Every recurring "obvious issue" surviving 3+ times into review is a signal to add one more automated rule, not to keep tolerating the manual catch.

**Process loopholes** (Ch 9): loopholes creep in through gaps (tooling defaults, undocumented process changes, misaligned incentives), not conspiracies. Six named loopholes: undefined process (fix: the **baseline-workflow exercise** — draw it, observe against it, consolidate, walk through weaknesses one at a time), lack of time (fix: smaller PRs), tool misconfiguration (fix: audit policy-to-config alignment on every process change), lack of feedback culture (fix: leadership models it first), approval-driven metrics (fix: metrics as trend signal, never individual compliance target), and emergency abuse (fix: intentionally tedious bypass procedures).

**Emergency Playbook** (Ch 10): the formal, pre-built exception process for genuinely bypassing review. Four required parts: a decision tree biased toward "no" (deadlines/PTO are *not* valid triggers; security incidents/revenue loss/compliance deadlines usually are), a short named authorization list, an explicit time-boxed bypass mechanism (single approver → manager approver → justified self-approval → no approver, least to most risky), and mandatory next steps — documentation (the **Emergency Procedure Execution Record**), communication, postincident analysis. Design principle: make it *intentionally tedious* so it's never tempting to use as a shortcut.

**Pairing and mobbing complement, never replace, review** (Ch 11, Ch 12): both accelerate real-time knowledge sharing and catch issues earlier, but neither produces review's one irreplaceable output — a durable, team-wide historical record of *why* a change was made. Mob programming adds two of its own risks beyond that shared gap: groupthink, and technical depth getting glossed over when non-developers are in the room.

**AI in code review** (Ch 13): genuinely speeds up first-pass feedback and improves consistency, but is limited by context/nuance blindness, training-data-bounded capability (including hallucinations), and the risk of eroding human reviewer skill through over-reliance. Adopt via a tracked **Low → Medium → High** confidence graduation, never at full trust from day one.

---

## Chapter Index

| # | Title | Key Frameworks |
|---|-------|----------------|
| [ch01](chapters/ch01-significance-of-code-reviews.md) | The significance of code reviews | CI/CD vs. review, durability & value |
| [ch02](chapters/ch02-dissecting-the-code-review.md) | Dissecting the code review | 4-part workflow, PR title prefixes, 5 participant contracts, DORA metrics |
| [ch03](chapters/ch03-building-your-teams-first-code-review-process.md) | Building your team's first code review process | 5 goals, blocking/non-blocking, Discussion→Decision→Dissemination |
| [ch04](chapters/ch04-the-team-working-agreement.md) | The Team Working Agreement | TWA scope rule, issue triage, nitpick policy |
| [ch05](chapters/ch05-the-advantages-of-automation.md) | The advantages of automation | Before/during automation split, style guide, gate checks, CODEOWNERS |
| [ch06](chapters/ch06-composing-effective-code-review-comments.md) | Composing effective code review comments | 5P process, MMG Exchange, comment signals, Triple-R, Politeness Principles |
| [ch07](chapters/ch07-how-code-reviews-can-suck.md) | How code reviews can suck | Lazy/mean/shape-shifting/stringent reviews |
| [ch08](chapters/ch08-decreasing-code-review-delays.md) | Decreasing code review delays | Single-senior-reviewer problem, offline-conversation protocol, feature breakdown |
| [ch09](chapters/ch09-eliminating-process-loopholes.md) | Eliminating process loopholes | Baseline-workflow exercise, 6 loopholes, metrics-as-signal |
| [ch10](chapters/ch10-the-emergency-playbook.md) | The Emergency Playbook | Playbook vs. runbook, 4-part structure, EPER |
| [ch11](chapters/ch11-code-reviews-and-pair-programming.md) | Code reviews and pair programming | Driver-navigator + 5 other styles, skill/personality matching |
| [ch12](chapters/ch12-code-reviews-and-mob-programming.md) | Code reviews and mob programming | 4 integration approaches, groupthink risk |
| [ch13](chapters/ch13-code-reviews-and-ai.md) | Code reviews and AI | Benefits/limitations, Low-Medium-High graduation |
| [ch14](chapters/ch14-appendix-a-twa-starter-template.md) | Appendix A: TWA starter template | Fill-in-the-blank TWA |
| [ch15](chapters/ch15-appendix-b-emergency-playbook-starter-template.md) | Appendix B: Emergency Playbook template | Fill-in-the-blank playbook |
| [ch16](chapters/ch16-appendix-c-pr-templates.md) | Appendix C: PR templates | Feature/bugfix/docs PR templates |
| [ch17](chapters/ch17-appendix-d-list-of-resources.md) | Appendix D: List of resources | Linters & static analysis tools by language |

## Topic Index

- **5P process** → ch06
- **AI code review** → ch13
- **Approval policy** → ch02, ch03, ch04, ch14
- **Automation** → ch05
- **Blocking vs. non-blocking issues** → ch03, ch04, ch14
- **Comment craft / tone** → ch06
- **CODEOWNERS** → ch05
- **DORA metrics** → ch02, ch03
- **Emergency Playbook** → ch10, ch15
- **Feature breakdown** → ch08
- **Loopholes** → ch09
- **Mob programming** → ch12
- **Pair programming** → ch11
- **PR sizing/structure** → ch02, ch08, ch16
- **PR templates** → ch05, ch16
- **Process design (4 stages)** → ch03
- **Review delays** → ch08
- **Review pain points (lazy/mean/etc.)** → ch07
- **Team Working Agreement** → ch04, ch14
- **Triple-R pattern** → ch06

## Supporting Files

- [glossary.md](glossary.md) — all key terms with definitions
- [patterns.md](patterns.md) — all techniques and design patterns
- [cheatsheet.md](cheatsheet.md) — quick reference tables and decision guides

---

## Scope & Limits

This skill covers the book content only. For hands-on implementation in your codebase,
combine with project-specific tools. For topics beyond this book, check related skills
or ask the agent directly.
