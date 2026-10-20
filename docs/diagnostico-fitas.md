# Diagnóstico: precificação de fitas (rolo fechado vs aberto)

Investigação do bug de produção: rolo de 100m cobrando R$ 3.960 (99 × R$ 40/un) em vez do preço por metro. Este documento é só diagnóstico — **nenhuma correção foi aplicada**. A escolha de arquitetura (seção 4) é decisão de negócio, não técnica.

## 1. Onde `price` vs `rollPrice` é lido

`Product` (`src/types/product.ts:47-48`) guarda dois campos de preço no mesmo doc: `price` (genérico — usado como preço por metro quando a fita está `ABERTO`) e `rollPrice?` (opcional — preço do rolo fechado inteiro). `ribbonInventory.status` (`FECHADO | ABERTO`) diz qual dos dois deveria valer.

| Ponto | Arquivo:linha | O que lê | Ciente do status? |
|---|---|---|---|
| Central de Fitas — aba "Rolos Fechados" | `src/app/fitas/page.tsx:210-213` | `product.rollPrice \|\| product.price` (override local em `displayProduct`) | Sim — filtra por `FECHADO` antes |
| Central de Fitas — `handleAddRoll` (adicionar rolo ao carrinho) | `src/app/fitas/page.tsx:81-96` | `product.rollPrice \|\| product.price` | Sim |
| Central de Fitas — aba "Por Metro" | `src/app/fitas/page.tsx:289, 394` | `product.price` direto | Sim — filtra por `ABERTO` antes |
| Central de Fitas — `handleAddMeter` | `src/app/fitas/page.tsx:98-108` | `product.price * meterAmount` | Sim (lista já filtrada) |
| Card de vitrine (home, seções automáticas) | `src/components/features/ProductCard.tsx:28,98` | `product.price` | **Não** — nenhuma referência a `ribbonInventory` |
| Vitrine da home (`SectionProductShelf`) | `src/components/sections/SectionProductShelf.tsx:26-35` | passa `product` cru pro `ProductCard`/carrinho, `kitTotalAmount: 0` | **Não** |
| Página do produto (`/produto/[id]`) | `src/app/produto/[id]/page.tsx:422` | `selectedVariant?.price ?? product.price` | **Não** |
| Página do produto — adicionar ao carrinho | `src/app/produto/[id]/page.tsx:353-364` | `product` cru, sem `kitTotalAmount` | **Não** |
| Total do carrinho (`getCartTotal`) | `src/store/cartStore.ts:116-134` | pra `type: "SIMPLE"`: `(selectedVariant?.price \|\| product.price) * quantity` — **ignora `kitTotalAmount` inteiramente** | **Não** |
| Mensagem de WhatsApp (linha por item) | `src/components/features/CartSidebar.tsx:240-244` | `kitTotalAmount` se > 0, senão `(selectedVariant?.price ?? product.price) * quantity` | Parcial — só correto se quem adicionou já tiver calculado `kitTotalAmount` certo |
| `/meu-pedido/[id]` (cliente acompanha pedido) | `src/app/meu-pedido/[id]/page.tsx:154` | `(kitTotalAmount \|\| product?.price \|\| 0) * quantity` — **fórmula distinta das outras duas**, multiplica `kitTotalAmount` (que já é um total) por `quantity` de novo | **Não** |
| Admin — `RibbonsTab` (listagem visual e tabela) | `src/components/admin/RibbonsTab.tsx:208,538` (rolo fechado) e `:360,541` (aberto/metro) | Lê os dois campos lado a lado, corretamente rotulados | Sim (é só exibição) |
| Admin — `ProductFormDialog` (criar/editar produto) | `src/components/admin/ProductFormDialog.tsx:692-703` | **Só existe o campo genérico "Preço" → grava em `formData.price`. Não há nenhum input pra `rollPrice` em lugar nenhum do formulário.** | — |
| Admin — importação em lote (`batch-import`) | `src/app/admin/batch-import/page.tsx:219-220` | único caminho que grava `rollPrice` a partir de um CSV externo | — |
| Pedido no admin (`OrdersTab`) | `src/components/admin/OrdersTab.tsx:493,703` | exibe `order.total`, já congelado no momento do checkout — não recalcula | — |

## 2. Onde diverge — achado central

**O campo `rollPrice` não tem NENHUM input no formulário de edição de produto** (`ProductFormDialog`). Os únicos jeitos de definir `rollPrice` são: (a) o default `0` ao clicar "Nova Fita" em `RibbonsTab.tsx:140`, ou (b) a importação em lote via CSV (`batch-import/page.tsx:220`, usada pra migrar dados de outro sistema, não é fluxo do dia a dia).

Isso força os dois preços — que representam unidades diferentes (por metro vs por rolo inteiro) — a competir pelo único campo "Preço" que o admin de fato consegue editar. O padrão `rollPrice || product.price` (usado só dentro de `fitas/page.tsx`) faz `rollPrice = 0` (o default) cair silenciosamente pro valor de `price`, em vez de sinalizar "preço de rolo não configurado".

Isso produz o bug **nos dois sentidos**, dependendo de qual significado o admin tinha em mente ao preencher o único campo "Preço" disponível:

- **Rolo fechado mostrando preço de metro** (R$ 0,50/m num item LACRADO): admin criou a fita, preencheu "Preço" pensando no valor por metro (ex: R$ 0,50), nunca setou `rollPrice`. Em qualquer tela que NÃO seja a aba "Rolos Fechados" da Central de Fitas (vitrine da home, página do produto acessada direto, ou o próprio fallback `rollPrice || price` quando `rollPrice` é `0`), o preço exibido/cobrado é o de metro, não o de rolo.
- **Fita aberta cobrando preço de rolo** (99m × R$ 40 = R$ 3.960, o incidente real): admin criou a fita já pensando no preço do ROLO FECHADO (R$ 40) e digitou isso no único campo "Preço" existente (não tinha onde mais botar). Isso grava `price = 40`. Quando a fita depois é aberta (botão "Abrir Rolo" em `RibbonsTab.tsx:220-240`, que só troca `ribbonInventory.status` — não toca em `price`/`rollPrice`), a aba "Por Metro" e `handleAddMeter` passam a usar esse mesmo `price = 40` como valor **por metro**, multiplicado pela metragem pedida (99m × R$ 40 = R$ 3.960). Bate exatamente com o valor relatado em produção.

Achado secundário, independente do anterior: `/meu-pedido/[id]/page.tsx:154` usa uma terceira fórmula (`kitTotalAmount * quantity`) que já multiplica duas vezes quando `kitTotalAmount` é um total pré-calculado (caso de fitas por metro e kits) — diverge tanto de `getCartTotal` (`cartStore.ts`) quanto da mensagem de WhatsApp (`CartSidebar.tsx`). As três fórmulas de preço de item deveriam ser uma função só, reaproveitada nos três lugares — hoje são três implementações independentes que já divergem entre si mesmo sem envolver fita.

## 3. Modelo de dados real: um produto com estados

Confirmado pelo comportamento do admin: **fita é UM produto Firestore com um campo de estado (`ribbonInventory.status`), não dois produtos separados.** Evidências:

- `RibbonsTab.tsx:220-240` ("Abrir Rolo") e `:387-402` ("Fechar Manual") fazem `setDoc(doc(db, "products", fita.id), updated)` no **mesmo id** — só reescrevem `ribbonInventory.status`, o doc nunca é duplicado.
- Não existe em nenhum lugar do admin um botão "duplicar fita" ou fluxo que crie um segundo produto a partir de um existente para representar a versão aberta/fechada.
- O próprio doc carrega os dois preços (`price` e `rollPrice`) simultaneamente, o tempo todo — não é um preço substituindo o outro por documento.

Ou seja, o modelo de dados já é o de "produto único com estados". O bug não vem de dados duplicados/divergentes entre dois docs — vem de um único doc com dois campos de preço mal-rotulados na única tela onde o humano os edita.

## 4. Duas arquiteturas possíveis (sem escolher)

### A — Manter produto único com estados, mas corrigir a superfície

- Adicionar o campo `rollPrice` ao `ProductFormDialog` (visível quando `type === "RIBBON"`), com rótulos explícitos ("Preço por METRO" vs "Preço do ROLO FECHADO") em vez de um "Preço" genérico ambíguo.
- Centralizar a leitura de preço de fita numa função só (`getRibbonUnitPrice(product)`) que decide `price` vs `rollPrice` a partir de `ribbonInventory.status`, e trocar todos os pontos da tabela da seção 1 pra chamar essa função em vez de ler `product.price` cru.
- Unificar as três fórmulas de preço de item de carrinho (`cartStore.getCartTotal`, `CartSidebar` WhatsApp, `meu-pedido/[id]`) numa função compartilhada.
- **Custo de migração**: baixo. Não mexe no schema Firestore existente — só formulário + funções de leitura. Docs já existentes já têm os dois campos preenchidos (onde preenchidos corretamente) ou precisam de correção manual pontual pelos dados já errados (ex: a fita do incidente, hoje com `price = 40`).

### B — Separar em dois produtos (um por estado)

- Ribbon fechado e ribbon aberto viram dois docs `Product` distintos (ex: ligados por um `parentRibbonId` ou por convenção de nome), cada um com **um único** campo `price` no seu próprio significado (fechado = preço do rolo; aberto = preço por metro). Elimina a ambiguidade de campo por construção — não tem `rollPrice` pra esquecer de preencher.
- "Abrir rolo" vira uma operação que cria (ou ativa) o produto "aberto" e desativa/oculta o "fechado" correspondente, em vez de só trocar um campo de status no mesmo doc.
- **Custo de migração**: alto. Precisa: (1) script de migração pra converter cada `Product` RIBBON existente em até dois docs; (2) reescrever toda a lógica de listagem que hoje assume "uma fita = um doc" (`RibbonsTab`, `fitas/page.tsx`, carrinho, pedidos históricos que referenciam o id antigo); (3) decidir o que acontece com pedidos já colocados que referenciam o id do produto original — o id pode deixar de existir ou mudar de significado; (4) painel de estoque (`remainingMeters`/`totalRollMeters`) precisa ficar sincronizado entre os dois docs em vez de num só.

A opção A resolve o incidente relatado sem tocar em schema nem em pedidos históricos; a opção B é uma mudança de modelo de dados mais profunda, com superfície de migração bem maior, mas elimina a classe de bug "campo errado no formulário" por construção em vez de depender de um formulário bem rotulado.
