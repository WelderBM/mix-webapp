# QA manual — validação de `dev` (integração addendum-4)

Rodar local: `npm run dev` (ou `next dev`), com o `.env` apontando pro Firebase de **staging** (`mix-webapp-staging`).

`tsc --noEmit` e `vitest run` (184/184) já passaram na árvore atual. Este roteiro cobre o que só um humano em um navegador real pega — os bugs aqui já morderam antes (echo do Firestore, falso positivo de draft, reset de formulário), então o teste tem que reproduzir a condição exata que os causou, não só "abrir a tela".

---

## 1. Persistência de rascunho — assistente de produto (Fatia 1)

1. Admin → Produtos → "+ Novo Produto". Preencha nome, categoria, avance até "Variações", digite algo, **não salve**.
2. Feche a aba (ou dê F5). Reabra o assistente do mesmo jeito (novo produto).
3. **Esperado**: prompt perguntando se quer continuar o rascunho ou descartar. Ao continuar, volta pro mesmo passo com os dados preenchidos.
4. Repita, mas agora clique em "Cancelar"/feche o modal normalmente (sem editar nada) e reabra.
5. **Esperado (regressão do bug 2b9f26c)**: **nenhum** prompt de rascunho deve aparecer — esse era o falso positivo (disparava em toda primeira carga sem edição real).
6. Edite um produto existente, mude um campo, salve com sucesso. Reabra o mesmo produto.
7. **Esperado**: sem prompt — draft foi limpo no save.

## 2. Persistência de rascunho — Configurações/Balões (Fatia 2)

1. Admin → Configurações, mude a cor primária (não salve ainda). Vá pra aba Balões, mude um preço. **Não clique em "Salvar Configurações"**.
2. Dê F5.
3. **Esperado**: prompt de rascunho não salvo, cobrindo as duas abas juntas (é um único draft `admin-config`).
4. Continue o rascunho → confirme que a cor e o preço mudado nas duas abas voltaram.
5. Clique "Salvar Configurações". F5 de novo.
6. **Esperado (regressão do bug 9a54a17 — echo do onSnapshot)**: **nenhum** prompt reaparece logo após salvar. Esse era o bug onde o eco do Firestore (escrita otimista + confirmação do servidor) parecia uma edição nova e ressuscitava o draft já limpo.

## 3. Matriz de variação (dimensões combinadas)

1. Admin → Produtos → editar um produto → aba Variações.
2. Use "Gerar Combinações": declare 2 dimensões (ex: Tamanho: P/M/G, Cor: Azul/Vermelho). Gere.
3. **Esperado**: cartesian product das combinações (3×2=6 variantes), a primeira como padrão.
4. Vincule uma imagem diferente a pelo menos 2 combinações específicas (não todas).
5. Salve. Abra o produto na loja (`/produto/[id]`).
6. Escolha um valor de Tamanho, depois troque a Cor. **Esperado (regressão do bug corrigido em efb4670)**: trocar a Cor não deve resetar o Tamanho já escolhido — os dois seletores são independentes.
7. Verifique que a imagem exibida troca pra a mais específica combinação escolhida (não sempre a primeira imagem que contém aquele valor).
8. Crie agora um produto com variante de **uma dimensão só** (ex: só Tamanho, sem gerador de combinação) usando o botão "Adicionar Variação" simples.
9. **Esperado**: funciona igual a antes — internamente vira `attributes: {Tamanho: 'G'}`, sem tela diferente pro usuário.
10. Teste um produto **legado** (variante antiga sem `attributes`, se existir algum no seu banco de staging) — deve continuar caindo no picker antigo (flat), sem erro.

## 4. Navegação "Ver Loja" / "Ver na Loja" (gesto nativo de voltar)

Esse teste só é 100% confiável **no celular** (o bug era especificamente sobre o gesto de voltar do navegador mobile), mas dá pra checar o básico no desktop:

1. No celular, acesse `http://<seu-ip-local>:3000` (o `next.config.ts` agora libera acesso LAN — pegue o IP com `ipconfig`).
2. Logado como admin, clique "Ver Loja" no cabeçalho do admin.
3. **Esperado**: navega na **mesma aba** (não abre nova aba/tab).
4. Use o gesto nativo de voltar do celular (swipe/botão do sistema, não um botão da UI).
5. **Esperado**: volta pro admin corretamente (era esse o bug — aba nova sem histórico fazia o gesto nativo não fazer nada).
6. Repita a partir de "Ver na Loja" dentro do modal de detalhes de um produto (ProductInfoModal).

## 5. Deep-linking por query param (admin componentizado)

1. Admin → Pedidos, filtre por um status específico, abra um pedido específico.
2. Copie a URL da barra de endereço (deve ter algo como `?view=pedidos&status=...&pedido=...`).
3. Abra essa URL em uma aba anônima/nova sessão (ou dê F5).
4. **Esperado**: cai direto na tela/filtro/pedido certos, sem precisar navegar manualmente de novo.
5. Repita em Gerenciar Estoque com filtro de nome/tipo/categoria (`?aba=...&nome=...&tipo=...&categorias=...`).

## 6. Nome da loja dinâmico

1. Admin → Configurações, mude `Nome da Loja` pra algo diferente de "Mix Novidades", salve.
2. **Esperado**: Navbar, Footer e StoreHeader na loja pública refletem o novo nome (eram hardcoded antes).
3. Reverta pro nome original ao final do teste (staging, mas evite deixar sujeira pro próximo teste).

## 7. Rótulos unificados de ProductType

1. Compare o rótulo de um mesmo `ProductType` (ex: "Laço", "Balão", "Fita") em três lugares: assistente de criação (dropdown), filtro da aba Gerenciar Estoque, e o badge na tabela de produtos.
2. **Esperado**: rótulo idêntico nos três — antes havia 3 conjuntos de rótulos diferentes, incluindo um "RIBBON" cru (não traduzido) na aba Fitas.
3. Confira especificamente a aba Fitas — não deve mais aparecer "RIBBON" sem tradução.

## 8. ConfirmDialog (sem `window.confirm`)

1. No admin, dispare qualquer ação que antes usava `confirm()` nativo do browser (ex: excluir um produto, uma seção, uma imagem).
2. **Esperado**: modal customizado (ConfirmDialog) aparece, não o popup nativo feio do navegador. Cancelar não executa a ação; confirmar executa.

## 9. Performance (Addendum 4, Parte C) — checagem indireta

Difícil de "ver" diretamente, mas dá pra confirmar não-regressão:
1. Abra o admin com o DevTools Network aberto, filtre por Firestore (`firestore.googleapis.com`). Recarregue a página de Configurações.
2. **Esperado**: apenas **um** listener ativo em `settings/general` (antes havia dois — um no ThemeProvider global, outro duplicado no admin/page.tsx).
3. Clique "Salvar Configurações" com Network aberto — as duas escritas (`settings` + `balloonConfig`) devem sair praticamente juntas (paralelas via `Promise.all`), não uma esperando a outra.
4. Passeie pela loja em geral (produto, carrinho, seções com imagem) e confira que nenhuma imagem quebra ou distorce — era um sweep de `sizes` em `next/image fill` em 27 lugares.

---

**Ao final**: se tudo passar, o próximo passo natural (fora do escopo deste teste) seria decidir sobre promoção `dev → master`, já que `dev` está 73 commits à frente de produção. Isso é uma decisão separada — não assumi nada aqui.
