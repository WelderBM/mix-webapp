> **Atualização 23/10:** etapas 0 (chave do Serper) e 1 (busca de foto, #269/#270) concluídas. Estado atual em `docs/sessoes/2026-10-23-baloes-e-fluxo.md`.

# Plano dos próximos passos — Mix Novidades

> **Data:** 22/10/2026
> **Objetivo central:** as 3 funcionárias lançarem o estoque do Noturno **em produção**, com o mínimo de fricção.
> **Regra de ordem:** primeiro o que destrava o lançamento real; polimento vem em paralelo, nunca na frente.

---

## 1. Onde estamos

| Frente | Situação |
|---|---|
| **Marco 2: lançamento pelo Noturno** | 5 de 6 partes prontas: importar, fila por área, card, grupos, estoque. Balões e fitas pelo cadastro próprio também estão prontos. |
| **Ambiente** | Tudo isso está **só no dev/staging**. A produção está **109 commits (43 PRs) atrás**, desde 20/10. |
| **Revisão de PRs** | Automática. PR pequeno entra no dev sozinho; produção (master) sempre passa por você. |
| **Backlog dos marcos** | Auditado hoje. Nada se perdeu; só o **#105** tinha itens de fato pendentes. |

---

## 2. A ordem proposta

```
Etapa 0  Chave do Serper no Vercel          você, 5 min        ← agora
Etapa 1  Busca de foto (#267, #268)          eu, 2 PRs          ← em seguida
Etapa 2  Seu teste ponta a ponta             você, ~1 h
Etapa 3  Levar para produção                 juntos, ~1 h
Etapa 4  Lançamento real com as funcionárias você + elas, dias
Etapa 5  Polimento em paralelo               eu, durante a etapa 4
```

---

## Etapa 0 — Colocar a chave do Serper (você)

> ⚠️ **Nunca cole a chave aqui no chat.** E não use `!` no terminal: com comandos que pedem o valor, ele grava a variável **vazia** (já aconteceu com o token do GitHub).

1. Em **serper.dev**, abra *API Key* e copie a chave.
2. No **Vercel**: projeto `mix-webapp` → *Settings* → *Environment Variables* → *Add*.
   - **Key:** `SERPER_API_KEY`
   - **Value:** a chave
   - **Environments:** marque **Preview** e **Production**.
3. Para testar no seu computador: adicione no `.env.local` a linha `SERPER_API_KEY=...`.
4. Me avise com um "feito". Eu confiro que a variável existe, **sem ler o valor**.

**Pronto quando:** a variável aparece no Vercel nos dois ambientes.

---

## Etapa 1 — Busca de foto dentro do app (eu)

| PR | Issue | O que entrega |
|---|---|---|
| 1º | **#267** | Rota segura de busca e de download; botão **"Buscar foto"** em Fitas › Cadastrar pelo Noturno |
| 2º | **#268** | O mesmo botão no **card de lançamento** de qualquer produto |

- **Como a atendente usa:** toca em "Buscar foto" → vê a grade de fotos → toca numa → confere grande → **"Usar esta foto"**. Nenhum link copiado.
- **Segurança:** só admin logado usa as rotas; só baixa imagem, com limite de tamanho; bloqueia endereços internos.
- **Cota:** 2.500 buscas grátis. A busca só acontece quando ela toca no botão.

**Pronto quando:** os dois PRs estiverem no dev, e no preview der para escolher a foto de uma fita do Master 16 mm.

---

## Etapa 2 — Seu teste ponta a ponta (você)

Roteiro em **staging**, de preferência **no celular** (é como as funcionárias vão usar):

- [ ] **Importar:** subir o Excel do Noturno mais recente. A contagem de novos e atualizados faz sentido?
- [ ] **Balões:** Admin › Balões › **Montar pelo Noturno** → revisar os pacotes → **Salvar Configurações**.
- [ ] **Loja › Balões:** cor sem estoque some? Os desenhos (canudo, cintilante, A1) estão bons? Foil pede as letras?
- [ ] **Fitas:** Admin › Fitas › **Cadastrar pelo Noturno** → começar pelo **Master 16 mm × 50 m** → preços → cadastrar → testar **Buscar foto**.
- [ ] **Fila:** abrir uma área → aparece o aviso das fitas de laço? → lançar 3 produtos (um avulso, um grupo de cores, um com várias fotos).
- [ ] **Rascunho:** fechar a tela no meio de um lançamento e reabrir. Voltou?
- [ ] **Compra:** como cliente, comprar um balão foil "ANA" e uma fita. O pedido chega certo no admin e no WhatsApp?

**Pronto quando:** o roteiro passar, ou os problemas encontrados virarem issues (eu corrijo na hora).

---

## Etapa 3 — Levar para produção (juntos)

São **43 PRs** de uma vez, então vale cuidado. Eu preparo; **o merge para `master` é sempre seu**.

**Antes do merge (eu):**
- [ ] Rodar a varredura de **runtime** (app rodando, coletar avisos de console) e a **checagem de segurança** do diff dev → master.
- [ ] Conferir as **regras do Firestore**: mudaram 35 linhas desde a produção (coleções novas da fila de lançamento). A publicação em produção é automática no merge para `master`.
- [ ] Abrir o PR `dev → master` com o resumo do que muda para o cliente e para o admin.

**Depois do merge (você, no admin de produção):**
- [ ] Conferir se as **3 funcionárias** estão na lista de equipe (*whitelisted staff*) da produção.
- [ ] **Importar** o Excel do Noturno em produção.
- [ ] Balões › **Montar pelo Noturno** (o catálogo de produção é de **março**) → Salvar.
- [ ] Fitas › **Cadastrar pelo Noturno**, linha por linha.
- [ ] Abrir a loja no celular e fazer uma compra de teste.

**Pronto quando:** a loja em produção mostra balões e fitas atualizados e a fila de lançamento abre para as funcionárias.

---

## Etapa 4 — Lançamento real (você + funcionárias)

- Cada funcionária **pega uma área** da loja (a fila já impede duas na mesma).
- Você acompanha pelo **placar de progresso** na fila.
- **Combinado:** qualquer atrito que elas encontrarem, você me manda (print + uma frase). Eu corrijo em PR pequeno, que entra sozinho no dev, e promovemos para produção em lote, a cada 1 ou 2 dias.

**Pronto quando:** o núcleo festa/presente/embalagem (≈ 2.500 itens) estiver lançado ou marcado como "fora da loja".

---

## Etapa 5 — Polimento em paralelo (eu, durante a etapa 4)

Nada aqui bloqueia o lançamento. Cada linha é **um PR**:

| PR | Issues | O que muda | Por quê agora |
|---|---|---|---|
| A | **#147** | Lista de produtos do admin paginada + busca sem travar | Com milhares de produtos lançados, a aba Produtos vai pesar no celular |
| B | **#105** (8 itens) | Avisos de console, acessibilidade dos diálogos, rótulos do checkout, rolagem suave | Higiene; pequeno |
| C | **#220–#228** | Alvos de toque pequenos e acessibilidade na loja (`/`, `/fitas`, `/meu-pedido`, `/natura`, cabeçalho) | Achados da vistoria automática de UX; clientes no celular |

---

## 3. Depois do lançamento rodando

| Prioridade | Item | Observação |
|---|---|---|
| Alta | **#162** Sentry: validar com erro de teste | **10 min seus** no painel do Sentry; garante que erro em produção chega até nós |
| Média | **#203** IA de apoio (nome comercial e texto para SEO) | Usa a API do Claude, com custo de centavos por produto. **Precisa da sua decisão de custo.** Fica melhor com dados reais já lançados. |
| Média | **#253** Adicionar cor a um produto já lançado em grupo | Vai aparecer quando chegar mercadoria nova |
| Baixa | **#56** Maquininha nas configurações | **Decisão de produto sua:** quais formas de pagamento a loja aceita na entrega |
| Baixa | **#146** Dicas por campo no formulário de produto | O formulário manual ficou secundário com a fila |
| Baixa | **#205** Importar o Noturno por e-mail | Bloqueado: o PDF do e-mail corta os nomes em 44 caracteres |
| Futuro | **Épico de kits (#94 a #104)** | Kit pronto, kit sugerido, laço pronto. Vale quando o catálogo estiver no ar. |
| Futuro | **#168** Vitrines por comportamento, **#110** auditoria de performance, **#142** sobra de rolo de fita | — |

---

## 4. Decisões que dependem de você

| # | Decisão | Quando |
|---|---|---|
| 1 | Colocar a chave do Serper (etapa 0) | **Agora** |
| 2 | Aprovar o teste ponta a ponta (etapa 2) | Antes da produção |
| 3 | Fazer o merge `dev → master` (etapa 3) | Depois do teste |
| 4 | Orçamento da IA (#203): quanto por mês está ok? | Depois do lançamento rodando |
| 5 | Formas de pagamento na entrega (#56) | Sem pressa |

---

## 5. Riscos conhecidos

| Risco | Impacto | O que fazemos |
|---|---|---|
| **Promoção grande** (43 PRs de uma vez) | Algo que só aparece em produção | Varredura de runtime e segurança antes; daí em diante, promover em lotes menores |
| **Estoque do foil é por cor, não por letra** | Cliente pede "M" e a loja não tem | A funcionária confirma ao atender o pedido; se virar problema, controlar estoque por caractere |
| **Serper: 2.500 buscas uma vez só** | Acaba se usado em todos os produtos | A troca para SerpApi ou Brave é só de chave; o código já prevê isso |
| **1.626 itens com estoque 1** | Produto some da loja logo depois de vendido | Comportamento correto; a reimportação do Noturno repõe |
| **Catálogo de balões de produção é de março** | Loja mostra cores e preços antigos até rodar "Montar pelo Noturno" | Está no checklist da etapa 3 |
