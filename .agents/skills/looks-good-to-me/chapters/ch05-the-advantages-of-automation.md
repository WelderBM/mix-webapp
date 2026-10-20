# Chapter 5: The advantages of automation

## Core Idea
Automation exists to protect human reviewer attention: everything mechanically checkable (style, lint, security scans, test coverage, PR hygiene, nudges/reminders) should be offloaded to tooling so reviewers spend their limited focus only on what requires human judgment — nuance, intent, and whether the code actually solves the right problem.

## Frameworks Introduced
- **Automation split: before-the-review vs. during-the-review**. Before: formatting, linting, static analysis, automated testing — all meant to happen during development, long before a human ever opens the diff. During: PR templates, PR validators (title format, labels, size), reviewer auto-assignment, PR gate checks, reminders/escalations.
  - How: work through both halves in order — before-the-review automation has the highest ROI per hour invested and should be tackled first.
- **Style guide as the prerequisite for formatting automation**: a style guide is the team's codified ruleset (brace style, casing, spacing) that a formatter then *enforces* mechanically — without it, "good style" stays a subjective, re-litigated-every-PR argument.
  - When to use: as the very first automation investment — it eliminates the highest-frequency, lowest-value class of review comment.
- **Formatting vs. linting vs. static analysis, as three depths of automated check**: formatting = how code *looks* (spacing, braces); linting = syntactic/semantic smells (unused variables, deprecated calls, `==` vs `===`); static analysis = deeper structural/security issues a compiler-adjacent tool can find without executing the code (cyclomatic complexity, SQL injection, memory leaks). Each depth needs a different class of tool, though many tools blend two or more.
- **PR gate checks (quality gates)**: automated pass/fail conditions that block a merge if unmet — linting, formatting, static analysis, inclusive language, security scanning, secret/sensitive-data detection, test coverage thresholds. A failed gate check should mark the PR "broken," and reviewers should feel free to ignore broken PRs entirely until fixed.
  - How: add gate checks incrementally (start with linting + formatting), not all at once — each one you add is one less category of "noise" a human reviewer has to manually check for.
- **CODEOWNERS-based reviewer assignment**: a file (or tool-native branch policy) mapping file/path patterns to required reviewers/teams, so the right expert gets auto-assigned based on *what changed*, not manual selection. Sits at the "ultra fancy" end of a spectrum that starts at "auto-assign the whole team" and passes through "assign by group" first.

## Key Concepts
- **Lint** (etymology): named after clothes-dryer lint traps by Stephen C. Johnson (Bell Labs, 1978) — a tool that catches small bits of "fluff" (faults) in code the way a lint trap catches fabric fluff.
- **PR template**: a preset Markdown checklist/questionnaire (`pull_request_template.md`) auto-populated when a PR opens — different templates for different PR types (feature/bugfix/docs) ask for different information.
- **PR validator**: automation that checks the *PR itself* for consistency (title format against Conventional Commits, label correctness, PR size), distinct from gate checks which validate the *code*.
- **Reviewer pool grouping**: "Always Required" (tenured/core reviewers) vs. "Informational" (kept apprised, no approval needed) — a structure that scales reviewer assignment as a team grows.
- **"Broken" PR status**: the state a PR should be forced into when a blocking gate check fails (secrets detected, sensitive data found, coverage regression) — signals to reviewers that this PR isn't safe to look at yet, full stop.

## Mental Models
- Mario Tacke's line, quoted in the book: *"Developers are much more susceptible to change when a robot yells at them rather than another human."* Use this as the design principle for what belongs in automation vs. what belongs in a human comment — anything that would otherwise become an interpersonal friction point over subjective preference is a candidate to hand to a bot.
- Treat automation coverage as a ratchet, not a one-time project: notice a recurring "obvious issue" (ch. 4) surviving into review 3+ times, and that's the signal to add one more lint/gate-check rule, not to keep tolerating the manual catch.
- What automation *cannot* do: judge developer intent ("does this code actually do what it's supposed to"), or enforce rules that require contextual judgment (e.g., "comments should explain why, not what"). That boundary is exactly where the human code review still lives.

## Anti-patterns
- **Relying on reviewers to manually catch style/lint issues**: burns reviewer attention on the lowest-value class of feedback and turns subjective style into a recurring interpersonal debate (a linter ends the debate permanently, a human comment restarts it every PR).
- **Misusing review-workload metrics** (e.g., pull-request-stats actions) **as a performance indictment**: "this person reviews less" can just mean they were out sick or got smaller PRs that week — use the numbers to spot trends and prompt discussion, never as a standalone judgment of an individual.
- **Treating PR templates as automation**: the *creation* of a template is automated, but authors still have to actually fill it out honestly — a template is a scaffold for author diligence, not a replacement for it.

## Worked Example
**The `no-console` rule that changed a team's release cadence.** The author's team kept shipping PRs with stray `console.log("here!")` debug statements, burning reviewer time on manual scans. After a few hours of research, she proposed a single ESLint rule: `no-console: "error"`. That one rule immediately ended the recurring comment. Encouraged, the team kept going — `no-var`, `eqeqeq`, `no-duplicate-imports`, `no-unneeded-ternary`, and others — introducing each new rule as a `"warn"` first to build familiarity before promoting it to a hard `"error"`. The team's release cadence went from once or twice every two weeks to once or twice a day. Other factors contributed, but the shift traces directly to automating away exactly the class of low-stakes, recurring review comment that had been quietly taxing every single PR.

The reusable pattern: pick the single most annoying recurring comment your team gives, automate *only that one thing* first, and use the momentum from the obvious win to justify the next rule.

## Key Takeaways
1. Automate in two waves: before-the-review (formatting, linting, static analysis, testing) has the best ROI and should come first; during-the-review (templates, validators, CODEOWNERS, gate checks, reminders) comes next.
2. A style guide isn't a debate — it's the input to a formatter; write down what "good" means for your team once, then let a machine hold everyone to it.
3. Gate checks should fail loudly and mark a PR "broken" (especially for secrets, sensitive data, or coverage regressions) — reviewers should feel entitled to ignore a broken PR entirely.
4. Reviewer assignment can scale from "the whole team, every time" → "grouped pools" → "CODEOWNERS auto-assignment by changed files" as a team grows — don't over-engineer this on day one.
5. Automate reminders and escalations (24-hour no-review nudge, 1-week escalation) so response-time expectations from the TWA (ch. 4) are actually enforced without anyone having to nag a colleague.

## Connects To
- **Ch 4**: The TWA is where a team writes down *what* the style guide/response-time/blocking-issue policies are; this chapter is how those policies get mechanically enforced.
- **Ch 2**: PR title categorization prefixes and labels (introduced there) are exactly what PR validators like `semantic-pull-request` and label-manager actions enforce automatically here.
- **Ch 8**: Reviewer-assignment bottlenecks (single-approver dependency) get a deeper treatment there.
- **Ch 13**: AI-assisted review is presented as a further extension of this same "offload the mechanically-checkable" philosophy.
