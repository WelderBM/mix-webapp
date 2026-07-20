---
name: deploy-vercel
description: Use quando aparecer um check vermelho no deploy do Vercel, ao criar uma branch nova que vai gerar preview deploy, ou ao adicionar/editar/remover variável de ambiente no Vercel (CLI ou dashboard). NÃO use pra debugar erro que só acontece em runtime local (`npm run dev`) sem nenhum deploy envolvido.
---

# Deploy / Vercel

Ambientes deste projeto (ver CLAUDE.md, seção "Ambientes"): produção usa o projeto Firebase `mix-webapp`, `dev`/preview usa `mix-webapp-staging`. As lições aqui são especificamente sobre a camada Vercel — env vars, CLI e o gotcha de build que costuma se disfarçar de "falha genérica".

## Regra de ouro: check vermelho merece abrir o log

Nunca presuma que um check vermelho no Vercel é "ruído genérico" só porque outros checks (testes, lint) passaram. Isso já aconteceu de verdade neste projeto e o build ficou quebrado por mais tempo do que devia porque ninguém abriu o log pra confirmar. Primeiro passo sempre: abrir o log do deployment que falhou e ler o erro real antes de qualquer suposição.

## Env vars são escopadas por branch — branch nova não herda

Preview deploys usam só as env vars configuradas pra aquele branch específico. Se `NEXT_PUBLIC_FIREBASE_*` só está configurado pro branch `dev`, **toda branch de feature nova builda sem nenhuma config de Firebase**, mesmo que `dev` já esteja funcionando.

Ao criar uma branch nova que vai gerar preview deploy, considere de antemão se ela vai precisar dessas vars — não espere o build falhar pra descobrir.

Se o log do check vermelho apontar algo como `Firebase: Error (auth/invalid-api-key)` ou uma falha de inicialização do Firebase durante o build (não durante uma requisição), é praticamente sempre env var faltando pro branch, não bug de código — ver o gotcha do `sitemap.ts` abaixo pra entender por que isso mata o build inteiro.

## Workaround da CLI pra adicionar env var

`vercel env add <nome> preview` **sem** especificar branch trava em loop quando rodado em modo não-interativo/agente — a CLI devolve `"status": "action_required", "reason": "git_branch_required"` pedindo pra rodar o mesmo comando de novo, e isso nunca resolve sozinho (nem com `--yes --force`).

**O que funciona**: escopar direto pra uma branch específica —
```
vercel env add <nome> preview <branch> --value <valor> --yes
```

Não existe hoje um jeito confiável de aplicar "todas as branches de preview de uma vez" via CLI em modo agente. Pra isso, use o dashboard: Settings → Environment Variables → editar cada var → marcar "Preview" sem restringir a uma branch específica.

## Cuidado com `vercel env rm` em entrada de escopo combinado

Uma única entrada pode cobrir vários ambientes ao mesmo tempo (`Production, Preview, Development`). Rodar `vercel env rm <nome>` sem escopo remove de **todos** os ambientes que aquela entrada cobre — inclusive produção.

Antes de remover qualquer env var: rode `vercel env ls` e confirme exatamente quais ambientes aquela linha específica cobre. Pra sobrescrever só o comportamento de Preview sem tocar produção, adicione uma entrada **nova** escopada só pra Preview (a mais específica vence) em vez de remover e recriar a antiga.

## Gotcha do `sitemap.ts`: import de `db` no escopo do módulo precisa de env vars válidas em build time

Qualquer `route.ts`/página que faz `import { db } from "@/lib/firebase"` dispara a inicialização do Firebase como efeito colateral do `import` — antes de qualquer `try/catch` dentro da função em si rodar. Se uma env var do Firebase estiver ausente ou inválida durante o build (não durante uma requisição real), a inicialização lança na hora do `import` e derruba **o build inteiro**, não só aquela rota. Nenhum `try/catch` local protege contra isso, porque o erro acontece antes do corpo da função executar.

Isso é o motivo pelo qual "uma branch sem env vars do Firebase" e "build inteiro quebrado" andam juntos neste projeto — não é uma rota isolada falhando, é o processo de build morrendo cedo.
