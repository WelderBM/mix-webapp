---
name: deploy-vercel
description: Use quando aparecer um check vermelho no deploy do Vercel, ao criar uma branch nova que vai gerar preview deploy, ou ao adicionar/editar/remover variável de ambiente no Vercel (CLI ou dashboard). NÃO use pra debugar erro que só acontece em runtime local (`npm run dev`) sem nenhum deploy envolvido.
---

# Deploy / Vercel

Ambientes deste projeto (ver CLAUDE.md, seção "Ambientes"): produção usa o projeto Firebase `mix-webapp`, `dev`/preview usa `mix-webapp-staging`. As lições aqui são especificamente sobre a camada Vercel — env vars, CLI e o gotcha de build que costuma se disfarçar de "falha genérica".

## Regra de ouro: check vermelho merece abrir o log

Nunca presuma que um check vermelho no Vercel é "ruído genérico" só porque outros checks (testes, lint) passaram. Isso já aconteceu de verdade neste projeto e o build ficou quebrado por mais tempo do que devia porque ninguém abriu o log pra confirmar. Primeiro passo sempre: abrir o log do deployment que falhou e ler o erro real antes de qualquer suposição.

## Env vars são escopadas por branch — branch nova não herda

**Resolvido na raiz em 22/07/2026**: as vars `NEXT_PUBLIC_FIREBASE_*` (e qualquer outra necessária no build) agora têm uma entrada em Preview **sem restrição de branch**, com os valores de staging — toda branch nova herda automaticamente, sem precisar de configuração específica. Um check vermelho de preview a partir dessa data **não é mais esse caso conhecido** — abra o log, a causa é outra.

O que descreve o resto desta seção é o comportamento antigo (branch nova não herdava), mantido aqui como histórico/fallback — útil se a entrada sem restrição de branch for removida por engano no futuro, ou pra reconhecer o sintoma de novo caso volte a acontecer.

Preview deploys usam só as env vars configuradas pra aquele branch específico. Se `NEXT_PUBLIC_FIREBASE_*` só está configurado pro branch `dev`, **toda branch de feature nova builda sem nenhuma config de Firebase**, mesmo que `dev` já esteja funcionando.

Ao criar uma branch nova que vai gerar preview deploy, considere de antemão se ela vai precisar dessas vars — não espere o build falhar pra descobrir.

Se o log do check vermelho apontar algo como `Firebase: Error (auth/invalid-api-key)` ou uma falha de inicialização do Firebase durante o build (não durante uma requisição), é praticamente sempre env var faltando pro branch, não bug de código — ver o gotcha do `sitemap.ts` abaixo pra entender por que isso mata o build inteiro.

## Workaround da CLI pra adicionar env var

`vercel env add <nome> preview` **sem** especificar branch trava em loop quando rodado em modo não-interativo/agente — a CLI devolve `"status": "action_required", "reason": "git_branch_required"` pedindo pra rodar o mesmo comando de novo, e isso nunca resolve sozinho (nem com `--yes --force`, nem removendo antes todas as entradas branch-escopadas conflitantes — testado e confirmado: a CLI simplesmente não tem um caminho não-interativo pra criar uma entrada "Preview, todas as branches" do zero).

**O que funciona pra uma branch específica**:
```
vercel env add <nome> preview <branch> --value <valor> --yes
```

**O que funciona pra "todas as branches de preview de uma vez"**: a API REST da Vercel direto, contornando o loop da CLI (a limitação é da UX da CLI, não da plataforma). Token já autenticado da CLI fica em `~/AppData/Roaming/com.vercel.cli/Data/auth.json` (campo `token`; se expirado — checar `expiresAt`, em segundos — rodar qualquer comando `vercel` primeiro pra renovar). `projectId`/`orgId` ficam em `.vercel/project.json` na raiz do repo.
```
POST https://api.vercel.com/v10/projects/{projectId}/env?teamId={orgId}
Authorization: Bearer <token>
{ "key": "<nome>", "value": "<valor>", "type": "encrypted", "target": ["preview"] }
```
Sem `gitBranch` no body = vale pra todas as branches de preview. **Nunca imprima o token nem os valores em log/commit** — extraia pra variável de shell dentro do próprio comando, sem ecoar.

**Gotcha do dashboard: tipo "Sensitive" por padrão quebra a verificação silenciosamente.** Se a var for criada pelo dashboard com o toggle "Sensitive" (write-only) em vez de "Encrypted", o valor nunca mais pode ser lido de volta — nem por `vercel env pull`, nem por `PATCH .../env/:id` (que devolve `200` mas não atualiza nada, ou `400 "You cannot change the type of a Sensitive Environment Variable"` se você tentar mudar o tipo junto). Isso se disfarça de "o valor não colou", porque `vercel env pull` sempre mostra vazio pra esse tipo, tenha o valor sido salvo certo ou não — não dá pra diferenciar os dois casos por fora. Pra variáveis `NEXT_PUBLIC_*` (já públicas no bundle do cliente, sem motivo real pra serem write-only): se a entrada foi criada como "Sensitive" por engano, não adianta tentar corrigir com PATCH — apague (`DELETE .../env/:id`) e recrie do zero com `"type": "encrypted"`.

## Cuidado com `vercel env rm`/edição em entrada de escopo combinado

Uma única entrada pode cobrir vários ambientes ao mesmo tempo (`Production, Preview, Development`). Rodar `vercel env rm <nome>` sem escopo remove de **todos** os ambientes que aquela entrada cobre — inclusive produção.

Antes de remover qualquer env var: rode `vercel env ls` e confirme exatamente quais ambientes aquela linha específica cobre.

Pra sobrescrever só o comportamento de Preview sem tocar produção, o instinto é "adicionar uma entrada nova escopada só pra Preview, a mais específica vence" — funciona quando a entrada antiga é branch-específica, mas **não** quando a entrada antiga já é combinada (`Production, Preview, Development`): tanto o dashboard quanto a API recusam criar a nova (`ENV_CONFLICT: "already exists for the target ..."`), porque os alvos se sobrepõem. Nesse caso o caminho seguro é `PATCH .../env/:id` só no campo `target` da entrada antiga, tirando `"preview"` da lista (ex: `{"target": ["production", "development"]}`) — isso estreita o alcance sem tocar no valor nem apagar a linha, diferente de `rm`. Só depois disso a entrada nova de Preview pode ser criada sem conflito.

## Gotcha do `sitemap.ts`: import de `db` no escopo do módulo precisa de env vars válidas em build time

Qualquer `route.ts`/página que faz `import { db } from "@/lib/firebase"` dispara a inicialização do Firebase como efeito colateral do `import` — antes de qualquer `try/catch` dentro da função em si rodar. Se uma env var do Firebase estiver ausente ou inválida durante o build (não durante uma requisição real), a inicialização lança na hora do `import` e derruba **o build inteiro**, não só aquela rota. Nenhum `try/catch` local protege contra isso, porque o erro acontece antes do corpo da função executar.

Isso é o motivo pelo qual "uma branch sem env vars do Firebase" e "build inteiro quebrado" andam juntos neste projeto — não é uma rota isolada falhando, é o processo de build morrendo cedo.
