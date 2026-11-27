# Passagem 27/11/2026: revisão, promoção para produção e planilha do Noturno

> Documento de fim de conversa (procedimento em `docs/fluxo/guia-varias-conversas.md`).
> Resume as mensagens de hoje, na ordem em que aconteceram. Seção sem nada diz "nada".

## Resumo

- **Repositório:** saudável. Tipos limpos e 881 testes passando no `dev` (`a503186`).
- **Revisão do #408 e do #410:** podem mergear, nenhum achado bloqueante. Foram mergeados no `dev` durante a conversa.
- **Produção:** o `dev` foi promovido para o `master` pelo **PR #414**, merge `28c465f`. O deploy de produção estava sendo montado na Vercel ao fim da conversa.
- **Planilha do Noturno:** achada no Gmail e analisada: 7.305 produtos, cerca de R$ 363,7 mil a custo.
- **Página com o diff `dev` → `master`:** https://claude.ai/artifact/Akphig94HeCDJZMziNoX2Y (privada, só o dono abre). Feita antes de o #402, o #408 e o #410 entrarem no `dev`, por isso cobre os 8 PRs anteriores.

## 1. Panorama do repositório

- **O que é:** loja da Mix Novidades (Boa Vista). Next.js 16, React 19, Firebase (Firestore, Auth, Storage) e Vercel.
- **Branch da sessão:** estava 22 commits atrás do `dev`. Foi atualizada sem perder nada.
- **Backlog:** 30 issues abertas.
  - A maioria tem a etiqueta `precisa-de-voce`: kits (#94 a #104), balões (#287), maquininha (#56) e skills (#288).
  - A fila autônoma é de performance e cota (#399, #373, #110) e acessibilidade (#221).
- **Firebase:**
  - O código dá para mexer daqui: regras, stores, seed.
  - O projeto ao vivo, não. A sessão não tem credencial: sem `.env`, `gcloud` sem login e nenhum conector.
  - Para liberar: chave de conta de serviço em *Network secrets* do ambiente.

## 2. Diferença `dev` → `master` (antes da promoção)

8 PRs, todos de 09/11, mexendo em 31 arquivos (+478 −133).

| PR | Área | O quê |
|---|---|---|
| #401 | Loja / SEO | Canônico, JSON-LD e robots no domínio real (`www.mixnovidades.com`; antes iam para `mixnovidades.com.br`, que não existe). /natura e /baloes-boa-vista no sitemap. Produto desativado com `noindex`. |
| #406 | Loja | Timestamp do Firestore vira texto ISO antes do Client Component. Foto do produto com prioridade. |
| #403, #405 | Admin / pedidos | Card de pedido no celular, "Ver/Ocultar detalhes", Cancelado com visual próprio. |
| #398 | Admin / a11y | Nomes acessíveis e contraste em 11 telas. |
| #407 | Admin / lançamento | Tela de áreas mais clara, com sugestão de por onde continuar. |
| #411 | Admin / lançamento | Cabeçalho no padrão de /admin. |
| #412 | Docs | Lições: `mockReset` do Vitest 4 e rota `force-static`. |

Conferido:
- Nenhum código no navegador chama `toDate()` na data de produto, então o #406 é seguro.
- O `.gitignore` do `master` tem 12 linhas a mais (Firebase, editor, logs). O merge manteve essas linhas.

## 3. Revisão do #408 e do #410 (skill `auditoria-de-pr`)

**Veredito:** podem mergear.
- Os dois entram no `dev` sem conflito, juntos ou separados.
- Com os dois aplicados, tipos limpos e 881 testes passando.

**#408: menu e carrinho sem baixar o catálogo em toda página**
- O menu "Loja" usa a contagem pronta de `/catalogo/menu` (revalida a cada 5 min).
- O catálogo só desce quando o carrinho ou o montador de kit abre.
- Se o cliente tocar em "Finalizar" antes de o catálogo chegar, o carrinho espera e confere.
- Conferido: toda tela que dependia da Navbar para carregar o catálogo agora carrega sozinha. São home, /fitas (`LacoBuilder`), balões, categoria, produto, carrinho e montador.

**#410: produto e categoria leem só o recorte**
- `where`/`limit`/`documentId in` não precisam de índice novo.
- A regra de `products` é leitura pública.
- Cada vitrine falha sozinha.

**Achados baixos** (nenhum bloqueia):
1. **Se a leitura do catálogo falhar** (por exemplo, cota estourada), o checkout barra todos os itens como "não está mais disponível". Já acontecia antes.
   - Sugestão: com `error` preenchido, deixar o pedido seguir ou avisar "não consegui conferir o estoque".
   - Como confirmar corrigido: um teste do CartSidebar em que `ensureProducts` termina com `error` e o pedido é gravado.
2. **`/catalogo/menu` relê o catálogo inteiro no servidor** até 288 vezes por dia (uma a cada 5 min, com movimento constante). É bem menos que antes. Se a cota apertar, subir o intervalo para 15 a 30 min.
3. **"Relacionados" pode mostrar menos itens** que o limite quando há mais de 4 desativados ou kits no início da subcategoria.

**Revisão automática do CI no #414** (não bloqueante):
- O botão de expandir da tabela de pedidos no desktop tem 32 px. Sugestão: `size-11`.
- Repetiu o achado 1 acima.

## 4. Promoção para produção

1. **Domínio conferido:** o robots.txt no ar (lido pela Vercel) já usava `https://www.mixnovidades.com`. Então `NEXT_PUBLIC_BASE_URL` de produção está certa, e os canônicos do #401 vão para o lugar certo.
2. **`dev` mudou no meio:** o #402 (botão "Finalizar Pedido" com contraste e descrição para leitor de tela), o #408 e o #410 foram mergeados no `dev`. Testado de novo no `a503186`: tipos ok, 881 testes, preview da Vercel READY.
3. **PR #414** aberto do `dev` para o `master`.
4. O primeiro merge foi barrado: o check obrigatório "Run Tests & Build" estava na fila.
5. Com todos os checks verdes e a revisão automática aprovando, o merge foi feito (`28c465f`).
6. O deploy de produção começou: https://vercel.com/welderbms-projects/mix-webapp/8sGuZTxS5giXH1SggTAd6bYqhT3S

## 5. Planilha `produtos-20-10-2026.xlsx` (Gmail)

**Busca no Gmail**
- É a única planilha Excel de produtos deste ano no e-mail. Foi enviada em 20/10 por Felomena Rocha Barroso.
- No mesmo dia a conta da loja mandou o "RELATORIO - PRODUTO", mas é um PDF (`Produto.pdf`, do Noturno).

**O que é**
- Exportação de estoque do Noturno: `ID_PRODUTO, REFORIGINAL, DESCRICAO, MARCA, ESTOQUE, CUSTOBASE`.
- É a mesma planilha que originou o importador `src/lib/intake/noturno.ts`.
- A análise abaixo foi feita com o próprio `analyzeNoturnoRows`.

**Números gerais**
- 7.305 itens e 174.857 unidades. Valor a custo: **R$ 363.741,60**.
- A exportação só traz itens com estoque acima de zero.
- Estoque picado: 1.680 itens têm 1 unidade, 3.870 têm até 5 e só 197 passam de 100.
- 97% dos itens não têm código de barras, e 74% não têm referência.

**Classificação da fila de lançamento**

| Situação | Itens | Valor a custo |
|---|---|---|
| Pronto para lançar (`candidato`) | 5.176 | R$ 265 mil |
| Atenção | 1.710 | R$ 81 mil |
| Revisar | 415 | R$ 17 mil |
| Bloqueado | 4 | R$ 0,5 mil |

**Categoria sugerida**
- 37% dos itens têm categoria sugerida. Por valor: sacos (R$ 37 mil), balões (R$ 31 mil), fitas (R$ 28 mil), papéis (R$ 18 mil), caixas (R$ 16 mil), canecas (R$ 15 mil).
- **4.576 itens (R$ 182 mil) ficaram sem categoria.** Destes, 2.913 estão prontos para lançar, mas precisam de categoria na mão.

**Marcas:** 370 no total.

| Marca | Itens | Valor a custo |
|---|---|---|
| DIVERSOS (sem marca de verdade) | 1.499 | R$ 73 mil |
| CROMUS | 413 | R$ 35 mil |
| VMP | 552 | R$ 32 mil |
| ALBANO | 312 | R$ 32 mil |
| SÃO ROQUE | 196 | R$ 18 mil |

**Problemas no cadastro do Noturno**
- **Estoque impossível:**
  - PINÇA MERHEJE (cód. 76): 14.284 unidades a R$ 0,01;
  - ALFINETE DE SEGURANÇA (9104): 5.933 unidades;
  - SACO PARA PRESENTE 10X15 (1250): 1.594 unidades.
- **Item fantasma:** cód. 999999999, "PRODUTO NÃO CADASTRADO".
- **Obsoletos** (21 itens, R$ 3,1 mil): celulares Samsung (cerca de R$ 830 cada), cabos de DVD, chip Claro.
- **Datados** (77 itens, R$ 4,4 mil): balões "Kit 2023", Álbum da Copa, Dia das Mães, Natal.
- **Perecíveis** (20 itens): bombons, chocolates, biscoitos. Conferir validade.
- **Duplicados:** 150 grupos e 337 itens, mesmo nome em códigos diferentes. Exemplos:
  - ALIANÇA DE AÇO NS: 81 + 149;
  - ADESIVOS DIA DAS MÃES: 3 + 197;
  - ACETONA;
  - ÁLCOOL EM GEL.
- **Estoque fracionado:** 250 itens, por exemplo ELÁSTICO FINO com 2.552,98. Ou é venda por metro ou peso, ou é erro de digitação.

## Esperando o dono

1. **Subir a tag de promoção.** O ambiente da sessão recusou o push. No computador:
   `git tag -a promo-2026-11-27 a503186 -m "Promoção 27/11" && git push origin promo-2026-11-27`
2. **Conferir o deploy de produção** do `28c465f`: home, produto, /categoria, /natura, carrinho até o WhatsApp, card de pedido no celular e `sitemap.xml` com /natura e /baloes-boa-vista.
3. **Limpeza no Noturno** (sugestão): bloqueados, duplicados, obsoletos e datados. Depois, exportar de novo e reimportar no admin.
4. **Lista dos 2.913 itens sem categoria**, agrupados por tipo de produto, para acelerar o lançamento. Foi oferecida e ainda não teve resposta.
5. **Acesso ao Firebase ao vivo nesta sessão:** só com credencial nas configurações do ambiente.

## Pendências registradas (viram issue se forem feitas)

- Checkout barrando tudo quando a leitura do catálogo falha (achado 1 da seção 3).
- Botão de expandir da tabela de pedidos no desktop com 32 px (revisão automática do #414).
- Trazer para o `dev` as 12 linhas extras do `.gitignore` do `master`. O `server_logs.txt` continua commitado.
- A última tag `promo-*` no GitHub era de 14/07, mas houve promoções depois (#379, #383, #391, #395, #397) sem tag.
