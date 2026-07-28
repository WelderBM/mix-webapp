# Appendix D: List of resources

## Core Idea
A curated, per-chapter external-resource index plus two large reference tables (linters by language, static analysis tools by language) — explicitly framed by the author as a snapshot that will age, with two canonical living sources named for staying current.

## Structure
- **D.1 List of resources by chapter**: most chapters have no resource list (their references live in the chapter's own numbered citations instead); the two standalone callouts are Git docs (ch. 1) and collaborative whiteboard tools — Miro, Figma, Draw.io (ch. 9, for the baseline-workflow diagramming exercise).
- **D.2 List of linters by language**: a large table (sourced from the community-maintained "Awesome Linters" GitHub repo) mapping ~50 languages/ecosystems to their standard linter(s).
- **D.3 List of static analysis tools by language**: a similarly large table (sourced from analysis-tools.dev) covering deeper static/security analysis tools across languages.

The author explicitly tells readers to treat both tables as a starting point and to check the two live source projects for current information — this appendix is a snapshot in a book, those sites are maintained references.

## Key Concepts (representative samples, not the full table — check the live sources for your stack)
- **Common linters by ecosystem**: JavaScript/TypeScript → ESLint (also `standard`, `xo`); Python → pylint, flake8, ruff, black (formatting); Ruby → RuboCop, Standard Ruby; Go → golangci-lint, go-critic; Rust → Clippy; C/C++ → clang-tidy, clang-format, cpplint; Java → checkstyle, google-java-format; Shell → ShellCheck, shellharden; Markdown → markdownlint; YAML → yamllint; multi-language/orchestrators → Mega-Linter, Super-Linter, Trunk.
- **Common static analysis / security tools (cross-language or notable)**: SonarQube/SonarCloud (code quality + security, broad language support, CI/CD integration), Veracode (binary/bytecode flaw detection without source), Snyk Code (AI-based vulnerability detection), Teamscale (static + dynamic, 25+ languages, IDE integration), trivy (container/artifact vulnerability scanner for CI), Understand (code visualization/metrics/dependency analysis), WALA (Java bytecode + JS static analysis).
- **Two living meta-resources** (use these instead of trusting this list to stay current): **Awesome Linters** (github.com/caramelomartins/awesome-linters) and **Analysis Tools** (analysis-tools.dev, community-ranked).

## Mental Models
- Treat this appendix as a *pointer*, not a database — the moment a specific tool/version matters for a real decision, go to the live source (Awesome Linters repo or analysis-tools.dev) rather than trusting a book-page snapshot that can't reflect tool churn.
- Use the chapter-by-chapter resource gaps (most chapters have none) as a signal of where the book's own claims are self-contained vs. where it explicitly points outward — ch. 1 (Git basics) and ch. 9 (whiteboarding tools for the baseline-workflow exercise) are the only two chapters that lean on external tool recommendations this directly.

## Key Takeaways
1. For linter/static-analysis tool choice, go to Awesome Linters (GitHub) or analysis-tools.dev directly rather than relying on any static list (including this one) — tool rankings and availability change faster than a book or skill file can track.
2. The baseline-workflow exercise (ch. 9) benefits from a real collaborative whiteboard tool — Miro, Figma, or Draw.io are the book's named starting suggestions.
3. Don't over-index on brand names in this appendix — the point isn't "use SonarQube specifically," it's "every mainstream language ecosystem has a mature linting and static-analysis option; pick one and automate it (ch. 5) rather than debating style manually."

## Connects To
- **Ch 5**: This appendix is the concrete tool directory backing that chapter's "formatting, linting, static analysis" automation framework.
- **Ch 9**: The whiteboarding tools here support the baseline-workflow-diagram exercise for surfacing process loopholes.
