# Chapter 10: The Emergency Playbook

## Core Idea
An Emergency Playbook is the formal, pre-agreed procedure for the rare, genuine cases where bypassing code review is actually warranted — its entire design goal is to be used as close to never as possible, which is why every section of a good one is deliberately built with friction, documentation, and accountability rather than convenience.

## Frameworks Introduced
- **Playbook vs. runbook**: a *runbook* is a detailed, repeatable set of steps for a single task ("how to roll back a deployment") — narrow, ideally automatable. A *playbook* is broader and strategic, may bundle multiple runbooks, and explicitly involves human judgment/decisions. An Emergency Playbook is a playbook because deciding *whether* an incident qualifies as an emergency, and *how* to bypass review, both require human judgment, not just mechanical steps.
- **The 4-part structure of an Emergency Playbook procedure**: (1) **decision tree** — a deliberately strict yes/no tree (or table) for "is this actually an emergency?", biased hard toward "no"; (2) **authorization process** — a short, explicit list of who may invoke it and the documentation/approval steps to do so; (3) **bypassing mechanism** — the specific, time-boxed relaxation of the review rule (single approver, manager-as-approver, justified self-approval — never a silent no-review default); (4) **next steps** — documentation (the Emergency Procedure Execution Record), team communication, and postincident analysis.
  - How: build all four sections *before* an emergency happens, with security/compliance/DevOps stakeholders in the room, not improvised during the incident itself.
- **"Intentionally tedious" as a design requirement, not a flaw**: every section should feel effortful enough that no one would consider using it to dodge a normal review — the friction is the safeguard.

## Key Concepts
- **Break-glass procedure**: another name for the bypass mechanism, evoking a literal glass box you break only when there's no other option.
- **Emergency Procedure Execution Record (EPER)**: the book's name for the mandatory documentation artifact capturing who was involved, who actually carried out the bypass, what was actually done (including deviations from the plan — emergencies rarely go exactly as scripted), what temporary access was granted, when/where, and a link to the original justification.
- **Bypass mechanisms, from least to most permissive**: single approver required (most common) → manager/stakeholder as sole approver (when the developer pool is too small) → justified self-approval (requires a logged reason + automatic notification to the team/lead) → no approver at all (explicitly *not recommended*, and only viable with heavy documentation if used).

## Mental Models
- Treat the Emergency Playbook like insurance: "better to have it and not need it than to need it and not have it" — build it during calm times, not while the incident is on fire.
- Use the decision tree as a hard gate biased toward "no": the book explicitly wants *fewer* paths that resolve to "yes, this is an emergency" — a deadline or someone's PTO is explicitly NOT a valid emergency trigger (those are planning failures, not emergencies), while a security incident, active revenue loss, or a regulatory/compliance deadline generally are.
- Every emergency invocation should end in a mandatory postincident analysis — distinct from the technical postmortem on *what broke* — specifically evaluating how well the *bypass procedure itself* worked and what should change about it.

## Anti-patterns
- **Treating "we're on a deadline" as an emergency**: the book explicitly rules this out — skipping review to hit a deadline makes skipping it again more likely, and deadline/PTO overlaps are planning problems to solve in advance, not code-review problems to solve by bypassing.
- **Allowing a bypass with no approver at all and light documentation**: the single riskiest option in the book's own ranking — only defensible with heavy compensating documentation, and generally discouraged outright.
- **Skipping the postincident analysis once the fire is out**: the "hard part is done" feeling is exactly when teams forget to document and communicate what happened — but that's precisely the step that prevents the bypass from quietly becoming a habit.
- **Improvising the emergency process during the emergency**: defeats the entire purpose — the playbook needs to exist, be socialized, and be pre-approved by security/compliance stakeholders *before* it's ever invoked.

## Worked Example
**The "is it an emergency?" decision table.** The book's own table 10.1 walks through concrete scenarios and their verdicts: "need to meet boss's deadline" → **not** an emergency (skipping review just to hit a deadline normalizes skipping it); "need to deploy before someone goes on PTO" → **not** an emergency (PTO is planned — this is a planning failure to fix at the team-planning level, not a reason to bypass review); "need to meet a regulatory/compliance deadline," "security incident," "revenue is being lost" → generally **valid** emergencies, but even then the book insists the team must discuss afterward how the situation arose and how to prevent a repeat, explicitly warning against letting the Emergency Playbook become "a regular backup plan."

The generalizable move: build your own decision table before you need it, and bias every ambiguous case toward "no, this isn't an emergency" — the cost of occasionally being too strict is far lower than the cost of a bypass mechanism that quietly becomes routine.

## Key Takeaways
1. Playbooks (broad, judgment-requiring, strategic) are distinct from runbooks (narrow, mechanical, ideally automated) — an Emergency Playbook is explicitly the former because "is this really an emergency?" requires human judgment.
2. Structure every emergency procedure with all four parts: a strict decision tree, a short authorized-invoker list, an explicit and time-boxed bypass mechanism, and mandatory next-steps (documentation, communication, postincident analysis).
3. Deadlines and planned absences (PTO) are explicitly NOT valid emergency triggers in the book's framing — they're planning problems, and treating them as emergencies normalizes bypassing review.
4. The Emergency Procedure Execution Record — who, what, when, what access, linked justification — is the single most important artifact; without it, a bypass is "a grave misuse of the Emergency Playbook."
5. Build the playbook collaboratively with security/compliance/DevOps stakeholders *before* an emergency, using the book's Starter Emergency Playbook template (appendix B / ch. 15 of this skill) as a jumping-off point, not a rigid final form.

## Connects To
- **Ch 4**: Self-approval-as-emergency-exception was introduced there; this chapter is where it gets its full, formal procedure.
- **Ch 7 / Ch 9**: Both chapters warn that an easy, undocumented bypass becomes a habit — this chapter is the concrete structural fix (intentional tedium + mandatory documentation) for that exact failure mode.
- **Ch 15 (appendix B in the book)**: The Starter Emergency Playbook template operationalizes this chapter's four-part structure into a fill-in-the-blanks document.
