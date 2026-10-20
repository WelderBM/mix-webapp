# Appendix C: PR templates

## Core Idea
Three ready-to-use Markdown PR templates (new feature, bug fix, documentation update) that operationalize ch. 2's "elements of a great PR" and ch. 5's PR-template automation into type-specific checklists an author fills out at PR-open time — each one deliberately errs toward over-communicating rather than under.

## Structure of the Templates
- **New Feature PR Template**: What is this? → Why are we building it? (justification/rationale, link the user story but *also* paste it inline) → How does it work? (numbered high-level flow) → Documentation link → Acceptance criteria → Regression risk → checklist (work item linked, design doc linked, new unit tests added) → open Notes field.
- **Bug Fix PR Template**: What's happening? → Reproduction steps (numbered, order-sensitive) → Root cause (and how it was identified) → Fix (what, then *why* it solves the problem) → Testing strategy → Impact on other parts of the app → Regression risk and mitigation → checklist (issue linked, fix tested locally, regression tests added, docs updated if applicable) → Notes.
- **Documentation Update PR Template**: What's changing? → Why? → Items impacted (components/pages/versions) → Screenshots if visual → checklist (spelling/grammar checked, links verified, content accuracy confirmed, changes clearly highlighted) → Notes.

## Key Concepts
- **"Link it, but also copy it" instruction**: both the feature and bug templates explicitly ask authors to link the source ticket/story *and* paste its content into the PR description — directly enacting ch. 2's point that external tickets can go stale or get migrated, so the PR itself should be a self-contained historical record, not just a pointer.
- **Type-specific checklists**: each template's checklist targets the failure mode specific to that PR type — a feature template checks for a linked design doc and new tests (does this thing work and is it explained?); a bug-fix template checks for regression tests specifically (did we prevent this exact bug from coming back?); a docs template checks spelling/grammar/link validity (the failure modes unique to documentation, not code).

## Mental Models
- Treat "Why" as the section that most separates a good PR from a merely complete one — every template asks it explicitly and separately from "What," directly mirroring ch. 2's title-is-what/description-is-why framing.
- Use these templates as literal starting points to copy into `pull_request_template.md` (or per-type templates, ch. 5) — the book's own stance is that erring toward more prompted context is "usually helpful," not overhead.

## Worked Example
**Why the bug-fix template asks for root cause *and* fix, separately.** A weaker template might just ask "what did you fix?" This one splits it: first, *root cause* ("What was the root cause of the bug? How did you identify it?") — forcing the author to demonstrate they actually understand why it broke, not just that they made the symptom disappear; then, separately, *fix* ("Explain the fix... then go into detail about why this fix solves the problem") — forcing them to connect the fix back to the diagnosed cause. A reviewer reading both sections can catch a common failure mode: a "fix" that patches a symptom without addressing the actual root cause, which the two-question structure surfaces much faster than a single "what did you change?" field would.

## Key Takeaways
1. Use type-specific PR templates (feature/bugfix/docs), not one generic template — each targets the failure modes specific to that kind of change.
2. Ask "why," explicitly and separately from "what," in every template — it's the single highest-value section for reviewer context.
3. For bug fixes, separate "root cause" from "the fix" as distinct questions — this structural split catches symptom-patches that don't address the actual cause.
4. Ask authors to paste ticket/story content inline, not just link it — external trackers can go stale or migrate; the PR should stand alone as the historical record.

## Connects To
- **Ch 2**: The "elements of a great PR" (title=what, description=why, context, testing steps) are exactly what these templates operationalize into fillable checklists.
- **Ch 5**: PR templates as an automation mechanism (auto-populated via `pull_request_template.md`) — these three files are the literal content to drop into that mechanism.
