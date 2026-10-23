# Mapa de skills — onde cada uma entra no fluxo

> **Data:** 23/10/2026 · rascunho para integrarmos juntos
> **Regra geral:** cada skill tem **um** momento certo. Duas skills no mesmo
> momento só se fizerem coisas diferentes (uma cria, outra confere).

---

## 1. O fluxo, etapa por etapa

```
Pedido ──► Planejar ──► Construir ──► Conferir ──► PR ──► Enquanto espera ──► Rotina
```

| Etapa | Skill | O que faz ali | Já existia? |
|---|---|---|---|
| **Pedido** | `triagem-de-issues` | Confere se já existe issue/branch com o mesmo diff | sim |
| **Planejar** | `writing-plans` | Plano em passos verificáveis, **só** para trabalho de mais de um PR ou ~5+ arquivos | **nova** |
| **Construir — tela nova ou redesenho** | `frontend-design` | Direção visual (tipografia, hierarquia, nada "cara de template") | **nova** |
| | `ui-ux-pro-max` | Consulta: paleta, par de fontes, regra de UX, padrão de gráfico | **nova** |
| | `mobile-first-guide` | Toque, formulário e layout no celular | sim |
| **Construir — código React/Next** | `vercel-react-best-practices` | Regras de desempenho ao escrever componente, busca de dados, bundle | **nova** |
| | `next-performance-guide` | Estratégia de renderização, imagens, Core Web Vitals | sim |
| **Conferir (antes do PR)** | `verification-before-completion` | Só digo "pronto" com a prova rodada (tsc, vitest, build, simulação) | **nova** |
| | `web-design-guidelines` | Revisa os arquivos de tela mudados contra as regras da Vercel (arquivo:linha) | **nova** |
| | `accessibility-test` / `design-audit` | Acessibilidade a fundo / consistência visual | sim |
| **PR aberto** | `fluxo-continuo` | Uma espera só; sigo outra tarefa independente | sim (de hoje) |
| | `auditoria-de-pr` | Revisar PR que veio de outra sessão | sim |
| **Textos que ficam** | `stop-slop` | Tira o "tom de IA" de descrição de produto, texto da loja, mensagem de WhatsApp, corpo de PR | **nova** |
| **Rotina (1× por sprint)** | `varredura-de-saude` | Código morto, backlog, drift | sim |
| | `token-optimizer` (+ `token-coach`) | Mede onde vão os tokens e propõe cortes (aplica só com sua aprovação) | **nova** |
| **Retomar trabalho** | `resume-checkpoint` | Recupera o contexto de uma sessão anterior depois de um `/clear` | **nova** |

---

## 2. Sobreposições e como resolvi

| Par | Divisão |
|---|---|
| `frontend-design` × `ui-ux-pro-max` | A primeira **decide a direção**; a segunda é **catálogo de consulta**. |
| `web-design-guidelines` × `design-audit` × `accessibility-test` | Guidelines = checklist rápido nos arquivos mudados (todo PR de tela). Design-audit e accessibility-test = auditoria funda, quando pedida. |
| `vercel-react-best-practices` × `next-performance-guide` | React = como escrever o componente. Next = como a página é entregue (SSR/ISR, imagem, LCP). |
| `writing-plans` × plano em markdown que já faço | Mesmo espírito; a skill dá o formato (objetivo, arquitetura, passos com verificação). |
| `verification-before-completion` × ritual do CLAUDE.md | Reforça o ritual: sem `tsc`/`vitest` rodados nesta mensagem, não existe "pronto". |

---

## 3. Ajustes que proponho (decidir juntos)

1. **Onde salvar os planos** — a skill quer `docs/superpowers/plans/`. Proponho
   `docs/planos/AAAA-MM-DD-<assunto>.md`, versionado, para você ler no GitHub.
2. **`ui-ux-pro-max` só como consulta** — o passo dela de "gerar e gravar um
   design system" criaria arquivos novos de padrão visual no repo, em conflito
   com os tokens do Tailwind que já existem. Proponho não usar esse passo.
3. **`writing-plans` sem TDD obrigatório** — ela manda escrever o teste que
   falha antes do código. Proponho manter como hoje: teste junto com o código,
   TDD só em correção de bug (teste que reproduz primeiro).
4. **`web-design-guidelines` no revisor automático** — dá para pôr no revisor
   do CI como mais uma "lente" para PR de tela. Fica para depois que virmos
   a skill funcionando em 2–3 PRs.
5. **Primeira medição de tokens** — rodar `token-optimizer` numa conversa nova
   (os ganchos dele só carregam ao abrir). Ele mostra o antes/depois e pede
   aprovação para cada corte.
6. **`stop-slop` nos textos da loja** — quando o lançamento pelo Noturno
   ganhar descrição de produto com IA (#203), passar por ela.

---

## 4. O que **não** muda

- Merge em `master` continua só seu; o revisor automático continua igual.
- Subagentes só quando você pedir.
- Skills carregam só no momento delas: não pesam nas conversas comuns.
