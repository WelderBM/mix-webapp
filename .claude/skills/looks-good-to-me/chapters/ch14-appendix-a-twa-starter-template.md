# Appendix A: Team Working Agreement starter template

## Core Idea
A fill-in-the-blanks Markdown template that operationalizes chapters 2–4's frameworks into a single, ready-to-adapt document — meant to be copied into a repo, filled out collaboratively, and revised as a living document (ch. 4), not used verbatim.

## Structure of the Template
The starter TWA has seven sections, each mapping directly to a framework from earlier chapters:

1. **Code Review Goals** — a fill-in-the-blank prioritized goal from the five in ch. 3 (finding bugs / codebase stability & maintainability / knowledge transfer & sharing / mentoring / recordkeeping-chronicling), plus a free-text "what we want our process to do" and a standing reminder: focus on the code, never the developer.
2. **Our Tools/Platform and Workflow** — names the chosen tool and *why*, then documents the 6-step workflow from ch. 2/3 (starting point → review-requesting action → review mechanism → feedback-cycle mechanism → signoff conditions → ending point), followed by explicit **Author Responsibilities** (be your own first reviewer, keep the PR under ~500 LOC/20 files, make it understandable, "you are not your code," address blocking feedback within 24 hours) and **Reviewer Responsibilities** (leave ego at the door, focus on code not developer, back suggestions with facts, complete reviews within 24 hours, full accountability for what you approve).
3. **Our Guidelines: Review Focus** — the ch. 4 checklist of what reviewers should actually spend attention on: complexity, consistency, conventions, cross-platform compatibility, documentation, error handling, naming, resource management, scalability, security, tests.
4. **Our Blocking vs. Non-blocking Issues** — the ch. 3/4 two-column split: blocking (core functionality gaps, security issues, major convention violations, code smells, regressions, performance issues, failing tests) vs. non-blocking (style preferences, minor formatting, doc nitpicks, missing-optional-features, minor refactor opportunities, unrelated improvements) — with an explicit fallback: anything not listed gets discussed as a team, not assumed.
5. **Our Approval Policy** — defines the approver pool (anyone with "Write" access), distinguishes **Required** reviewers (owe a timely review) from **Optional** reviewers (encouraged to treat it as a learning opportunity and leave an acknowledgment comment), and sets the default: **2 approvals minimum**, author can never self-approve.

## Key Concepts
- **Prompted vs. pre-filled sections**: the template deliberately leaves some content pre-written (the review-focus checklist, the blocking/non-blocking split, the responsibility lists) as sane defaults, while leaving other sections as open prompts (goals, tool choice, workflow diagram, approval numbers) that only the specific team can fill in — this mirrors the book's overall stance that some things are near-universal and others are genuinely team-specific.
- **Optional/Informational reviewer acknowledgment**: the template operationalizes ch. 3's "Informational Reviewer" concept as a concrete line item — optional reviewers aren't just passively cc'd, they're expected to leave a comment showing they engaged, turning a knowledge-sharing intent into a checkable behavior.

## Mental Models
- Treat this template as a first draft to argue with, not a policy to adopt unedited — every bracketed placeholder (`{tool/platform of choice}`, `{finding bugs|...}`) is a forced decision point meant to trigger the team conversation ch. 3 describes, not a fill-in-the-blank formality.
- The document's own instructions are explicit that it "can be changed as a team as many times as necessary" — treat the act of filling it out as the first real exercise of the team's own Discussion→Decision→Dissemination process (ch. 3), not a one-time form.

## Worked Example
**A minimally filled-in excerpt**, showing what "done" looks like for one section:

> ## Code Review Goals
> Our prioritized goal is **codebase stability & maintainability**, with **recordkeeping/chronicling** as a secondary goal.
> We want our code review process to catch readability and convention issues before they compound, and to leave a clear record of *why* changes were made for future maintainers.
>
> ## Our Approval Policy
> ### Approver list
> Anyone with Write access to the repo.
> ### Number of approvals
> **2** approvals required. Author cannot approve their own PR, except during a documented Emergency Playbook (appendix B) invocation.

This is deliberately short — the template's own philosophy (ch. 4) is that the TWA should be concise enough to actually get read and kept current, not a comprehensive legal document.

## Key Takeaways
1. Use this template as the literal starting point for a first TWA (ch. 4) — it already encodes the book's defaults (2 approvers, 500 LOC/20 files, 24-hour response time, blocking/non-blocking split) so a team doesn't have to invent them from scratch.
2. Every bracketed placeholder is a required team decision, not boilerplate to skip past — the value of the template is in forcing those conversations, not in its literal text.
3. The Required/Optional reviewer distinction, with an explicit acknowledgment expectation for Optional reviewers, is a simple, adoptable mechanism for making knowledge-sharing intent (ch. 3) into an actual checkable habit.

## Connects To
- **Ch 2**: The 6-step workflow and author/reviewer contracts this template asks teams to fill in.
- **Ch 3**: The five code-review goals and the blocking/non-blocking issue lists originate there.
- **Ch 4**: The living-document philosophy and full rationale for every section here.
- **Ch 15 (appendix B)**: The self-approval exception this template's approval policy references is fully specified in the Emergency Playbook template.
