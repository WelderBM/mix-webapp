---
name: engenharia-reversa-pr
description: Use pra auditar PRs FECHADOS (mergeados ou não) contra o estado ATUAL do código, procurando incoerência — uma promessa/decisão/checklist de um PR antigo que não bate mais com a realidade (revertida silenciosamente por um PR posterior, item de checklist nunca de fato feito, decisão documentada depois contrariada sem registro, código morto deixado por um revert parcial). NÃO use pra revisar o diff de um PR no momento do merge (isso é `auditoria-de-pr`) nem pra sweep geral de saúde do projeto sem ponto de partida em PR (isso é `varredura-de-saude`).
---

# Engenharia reversa de PR (coerência histórico × atual)

**Por que essa skill existe**: um PR fechado é um registro do que foi *decidido e prometido* num momento — "critério de aceite: X", "corrigido: Y", "decisão: Z porque W". Nada garante que isso continua verdade depois. Um PR posterior pode reescrever o mesmo arquivo e reverter Y sem ninguém perceber (nenhum teste quebra porque o teste testava o sintoma, não a causa); um checklist de PR mergeado pode ter ficado com item `[ ]` never resolvido, invisível porque ninguém revisita PR fechado; uma decisão registrada ("mantive X porque Y") pode ter sido contrariada por uma mudança posterior que não sabia da decisão original. Esta skill é o procedimento pra caçar esse tipo de deriva — comparar a *promessa* do PR contra o *código de hoje*, não contra o diff de quando foi aberto.

## 0. Escopo — sempre combinar antes de começar

O repo pode ter 100+ PRs fechados. Nunca tente ler todos de una vez (estoura contexto, e a maioria não vai ter achado nenhum — baixo retorno por PR revisado). Antes de rodar, confirme com o humano (pergunte, não assuma):

- **Janela**: todos os fechados, só os últimos N, só um intervalo de data/número, ou só os que tocam uma área específica (ex: "só PRs que mexeram em `CartSidebar.tsx`")?
- **Profundidade**: passada rápida (só cruzar checklist/critério de aceite contra grep no código atual) ou passada funda (reler o diff original inteiro e comparar linha a linha com o arquivo atual)? Rápida serve pra descoberta ampla; funda só vale a pena depois que a rápida já apontou um PR suspeito.

Sem essas duas respostas, não comece a rodar `gh pr list --state closed` em lote.

## 1. Levantar os candidatos

```
gh pr list --state closed --json number,title,url,mergedAt,body,files --limit <N>
```

Descarte primeiro os PRs `mergedAt: null` sem corpo relevante (fechados sem merge, ex: superseded por outro PR — só interessam se o motivo do fechamento também precisa de checagem, ex: "fechado porque #X já resolvia" — confirmar que #X realmente resolveu). Priorize PRs cujo corpo tem qualquer um destes sinais, que são exatamente onde a deriva mora:

- **Checklist com item `[ ]` não marcado** no corpo de um PR já mergeado — promessa que nunca foi cumprida, ou foi cumprida em outro PR sem linkar de volta.
- **Seção "Achados fora de escopo" / "fast-follow" / "não corrigido"** — coisas que o autor sabia que estavam pendentes. Confirmar se viraram issue (muitas não viravam antes desta skill existir — é esperado achar backlog de dívida aqui).
- **Seção "Decisão: ..."** — uma escolha de produto/arquitetura registrada com justificativa. Confirmar se a justificativa ainda é verdade no código atual (ex: "mantive X obrigatório porque Y usa em `Z.tsx:123`" — `Z.tsx:123` ainda usa X do jeito descrito?).
- **"Critério de aceite"** do corpo (ou da issue que o PR fecha, via `Closes #N`) — cada item é uma afirmação verificável sobre o comportamento atual do código.

## 2. Passada rápida — cruzar promessa × grep

Pra cada candidato, sem reler o diff inteiro:

1. Extraia as afirmações verificáveis (checklist, critério de aceite, decisão documentada).
2. Pra cada uma, confirme contra o código ATUAL (`git grep`/`Grep`/`Read` no HEAD de `dev`, nunca no diff antigo do PR — o diff antigo é história, o HEAD é a fonte da verdade sobre o que é verdade hoje).
3. Três resultados possíveis por afirmação:
   - **Ainda bate** — nada a fazer, não reporte (achado "nada encontrado" não precisa virar registro, diferente de uma auditoria de PR único — aqui o volume é alto, só reporta o que quebrou).
   - **Não bate mais, e dá pra saber por quê** (outro PR posterior mexeu ali) — `git log -p --follow <arquivo>` ou `git blame` na linha em questão pra achar o PR/commit que mudou. Isso vira o achado.
   - **Nunca bateu** (item de checklist que never foi feito, nem por este PR nem por nenhum depois) — dívida esquecida. Também vira achado.

## 3. Passada funda — só nos suspeitos

Se a passada rápida achou algo, aí sim releia o diff original inteiro (`gh pr diff <N>`) contra o arquivo atual, pra entender o tamanho real da divergência antes de reportar — não reporte "parece que regrediu" sem ter confirmado lendo os dois lados.

## 4. Reportar — mesma regra de formalização da `orquestracao-multi-branch` §6

Achado de engenharia reversa nunca fica só na resposta do chat. Pela natureza:

1. **Regressão silenciosa de comportamento** (algo que funcionava, e um PR posterior quebrou sem querer) — isso é bug real hoje, vira **issue nova**, severidade conforme o impacto, referenciando os dois PRs (o que implementou, o que regrediu).
2. **Checklist/fast-follow nunca resolvido** — vira **issue nova** (mesmo padrão das issues #160/#162/#163 abertas em 03/08/2026 a partir de achados de PR), ou entra como item numa issue coletora já existente se a natureza bater (ex: `#105`, polish/acessibilidade).
3. **Decisão documentada que ficou desatualizada** sem ninguém ter decidido mudar de propósito — não é bug, é decisão que precisa ser revisitada. Vira issue com label apropriada, corpo explicando a decisão original, o que mudou, e a pergunta em aberto pro humano decidir de novo.

Nunca "conserte" uma decisão de produto sozinho durante essa auditoria — o papel aqui é achar a incoerência e formalizar, não julgar qual lado (código atual ou decisão antiga) está certo. Isso é call do humano.

## 5. Aprendizado contínuo

Se o mesmo padrão de deriva aparecer 2+ vezes (ex: todo PR que mexe em `CartSidebar.tsx` esquece de atualizar `OrdersTab.tsx` — já é o caso registrado na #160), isso deixa de ser achado avulso e vira um item de checklist na skill `auditoria-de-pr` (seção 3, "rastreamento entre arquivos") — o objetivo de longo prazo desta skill é alimentar as outras com os padrões reais de deriva que este repo tem, não só gerar issues uma vez.
