# Mix Novidades — mix-webapp (Manual de Suporte a Agentes de IA)

> **Instrução Universal para Agentes:** Este repositório utiliza o padrão universal `AGENTS.md` para orientação de IAs (Claude Code, Gemini, Codex, Grok, Kimi, Cursor, etc.). 
> **Se você é uma sessão nova (ou rodando em outra máquina), leia este arquivo inteiro antes de fazer qualquer modificação.** Múltiplas sessões — às vezes em computadores diferentes — trabalham nesse repo em paralelo. Execute `git branch -a` e `git log --all --oneline -20` antes de assumir que a árvore está "limpa".

---

## 1. Visão Geral da Aplicação
Loja de presentes/festas (Boa Vista - RR) com pedido digital-first: cliente monta o carrinho no site, o checkout grava em `orders` no Firestore e monta uma mensagem de WhatsApp pré-preenchida (`wa.me`) pro handoff final. `OrdersTab.tsx` (admin) recebe o pedido em tempo real; `/meu-pedido` deixa o cliente acompanhar o status sem login.

---

## 2. Stack Tecnológica
- **Framework & Runtime**: Next.js 16 (App Router, Turbopack), React 19, TypeScript
- **Backend & BaaS**: Firebase (Firestore client SDK, Auth com Google Sign-In, Storage)
- **Estado & UI**: Zustand, shadcn/ui, Tailwind CSS v4
- **Testes & Qualidade**: Vitest, TypeScript CLI (`tsc`)

---

## 3. Fluxo de Git & Trabalho Multi-Sessão (Regra Obrigatória)
- **`dev` é a branch principal**, não `master`. Toda branch de trabalho nasce de `dev` (`git checkout dev && git pull`), e todo PR volta pra `dev`.
- `master` é a branch de release/produção (atualizada por promoção `dev` → `master`).
- **Validação Local Obrigatória**: `.env` local aponta pro projeto Firebase de **staging** (`mix-webapp-staging`), nunca pro de produção. Testes locais não podem sujar dados reais de clientes.
- **Detecção de Concorrência & Worktree**: Antes de iniciar uma fatia, rodar `git branch --show-current` + `git status`. Se o diretório já estiver ocupado por outra sessão: PARAR, avisar, e propor worktree (`node scripts/wt-new.mjs <branch>`). Limpeza via `scripts/wt-clean.mjs`.
- **Promoção**: Criar tag anotada `promo-YYYY-MM-DD` no HEAD de `dev` e dar push antes do merge `dev` → `master`.

---

## 4. Catálogo de Skills & Roteador por Eventos
As skills do repositório estão centralizadas no ambiente global (`~/.agents/skills/` / `~/.claude/skills/`) e espelhadas localmente em `.agents/skills/` (com link simbólico para `.claude/skills/`). As IAs resolvem skills priorizando a instalação global e mantendo a versão local do projeto para portabilidade. Os eventos a seguir exigem o carregamento da skill correspondente:

| Evento Ocorrido | Skill a Carregar |
| :--- | :--- |
| `npm audit` ou aviso de vulnerabilidade pós-install | `auditoria-de-dependencias` (nunca rodar `npm audit fix` inline) |
| Antes de criar qualquer issue (`gh issue create`) | `triagem-de-issues` |
| Antes de abrir ou aprovar qualquer PR | `auditoria-de-pr` |
| Após merge de dependências/config/infra ou pré-promoção | `smoke-de-runtime` |
| Check da Vercel vermelho / falha de deploy | `deploy-vercel` |
| Início de sessão de planejamento ou backlog extenso | `varredura-de-saude` |
| Alteração em rendering, imagens, cache ou bundle | `next-performance-guide` |
| Despachar várias issues em paralelo como agent master | `orquestracao-multi-branch` |
| Auditar PRs fechados contra o estado atual do código | `engenharia-reversa-pr` |

---

## 5. Ritual de Entrega & Qualidade de Código
- **Fatiamento**: Mudanças devem ser divididas em PRs pequenos e revisáveis.
- **Checklist Pré-Commit (Obrigatório)**:
  1. `npx tsc --noEmit` (deve passar 100% limpo)
  2. `npx vitest run` (suíte inteira passando)
  3. `npx next build` (obrigatório em mudanças estruturais)
- **Guards Explícitos em Campos Opcionais**: Nenhum fallback (`a || b`) ou comparação de igualdade envolvendo campos opcionais (`?:`) pode ficar sem guard explícito (`!= null`, checks de tipo). Previne bugs reais como `0` sendo substituído incorretamente ou `undefined === undefined` colapsando itens.

---

## 6. Ambientes & Documentação Viva
- **Produção**: Firebase `mix-webapp` | Domain: `www.mixnovidades.com`
- **Staging**: Firebase `mix-webapp-staging` (usado em preview Vercel e `.env` local)
- **Documentação de Lições**: `docs/claude-lessons.md` — Registro obrigatório de qualquer gotcha, bug sutil ou decisão de arquitetura descoberta durante a sessão.
