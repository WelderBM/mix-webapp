# Lições técnicas — mix-webapp

Catálogo de bugs reais (não hipotéticos), a causa-raiz de cada um, e o padrão pra reconhecer a categoria de novo. Objetivo: qualquer sessão Claude Code, em qualquer máquina, não perder tempo redescobrindo isso.

Adicione uma entrada nova quando encontrar algo que vai morder de novo — um gotcha de biblioteca, uma decisão não óbvia, um bug sutil que exigiu investigação de verdade pra achar. Não registre bug trivial ou específico demais pra reaparecer.

---

## React / Frontend

### Wizard multi-passo dentro de um `<form>` nativo é frágil
Um único `<form onSubmit>` com vários "passos" visuais quebra de duas formas: (1) Enter num `<input>` de texto, em QUALQUER passo, aciona o botão `type="submit"` do form inteiro, não importa qual passo está visível pro usuário; (2) se o botão final troca de `type="button"` pra `type="submit"` só na renderização do último passo, o navegador às vezes ainda processa o clique que causa essa troca como submit.

**Padrão**: `<form onSubmit={(e) => e.preventDefault()}>` (no-op de segurança), todo botão do wizard com `type="button"` explícito, e o botão final chama o handler de salvar direto via `onClick`, nunca via evento `submit`. Ver `ProductFormDialog.tsx`.

Sub-armadilha relacionada: um `<button>` sem `type` explícito assume `type="submit"` por padrão do HTML — isso já causou um bug real onde clicar em "Trocar imagem" dentro do wizard submetia o formulário inteiro antes da imagem ser escolhida (`ImageUploadModal.tsx`). Único caso seguro sem `type="button"` explícito: botões que renderizam dentro do **Portal** de um Dialog Radix, porque saem da árvore DOM real do `<form>` que os envolve visualmente.

### Objeto recriado a cada render engana `useEffect` por referência
`useEffect` compara dependências por referência (`Object.is`), não por conteúdo. Passar um objeto literal construído inline — `{ settings, balloonConfig }`, `{ formData, stepIndex }` — como dependência faz o efeito disparar em QUALQUER re-render do componente pai, mesmo sem nenhuma mudança real nos dados, porque o literal ganha uma referência nova toda vez.

Isso causou um bug de verdade: `useDraftPersistence` gravava um "rascunho" no localStorage segundos depois de qualquer tela abrir, mesmo sem o usuário editar nada — porque cada re-render do `admin/page.tsx` (que tem dezenas de outros pedaços de estado, mudando o tempo todo) recriava `{ settings, balloonConfig }` e o hook achava que era uma edição nova.

**Padrão**: memoize o objeto que vira dependência (`useMemo(() => ({ settings, balloonConfig }), [settings, balloonConfig])`) quando ele for passado pra um hook que reage a mudança de valor. E mesmo memoizado, a PRIMEIRA vez que um efeito liga (ex: `enabled` vira `true` depois do primeiro carregamento) não deve ser tratada como "o valor mudou" — é só o estado inicial assentando, não uma edição do usuário. `useDraftPersistence.ts` guarda uma baseline "limpa" (comparada por conteúdo serializado, não por referência) pra distinguir isso; ver o hook e seus testes pro caso completo, incluindo o eco de `onSnapshot` pós-save (salvar dispara um novo snapshot do Firestore com o MESMO conteúdo mas referência nova — sem comparação por conteúdo, isso reviveria um rascunho que acabou de ser limpo).

### `valor || fallback` trata `0` explícito como ausente
`item.selectedVariant?.price || item.product.price` parece um fallback razoável ("se não tem preço próprio, usa o do produto"), mas `0` é falsy em JS — um preço propositalmente zerado (variação grátis/promocional) cai no fallback e mostra o preço do produto base em vez de R$0. Achado no `cartStore.ts`, mas o padrão se repete em qualquer lugar que resolve um valor opcional numérico com `||`.

**Padrão**: quando `0` (ou `""`) é um valor válido e distinto de "ausente", use `??` (nullish coalescing) em vez de `||`, ou cheque `!== undefined` explicitamente.

### `.every()` sobre chaves opcionais pode confundir "ausente" com "igual"
Comparar duas estruturas campo a campo com `keys.every((k) => a[k] === b[k])` passa silenciosamente quando a chave falta dos dois lados (`undefined === undefined` é `true`) — o código não distingue "os dois têm o mesmo valor" de "nenhum dos dois tem valor nenhum". Achado no seletor de variação combinada (`produto/[id]/page.tsx`): um produto com variações de dimensões inconsistentes entre si (ex: geradas em lotes diferentes, uma leva só com Tamanho, outra com Tamanho+Cor) deixa o comparador achar que uma variação sem Cor definido "combina" com a ausência de escolha de Cor do cliente, permitindo adicionar ao carrinho sem selecionar todas as dimensões visíveis.

**Padrão**: ao comparar por um conjunto de chaves que pode não existir uniformemente em todos os registros, valide primeiro que cada registro TEM todas as chaves esperadas (ou bloqueie/avise na origem — na criação dos dados — em vez de só na leitura).

### UI nova que grava um dado precisa ser rastreada até toda leitura que já existe do mesmo conceito
Adicionar um caminho novo pra gravar algo (ex: "enviar imagem direto pra uma variação") sem conferir se ele alimenta a MESMA fonte que a tela de exibição já lê é um jeito fácil de criar um dado "invisível" — grava em algum lugar, mas nada que já existe mostra aquilo. Achado no gerenciador de imagem por variação: `ProductVariationImageManager` permite subir uma imagem nova e grava só em `variant.imageUrl`, mas a galeria de miniaturas da loja (`ProductImageGallery`) sempre leu de `product.images` — a imagem nova nunca aparece como miniatura clicável, só quando aquela variação específica já está selecionada.

**Padrão**: ao adicionar uma nova forma de gravar um dado que já tem consumidores de leitura estabelecidos, grep pelos consumidores existentes ANTES de decidir onde gravar — ou grava na mesma fonte que eles já leem, ou atualiza os consumidores pra também lerem a fonte nova.

### Trocar `window.confirm()` (síncrono) por um modal React (assíncrono) muda a semântica de concorrência, não só a aparência
`window.confirm()` bloqueia a thread JS inteira até o usuário responder — nenhum listener (`onSnapshot`, `setInterval`, etc) roda enquanto o diálogo está aberto, então qualquer dado capturado antes do confirm (ex: um índice de array) ainda é válido depois. Um modal React (`ConfirmDialog`/`AlertDialog`) NÃO bloqueia nada — a UI continua reativa, incluindo listeners do Firestore, enquanto o usuário decide. Achado numa ação de "replicar tamanho/cor pra todos" no admin de balões: o índice do item de origem era capturado no clique e só usado depois do confirm resolver; com confirm síncrono isso era seguro, com o modal assíncrono um `onSnapshot` concorrente pode reordenar a lista enquanto o diálogo está aberto, fazendo a ação replicar a partir do item errado.

**Padrão**: ao migrar de `window.confirm()`/`alert()` pra um modal assíncrono, releia toda lógica que capturava estado "antes do confirm, usado depois" — índices de array e outras referências posicionais são o caso mais comum de quebrar.

### Aba aberta via `window.open`/`target="_blank"` não tem histórico de navegador de verdade
O gesto/botão nativo de voltar do celular aciona o histórico do **navegador**, não nenhum handler customizado da página. Uma aba aberta via `window.open(url, "_blank")` começa sem histórico nenhum — o voltar nativo não sabe que essa aba "veio de" outra aba, então não faz nada (ou sai do app).

**Padrão**: pra navegação realmente interna (ex: "Ver na Loja" saindo do admin), troque `window.open`/`target="_blank"` por navegação na mesma aba (`router.push`/`<Link>` normal) — aí o histórico é real e o voltar nativo funciona sozinho. Quando a nova aba é necessária de verdade (preview lado a lado, por exemplo — ver decisão em `docs/` sobre isso), o botão "Voltar" customizado da página de destino deve checar `window.opener` e chamar `window.close()` nesse caso, já que não existe histórico pra voltar. Ver `src/components/ui/BackButton.tsx`.

### Componentes Radix (`Accordion`, `AlertDialog`) testam direto com `@testing-library/react` + `happy-dom`, sem polyfill extra
Ao escrever o primeiro teste de componente deste repo que renderiza `Accordion`/`AlertDialog` (via `ConfirmDialog`), não foi preciso mockar `ResizeObserver`, `PointerEvent` ou `scrollIntoView` — diferente do Radix `Select`, que já exige mock de `scrollIntoView` neste projeto (ver `BalloonBuilder.test.tsx`). `fireEvent.click` no trigger expande o conteúdo normalmente e o `AlertDialog` renderiza seu conteúdo (incluindo via portal) de forma que `screen` encontra sem configuração adicional.

**Padrão**: ao testar um componente que usa `Accordion`/`AlertDialog`/`ConfirmDialog`, tente direto sem polyfill — só adicione mock de API de browser (`ResizeObserver`, `scrollIntoView`, etc.) se o teste realmente falhar por causa disso. Pra distinguir itens com o mesmo texto visível (ex: dois botões "Replicar p/ Todos"), prefira `getByTitle`/atributo único a depender da ordem do DOM.

### Um `useRouter()` mockado como stub não consegue provar a ausência do warning "Cannot update a component (Router)..."
Esse projeto mocka `next/navigation` em vários testes (`vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }), ... }))`, ver `meu-pedido/page.test.tsx`). Um `vi.spyOn(console, "error")` rodando contra um componente que chama `router.replace()` **nunca** vai capturar o warning real do React ("Cannot update a component (`Router`) while rendering a different component") nesse cenário, porque o mock é um `vi.fn()` sem estado nenhum por trás — não existe um "componente Router" de verdade sendo atualizado, então o React não tem o que reclamar, não importa se o código de produção tem o bug ou não. Confirmado experimentalmente: revertendo de propósito o fix de `OrdersTab.tsx` (que causou esse warning em produção) e rodando o mesmo teste, o `console.error` mockado continuou vazio.

**Padrão**: um teste assim só prova o resultado observável (o estado final bate com o esperado, considerando timing de dados assíncronos), não a ausência do warning de "setState durante o render de outro componente" — esse warning exige o Router/contexto real do Next.js, não um stub. Pra essa classe de bug, confie na leitura do código (efeito colateral nunca dentro de um updater funcional de `setState`, nunca no corpo do componente) mais do que no teste automatizado; o teste cobre regressão de comportamento, não a ausência do warning específico.

---

## Firebase / Firestore

### `request.resource` só existe em operações de escrita nas regras
Uma regra de leitura anônima usando `request.resource.data.algumCampo` sempre falha — `request.resource` não existe em `get`/`onSnapshot`, só em `create`/`update`. Isso deixou a página de rastreamento de pedido (`/meu-pedido`) quebrada pra qualquer cliente deslogado por um bom tempo sem ninguém perceber, porque o erro só aparece em uso real, não em teste feito logado como admin.

### Nome de coleção nas regras precisa bater exatamente com o código
`kitRecipes` (regra) vs `kit_recipes` (código) — mismatch silencioso que derrubou o recurso de kits montados inteiro, sem erro óbvio (só "permission denied" genérico). Sempre confirme o nome literal da coleção usado em `collection(db, "...")` no código antes de escrever/revisar uma regra.

### `initializeFirestore` com streaming (WebChannel/HTTP2) falha em rede restrita
Firewall/antivírus/VPN local pode bloquear o transporte padrão do Firestore, gerando "Could not reach Cloud Firestore backend" mesmo com internet normal. `experimentalAutoDetectLongPolling: true` em `initializeFirestore` resolve tentando o caminho rápido primeiro e caindo pra long-polling se precisar. Ver `src/lib/firebase.ts`.

### Qualquer rota que importa `db` no escopo do módulo precisa de env vars válidas em **build time**, não só runtime
`sitemap.ts` (e qualquer `route.ts`/página que faz `import { db } from "@/lib/firebase"`) dispara a inicialização do Firebase como efeito colateral do `import`, ANTES de qualquer `try/catch` dentro da função em si rodar. Se `NEXT_PUBLIC_FIREBASE_API_KEY` estiver ausente/inválida durante o build (não durante uma requisição real), o Firebase lança `auth/invalid-api-key` na inicialização do módulo — isso derruba o **build inteiro**, não só aquela rota, e nenhum `try/catch` local protege contra isso porque o erro acontece antes do corpo da função.

### Ordem de chaves de um objeto/mapa não é garantida num round-trip escrita→leitura do Firestore
Comparar conteúdo via `JSON.stringify(a) === JSON.stringify(b)` funciona só se as chaves vierem sempre na mesma ordem — mas o SDK do Firestore não documenta/garante que um campo de mapa volte na mesma ordem em que foi escrito. Um mecanismo de "detectar eco pós-save" (salvar, esperar o `onSnapshot` confirmar, e ignorar esse eco por ter o MESMO conteúdo) que compara por string serializada pode falhar silenciosamente se a ordem das chaves mudar entre o que foi salvo e o que voltou — reintroduzindo exatamente o bug que esse mecanismo existe pra evitar (rascunho fantasma reaparecendo). Ver `useDraftPersistence.ts`.

**Padrão**: comparação de conteúdo "profunda" que precisa ser 100% confiável não deve depender de serialização com ordem de chave sensível — ou normalize a ordem antes de comparar (`JSON.stringify` com chaves ordenadas), ou compare por igualdade estrutural de verdade em vez de string.

### Firebase Auth (Google Sign-In) exige domínio autorizado com match exato
"Authorized domains" no Console Firebase não aceita wildcard nem CIDR pra IP — é string exata. Testar login com Google a partir de um IP de rede local (ex: celular acessando `192.168.x.x:3000`) precisa desse IP adicionado manualmente em Authentication → Settings → Authorized domains, no projeto de **staging**, não produção. Se o IP mudar (DHCP), isso quebra nível de novo — resolver de raiz é dar um IP fixo (reserva DHCP no roteador) pro computador de desenvolvimento, não ficar re-adicionando.

---

## Vercel / Deploy

Graduou para skill: ver `.claude/skills/deploy-vercel/SKILL.md` (env vars escopadas por branch, workaround da CLI pra `vercel env add`, cuidado com `vercel env rm` em escopo combinado, e o gotcha do `sitemap.ts` em build time).

---

## Processo / coordenação entre sessões

### Múltiplas sessões podem estar trabalhando no mesmo repo ao mesmo tempo, inclusive em máquinas diferentes
Sempre rode `git branch -a` e `git log --all --oneline` antes de assumir que sabe o estado atual do repositório. Um merge que parece simples pode ter dois lados que evoluíram de forma incompatível (ex: uma função que perdeu um parâmetro numa branch, enquanto a outra branch ainda chama com a assinatura antiga) — ao resolver conflito, confirme contra o resto do arquivo (já mesclado, sem marcador de conflito) qual assinatura/formato é o que sobreviveu, não assuma que "o lado que parece mais completo" está certo.

### Fatiar entregas grandes em PRs sequenciais pequenos
Cada PR cobre uma responsabilidade (modelo de dados → UI → integração → exibição), com `tsc`/`vitest`/build limpos antes de cada commit, e fica aberto sem merge até validação local de quem pediu a mudança. Isso apareceu repetidamente como o ritmo que funcionou bem nesse projeto — evita PR gigante difícil de revisar, e cada fatia é testável isoladamente.

Sessões paralelas em máquinas diferentes tendem a violar essa regra por conta própria: cada sessão fatia bem localmente, mas ninguém fatia entre sessões — o resultado, quando tudo se junta, é um PR gigante de fato (achado real: 26 arquivos, 5 responsabilidades sem relação direta, numa auditoria única). Se o trabalho paralelo já aconteceu e não dá mais pra desfazer a fusão, pelo menos documente isso explicitamente no PR/relatório de auditoria, pra quem revisar saber que está avaliando várias fatias de uma vez, não uma só.

### Auditar código que outra sessão escreveu antes de confiar nele
Graduou para skill: ver `.claude/skills/auditoria-de-pr/SKILL.md` (checklist multi-ângulo — bugs de linha, comportamento removido, rastreamento entre arquivos, condição de corrida, duplicação, aderência a padrões).
