---
name: orquestracao-multi-branch
description: Use quando o pedido for despachar várias issues do backlog em paralelo como "agent master" — várias threads de trabalho, cada uma em worktree própria, indo até PR aberto sem merge. Cobre seleção de issue sem colisão de diff, cap de paralelismo, encadeamento de skills auxiliares por thread, e o checkpoint de parada. NÃO use pra implementar uma única issue (fluxo normal de branch) nem pra revisar PR pronto (isso é auditoria-de-pr).
---

# Orquestração multi-branch (agent master)

**Por que essa skill existe**: despachar N issues em paralelo sem critério gera dois tipos de dano — threads que colidem no merge (duas branches reescrevendo o mesmo arquivo) e threads "concluídas" que na verdade só passaram no `tsc`/`vitest` sem nenhuma auditoria de qualidade real (mobile, design, testes de fato cobrindo o critério de aceite). Esta skill é o procedimento pra evitar os dois.

## 0. Alinhar parâmetros com o humano antes de disparar a primeira thread — SEMPRE, sem exceção

Isto é orquestração com efeito colateral real (branches, push, PR). Antes do primeiro despacho — mesmo que o pedido pareça implicar "manda ver" ("dispara todas", "roda o backlog inteiro") —, pergunte com `AskUserQuestion` (não assuma, não infira do tom do pedido):

- **Quantidade de threads simultâneas (cap de paralelismo)** — este é o item que NUNCA pode ser pulado ou decidido sozinho, mesmo que os outros dois pareçam óbvios pelo contexto. Conte as que já estão rodando (`git worktree list`) antes de perguntar, pra oferecer a pergunta com o número real de vagas livres, não um cap abstrato.
- **Checkpoint de parada** — até branch pronta sem PR, até PR aberto sem merge, ou até merge autônomo. Nunca vá além do combinado sem perguntar de novo.
- **Critério de seleção de issue** — o humano escolhe a lista, ou você decide pela regra de prioridade (ver §1).

Isso vale mesmo em uma sessão já "aquecida" (você já rodou esse fluxo antes na mesma conversa) — o cap combinado no início da conversa não se renova sozinho conforme threads terminam; você só *preenche vagas dentro do cap já combinado* (§4), nunca aumenta o cap por conta própria. Se quiser rodar mais threads simultâneas do que o combinado, pergunte de novo — não escale sozinho só porque "está indo bem".

## 1. Selecionar issues sem colisão de diff

Antes de escolher a próxima issue da fila:
1. `gh issue list --state open --json number,title,labels` — priorize bugs, depois `P2` antes de `P3`. Pule `epic` (não são fatias diretamente acionáveis — ver `triagem-de-issues` pro critério de agrupamento/fatiamento).
2. Para cada worktree/branch já ativa (`git worktree list`), rode `git diff dev...<branch> --stat` pra saber que arquivos ela já toca.
3. Descarte da fila qualquer issue cujo corpo (`gh issue view <n>`) cite os mesmos arquivos de uma branch ativa. O título mente — confirme lendo o corpo, mesma regra da skill `triagem-de-issues`.
4. Se restar dúvida sobre duas issues candidatas tocarem o mesmo arquivo, trate como colisão e adie uma delas — o custo de uma thread a menos é bem menor que o de um merge quebrado.

## 2. Abrir a thread

Sempre via `node scripts/wt-new.mjs <branch> --new --from dev` (nunca `git worktree add` manual — o script já copia `.env` de staging e roda `npm ci`). Nomeie a branch com o padrão do repo: `<tipo>/<slug>-<numero-da-issue>`.

Registre a thread com `TaskCreate` antes de despachar — o humano acompanha progresso e você evita duplicar despacho se for chamado de novo no meio do fluxo.

## 2.5. Regra dura: nenhuma thread mata processo por nome, só por PID capturado

Uma thread rodou `taskkill //IM node.exe //F` (Windows) pra encerrar o próprio `next dev` de um smoke test — isso mata TODOS os processos `node.exe` da máquina, não só o dela: outras threads em background (`npm ci`, dev servers de outras sessões), ferramentas do editor, e potencialmente processos do próprio usuário fora deste repo. Git/worktree sobrevive (é metadado em disco), mas qualquer coisa Node em execução no momento não sobrevive — sem aviso, sem escopo.

**Regra pro prompt de toda thread que precisar subir/derrubar um servidor local (dev server, smoke test)**: capturar o PID do processo que ELA MESMA iniciou (`spawn`/`&` + `$!` no bash, ou equivalente) e matar só esse PID (`kill <pid>` / `taskkill /PID <pid> /F`). Nunca `pkill -f "next dev"` (mata qualquer `next dev` de qualquer worktree) nem `taskkill /IM node.exe /F` (mata todo Node da máquina). Se a thread não tiver certeza de como isolar o próprio processo, ela deve preferir deixar o processo rodando (documentando isso no relatório) a arriscar um kill amplo demais.

## 3. Despachar a thread como agente em background

Um `Agent` por thread, **`run_in_background: true`** (nunca bloqueie a sessão principal esperando uma thread — isso derrota o propósito do paralelismo), com prompt autocontido cobrindo, nesta ordem:

1. Ler `AGENTS.md` do worktree (regras de git flow, ritual, guards).
2. Contexto + critério de aceite da issue, copiado do `gh issue view` — não faça o agente re-buscar, cole o corpo relevante no prompt.
3. Implementação.
4. Skills auxiliares conforme o tipo de mudança — não é opcional, é o que separa "passou no tsc" de "está pronto":
   - Mudança em UI/tela visível ao cliente → `mobile-first-guide` (toque, legibilidade, breakpoints).
   - Mudança em UI com estado visual novo (cor, contraste, dark mode) → `design-audit`.
   - Fluxo interativo novo/alterado → `accessibility-test` se houver navegação por teclado/leitor de tela envolvida.
   - Qualquer lógica nova/alterada → `unit-test` cobrindo happy path + edge case + o critério de aceite literal da issue.
5. Ritual pré-commit obrigatório (`tsc --noEmit`, `vitest run`, `next build` se estrutural).
6. Autoauditoria com `auditoria-de-pr` no próprio diff antes de abrir o PR — incomum (a skill é desenhada pra revisar PR alheio) mas é a barra de qualidade antes de expor o PR pro humano revisar de verdade.
7. Commit (mensagem em português, estilo do `git log` do repo, `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`), push, `gh pr create --base dev` (nunca `master`), "Closes #N" no corpo. **Parar no checkpoint combinado em §0** — não faça merge sem instrução explícita.
8. Relatório final: arquivos mudados, resultado do ritual, o que a autoauditoria encontrou e como foi tratado, URL do PR, achados fora de escopo que ficaram de fora (bug de aplicação encontrado no processo vira achado reportado, nunca fix oportunista — mesma regra da `unit-test`).

## 4. Voltar ao fluxo principal, não empilhar threads sem controle

Depois de despachar uma thread em background, volte pro fluxo original (responder o humano, ou avaliar a próxima issue da fila) em vez de ficar esperando. Só despache a próxima thread quando: (a) uma thread ativa terminar e liberar uma vaga do cap combinado em §0, ou (b) o humano pedir mais. Nunca deixe rodando mais threads simultâneas que o cap combinado — reconte com `git worktree list` antes de cada novo despacho, porque outras sessões podem ter aberto worktrees no meio do caminho.

## 5. Aprendizado contínuo

Se um padrão se repetir em 2+ threads (um tipo de colisão não previsto, uma skill que devia ter sido chamada e não foi, um checkpoint que o humano corrigiu), atualize esta skill — não só `docs/claude-lessons.md`. `claude-lessons.md` é o registro do que aconteceu; esta skill é o procedimento que evita repetir.

## 6. Sincronizar branches abertas com `dev` — e formalizar todo achado, por menor que seja

Quando o humano pede pra atualizar as branches com PR aberto (`dev` avançou, ele quer revisar sem bloqueio), o procedimento por branch é: `git fetch origin dev` → `git merge origin/dev --no-edit` → `npx tsc --noEmit` → `npx vitest run` → **`npx next build` com as mesmas env vars dummy do workflow de CI** (não pule o build achando que só `tsc`/`vitest` bastam — foi exatamente um `next build` com credencial fake que expôs o bug real da #113, invisível em `tsc`/`vitest`) → `git push`. Fazer isso pra toda branch com PR aberto, inclusive as que não foram criadas por você nesta sessão (`gh pr list --state open`) — se não houver worktree, crie um (`wt-new.mjs <branch>`, sem `--new`) ou reaproveite um já existente de outra sessão, checando `git status` limpo antes de mexer (nunca sobrescreva trabalho não commitado alheio).

**Regra dura**: todo achado dessa varredura — build quebrado, teste que não cobre mais um caso, comportamento visivelmente diferente, qualquer coisa "por mais mínima que seja" — vira conhecimento rastreável fora do chat, nunca só uma menção na resposta ao humano. Escolha uma das três formas, pela natureza do achado:

1. **Comentário bloqueante no PR afetado** — quando o achado é sobre o diff daquele PR especificamente (ex: o fix da #113 quebrando o build do próprio PR #155). Comenta no PR, explica a causa raiz e o fix aplicado (ou, se não corrigido ainda, marca como bloqueador explícito).
2. **Issue nova** — quando o achado é um problema real mas fora do escopo do PR que você estava sincronizando (ex: uma dependência vulnerável encontrada de passagem, um padrão quebrado em outro arquivo). Mesma regra da `triagem-de-issues`: título com prefixo de prioridade, corpo explicando o achado e como reproduzir.
3. **Sub-issue de uma epic existente** — quando o achado se encaixa claramente numa epic já aberta (ex: mais um caso do mesmo padrão de bug que a epic #110 já rastreia). Referencia a epic mãe no corpo.

Corrigir o achado localmente e só contar pro humano na resposta do chat **não conta como formalizado** — a resposta do chat não sobrevive à sessão nem aparece pra quem revisa o PR depois. O critério de "formalizado" é: alguém que não estava nesta conversa, olhando só o GitHub (PR + issues), consegue reconstruir o que foi encontrado e por quê.
