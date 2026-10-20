# Padronização do Catálogo (Categoria, Subcategoria, Ocasião)

> Cartilha de referência pro lojista e pro projeto — origem: issue #69
> ("Categoria como seleção controlada + cartilha de padronização").

## O problema que isso resolve

Antes desta cartilha, categoria/subcategoria eram texto livre no cadastro de
produto. Resultado: a mesma coisa virava três categorias diferentes
("Perfume", "perfumes", "Perfumaria") porque cada cadastro dependia de quem
digitou lembrar exatamente o nome usado da última vez. `slugify`/`uniqueSlug`
(`src/lib/migrateCategories.ts`) evitam colisão de **id** entre categorias,
mas não evitam essa duplicata **semântica** — "perfumes" e "Perfumaria" viram
dois documentos `categories` diferentes, cada um aparecendo sozinho como
filtro na loja.

A partir da issue #69, o cadastro de produto não permite mais digitar
categoria/subcategoria — só selecionar entre as que já existem. Criar
categoria/subcategoria nova é uma ação separada, deliberada, feita em
**Produtos → Categorias e Subcategorias**.

## Qual campo usar

### Categoria — obrigatória
O **tipo de produto**, no nível mais alto que faz sentido pro cliente decidir
"eu quero algo dessa gaveta". Referência de tamanho: o catálogo inteiro
costuma ter entre **5 e 12 categorias**. Se você está prestes a criar a
categoria #13, pare e pergunte: isso não é uma subcategoria de algo que já
existe?

Exemplos bons: `Balões`, `Perfumaria`, `Fitas`, `Descartáveis`, `Decoração`.

Exemplos ruins (na prática, tipo demais ou granularidade errada): `Perfume`,
`Perfumes Importados`, `Perfumaria Nacional` — tudo isso é `Perfumaria`, com
subcategoria (se precisar) separando por origem/linha.

### Subcategoria — opcional
Só crie subcategoria quando a categoria **já tem produtos demais pra
navegar de uma vez** e existe um critério claro de divisão dentro dela.
Referência de gatilho: **a partir de ~6 produtos** numa categoria sem
nenhuma subcategoria já vale a pena considerar dividir — não é uma regra
rígida, é o ponto em que normalmente compensa.

Exemplo: `Perfumaria` com 20 produtos pode ganhar subcategorias `Importados`
e `Nacionais`. `Fitas` com 4 produtos não precisa de nenhuma.

O `CategoryManager` (tela "Categorias e Subcategorias") mostra um aviso
quando uma categoria bate nesse gatilho (muitos produtos, zero
subcategorias) — e também quando uma categoria tem zero produtos, sugerindo
avaliar se ela ainda faz sentido existir.

### Ocasião — **não é um campo de Categoria/Subcategoria**
"Aniversário", "Casamento", "Chá Revelação", "Formatura" etc. não descrevem
o **tipo** do produto — descrevem **quando/pra que** o cliente vai usar.
Um mesmo balão metalizado serve pra vários desses eventos ao mesmo tempo, o
que já é incompatível com um campo de seleção única como categoria.

Ocasião é (ou será, dependendo do estado da issue #68 — Tags/Coleções)
vitrine/tag: uma forma de destacar produtos de categorias diferentes juntos
numa mesma prateleira temática, sem forçar duplicidade de categoria. Não
existe ainda um campo de Ocasião implementado no wizard de produto nesta
versão — quando existir, será tratado como tag/coleção, não como
categoria/subcategoria.

## Convenção de nomenclatura

- **Singular ou plural, mas consistente**: prefira o plural pro nome da
  categoria (`Balões`, não `Balão`) — é como o cliente pensa numa vitrine
  ("a seção de balões").
- **Sem acento decorativo redundante nem abreviação**: `Perfumaria`, não
  `Perfum.` nem `PERFUMARIA`.
- **Capitalização de título**: primeira letra maiúscula, resto minúsculo
  (exceto nomes próprios). `Chá Revelação`, não `chá revelação` nem `CHÁ
  REVELAÇÃO`.
- **Antes de criar uma categoria/subcategoria nova, procure na lista atual
  se já existe algo equivalente** — a barra de busca do `Select` no wizard
  de produto já é o primeiro lugar pra checar isso; se o nome que você ia
  digitar não aparece nem parecido, aí sim é caso de criar.

## Fluxo de cadastro (depois da issue #69)

1. **Cadastrar produto novo**: no passo "Classificação" do wizard, categoria
   e subcategoria são só seleção — se a categoria que você precisa não
   existe ainda, cancele o cadastro do produto, vá em **Produtos →
   Categorias e Subcategorias**, crie a categoria (e subcategoria, se for o
   caso), volte e cadastre o produto normalmente.
2. **Criar/editar/apagar categoria ou subcategoria**: sempre pela tela
   "Categorias e Subcategorias" (`CategoryManager`). Apagar categoria com
   produtos vinculados é bloqueado — é preciso mover/reclassificar os
   produtos primeiro.
3. **Produto antigo com categoria "órfã"** (valor que não bate com nenhuma
   categoria da lista atual — texto livre de antes desta issue, ou uma
   categoria renomeada/apagada depois): o wizard continua abrindo
   normalmente pra edição, com a categoria antiga mostrada e marcada como
   "fora da lista atual". Ela permanece selecionada até alguém trocar
   manualmente por uma opção real da lista — a edição nunca é bloqueada por
   causa disso.

## Referência rápida

| Campo | Obrigatório? | Quem cria | Quantidade de referência |
| :--- | :--- | :--- | :--- |
| Categoria | Sim | `CategoryManager` | ~5 a 12 no catálogo todo |
| Subcategoria | Não | `CategoryManager` | a partir de ~6 produtos na categoria, se fizer sentido dividir |
| Ocasião (futuro, tag/coleção) | Não | (ver issue #68) | N/A — não é seleção única |
