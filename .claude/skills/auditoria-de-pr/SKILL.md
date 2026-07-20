---
name: auditoria-de-pr
description: Use quando for revisar um PR ou trabalho que chegou pronto de outra sessão/máquina, antes de confiar nele ou de fazer merge — especialmente quando tsc/vitest/build já passaram e o código "parece" pronto, mas ninguém rodou uma auditoria de lógica de verdade ainda. NÃO use pra revisar seu próprio código recém-escrito na mesma sessão (aí o fluxo normal de review já cobre).
---

# Auditoria de PR / trabalho de outra sessão

**Por que essa skill existe**: `npx tsc --noEmit` limpo, `npx vitest run` passando e `npx next build` verde confirmam que o código **roda**. Nenhum dos três confirma que a **lógica está certa**. Um PR pode compilar, passar em todos os testes existentes e ainda assim ter um bug de comparação, um comportamento removido silenciosamente, ou uma condição de corrida — porque os testes existentes não cobrem o caso novo, só o que já existia. Esta skill é o procedimento pra pegar isso.

Se o PR junta várias responsabilidades sem relação direta (ex: sessões paralelas em máquinas diferentes que não se coordenaram), diga isso explicitamente no relatório de auditoria — quem revisar precisa saber que está avaliando várias fatias de uma vez, não uma só.

## Antes de tudo

Leia o diff inteiro, não só os arquivos que parecem centrais. Um bug real já foi encontrado num arquivo "secundário" (`ProductVariationImageManager.tsx`) que ninguém revisou de perto porque a atenção estava no arquivo principal da feature.

## Checklist multi-ângulo

Passe por cada item abaixo contra o diff. Não pule um item só porque os outros já vieram limpos — cada um pega uma classe de bug diferente.

### 1. Bugs de linha — comparação e fallback

- **`a[k] === b[k]` sobre chaves opcionais**: se `k` pode estar ausente dos dois lados, `undefined === undefined` é `true` — o código não distingue "os dois têm o mesmo valor" de "nenhum dos dois tem valor nenhum". Grep por `.every(` ou `.some(` comparando dois objetos campo a campo; confirme que os registros comparados **sempre** têm as mesmas chaves, ou valide presença antes de comparar.
- **`valor || fallback`** engole qualquer falsy válido (`0`, `""`, `false`). Grep por `||` em contexto de preço, quantidade, índice ou qualquer valor numérico/string que pode ser legitimamente zero/vazio. Se `0` for um valor válido e distinto de "ausente", o certo é `??` ou um check explícito `!== undefined`.

### 2. Comportamento removido

Compare o arquivo modificado contra o que ele fazia antes (git diff, não só o resultado final). Confirme que nenhuma validação, handler de evento, ou passo silencioso desapareceu no meio da mudança — principalmente em refatorações que "só reorganizam" código, onde é fácil perder um `if` ou um `return` early no meio do reshuffle.

### 3. Rastreamento entre arquivos

Toda vez que o PR adiciona um jeito **novo** de gravar um dado que já tem consumidores de leitura estabelecidos (ex: uma tela nova que escreve num campo que uma tela existente já lê), grep pelos consumidores existentes daquele campo/conceito ANTES de aceitar o PR como completo. Ou a escrita nova alimenta a mesma fonte que eles já leem, ou os consumidores existentes precisam ser atualizados pra também ler a fonte nova — do contrário o dado fica "invisível": gravado em algum lugar, mas nada que já existe mostra aquilo.

### 4. Condição de corrida: `window.confirm()` síncrono → modal assíncrono

`window.confirm()` bloqueia a thread inteira — nenhum listener (`onSnapshot`, `setInterval`) roda enquanto o diálogo está aberto, então qualquer estado capturado antes do confirm (um índice de array, uma referência posicional) continua válido depois. Um modal React (`ConfirmDialog`/`AlertDialog`) **não bloqueia nada** — a UI, incluindo listeners do Firestore, continua reativa enquanto o usuário decide.

Se o PR troca `confirm()`/`alert()` por um modal assíncrono em qualquer lugar, releia toda a lógica que captura estado "antes do confirm, usado depois". Índices de array e outras referências posicionais são o caso mais comum de quebrar — um listener concorrente pode reordenar a lista enquanto o modal está aberto, fazendo a ação disparar sobre o item errado.

### 5. Duplicação

O PR reimplementa algo que já existe no repo em vez de reaproveitar? Padrões conhecidos deste projeto: "Select + '+ Novo X'" (categoria/subcategoria/variação), o wizard por passos do `KitBuilderModal`, `useDraftPersistence` pra persistência de rascunho, `useSearchParamsPatch` pra sincronizar estado com a URL. Se o PR escreveu uma versão nova de algo que já tem solução no repo, isso é uma auditoria válida mesmo que o código novo funcione.

### 6. Aderência aos padrões existentes

Além de duplicação, confira convenções que o repo já fixou: todo botão dentro de um wizard multi-passo precisa de `type="button"` explícito (exceto dentro do Portal de um Dialog Radix); toda imagem `fill` do `next/image` precisa de `sizes` correspondente ao layout real; `Promise.all` em vez de awaits sequenciais quando as chamadas não dependem uma da outra.

## Ao reportar

Liste os achados por severidade, cada um com o cenário concreto que quebra (input/estado específico → saída errada), não uma descrição vaga do tipo "pode ter um problema aqui". Se o `ReportFindings` estiver disponível na sessão, use-o. Se nada sobreviver à auditoria, diga isso explicitamente — "auditado, nada encontrado" é um resultado válido, não um relatório vazio.
