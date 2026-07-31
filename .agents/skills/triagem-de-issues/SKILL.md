---
name: triagem-de-issues
description: Use ao abrir uma issue nova (pra checar se ela já não existe ou não caberia numa issue aberta), OU pra rodar uma varredura periódica do backlog aberto procurando issues que deviam virar uma branch só, sub-issues de uma mãe, ou duplicatas a fechar. NÃO use pra implementar uma issue já criada (isso é o fluxo normal de branch), nem pra revisar um PR pronto (isso é a skill auditoria-de-pr).
---

# Triagem e agrupamento de issues

**Por que essa skill existe**: neste repo **uma issue = uma branch** (ver `CLAUDE.md`, "Fluxo de git"). Isso torna duplicata cara de um jeito específico: duas issues que compartilham a mesma superfície de diff, mas nasceram separadas, viram duas branches mexendo no mesmo arquivo — trabalho refeito, conflito de merge previsível, e uma revisão que precisa reconstruir que as duas eram a mesma coisa. E, do outro lado, uma issue nova aberta sem olhar o backlog vira duplicata de algo já mapeado, ou pior: uma branch que reescreve um arquivo que outra branch aberta já vai reescrever.

Esta skill é o procedimento pra os dois momentos: **(a) varrer o backlog aberto e reagrupar** o que já existe, e **(b) triar toda issue nova contra o backlog antes de criar**. As duas usam o mesmo critério de agrupamento — só mudam o gatilho.

## O critério não é "tema parecido" — é superfície de diff

O erro fácil é agrupar por semelhança temática ("as duas são sobre fitas", "as duas são do admin"). Isso agrupa demais e agrupa errado. O critério certo é: **o diff que fecha uma fecharia a outra sem inchar o PR além do revisável?** Se sim, é uma branch só. Se as duas tocam a mesma tela mas em camadas independentes (uma no modelo de dados, outra na exibição), são coisas distintas mesmo compartilhando a label.

Corolário obrigatório: **valide contra o código real antes de afirmar que duas issues tocam o mesmo arquivo.** O título mente. Abra os arquivos citados no corpo das duas (`gh issue view <n>`, depois leia os paths) e confirme que a interseção existe de fato no código, não só no assunto. Afirmar "co-resolvíveis" sem ter aberto os dois arquivos é um palpite, não uma triagem.

## Os três destinos de um agrupamento (não confunda)

Todo par/cluster relacionado cai em **um** destes três — e tratá-los igual é o erro central:

1. **Duplicata — fecha uma.** Mesma necessidade, mesmo resultado esperado. Uma fecha apontando pra outra (`Fechada como duplicata de #N`). Ex. do backlog: a parte "vitrine automática por categoria" da #57 é a mesma necessidade do modo `category`/`auto` da #71.

2. **Co-resolvível numa branch — funde (ou mãe+sub que dividem a MESMA branch).** Necessidades distintas, mas mesma superfície de diff, pequena o bastante pra que separar seja artificial e caro. O sinal forte: fechar a "principal" já resolve a outra de passagem, ou deixa o arquivo num estado onde a outra vira trivial. **Ex. real: #74 (CTA vaza o container) dentro de #75 (redesign da toolbar do `ProductsTab`)** — as duas mexem na mesma toolbar; o redesign já corrige o overflow. Tratar em branches separadas = tocar a toolbar duas vezes.

3. **Fatias de uma epic — mãe + sub-issues, branches SEPARADAS.** Relacionadas, mas cada uma é uma fatia revisável de forma independente. **Isto é o modelo Fatiado do `CLAUDE.md` — colapsar aqui é o erro oposto ao de não agrupar.** Modelo de dados, depois UI, depois integração, depois exibição são branches distintas *de propósito*. Ex. real: #68 (eixo Tags no modelo) → #69 (categoria controlada) → #70 (navbar dinâmica) → #71 (StoreSection por source) formam uma epic de taxonomia com ordem de dependência; cada uma é branch própria. A mãe existe pra rastrear, não pra virar uma branch monstro.

A pergunta que separa o destino 2 do 3: *"se eu fizer as duas na mesma branch, o PR ainda é revisável numa passada?"* Se estoura o tamanho revisável (ver o limite de ~500 linhas / ~20 arquivos da skill `auditoria-de-pr`), são fatias — destino 3.

## Modo A — Varredura periódica do backlog

Rode ao início de uma sessão de planejamento, ou quando o backlog aberto passar de ~15 issues sem uma revisão de agrupamento.

```
gh issue list --state open --json number,title,body,labels,url --limit 100
```

Passos:

1. **Agrupe por raiz técnica**, não por tema. Pra cada cluster candidato, abra os arquivos citados nos corpos e confirme a interseção real no código (regra acima).
2. **Classifique cada relação nos três destinos.** Um cluster pode ter os três: uma dup pra fechar, um par co-resolvível, e o resto como fatias de epic.
3. **Cuidado com as issues de planejamento antigas (checklists P2/P3) contra as issues detalhadas novas.** As antigas coarse (ex. #55–#59) costumam ter sido *re-recortadas* em detalhe pelas novas — parte delas já está superseded. Não deixe as duas versões gerarem branches.
4. **Não funda code-fix com data-audit.** Corrigir a lógica e limpar dado ruim em produção são branches diferentes mesmo com a mesma label `bug`. Ex. real: #52 (lógica de preço) vs #65 (auditoria dos registros RIBBON em produção) — mesma origem, branches distintas.

Formato de saída (reporte assim, não em prosa solta):

```
CLUSTER: <nome curto da raiz técnica> — arquivos: <paths reais confirmados>
  Mãe sugerida: #N — <por quê é a âncora>
  #A — fecha como dup de #N        (destino 1)
  #B — funde na branch de #N       (destino 2) — motivo: mesma toolbar/lógica
  #C — sub-issue de #N, branch própria (destino 3) — depende de #D
  Ordem de dependência (se epic): #D → #N → #C
```

## Modo B — Triagem na criação (aparato contínuo)

Antes de todo `gh issue create`, rode esta checagem — é o que impede o backlog de reacumular o que a varredura acabou de limpar:

1. **Já existe issue aberta com essa mesma raiz?** Se sim, ela vira sub-issue de uma issue existente, ou nem nasce (é um checkbox a mais numa issue aberta). Não crie uma issue nova pra algo que é uma fatia de algo já mapeado.
2. **O corpo cita arquivos que outra issue aberta já vai reescrever?** Se sim, ou sequencie (declare a dependência no corpo: "depende de #N") ou funde. Duas branches reescrevendo o mesmo arquivo é exatamente o que esta skill existe pra evitar.
3. **Valide os paths e trechos citados no corpo contra o código real ANTES de escrever o corpo.** Regra já estabelecida no fluxo de criação de issues deste repo: nada de path inventado ou "provavelmente é nesse componente". Abra, confirme, então escreva.
4. Só então crie, seguindo a convenção: **branch nasce de `dev`** (`git checkout dev && git pull`), **uma Fatia por PR**, e **labels existentes do repo** (domínio: `frontend`/`admin`/`modelo`/`navegacao`; tipo: `bug`/`refactor`/`enhancement`/`epic`; prioridade quando aplicável: `P0`/`P2`/`P3`) — não invente label nova sem necessidade real.

## Achados da primeira varredura (jul/2026) — âncora e histórico

Registro do estado real em que a skill nasceu (17 issues abertas), pra reconhecer os padrões de novo:

- **Fundir #74 → #75** (mesma toolbar do `ProductsTab`; redesign já corrige o overflow). Caso-modelo do destino 2.
- **Fusão #66 → #52 morreu antes de executar** (auditoria de 27/07/2026): a branch da #52 (PR #67) já tinha mergeado em `dev` quando #66 foi aberta — nunca existiu uma branch viva pra fundir. Padrão a reconhecer: uma decisão de fusão registrada aqui pode ficar obsoleta sozinha se o alvo mergear antes de ser executada; antes de propor "fundir X → branch de Y", confirme que a branch/PR de Y ainda está aberta. #66 segue como issue própria (decisão de produto em aberto sobre rolo fechado parcial, `remainingMeters`/`ribbon-pricing.ts`). Manter **#65 separada** (auditoria de dados, não lógica).
- **#57 ∩ #71**: fechar a parte "vitrine automática por categoria" da #57 como dup do modo `category`/`auto` da #71; recortar só a *gestão* (excluir/renomear/ocultar/drag/persistência) como sub-issue. #71 assume a arquitetura.
- **Epic Taxonomia (não colapsar)**: #68 (modelo Tags) → #69 (categoria controlada) → #70 (navbar dinâmica) → #71 (StoreSection por source) → gestão-de-vitrines (recorte da #57). #55 (campo `marca`) alimenta as vitrines por marca — dependência, não parte.
- **Standalone confirmadas**: #73 (OrdersTab, superfície própria), #72 (CartSidebar) — considerar sequenciar #56 (toggle maquininha no checkout) *depois* da #72 pra não mexer no `CartSidebar` duas vezes.

Quando um cluster novo for triado e resolvido, atualize esta seção com o padrão que apareceu (não com cada issue individual) — é o mesmo hábito do `docs/claude-lessons.md`: registrar a classe, não a instância.
