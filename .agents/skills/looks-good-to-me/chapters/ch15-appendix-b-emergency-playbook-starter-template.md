# Appendix B: Emergency Playbook starter template

## Core Idea
A fill-in-the-blanks version of chapter 10's 4-part Emergency Playbook structure (decision tree, authorization, bypassing mechanism, next steps) — designed as a conversation-starter document, not a rigid form to complete once and forget.

## Structure of the Template
1. **B.1 Name your emergency procedure** — a single naming prompt, useful once a team maintains more than one playbook (e.g., separate procedures for "production outage hotfix" vs. "security incident response").
2. **B.2 Decision trees** — an open prompt for the team's own trigger-condition tree/table: "what conditions warrant ignoring code review?" (ch. 10's own example table — deadlines and PTO are *not* valid triggers; security incidents, active revenue loss, and regulatory deadlines generally are).
3. **B.3 Authorization process** — two prompts: who specifically is allowed to initiate the procedure (named individuals, not roles, per ch. 10's "the fewer people, the more secure"), and the exact invocation steps (ticket/form + approval chain).
4. **B.4 Bypassing mechanism** — prompts the team to pick from ch. 10's ranked options (single approver → manager/stakeholder approver → justified self-approval → no approver at all, least to most risky) or define an "Other," then requires the specific associated actions (temporary elevated permissions, temporary privileged accounts, config changes), their exact valid time window, and who performs them.
5. **B.5 Next steps**, three required sub-sections:
   - **B.5.1 Documentation** — the checklist for the Emergency Procedure Execution Record (EPER): who was involved, who actually carried out the bypass, what was actually done (including deviations from plan), what temporary access was granted, which tools/accounts were affected, when/where, and a link to the original justification. The template explicitly warns: an emergency bypass with no linked justification "should be considered a grave misuse of the emergency playbook."
   - **Communication** — concrete example artifacts to adapt: a Production Outage Record, an Emergency Bypass Acknowledgement Record, an Incident Summary email to affected teams, a Resolution Summary email to affected customers.
   - **Post-Incident Analysis** — an open prompt for when the team holds this discussion and what questions it answers, distinct from a technical postmortem: this one evaluates the *bypass procedure itself*, not just the technical root cause.

## Key Concepts
- **EPER (Emergency Procedure Execution Record)**: the template's name for the mandatory audit trail of an invoked bypass — the single artifact the book repeatedly stresses as non-negotiable.
- **Named individuals over roles**: the authorization prompt specifically asks for a list of people, reinforcing ch. 10's "the fewer people, the more secure" principle over a vaguer "any manager can approve."

## Mental Models
- Treat every open prompt in this template as a required team discussion, not a fill-in-the-blank formality — the template deliberately leaves the decision tree, the authorized-person list, and the bypass mechanism blank because those are the genuinely team- and organization-specific decisions (compliance posture, team size, risk tolerance) that can't be pre-filled generically.
- Build and socialize this document with security/compliance/DevOps stakeholders *before* any emergency, exactly as ch. 10 insists — a playbook filled out for the first time during an actual incident has already failed its purpose.

## Worked Example
**A minimally filled-in excerpt**, illustrating what a completed section looks like:

> ## B.3 Authorization process
> Who is authorized: the on-call engineer (current rotation), the engineering manager, and the CTO.
> How to initiate: file an "Emergency Bypass Request" ticket linking the incident, tag @oncall-leads, and get one written approval (Slack thread acceptable) from anyone on the authorized list before proceeding.
>
> ## B.4 Bypassing mechanism
> Single approver required (instead of the standard 2). The approver must be someone from the authorized list in B.3, and must not be the PR's author.
> Associated actions: none beyond the approval-count relaxation — no elevated permissions granted.
> Valid for: the duration of the linked incident only: automatically reverts to standard 2-approver policy once the incident is marked resolved.

Notice how narrowly scoped this stays — a single relaxed rule (approver count), tied to a specific incident, with an automatic expiry — rather than a broad, standing exception.

## Key Takeaways
1. Use this template as the starting skeleton for chapter 10's four-part structure, but treat every blank as a mandatory team+stakeholder discussion, not paperwork to rush through.
2. The EPER's justification link is the one item the book treats as absolutely non-negotiable — its absence is explicitly called "a grave misuse of the emergency playbook."
3. Scope the bypass mechanism as narrowly and temporarily as possible (see Worked Example) — a specific relaxed rule with an automatic expiry beats a broad, standing exception.
4. Post-incident analysis after an emergency bypass evaluates the *procedure itself* (did it work, what should change) — separate from, and in addition to, the technical postmortem on what caused the incident.

## Connects To
- **Ch 10**: The full narrative rationale, the "intentionally tedious" design principle, and the decision-tree examples (PTO/deadlines are not emergencies; security incidents generally are) that this template operationalizes.
- **Ch 14 (appendix A)**: The TWA's approval-policy section explicitly defers to this playbook for the self-approval exception case.
