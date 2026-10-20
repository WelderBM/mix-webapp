# Chapter 12: Code reviews and mob programming

## Core Idea
Mob programming (3+ people, not necessarily all developers, working together on one problem) supercharges real-time knowledge sharing beyond what pairing can reach — but it still can't replace code review, for the same core reason pairing can't: no durable historical artifact is produced without one.

## Frameworks Introduced
- **Four integration approaches, matched to different needs**:
  - **Agree and then split** — mob on high-level design/architecture agreement first, then split into individual work with individual (now much better-contextualized) code reviews. Best for major refactors, new frameworks, "what do we even mean by X" scope-alignment problems (see Worked Example).
  - **Into the void** — mob specifically when the *whole team* is unfamiliar with the problem (new service, cloud migration, framework switch, ambiguous/shifting acceptance criteria) — multiple perspectives tackling a genuine unknown together outperforms one person or pair guessing alone.
  - **Capture and chronicle** — when mobbing is the default way of working, shrink the code review down to its one irreplaceable job: documenting *why*, using a lightweight chronicle checklist (why/context, skipped solutions, considerations raised during mobbing) filled out live, like meeting notes, as the mob works.
  - **Mob code review** — instead of mobbing to *produce* code, mob to *review* it; useful for "emergency" oversized PRs (spread the review load across the team instead of crushing two assigned reviewers) or for reviewing junior/new-hire work.
- **Why mobbing can't replace review**: same core reason as pairing (ch. 11) — no historical artifact — plus two *new* risks unique to groups: **groupthink** (the group converges on one view, often deferring to the most senior voice, without individual dissent ever surfacing) and **technical depth glossed over** (when non-developers are in the mob, developers instinctively avoid going too deep technically, so a separate, developer-only technical check is still needed).

## Key Concepts
- **Mob programming ("mobbing")**: 3+ people around one workstation/shared IDE — one driver, multiple navigators, frequent role switching — and critically, participants don't have to be developers (a PO, QA, UX designer, or architect can be a navigator).
- **Groupthink**: the phenomenon where a group converges on agreement without weighing individual/dissenting opinions — the chapter's cited concern for over-relying on mobbing as a team's *default* mode.
- **Git handover (remote mobbing)**: since you can't physically pass the keyboard, the outgoing "driver"/typist pushes WIP commits to a temporary branch for the next person to pick up; squashed into clean commits at the end. Tools: `mob.sh` (`mob start`/`mob next`/`mob done`), MobTime, Mobster for interval timers.
- **Emergency mob review**: the whole team (not just the 1-2 assigned reviewers) jointly reviews an oversized, time-pressured PR — a stopgap the book's interviewee explicitly frames as a tool for *now* while separately working to shrink PR sizes at the source.

## Mental Models
- Mobbing trades review *speed and depth of shared context* for a documentation gap — the trade only pays off if a lightweight capture-and-chronicle step still runs, because the group's context "fresh in your head(s) now will likely deteriorate over time" exactly like a pair's or an individual's would.
- Brainwave research cited in the book found perceived problem difficulty rises ~36% working solo but only ~1% in a mob, on identically-difficult problems — treat "this feels too hard for me alone" as a legitimate signal to escalate to a mob session, not a personal failing.
- Mob size has a real ceiling: at least 3 to count as mobbing, but past a certain size (no fixed number — team-dependent) it degrades into "hard for anyone to get a word in" — start with the whole dev team and only pull in extra specialists when genuinely stuck.

## Anti-patterns
- **Defaulting to mobbing for everything**: invites groupthink and risks technical depth getting glossed over when non-developers are present for every session — reserve dedicated developer-only technical mobs (or a final code review) as the depth check.
- **Skipping the chronicle step because "we all already know why"**: exactly the assumption that fails once someone leaves the team, a new hire joins, or the team revisits the code a year later — capture the "why" while it's fresh, every time.
- **Running mob sessions with too many participants or no breaks**: leads to disengagement, side conversations, and reduced participation — cap the group and build in regular breaks.
- **Assuming mobbing alone fixes bad team communication**: mobbing amplifies whatever communication culture already exists — a team unused to speaking up will struggle in a mob just as much as anywhere else, so the underlying feedback-culture work (ch. 9) still has to happen.

## Worked Example
**"Breaking apart the monolith" meant three different things to three different people.** A senior developer called mob sessions to plan splitting a monolithic application into more manageable parts. Once in the room, it became clear each person had a wildly different mental model of the plan: the senior developer envisioned a full microservices rewrite; the author understood it as restructuring so unrelated changes wouldn't force a full-codebase rebuild/redeploy; another developer thought it just meant applying a few extra patterns to make the existing monolith more readable. Only by mobbing through *why* they wanted this change (their actual pain: any change, however small, forced a full redeploy, capping them at monthly releases) did the team converge on the right-sized fix — splitting along five logical domains into separate projects with shared libraries, not a full microservices rewrite. They then split into individual, code-reviewed work per domain, going from monthly to near-daily releases.

The generalizable lesson: "agree and then split" mobbing exists precisely to catch silent scope divergence *before* someone builds an entire wrong-sized solution alone — without it, the senior developer's larger vision would likely have shipped as an architecture only they understood.

## Key Takeaways
1. Match the mobbing approach to the situation: agree-then-split for design alignment, into-the-void for genuine team-wide unfamiliarity, capture-and-chronicle when mobbing is the default mode, mob-review for spreading an oversized/urgent review's load.
2. Mobbing still needs a documentation step — the "capture and chronicle" checklist (context, skipped alternatives, considerations, cross-team impact) is how a fast, real-time session leaves a durable trace.
3. Watch for groupthink and glossed-over technical depth as mobbing's two unique failure modes (beyond the "no artifact" weakness it shares with pairing) — a separate individual or developer-only technical review is the check against both.
4. Cap mob group size (start with the dev team, add specialists only when stuck) and build in regular breaks — unmanaged size and fatigue are the most common ways mob sessions degrade.
5. Remote mobbing is workable with deliberate tooling (video, Git handover via `mob.sh`, short timed intervals ~10 minutes) but still loses some of the in-person social cohesion — acknowledge the tradeoff rather than pretending it's equivalent.

## Connects To
- **Ch 2**: "Context is the PR author's responsibility" — mobbing is one way to make that context already shared before the PR is even opened.
- **Ch 8**: Emergency mob review is a direct alternative tactic to the "too many files to review" impromptu-mob suggestion made there.
- **Ch 9**: A lack of feedback/communication culture undermines mobbing exactly as it undermines regular reviews — the fix lives in that chapter, not this one.
- **Ch 11**: Nearly every argument here (complements-not-replaces, no historical artifact, real-time vs. async knowledge sharing) is the pair-programming chapter's framework scaled up to a group.
