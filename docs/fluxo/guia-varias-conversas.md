# Guia: trabalhar com várias conversas

> **Para quê:** gastar menos tokens e ter respostas melhores.
> **Ideia central:** a cada mensagem, eu releio a conversa **inteira**. Conversa
> longa custa mais por mensagem e me deixa mais propenso a esquecer ou
> confundir detalhes antigos. Conversa curta e com um assunto só é mais barata
> e mais precisa.

---

## 1. O que passa de uma conversa para outra (e o que não passa)

| Passa sozinho para a conversa nova | **Não** passa |
|---|---|
| O código, as branches e os PRs (estão no GitHub) | O que foi dito no chat |
| `CLAUDE.md` / `AGENTS.md` do projeto | Decisões que ninguém anotou |
| Minha **memória** (`MEMORY.md`: suas preferências, decisões, regras) | Contexto de "onde paramos" |
| As skills instaladas | Pendências que só existem na conversa |

**Consequência:** antes de trocar, o que importa precisa ir para um desses
lugares fixos. É isso que a "passagem de bastão" (seção 4) faz.

---

## 2. Quando parar e passar para outra conversa

### Troque de conversa quando

| Sinal | Exemplo do nosso dia a dia |
|---|---|
| **O assunto mudou** | Terminamos os balões e você quer mexer em fitas, pedidos ou CI |
| **Um bloco fechou** | O PR entrou no dev e não há correção pendente nele |
| **A conversa já foi resumida** | Aparece no topo "This session is being continued from a previous conversation…". Detalhes antigos já se perderam no resumo. |
| **Eu começo a errar o que já estava certo** | Repito um erro já corrigido, esqueço uma decisão sua, peço algo que você já respondeu |
| **As respostas ficam lentas** | Cada mensagem demora mais para começar |
| **O medidor está alto** | `/context` mostra a janela perto do limite |

### Fique na mesma conversa quando

- Você está **no meio de uma correção** e os detalhes (erro, arquivo, print)
  estão na conversa.
- O próximo pedido é **continuação direta** do anterior ("agora faça o mesmo
  para o metálico").
- Falta só uma resposta curta (merge, sim/não).

### Regra prática

> **Uma conversa = um assunto (ou um marco).**
> Fechou o assunto, ou a conversa já foi resumida uma vez → nova conversa.

---

## 3. Os comandos

Digite dentro da conversa (no Claude Code):

| Comando | O que faz | Quando usar |
|---|---|---|
| `/context` | Mostra quanto da janela está ocupado e com o quê | Para decidir se está na hora de trocar |
| `/usage` | Mostra o consumo | Curiosidade/controle de gasto |
| `/compact` | Resume a conversa **agora** e continua nela | Quer continuar o mesmo assunto, mas a conversa ficou longa |
| `/clear` | Apaga a conversa e começa do zero **no mesmo terminal** | Assunto novo, depois da passagem de bastão |
| `/resume` | Abre a lista de conversas antigas para voltar a uma | Retomar algo de outro dia |

No terminal, ao abrir:

| Comando | O que faz |
|---|---|
| `claude` | Conversa nova |
| `claude --continue` | Volta para a **última** conversa desta pasta |
| `claude --resume` | Escolhe qual conversa antiga retomar |

**`/compact` ou `/clear`?**
- `/compact` = mesmo assunto, só ficou comprido.
- `/clear` = assunto novo. Sai mais barato e mais limpo.

---

## 4. Como trocar: a passagem de bastão (3 passos)

### Passo 1 — Peça o fechamento

Escreva, na conversa que vai encerrar:

> **"fecha a conversa"**

Eu faço:
1. Confiro o estado de cada PR (aberto, mergeado, esperando você).
2. Gravo na memória as decisões novas que valem para o futuro.
3. Escrevo um **resumo de passagem** curto: o que está pronto, o que está
   pendente, o que espera resposta sua.
4. Te devolvo a **primeira mensagem pronta** para colar na conversa nova.

### Passo 2 — Abra a conversa nova

- No mesmo terminal: `/clear`
- Ou em outro terminal: `claude`

### Passo 3 — Cole a primeira mensagem

Ela segue este modelo:

```
Contexto: <assunto> — continuação da conversa de <data>.
Estado: <PRs e situação em 1–3 linhas>.
Pendente comigo: <decisões que eu ainda devo>.
Próximo passo: <o que você quer agora>.
```

Exemplo:

```
Contexto: balões — continuação de 23/10.
Estado: #280 (UX depois do merge) esperando meu merge; resto no dev.
Pendente comigo: foil preto/candy/75cm entram no montador? desativar os 3 balões de teste?
Próximo passo: rodar o token-optimizer e depois seguir o plano (etapa 2: meu teste ponta a ponta).
```

---

## 5. Várias conversas ao mesmo tempo

Dá para ter duas ou três abertas, **cada uma num terminal**, desde que:

| Regra | Por quê |
|---|---|
| **Assuntos que não mexem nos mesmos arquivos** | Duas conversas editando o mesmo arquivo geram conflito |
| **Cada uma na sua branch e pasta** (eu já crio as minhas pastas de trabalho separadas) | Uma não estraga o trabalho da outra |
| **Merge é sempre seu** e um de cada vez | Evita um PR passar por cima do outro |
| **No máximo 2–3 ao mesmo tempo** | Mais do que isso fica difícil para você acompanhar |

Bons pares para rodar em paralelo:
- Balões (loja) **e** CI/automação
- Correção de bug **e** documentação/plano
- Lançamento pelo Noturno **e** polimento de acessibilidade de outra tela

Ruins (deixe em sequência):
- Duas mudanças no montador de balões
- Duas mudanças no carrinho

---

## 6. Resumo de bolso

1. **Um assunto por conversa.**
2. **Trocou o assunto, fechou o bloco ou a conversa foi resumida → troque.**
3. **Para trocar:** "fecha a conversa" → `/clear` → cole a mensagem pronta.
4. **Mesmo assunto, só ficou longa:** `/compact`.
5. **Em paralelo:** só assuntos que não mexem nos mesmos arquivos.

---

## 7. Primeira passagem (23/10)

A conversa de 23/10 (balões, fotos, marcas, foil, CI e skills) foi a primeira a
fechar assim: ver `docs/sessoes/2026-10-23-baloes-e-fluxo.md`.

---

## 8. Onde guardar cada coisa (para nada se perder)

| Lugar | O que vai lá | Quem lê | Exemplo |
|---|---|---|---|
| **Issue** (GitHub) | Trabalho a fazer: bug, melhoria, achado de revisão que vale corrigir. Tem dono, pode ter marco e fecha quando resolvido | Você, eu, qualquer agente, o revisor do CI | "Cartão de marca sem imagem", "nome da loja diferente entre telas" |
| **PR** (descrição e comentários) | Por que uma mudança foi feita, como testar, o que a revisão achou | Quem for entender aquele código depois | Corpo do #275 explicando a marca da casa |
| **`docs/sessoes/`** | Fim de conversa: estado, pendências, perguntas abertas, decisões do dia | A próxima conversa (e você) | Este documento de 23/10 |
| **`docs/planos/`** | Plano de várias etapas ou vários PRs | Você e eu durante o trabalho | Plano dos próximos passos |
| **`docs/fluxo/`** e **`docs/*.md`** | Como trabalhamos e conhecimento do domínio que dura | Qualquer agente | Este guia, mapa de skills, diagnóstico de fitas |
| **`docs/claude-lessons.md`** | Lição técnica: armadilha que já custou tempo | Todo agente, antes de mexer | Arquivo CRLF inflando o diff |
| **`CLAUDE.md` / `AGENTS.md`** | Regra fixa do projeto, curta (é lida em toda mensagem) | Todo agente, sempre | "PR vai para dev, master só o dono" |
| **Comentário no código** | O porquê de um trecho que parece estranho | Quem abre o arquivo | "foil não se divide por marca (dono, 23/10)" |
| **Minha memória** (`MEMORY.md`, no seu computador) | Suas preferências e decisões sobre **como trabalhar** comigo; não vai para o GitHub | Só eu, neste computador | "trabalha sozinho (Nevalo)", "um assunto por conversa" |

**Regra de decisão:**
1. **Precisa ser feito?** → issue (com marco, se tiver prazo).
2. **Explica uma mudança?** → PR.
3. **Vale para o projeto todo e por muito tempo?** → `docs/` (lição técnica → `claude-lessons.md`; regra curta e obrigatória → `CLAUDE.md`/`AGENTS.md`).
4. **Explica uma linha específica?** → comentário no código.
5. **É sobre como você gosta que eu trabalhe?** → minha memória.
6. **É o estado de hoje** (pendências, perguntas)? → `docs/sessoes/`. O que nele for trabalho a fazer vira issue.

**Cuidado:** não duplicar. Uma informação mora em um lugar; os outros apontam
para ele (ex.: a sessão cita a issue pelo número).
