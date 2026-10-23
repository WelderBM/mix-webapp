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
3. **Não conflita com PR aberto:** issue de uma frente que já tem PR aberto vai para o fim.
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
