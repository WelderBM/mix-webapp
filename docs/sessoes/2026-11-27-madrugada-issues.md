# Passagem: madrugada de 27/11/2026, loop autônomo nas issues

> Documento de fim de conversa (procedimento em `docs/fluxo/guia-varias-conversas.md`).
> O dono pediu para resolver todas as issues sem consultar ninguém. As decisões da fila dele foram tomadas pelo agente e estão registradas aqui e em cada issue. Dá para reverter qualquer uma.
> **Checklist do dono (pendências):** https://claude.ai/artifact/Nj7dqyNwMTcShJ4s8YNCHX (bloco "Madrugada").

## Resumo

- **24 PRs abertos** na madrugada. A maioria entrou no `dev`. Os que ainda dependem de CI ou de merge estão na lista do fim.
- **Nada foi para produção.** A promoção `dev` → `master` é do dono, e a tag agora sai sozinha (#433).
- **Achados mais importantes** (não estavam em issue nenhuma):
  1. **A home saía "Sua vitrine está vazia" no HTML que o Google lê** (#426). As seções existiam, mas o primeiro render usava a store vazia. No servidor, o Zustand sempre devolve o estado inicial. Corrigido no #427, com lição registrada em `claude-lessons.md`.
  2. **A prateleira por categoria saía vazia no HTML do servidor**, porque as categorias só existiam no navegador. As vitrines passaram a ser resolvidas no servidor (#429).
  3. **As páginas de produto não tinham dados estruturados de Produto** (preço e estoque no Google). Entraram no #442.
  4. **As páginas de categoria saíam com o título genérico da loja e fora do sitemap**, e as capas de /fitas e /baloes apontavam para imagens que não existem (#443).

## Issues

| Issue | Resultado |
|---|---|
| #419 checkout com catálogo falho | #423: o pedido segue e a atendente confere no WhatsApp |
| #420 botão de 32 px | #424 |
| #421 `.gitignore` | #425 (idêntico ao do `master`, `server_logs.txt` fora) |
| #416 alerta para importar o Noturno | #428 e #430: data em `intake_meta/import`, período nas Configurações (padrão 2 dias); um Excel sem mudança também confirma a importação |
| #426 vitrine vazia (nova) | #427 e #429 |
| #399 catálogo inteiro em cada visita | #429 (home e /natura só com as vitrines) e #431 (/fitas só lê as fitas). Pendente: /baloes (filtro normalizado) e carrinho/montador (leem tudo ao abrir) |
| #373 cota | fechada: Blaze ativo e leituras da loja cortadas |
| #110 épico de performance | fechado: as 4 sub-issues já tinham entrado |
| #221 contraste | #432. A vistoria de 23/11 ainda via o verde antigo, que só foi para o ar no #414. Fecha sozinha depois de 2 vistorias |
| #409 cabeçalho do lançamento | fechada (resolvida pelo #411) |
| #422 tags de promoção | #433: workflow `promo-tag.yml` e 9 tags criadas |
| #289 pasta local | bloco do `next dev` no AGENTS.md (#433). O resto é no computador do dono |
| #307 UX das páginas | #434 e #439 (decisões abaixo) |
| #413 rolo "p/ metro" | #435 |
| #415 baixa de metragem | #437 |
| #56 maquininha | #440: "O motoboy tem maquininha" nas Configurações, desligado por padrão |
| #55 marca e quantidade | #442 (marca do Noturno; quantidade já era `packQty`) |
| #287 balões | #438 (números foil preto e candy). Resto no checklist |
| #288 skills | #441 |
| #436 venda de balcão (nova) | aberta, espera o dono |
| #390 SMS e mensagem automática | fechada sem fazer (custo) |
| #96, #97, #99, #100 (kits) | fechadas sem fazer: viram produto comum (comentário no #94) |
| #162 Sentry | sem token por ora; a validação no preview fica com o dono |
| #203 IA de texto | vale fazer; falta a chave da Anthropic na Vercel |
| #98, #101–#104, #142, #168, #205 | ideias futuras (`o:1`), sem bloqueio |

## Decisões tomadas pelo agente (o dono pode mudar)

- **#415:** a baixa da metragem acontece em **"Pronto"**. Voltar ou cancelar devolve. Pedido antigo que já estava entregue não baixa de novo.
- **#307:**
  - banner compacto nas telas internas (170 px no celular, sem o endereço);
  - /fitas abre em "Por Metro" sem rolo fechado em estoque, a menos que a cliente já tenha escolhido outra aba;
  - /baloes com um título só, "Orçamento de Balões".
- **#56:** o toggle começa desligado, o que mantém a regra de hoje.
- **#94:** sem tipos novos `READY_BOW` e `READY_KIT`. Laço pronto entra pelo Lançamento, e kit pronto é cadastrado como produto comum.
- **#390:** nada por enquanto.
- **#287:** Basic 6,5" continua no Liso; número foil candy fica sem arte e usa foto.
- **#162:** sem token de source maps por ora.
- **#288:** as 6 propostas do mapa de skills aceitas.

## Lições novas em `docs/claude-lessons.md`

- Zustand no servidor devolve sempre o estado inicial da store (#427).

Outras armadilhas encontradas na noite, sem lição própria:
- **Editar com Python em modo texto troca o CRLF por LF.** Aconteceu no `CartSidebar` e no `firestore.rules`. A lição de CRLF já existia; o padrão é ler e gravar em binário, mantendo o fim de linha.
- **Layout do Next só aceita exportações conhecidas.** Função auxiliar vai para `src/lib`.
- **A permissão de push direto no `dev` valeu só para o arquivo daquele momento.** Os PRs seguiram pelo fluxo normal.

## Pendências do dono

Estão todas no checklist (bloco Madrugada). As principais:
1. **Promoção `dev` → `master`.** Leva tudo isto para o ar.
2. Preencher a metragem de cada tamanho de laço no admin.
3. Rodar **Balões › Montar pelo Noturno** depois do #438.
4. Conferência de estoque dos balões na prateleira (lista no checklist).
5. Decidir sobre a chave da Anthropic (#203) e sobre a venda de balcão (#436).

## PRs ainda abertos ao fim desta passagem

#437, #441, #442 e #443, todos com base `dev`. O agente faz o merge assim que o CI ficar verde.
