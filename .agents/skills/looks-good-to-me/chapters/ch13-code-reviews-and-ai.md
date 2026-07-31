# Chapter 13: Code reviews and AI

## Core Idea
AI can meaningfully speed up and improve consistency in code review — but it cannot replace human review, because it still struggles with context, domain nuance, and novel/rare situations; the sustainable path is a deliberate, staged human-AI collaboration, not full automation.

## Frameworks Introduced
- **Four benefits of AI in review**: expedited reviews (immediate first-pass feedback the moment a PR opens); code quality improvement (AI catches more code smells than manual review in cited studies, freeing humans for higher-stakes architecture/design judgment); review consistency (AI reviews every PR with the same rigor — it doesn't get tired, rushed, or biased toward a favorite colleague); review scalability (removes time-zone/availability constraints for large or distributed teams).
- **Three limitations of AI in review**: (1) difficulty with context/domain knowledge/nuance — an AI can flag a real security pattern that's actually already mitigated elsewhere, or fail to grasp that a slightly-less-efficient-but-more-readable implementation was a deliberate team tradeoff; (2) capability is bounded by training data — brand-new frameworks, rare edge cases, and "AI hallucinations" (confidently invented, inaccurate output) are direct consequences; (3) over-reliance erodes human reviewer skill over time — the book traces a concrete decay path (trust the AI more → review its findings less thoroughly → eventually stop reviewing at all → the "process" quietly becomes AI-only).
- **The Low/Medium/High confidence-graduation model** for integrating an AI review tool: **Low** — use it for lenient, non-blocking first-pass suggestions only; never block a PR on AI findings yet; explicitly track how often it's right/wrong. **Medium** — AI suggestions taken more seriously, still human-overridable; graduate once correctness passes roughly a 90% threshold. **High** — AI is accurate enough that its flagged issues can legitimately hold up a PR until addressed. This is a trust-earning ladder, not a one-time tool adoption.
  - How: update the TWA alongside this graduation — document what "acceptable AI error rate" means at each level and what's expected of authors/reviewers regarding AI feedback.

## Key Concepts
- **AI hallucination**: an LLM confidently generating plausible-looking but factually wrong or fabricated output (e.g., repeating itself, inventing errors, or "fixing" code by reproducing the identical original) — a concrete, cited limitation, not a hypothetical risk.
- **False positive / false negative (AI review context)**: false positive = AI flags something that isn't actually a problem (can waste author time chasing a non-issue); false negative = AI misses a real problem it hasn't seen examples of in training — both reduce the tool's practical usefulness and require human validation to catch.
- **AI-assisted review tool categories** (illustrative, not exhaustive; treat specific product names as of the book's writing): PR summarization (auto-generates a description/impact summary/walkthrough — e.g., GitHub Copilot for Pull Requests, Qodo's `/describe`), code suggestions/instant refactoring (inline fixes an author can accept with one click — e.g., What The Diff's `/wtd`, Qodo's `/improve`, Google's internal DIDACT-based ML-suggested edits), automated review (an overall PR analysis: change type, test coverage, security concerns, effort estimate — e.g., Qodo's `/review`, CodeRabbit), PR feedback chat (conversational Q&A on review comments — e.g., CodeRabbit, Qodo's `/ask`).
- **Data privacy consideration**: check whether an AI tool trains on your codebase by default, whether you can opt out, and whether self-hosting is available — treat an available opt-out as a positive transparency signal.

## Mental Models
- Use AI as a tireless *first-pass* reviewer that handles the mechanically-detectable layer (this is philosophically the same move as ch. 5's automation-before-review — AI is simply a more sophisticated version of "offload what doesn't need human judgment").
- Treat AI's speed as a reallocation of reviewer time toward higher-value work (architecture, maintainability, team alignment), not as time saved outright — if a team just does *less* review overall because AI "already checked it," that's the over-reliance failure mode setting in.
- The book's own guiding metaphor: AI is "an amazing copilot, but it can't fly the code review plane — yet." Final judgment and validation stay a human responsibility at every confidence level, even High.

## Anti-patterns
- **Treating an automated AI review as "the review, done"**: the explicit shortcut-mentality warning in the chapter — running `/review` and calling it complete skips exactly the higher-level judgment (architectural fit, team maintainability, project goals) AI structurally can't provide.
- **Fully automerging on AI approval with no human check**: risks two failure classes at once — AI's context-blindness (e.g., not recognizing a PR is deliberately staged for a future migration event and shouldn't auto-merge yet) and its hallucination risk.
- **Skipping the Low/Medium/High graduation and trusting a brand-new tool immediately at "High" confidence**: the tool hasn't yet learned your codebase's specific conventions, domain knowledge, or historical decisions — premature trust is how false positives/negatives do real damage (blocked PRs on non-issues, or missed real ones).
- **Ignoring what happens to your code once it's fed to a third-party AI tool**: skipping the opt-out/self-hosting check risks leaking proprietary or sensitive code into a vendor's training pipeline.

## Worked Example
**The over-reliance decay path.** The book walks through a plausible, gradual failure: a team adopts an AI review tool and initially does everything right — checking every AI-flagged issue for relevance, still doing a full independent human review afterward. Over time, trust in the AI grows; the human double-check gets shallower; eventually the team stops doing independent review at all and stops even auditing the AI's own findings. What started as "AI-assisted review" has silently become "AI-only review" with no one noticing the transition, because each individual step down felt like a reasonable efficiency gain in the moment.

The generalizable lesson: the risk of over-reliance isn't a single bad decision, it's a slow, individually-justifiable erosion — which is exactly why the book recommends an explicit, tracked confidence-graduation model (Low→Medium→High) rather than trusting teams to notice the drift on their own.

## Key Takeaways
1. AI review delivers real, measured benefits — faster first-pass feedback, more code smells caught, consistent scrutiny regardless of author, and scalability across time zones — but none of that eliminates the need for human validation.
2. AI's three core limitations (context/nuance blindness, training-data-bounded capability including hallucinations, and the risk of eroding human reviewer skill through over-reliance) are why full automation isn't viable yet, not a temporary implementation detail.
3. Adopt AI review tools through an explicit Low→Medium→High trust-graduation process, tracked against a real correctness threshold (~90% to move to Medium) — never start at full trust.
4. Update the TWA to cover AI-specific expectations: acceptable error rates at each confidence level, whether AI feedback is blocking, and what participation the team owes to help the tool learn.
5. Check an AI tool's data policy (training opt-out, self-hosting option) before adopting it — an available opt-out is a good transparency signal; its absence is a real risk for proprietary code.

## Connects To
- **Ch 5**: AI-powered review tools are conceptually a more sophisticated extension of the "automate anything mechanically checkable" principle established there.
- **Ch 6**: The Triple-R pattern (Request/Rationale/Result) is explicitly cited as the kind of explicit, structured feedback that translates well into AI-actionable comments.
- **Ch 4**: The TWA is where a team's AI-integration policy (confidence level, blocking behavior, opt-in/out) should be documented as it evolves.
