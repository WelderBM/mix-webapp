# Contrato de estado-na-URL do Admin

Regra geral: todo estado que o lojista esperaria reencontrar ao voltar (filtro
ativo, pedido aberto, aba, página) vive na **URL**, nunca só em estado local
volátil. Se dá pra atualizar a página, compartilhar o link ou apertar "voltar"
no navegador e o lojista esperar continuar de onde parou, o valor tem que
estar num `searchParam`.

Toda leitura/escrita de query string do admin passa por
`src/hooks/useSearchParamsPatch.ts` — nunca chame `router.push`/`replace`
manualmente com uma URL montada à mão fora dele.

## Duas convenções, dois casos de uso

`useSearchParamsPatch()` retorna uma função `patchParams(patch, options?)`:

- **Filtro/estado de navegação (`replace`, padrão)** — status, busca, aba,
  página, pedido aberto. Usa `router.replace(..., { scroll: false })`: não
  cria uma entrada nova no histórico, porque alternar um filtro não é uma
  "página" que o usuário esperaria desfazer com o botão voltar — senão cada
  tecla digitada na busca viraria um degrau de histórico.
- **Abrir um modal que representa navegação (`{ push: true }`)** — hoje só
  `?produto=` em `OrdersTab`. Usa `router.push`, que cria uma entrada nova:
  o botão "voltar" do navegador fecha o modal e devolve o usuário exatamente
  pro estado anterior (pedido aberto, filtro, scroll), sem precisar de
  nenhuma lógica extra de restauração.

Use `{ push: true }` só quando abrir aquele estado é uma ação que faz sentido
"desfazer" com o botão voltar. Pra tudo que é filtro/posição contínua,
`replace` é o padrão certo.

## `OrdersTab` (`/admin`, `view` padrão/`orders`)

| Param | Formato | Escrita | O que é |
|---|---|---|---|
| `status` | `OrderStatus \| undefined` (omitido = "todos") | replace | Filtro de status ativo. |
| `pedido` | id do pedido | replace | Pedido com o accordion aberto. Ao chegar via deep-link: expande o pedido, calcula a página que o contém (ver `page` abaixo) e rola até ele (`scrollIntoView({ behavior: "smooth", block: "start" })`) assim que o card estiver montado. |
| `produto` | id do produto | **push** | Abre o `ProductInfoModal` para o produto do item clicado, destacando a variante/imagem que o cliente escolheu naquele pedido (`selectedVariant`/`selectedImageLabel`/`selectedImageUrl` do `CartItem`, nunca o produto genérico). Fechar (botão X, "voltar" do navegador, excluir produto) sempre volta pro estado anterior. |
| `page` | inteiro ≥ 1 (omitido = `1`) | replace | Página da lista paginada (`ITEMS_PER_PAGE = 10`). Ver decisão abaixo. |

Itens de pedido sem `product` único (`CUSTOM_KIT`/`CUSTOM_RIBBON`/
`CUSTOM_BALLOON`) **nunca** abrem `?produto=` nem o `ProductInfoModal` — não
existe um produto único pra apontar. O clique nesses itens abre um diálogo de
fallback local (sem estado na URL: o conteúdo já está todo carregado do
próprio pedido, é só uma reapresentação maior, não uma navegação).

## `ProductsTab` (`/admin?view=estoque&aba=produtos`, aba padrão)

| Param | Formato | Escrita | O que é |
|---|---|---|---|
| `nome` | texto (debounce 400ms) | replace | Busca por nome. |
| `tipo` | `ProductType \| "ALL"` (omitido = todos) | replace | Filtro de tipo. |
| `categorias` | `"1" \| undefined` | replace | Modal de categorias/subcategorias aberto. |

(O modal de "ver produto" em `ProductsTab`/`RibbonsTab` — `productToView` —
**não** está na URL hoje; é estado local puro. Diferente de `OrdersTab`,
abrir um produto ali não precisa preservar posição de scroll/filtro através
de uma navegação separada, porque não existe o cenário "abri o produto a
partir de outro contexto que preciso reencontrar". Ficou fora do escopo desta
issue — se um dia precisar do mesmo "voltar fecha o modal", replicar o padrão
`push` de `OrdersTab.produto`.)

## Decisões desta issue (#73)

**Modal via `?produto=` (push) vs. navegação real para `/produto/[id]`.**
Adotado `?produto=` com history push, como a issue já recomendava. Motivo:
navegação real pra `/produto/[id]` sairia do admin — teria que restaurar
manualmente `status`+`pedido`+`page`+scroll no caminho de volta, duplicando
toda a lógica de deep-link que `OrdersTab` já tem pra `?pedido=`. Com
`?produto=` como um parâmetro do próprio `OrdersTab`, a restauração é de
graça: o "voltar" do navegador simplesmente desfaz o `push` e a URL volta a
ser exatamente a de antes.

**`page` como query param vs. calcular a página do `?pedido=` on-arrival.**
Adotado `page` na URL (`?page=`), não um cálculo "silencioso" só na chegada.
Motivos:
- Navegação normal (clicar Anterior/Próximo) sem escrever a página na URL já
  era, por si, uma segunda instância do mesmo bug descrito na issue — dar
  refresh ou compartilhar o link no meio de "página 3" perdia a posição.
  Resolver só o caso do deep-link e deixar esse igual quebrado não fechava o
  gap de verdade.
- Com `page` na URL, o "gotcha da paginação" da issue vira uma consequência
  natural do padrão já usado por `status`/`pedido`: um efeito calcula a
  página que contém o `?pedido=` alvo dentro da lista já filtrada
  (`Math.floor(idx / ITEMS_PER_PAGE) + 1`) e chama `patchParams({ page })`
  se for diferente da atual — sem precisar de um mecanismo de "pular página"
  separado do resto do fluxo de paginação.
- `currentPage` deixou de ser `useState`; é derivado de `searchParams.get("page")`
  a cada render (com fallback pra `1` e um clamp só de exibição —
  `safePage` — pro caso da lista encolher por baixo de uma página que a URL
  ainda aponta, sem reescrever a URL por baixo do usuário).
