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
- **Descrição do PR**: siga as seções de `.github/pull_request_template.md` (Critério concluído, Pendências, Fora de escopo). O `gh pr create --body` não usa o modelo; copie as seções para o corpo. `Closes #N` só quando a issue fica 100% resolvida; senão, `Refs #N` e o que falta em Pendências.
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
- **Continuidade entre conversas (regra do dono, 23/10/2026)** — nada minimamente importante pode ficar só no chat:
  - **Ao começar**: ler o `docs/sessoes/*.md` mais recente (estado, perguntas abertas ao dono, pendências).
  - **Na hora em que aparece**: achado de revisão que não vou corrigir agora, bug visto de passagem ou promessa ("corrijo depois") vira **issue** (passando pela triagem); pergunta ao dono sem resposta fica listada até ser respondida.
  - **Ao fechar a conversa**: documento de passagem em `docs/sessoes/AAAA-MM-DD-<assunto>.md` com o levantamento completo; onde guardar cada tipo de informação está em `docs/fluxo/guia-varias-conversas.md` §8.
- **Prioridade (regra do dono, 23/10/2026)**: a próxima issue sai de `node scripts/prioridade.mjs` (fila autônoma, etiqueta `autonomo`); decisões ficam na fila do dono (`precisa-de-voce`). Toda issue nova nasce com os 6 eixos (`o:`, `s:`, `a:`, `e:`, `destrava`, `risco`) e uma `frente:`. Regra completa em `docs/fluxo/prioridade.md`.
