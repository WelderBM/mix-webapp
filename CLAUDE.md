# Mix Novidades — mix-webapp

Loja de presentes/festas (Boa Vista - RR) com pedido digital-first: cliente monta o carrinho no site, o checkout grava em `orders` no Firestore e monta uma mensagem de WhatsApp pré-preenchida (`wa.me`) pro handoff final. `OrdersTab.tsx` (admin) recebe o pedido em tempo real; `/meu-pedido` deixa o cliente acompanhar o status sem login.

**Se você é uma sessão nova (ou rodando em outra máquina), leia isto inteiro antes de mexer em qualquer coisa.** Múltiplas sessões — às vezes em computadores diferentes — trabalham nesse repo em paralelo. `git branch -a` e `git log --all --oneline -20` antes de assumir que a árvore está "limpa": muito provavelmente há trabalho em outra branch que você ainda não viu.

## Stack
Next.js 16 (App Router, Turbopack) + Firebase (Firestore client SDK, Auth com Google Sign-In, Storage) + Zustand + shadcn/ui + Tailwind v4 + Vitest.

## Fluxo de git (regra, não sugestão)
- **`dev` é a branch principal**, não `master`. Toda branch de trabalho nasce de `dev` (`git checkout dev && git pull` antes de criar qualquer branch nova), e todo PR volta pra `dev` — nunca pra `master` direto.
- `master` é a branch de release/produção, atualizada só por promoção periódica `dev` → `master` (não é o dia a dia).
- Apague branches locais já mescladas (`git branch -d`).
- **Antes de qualquer PR ir pra `dev`, validação local é obrigatória** — quem está pedindo a mudança testa rodando local antes do merge. `.env` local aponta pro projeto Firebase de **staging** (`mix-webapp-staging`), nunca pro de produção — testar local não pode sujar dado real de cliente.
- PRs ficam abertos, sem merge, até essa validação acontecer — isso é esperado, não um bloqueio a resolver sozinho.

## Como entregar trabalho aqui
- **Fatiado**: cada mudança significativa vira uma sequência de PRs pequenos e revisáveis (uma "Fatia" por PR — modelo de dados, depois UI, depois integração, depois exibição), não um PR gigante. Ver `docs/claude-lessons.md` pros exemplos reais dessa sequência.
- **Ritual antes de todo commit**: `npx tsc --noEmit` limpo + `npx vitest run` passando (rode a suíte inteira, não só o arquivo tocado) + `npx next build` quando a mudança for estrutural (troca de wizard, mudança em provider compartilhado, etc.) — build local pega coisa que typecheck sozinho não pega (ver seção de erros de build no lessons.md).
- **Performance é regra permanente**, não pedido pontual: toda imagem com `fill` do `next/image` leva `sizes` correto pro layout real; prefira `Promise.all` a `await` sequencial quando as chamadas não dependem uma da outra; evite `onSnapshot` redundante no mesmo documento; assuma celular de entrada como baseline, não topo de linha.
- Sem comentário decorativo — só quando o *porquê* não é óbvio (uma decisão contra-intuitiva, uma limitação de API, um bug que já mordeu antes).
- Antes de propor uma abstração nova, procure o padrão já existente no código pra reaproveitar (ex: o padrão "Select + '+ Novo X'" já usado em categoria/subcategoria/variação; o padrão de wizard por passos do `KitBuilderModal`).

## Ambientes
- **Produção**: projeto Firebase `mix-webapp`, deploy em `master` → `www.mixnovidades.com` (Vercel).
- **Staging**: projeto Firebase `mix-webapp-staging`, usado por `dev`/preview E por todo `.env` local.
- Variáveis de ambiente na Vercel são escopadas por branch — cada branch nova de preview pode não ter as variáveis do Firebase configuradas ainda (ver lessons.md, isso já quebrou builds de verdade, mais de uma vez).

## Documentação viva
- `docs/claude-lessons.md` — catálogo de bugs reais, causas-raiz e padrões técnicos descobertos, pra não redescobrir o mesmo problema em outra sessão/máquina.
- `docs/qa-fase2-checklist.md` — checklist de QA ponta-a-ponta do fluxo de pedido.
- Skills do projeto vivem em `.claude/skills/`, commitadas no repo, e carregam sob demanda em qualquer sessão/máquina — inclusive sessões cloud.
- Pipeline de graduação: lição nova entra em `docs/claude-lessons.md`; quando uma categoria acumula 3+ entradas relacionadas ou vira um procedimento com passos a seguir, ela gradua pra uma skill em `.claude/skills/` (o lessons.md fica com uma linha apontando pra skill correspondente).

Se você (Claude) aprender algo que vai te morder de novo em outra sessão — um gotcha de biblioteca, uma decisão de arquitetura não óbvia, um bug sutil — adicione em `docs/claude-lessons.md` antes de terminar a tarefa. Esse arquivo existe pra não perder esse conhecimento quando a sessão acabar ou trocar de máquina.
