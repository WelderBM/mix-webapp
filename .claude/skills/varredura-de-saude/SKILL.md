---
name: varredura-de-saude
description: Use pra rodar a varredura periódica de saúde do projeto inteiro — código morto/desnecessário, backlog duplicado, drift de performance/infra/github, e docs/skills que deviam graduar ou atualizar. Roda uma vez por sprint, antes de uma promoção dev→master, ou quando bater a sensação de "o projeto está grande demais pra monitorar". NÃO use pra auditar um PR específico (isso é auditoria-de-pr) nem pra debugar um deploy vermelho (isso é deploy-vercel) — esta é o sweep do todo, não o diagnóstico de um problema pontual.
---

# Varredura de saúde do projeto

**Por que essa skill existe**: passado um certo tamanho, ninguém segura o projeto inteiro na cabeça — e tentar é justamente o que produz a sensação de caos iminente. O antídoto não é vigiar tudo o tempo todo; é transformar "saúde do projeto" num **comando periódico** que roda uma passada, delega pras auditorias que já existem, preenche as lacunas que nenhuma cobre sozinha, e devolve **um relatório único de ação** — apagar, fundir, consolidar, graduar. O medo vira um comando.

**Esta skill é orquestração, não re-implementação.** Um ponto honesto sobre o mecanismo: uma skill não "chama" outra como função — quem orquestra é você (o agente) lendo este runbook e **carregando o conteúdo da skill referenciada** no passo indicado, aplicando o critério dela ali. Nas dimensões que já têm skill, esta varredura manda abrir aquela skill e usar o critério dela — nunca reescreve o critério aqui (isso duplicaria a fonte de verdade, exatamente o que a varredura existe pra caçar). Nas dimensões sem skill, ela traz o probe.

## Mapa de orquestração (o que delega vs. o que é probe próprio)

| Dimensão | Fonte do critério |
|---|---|
| Backlog / issues duplicadas | **carrega `triagem-de-issues`** (modo varredura) |
| Rendering / imagens / Core Web Vitals | **carrega `next-performance-guide`** |
| Infra / env / deploy | aplica o conhecimento de **`deploy-vercel`** (proativo, não reativo) |
| PR de risco encontrado no caminho | aponta pra **`auditoria-de-pr`** — NÃO audita aqui |
| Código morto, higiene git/gh, drift de docs/arquitetura | **probe próprio desta skill** |

## As dimensões da varredura

Passe por cada uma. Não pule uma porque as outras vieram limpas — cada uma pega uma classe de dívida diferente. Colete tudo e só monte o relatório no fim (formato na última seção).

### 1. Código morto / desnecessário — `npx knip`

```
npx knip
```

`knip` acha arquivos, exports e dependências não usados num projeto TS. É a resposta objetiva pra "o que é desnecessário" — deixa de ser sensação e vira lista.

**Cuidado com falso positivo, obrigatório antes de reportar como "apagar":** entrypoints por convenção do Next (`page.tsx`, `layout.tsx`, `route.ts`, `sitemap.ts`, `opengraph-image`) não são "não usados" — são chamados pelo framework, não por import. O plugin Next do knip cobre a maioria, mas confirme. Se der ruído nesses, adicione um `knip.json` mínimo declarando os entry globs do App Router antes de confiar na saída. **Nada entra no relatório como "apagar" sem você ter aberto o arquivo e confirmado que ninguém o alcança** — nem por import, nem por convenção, nem por string dinâmica.

### 2. Backlog — carrega `triagem-de-issues` (modo varredura)

Abra a skill `triagem-de-issues` e rode o modo varredura dela (`gh issue list --state open --json ...` — clusterizar por superfície de diff — destinos dup/funde/epic). Não repita o critério aqui — é dela. Traga o resultado pro relatório consolidado sob FUNDIR.

### 3. Higiene de branch / PR (GitHub) — probe próprio

O fluxo deste repo (ver `CLAUDE.md`) define o que é saudável aqui, então os probes são calibrados nele — não em defaults genéricos:

- **Branches já mescladas e não deletadas** (o `CLAUDE.md` manda apagar mescladas):
  ```
  git branch --merged dev | grep -v -E "dev|master"
  gh pr list --state merged --limit 30 --json headRefName,number
  ```
  Cruze: branch viva cujo PR já mergeou = candidata a apagar. Vai pra LEMBRETES.
- **PR aberto parado** — atenção: neste repo **PR aberto sem merge é o estado normal** (fica aberto pra validação local). Então NÃO reporte "PR aberto" como problema. O probe real é PR aberto **sem atividade há muito tempo** (semanas), como lembrete de que a validação local ficou pra trás — nunca como alarme.
- **Issues sem label** — metadata sujo que a IA (e você) lê pior:
  ```
  gh issue list --state open --json number,title,labels --jq '.[] | select(.labels|length==0) | "#\(.number) \(.title)"'
  ```
- **Proteção de branch** — confirme que o ruleset de `master` (e o de `dev`, se houver) segue ativo. Regressão silenciosa de proteção é dívida invisível.
- **Drift dev→master** — quantos commits `dev` está à frente de `master`:
  ```
  git rev-list --count origin/master..origin/dev
  ```
  Não é problema, é lembrete de promoção pendente — vai pra LEMBRETES.
- **Worktrees órfãos** — cruze `git worktree list` com branches já mescladas:
  ```
  git worktree list --porcelain
  git branch --merged dev
  ```
  Worktree cujo branch já mergeou (e sem PR aberto) é candidato a `node scripts/wt-clean.mjs` (dry-run primeiro) — vai pra LEMBRETES, nunca remova aqui dentro da varredura.

### 4. Drift de performance / rendering — carrega `next-performance-guide`

Abra a skill `next-performance-guide` e rode a auditoria de rendering/imagens/CWV dela sobre as rotas. Não duplique o critério aqui.

**Guard-rail de versão**: se a `next-performance-guide` ainda não tiver sido atualizada pro Next.js 16 (Cache Components, `reactCompiler` ligado, `revalidate` legado vs `use cache`), a saída dela pode acusar padrões corretos como bug. Antes de reportar qualquer achado de rendering, confirme que a skill já reflete o Next 16 — se não, sinalize no relatório sob GRADUAR ("next-performance-guide desatualizada, achados de rendering suspensos até atualizar") em vez de reportar achados possivelmente falsos.

### 5. Infra / env (Vercel) — aplica `deploy-vercel` proativamente

A `deploy-vercel` é reativa (check vermelho). Aqui use o conhecimento dela de forma proativa:
- As env vars `NEXT_PUBLIC_FIREBASE_*` de Preview ainda têm a entrada **sem restrição de branch** (a correção de raiz de 22/07/2026)? Se alguém a removeu por engano, branches novas voltam a buildar sem Firebase. Confirme antes que quebre.
- Últimos deploys de `dev`/preview verdes? `vercel ls` / status no dashboard. Check vermelho pendente = manda abrir a `deploy-vercel`, não diagnostica aqui.

### 6. Drift de arquitetura / duplicação de padrão — probe próprio

A versão sweep-wide do que a `auditoria-de-pr` faz por-PR. Grep pelo repo inteiro procurando:

- **Reimplementação de primitivo que já existe** — os padrões reutilizáveis conhecidos deste projeto: `Select + '+ Novo X'` (categoria/subcategoria/variação), o wizard por passos do `KitBuilderModal`, `useDraftPersistence`, `useSearchParamsPatch`. Uma versão nova de qualquer um destes escrita à mão é candidata a CONSOLIDAR — duplicação é quase sempre falha de descoberta, não de disciplina.
- **Violações grepáveis das regras do `CLAUDE.md`** (as que a `auditoria-de-pr` cobre por-PR, aqui varridas no todo):
  ```
  grep -rn "<img " src/                      # <img> cru em vez de SafeImage/next/image
  grep -rn "fill" src/ | grep -v "sizes"     # next/image fill sem sizes (candidatos)
  ```
  Mais o padrão dos bugs de dinheiro #52/#53: `a || b` e `x === y` sobre campo opcional sem guard explícito — mais difícil de grepar cego, mas os hotspots de preço/quantidade/carrinho merecem uma passada manual. Isso NÃO é auditar um PR (é sweep do código já mergeado); se um hotspot específico precisar de análise profunda, aí sim manda abrir a `auditoria-de-pr`.

### 7. Saúde da documentação viva — probe próprio (meta-check)

A varredura audita também o próprio sistema anti-caos, senão ele apodrece calado:

- **Lição madura a graduar**: alguma categoria em `docs/claude-lessons.md` acumulou 3+ entradas relacionadas ou virou um procedimento com passos? Pelo pipeline do `CLAUDE.md`, gradua pra skill em `.claude/skills/` (e a entrada no lessons.md vira ponteiro). Vai pra GRADUAR.
- **Skill ou doc mentindo**: alguma skill/CLAUDE.md referencia arquivo, linha ou padrão que não existe mais no código? Ponteiro morto é pior que ausência — manda o leitor pro lugar errado com confiança.
- **Regra do CLAUDE.md que o código já não segue**: se uma regra virou letra morta (todo mundo viola), ou a regra atualiza ou o código conforma — decida e registre, não deixe a divergência silenciosa.

## Formato de saída — um relatório, agrupado por AÇÃO (não por dimensão)

O ponto da varredura é entregar decisões, não sete listas soltas. Consolide tudo assim:

```
APAGAR      — código morto confirmado (knip, cada item aberto e verificado)
FUNDIR      — issues/branches duplicados (da triagem-de-issues + higiene git)
CONSOLIDAR  — padrão reimplementado — reusar primitivo existente (qual, onde)
GRADUAR     — lição madura — skill; ou skill/doc a atualizar/corrigir
LEMBRETES   — não-bloqueantes: dev→master N commits à frente; branch X mesclada a apagar;
              PR #Y parado há Z semanas; env var de preview a reconferir
```

Cada item com o comando ou arquivo concreto pra agir — nada de "pode ter algo aqui". Se uma dimensão veio 100% limpa, diga explicitamente ("backlog: nada a fundir") — limpo é um resultado válido, não uma seção omitida.

## Passo final: dos achados ao backlog

A varredura só vale a pena se o que ela acha vira trabalho rastreável — senão o relatório é lido uma vez e a dívida volta a ser invisível. Mas fechar esse loop tem uma ordem certa, e errar a ordem reintroduz exatamente a duplicação que a varredura existe pra caçar.

**Nem todo achado vira issue.** Separe antes de criar qualquer coisa:

- **APAGAR** (código morto confirmado) e **LEMBRETES** (branch mesclada a deletar, promoção dev→master pendente, env var a reconferir) são **ações de execução imediata, não backlog.** Você faz na hora — `git branch -d`, apagar o arquivo morto. Virar issue disso é burocracia que só engorda o backlog que a varredura acabou de tentar enxugar. Não crie issue pra APAGAR/LEMBRETES.
- **CONSOLIDAR**, **GRADUAR** e os achados de **rendering/perf** são trabalho de verdade a agendar — esses sim viram backlog.

**A triagem é o filtro na ENTRADA, não a faxina na saída.** O erro a evitar: despejar os achados como N issues cruas e só então rodar a triagem — nesse ponto você já criou o que a triagem existe pra impedir. Então, pros achados que viram backlog (CONSOLIDAR/GRADUAR/perf), o passo é:

**Carregue a `triagem-de-issues` em modo criação e passe cada achado por ela ANTES de criar a issue.** E com uma exigência a mais, específica da varredura: a triagem aqui cruza os achados **entre si**, não só contra o backlog aberto. A varredura, por natureza, produz achados que se sobrepõem uns aos outros mais que uma sessão normal — três `force-dynamic` desnecessários (natura, home, etc.) não são três issues, são um cluster de mesma superfície; um achado de `<img>` cru pode já ter issue aberta (ex: a issue do `BalloonBuilderTrigger`), e nesse caso não nasce de novo. Só o que sobrevive ao filtro — não é duplicata do backlog, não é duplicata de outro achado, não é sub-issue de algo que já existe — nasce como issue nova. O resto vira sub-issue, ou não nasce.

Ordem final, então: sete dimensões — relatório agrupado por ação — APAGAR/LEMBRETES você executa na hora — CONSOLIDAR/GRADUAR/perf passam pela triagem (cruzando backlog + entre si) — só o filtrado vira issue.

## O que esta skill NÃO faz

- **Não apaga nem fecha nada sozinha.** Knip erra com entrypoint dinâmico; a triagem decide destino de issue com julgamento seu. A varredura propõe e confirma; a execução é uma decisão sua, item a item.
- **Não substitui as skills que orquestra.** Se uma dimensão precisa de profundidade (um PR de risco, um deploy vermelho, um achado de rendering), ela manda abrir a skill específica — é um índice de saúde, não o conserto.
- **Não roda no automático a cada commit.** É deliberada e periódica. O gatilho certo é o calendário (uma vez por sprint), o marco (antes de promover dev→master), ou a emoção nomeada ("está grande demais") — transformada em comando em vez de preocupação difusa.
