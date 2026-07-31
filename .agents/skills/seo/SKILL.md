---
name: seo
description: Use quando for auditar SEO técnico (metadata, dados estruturados/JSON-LD, sitemap/robots, allowlist de crawler de IA) ou discoverability social/IA (Open Graph, llms.txt) de uma página ou do site inteiro. NÃO use pra Core Web Vitals/LCP/INP/CLS — isso é `next-performance-guide`. NÃO espere que ela commite ou publique nada sozinha — gera relatório e propostas de fix; quem decide o que vira PR e o que vira link building é você, fora desta skill.
---

## Proveniência

Origem: catálogo comunitário de agent skills (skills-hub.ai / registro público), path `analysis/seo/SKILL.md`, versão 2.1.0, obtida em 2026-07-27. Titularidade do registro (se `tinh2/skills-hub-registry` — repositório GitHub que se apresenta como "daily-synced to skills-hub.ai" — é de fato o mantenedor oficial por trás do site, ou um espelho/fork homônimo) **não verificada** — ver #122.
Auditada e adaptada em 2026-07-27 (PR `chore/hub-skills-batch`), aprovação condicional: mérito do conteúdo avaliado item a item, independente da proveniência ainda não confirmada acima — ver modificações abaixo.

Modificações aplicadas nesta cópia:
- **Removido o framing "autonomous agent... commit fixes directly".** O original instruía a skill a corrigir o código e commitar em lotes sozinha ("Commit fixes in focused batches"). Isso conflita direto com a regra do projeto de que todo PR fica aberto até validação local explícita. Nesta cópia a skill audita e propõe; commitar/abrir PR segue o fluxo fatiado normal.
- **Cortada inteira a Fase 2 (Core Web Vitals) do original** — duplicava o que `next-performance-guide` já cobre com mais profundidade e específico pra Next.js. Ficou só uma referência cruzada.
- **Cortada inteira a Fase 5 (Off-Page Advisory) do original** — recomendações de link building, guest post, submissão em awesome-lists, HN/Reddit. Fora do escopo de uma skill de código: é estratégia de marketing/PR, não algo que se decide olhando o repo.
- Removida a seção "SELF-EVOLUTION TELEMETRY" do original — escrevia em `~/.claude/projects/.../skill-telemetry.md`, fora do repo.
- **O que sobrou depois dos cortes** (linhas do original: ~423 → ~230 nesta versão): Fase 1 (SEO técnico: metadata, JSON-LD, sitemap/robots, allowlist de crawler de IA, canonical), Fase 3 (SEO de conteúdo + GEO: hierarquia de heading, TLDR-first, schema de autor, keyword/linking interno, SEO programático), Fase 4 (Open Graph/Twitter Card/llms.txt/GEO). Não é casca — sobrou auditoria técnica de verdade que não temos hoje (nenhuma skill do repo cobre metadata/JSON-LD/sitemap/llms.txt).

---

You audit technical SEO and AI-search discoverability. You report findings with specific file/line references and propose fixes — you do not apply or commit fixes yourself. That decision, and how it's sliced into PRs, belongs to the normal delivery flow of this project.

TARGET:
$ARGUMENTS

============================================================
BASELINE — o que mudou (2026)
============================================================

SEO moderno é dois canais, não um:

1. **Ranking orgânico tradicional (Google)** — ainda a maior fonte de tráfego orgânico.
2. **Citação em busca por IA** — ChatGPT, Perplexity, Google AI Overviews, Gemini, Claude search. A sobreposição entre top-10 do Google e URLs citadas por IA caiu de ~70% pra menos de 20%. É um canal próprio, com métrica própria: *taxa de citação*, não ranking.

Priorize, em toda fase:
- Autor nomeado e com credencial visível em conteúdo longo (bylines anônimos perdem em citação por IA)
- Conteúdo TLDR-first (primeiras ~200 palavras precisam responder sozinhas a pergunta do H1)
- Schema `Person` com cadeia `sameAs` em conteúdo longo
- Crawlers de IA (GPTBot, ClaudeBot, PerplexityBot, Google-Extended) explicitamente liberados
- Páginas programáticas com dado único + ≥300 palavras próprias + 5–15 links internos contextuais

============================================================
FASE 1: AUDITORIA DE SEO TÉCNICO
============================================================

1. METADATA COMPLETENESS
   - Check every public page for: title, description, canonical URL, OG tags, Twitter card
   - Verify title template pattern (page-specific title + site name suffix)
   - Titles: 50-60 chars optimal, never truncated. Descriptions: 150-160 chars.
   - Every page must have a unique title and description (no duplicates)
   - Check for `viewport` export (themeColor, width, initialScale)

2. STRUCTURED DATA (JSON-LD)
   - Root layout: `WebSite` schema with `SearchAction`, `Organization` schema
   - Product/detail pages: appropriate type (`Product` pro catálogo de presentes/festas)
   - List pages: `ItemList` or `CollectionPage` schema
   - FAQ sections: `FAQPage` schema (high CTR — earns rich snippets)
   - Breadcrumbs: `BreadcrumbList` on every non-root page
   - `Person` schema on every long-form page with `sameAs` chain (LinkedIn, GitHub, X — ao menos 3 perfis externos), se aplicável a este site
   - Validate against schema.org concepts (correct @type, required fields)

3. SITEMAP & ROBOTS
   - Verify sitemap.xml includes ALL public pages (static + dynamic)
   - Set realistic `<changefreq>` and accurate `<lastmod>` (real data-change time, not build time)
   - Check robots.txt allows crawling of public pages, blocks private routes (`/admin`, `/meu-pedido/*` se relevante)
   - Verify sitemap is referenced in robots.txt
   - Check for `noindex` on pages that should be indexed
   - Ensure dynamic pages (produto/categoria) are in sitemap

4. AI CRAWLERS — EXPLICITAMENTE PERMITIR
   Muitos sites bloqueiam crawler de IA sem querer. Auditar `robots.txt` E config de CDN/edge:
   ```text
   User-agent: GPTBot
   Allow: /
   User-agent: ClaudeBot
   Allow: /
   User-agent: PerplexityBot
   Allow: /
   User-agent: OAI-SearchBot
   Allow: /
   User-agent: Google-Extended
   Allow: /
   User-agent: CCBot
   Allow: /
   ```
   Não faça cloaking — sirva conteúdo idêntico pra bot de IA e Googlebot.

5. CANONICAL & DUPLICATE CONTENT
   - Every page has `alternates.canonical` pointing to its preferred URL
   - No trailing slashes inconsistency
   - WWW vs non-WWW consistency
   - Pagination pages use rel="next"/"prev" or canonical to main page

6. PERFORMANCE SEO (só o que é puramente SEO, não Core Web Vitals)
   - Check for `dns-prefetch` and `preconnect` for external domains
   - Images have alt text, width/height attributes, use next/image
   - Verify static pages are prerendered (not unnecessarily dynamic)
   - **Para LCP/INP/CLS, bundle size, code splitting: usar `next-performance-guide`, não repetir aqui.**

============================================================
FASE 2: SEO DE CONTEÚDO + GEO
============================================================

1. HEADING HIERARCHY
   - Each page has exactly one H1
   - H2-H6 follow logical nesting (no skipping levels)
   - Headings contain target keywords naturally

2. TLDR-FIRST CONTENT (pra citação por IA)
   AI retrievers judge relevance from the first ~200 words. On every long-form page:
   - The first 200 words must completely answer the query stated in the H1
   - Lead paragraph is self-contained
   - Expand with detail/examples below

3. AUTOR NOMEADO E CREDENCIADO (se este site tiver conteúdo editorial/blog)
   - Every long-form page has a visible author byline with bio
   - Person JSON-LD with `sameAs` chain (≥3 external profiles)
   - Se não houver conteúdo editorial no site, marcar este item como N/A explicitamente — não forçar bylines numa página de produto.

4. KEYWORD STRATEGY
   - Check root metadata.keywords array covers target terms
   - Verify key pages have keywords in: title, description, H1, first paragraph
   - Check for keyword cannibalization (multiple pages targeting same query)
   - Identify pillar topics; build pillar + cluster topology if aplicável

5. INTERNAL LINKING + TOPICAL AUTHORITY
   - Important pages are linked from the homepage
   - Navigation includes links to key content pages
   - Footer has links to legal, docs, and category pages
   - Breadcrumbs present on detail pages
   - No orphan pages — every published page has ≥3 incoming internal links
   - Varied anchor text — identical exact-match anchors everywhere is an over-optimization signal

6. SEO PROGRAMÁTICO (páginas de categoria/produto templadas)
   Cada página templada precisa de:
   - Unique structured data per slug (not boilerplate text changes)
   - ≥300 words of page-specific content beyond the structured data (se aplicável ao tipo de página)
   - Distinct title and meta description (templated but variabilized)
   - Real `lastmod` reflecting source-data change time, not build time

7. CONTENT GAPS
   - Look for pages that answer user questions (FAQ, how-to, guides)
   - Verify about/docs pages have substantial content (not thin)

8. ANTI-PATTERNS / PENALTY TRIGGERS
   Flag and recommend removal:
   - Anonymous content with no author identity (se aplicável)
   - Templated pages without unique data per slug
   - Cloaking AI bots (different content for AI crawlers vs Googlebot)
   - Excessive exact-match anchor-text internal linking
   - Accidental `noindex` on important pages
   - Paginated content without canonical strategy

============================================================
FASE 3: DISCOVERABILITY SOCIAL & IA
============================================================

1. OPEN GRAPH
   - Every public page has og:title, og:description, og:type, og:url
   - og:image is set (at minimum a default site image)
   - og:site_name is consistent across pages

2. TWITTER CARDS
   - twitter:card (summary or summary_large_image)
   - twitter:title, twitter:description set

3. llms.txt — DISCOVERABILITY PRA MODELOS DE IA
   - Create or verify `/llms.txt` at the site root (public/llms.txt or equivalent)
   - First non-comment line after H1: a `>` blockquote with the site's elevator pitch
   - Cap at 20–50 curated links — quality over quantity
   - `robots.txt` overrides `llms.txt` — coordinate the two
   - Format per llms.txt spec (https://llmstxt.org):
     ```
     # Site Name

     > Brief one-line description of the site/product.

     ## Get Started
     - [Página](url): Descrição.
     ```
   - **Nota**: adoção real ainda é baixa — a maior parte do tráfego de crawler de IA em `llms.txt` ainda é GoogleBot. Vale publicar, mas não é prioridade sobre o resto desta fase.

4. GENERATIVE ENGINE OPTIMIZATION (GEO)
   Audit:
   - First 200 words on every page = self-contained answer
   - Named author with sameAs chain on long-form (se aplicável)
   - AI bot crawlers explicitly allowed (Fase 1)
   - Content uses natural language (not buried in JS-only views)
   - FAQ schema on Q&A content (improves citation rate)

============================================================
FASE 4: RELATÓRIO (SEM COMMIT, SEM PUBLICAÇÃO)
============================================================

For each issue found, produce a finding — file/rota, o que falta, e o fix proposto. Não edite nada nem abra PR dentro desta skill; a fatia certa pra cada grupo de achado (metadata, structured data, sitemap/robots, allowlist de IA, llms.txt) é decisão de quem revisar o relatório, seguindo o modelo fatiado do projeto.

============================================================
SELF-HEALING VALIDATION (max 2 iterações, só do relatório)
============================================================

After producing output, validate report quality and completeness:

1. Verify all output sections have substantive content (not just headers).
2. Verify every finding references a specific file, code location, or data point.
3. Verify recommendations are actionable and evidence-based.
4. If the analysis consumed insufficient data (empty directories, missing configs),
   note data gaps and attempt alternative discovery methods.

IF VALIDATION FAILS:
- Identify which sections are incomplete or lack evidence
- Re-analyze the deficient areas with expanded search patterns
- Repeat up to 2 iterations

============================================================
OUTPUT
============================================================

## SEO + AI Search Audit Report

### SEO Técnico
- Pages audited: [count]
- Metadata issues: [count found]
- Structured data: [schemas faltando/incorretos]
- Sitemap coverage: [pages in sitemap / total public pages]
- Robots: [status]
- AI crawler config: [allowed / blocked / unintentionally blocked at CDN]

### SEO de Conteúdo + GEO
- Heading hierarchy: [issues found]
- TLDR-first compliance: [pages passing / total]
- Keyword coverage: [status]
- Internal linking: [orphans found, status]
- Programmatic page lint: [pass/fail rate if applicable]
- Content gaps: [recommendations]

### Discoverability Social & IA
- Open Graph: [status]
- Twitter Cards: [status]
- llms.txt: [existe / falta / desatualizado]
- GEO readiness: [score]

### Achados propostos (não aplicados)
- [lista de fixes, cada um com arquivo/rota e severidade]

### Fora do escopo desta skill
- Core Web Vitals / LCP / INP / CLS → `next-performance-guide`
- Estratégia de link building / PR / conteúdo editorial → fora do escopo de uma skill de código

NEXT STEPS:
- "Submeter sitemap no Google Search Console depois de aplicar os fixes de metadata/structured data."
- "Rodar `next-performance-guide` separadamente se Core Web Vitals for a dúvida."
