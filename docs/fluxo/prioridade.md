# Medidor de prioridade das issues

> **Data:** 23/10/2026 · **Objetivo que ele mede:** as funcionárias lançando
> o estoque do Noturno **em produção**, com a loja pronta para o cliente.
> **Para ver a fila:** `node scripts/prioridade.mjs` (opcional: `--frente <nome>`).

---

## 1. Seis eixos (etiquetas na issue)

| Eixo | Etiquetas | Níveis |
|---|---|---|
| **O — Objetivo** (peso 3) | `o:5` … `o:1` | 5 bloqueia a produção · 4 atrapalha as funcionárias lançando · 3 o cliente vê · 2 acessibilidade/polimento · 1 ideia futura |
| **S — Severidade** (peso 2) | `s:3` … `s:1` | 3 quebrado/dado errado · 2 confunde/atrasa · 1 estético |
| **A — Alcance** | `a:3` … `a:1` | 3 todas as telas/todos os clientes · 2 uma tela muito usada · 1 tela pouco usada |
| **D — Destrava** | `destrava` | +2 se destrava outra issue ou decisão |
| **E — Esforço** (subtrai) | `e:p` `e:m` `e:g` | 1 pequeno (até ~150 linhas) · 2 médio · 3 grande (vários PRs) |
| **R — Risco** (subtrai) | `risco` | −1 se mexe em arquivo sensível (carrinho, checkout, regras do banco) |

**Pontuação = 3·O + 2·S + A + D − E − R**

## 2. Desempate (até não sobrar empate)

1. Maior pontuação.
2. Destrava mais.
3. **Não conflita com PR aberto:** issue de uma frente que já tem PR aberto vai para o fim
   (vai para o fim, não sai da fila; ver § 6.1).
4. **Mesma frente da última tarefa:** contexto fresco, menos tokens.
5. Menor esforço.
6. **Número menor:** nunca empata.

## 3. Duas filas

| Fila | Etiqueta | Quem pega |
|---|---|---|
| **Autônoma** | `autonomo` | Eu, sem perguntar, na ordem do script |
| **Do dono** | `precisa-de-voce` (ou sem `autonomo`) | Você: decisão de produto, custo, ação fora do código |

A fila do dono não trava a autônoma. A cada bloco eu listo o topo dela para
você.

**Fora das filas:** `lembrete`, `vistoria-resumo`, `epic` (não são trabalho
em si).

## 4. Frentes (agrupamento por lugar no código)

`frente:<nome>` agrupa issues que mexem nos **mesmos arquivos ou na mesma
tela**, nunca só o mesmo tema.

- **Mesma frente, pequenas:** um PR resolve várias (`Closes #A, Closes #B`).
- **Mesma frente, grandes:** PRs em sequência, aproveitando o contexto.
- **Tema que atravessa telas** (acessibilidade): cada tela fica na sua frente.

Frentes atuais: `pre-producao`, `montador`, `fitas`, `home-rodape`,
`cabecalho`, `loja-paginas`, `lancamento`, `admin-produtos`, `acessibilidade`,
`pagamento`, `performance`, `vitrines`, `kits`, `fluxo`.

## 5. Quando pontuar

- **Issue nova:** já nasce com as 6 etiquetas e a frente (parte da triagem).
- **A cada sprint:** revisão rápida na vistoria. Prioridade muda: o que era
  ideia vira urgente e vice-versa.
- **Pesos** (3 e 2) são o chute inicial de 23/10. Se a ordem do script não
  bater com a intuição do dono por ~2 semanas, ajustar aqui e no script.

## 6. Antes de parar

A fila autônoma parecer vazia não é motivo para parar. Em 25/10, parei
com trabalho disponível: deixei o #147 de lado porque mexia num arquivo do
#302, embora em outra parte; não triei a #307 (12 achados de UX); e deixei
dois PRs esperando o dono, quando uma revisão nova bastava. Só paro depois
de passar por estes itens, nesta ordem:

1. **Conflito se mede por trecho, não por arquivo.** Mexer no mesmo arquivo
   de um PR aberto é permitido quando as mudanças ficam longe uma da outra:
   o git junta as duas sem conflito. Se as linhas forem as mesmas ou
   vizinhas, abro um PR empilhado (branch e base = a branch do PR aberto,
   com o número dele no corpo) ou espero o merge.
2. **PR com 🟡 já corrigido:** ponho a label `revisar`. A cadeia revisa de
   novo e, se vier limpa, faz o merge sozinha. Sem a label, o PR fica
   parado esperando o dono à toa.
3. **"Sem pontuação" no script:** as issues abertas pela revisão visual ou
   pela vistoria ficam fora das duas filas até alguém pontuar. Pontuo, e as
   que não precisam de decisão ganham `autonomo`.
4. **Lacunas que eu mesmo apontei:** teste que faltou, conferência no
   navegador, ⚪ que ficou para depois. Isso também é tarefa.
5. Só então paro, e listo o topo da fila do dono.

**Issues da vistoria** (marcador `<!-- vistoria:` no corpo) não se fecham à
mão: a vistoria mede produção e fecha a issue depois de 2 rodadas limpas.
As outras fecham pelo workflow `close-issues-on-dev.yml` quando o PR com
`Closes #N` entra em `dev`.
