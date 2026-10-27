# Passagem — 22 e 23/10/2026: balões, fotos, marcas, foil, CI e skills

> Documento de fim de conversa (procedimento em `docs/fluxo/guia-varias-conversas.md`).
> Tudo o que só existia no chat está aqui. Seção sem nada diz "nada".
>
> **Issues criadas a partir deste documento (23/10):** #282 imagens quebradas · #283 nome da loja · #284 escolha de marca · #285 /fitas · #286 instrução do lançamento · #287 decisões do catálogo de balões · #288 decisões das skills · #289 arrumação da pasta principal. Achados do mapa do rodapé e dos botões da Home foram comentados na #222 e na #224.

## Resumo

- **Balões do Noturno:**
  - viraram catálogo do montador de verdade: cor só aparece no tamanho com estoque, marca escolhida primeiro, neon como tipo próprio;
  - foto do pacote por tipo;
  - foil limitado às letras e números que existem.
- **Fitas e lançamento:** ganharam busca de foto na internet (Serper).
- **Automação:** a revisão de UX passou para depois do merge em `dev` e não segura mais PR.
- **Skills:** 7 instaladas, mais o Token Optimizer.
- **Produção:** **nada disso foi para produção ainda** (`master`).

## Estado dos PRs

Todos no `dev`; nenhum aberto.

| PR | O quê |
|---|---|
| #269, #270 | Busca de foto na internet (fitas e card de lançamento) |
| #271 | Balão do catálogo nunca vira produto; carrinho reconhece produto recém-publicado |
| #272 | Cores sem juntar parecidas; temático/coração/gigante → "Balões personalizados" |
| #273, #274 | Cor só no tamanho com estoque; Montar pelo Noturno limpa cores velhas e nomes quebrados; cor com tom não some |
| #275, #276 | Montador por marca (São Roque primeiro), neon tipo próprio; ajustes da revisão |
| #277 | Foto do pacote por tipo (busca padronizada); foil sem divisão por marca |
| #278, #279 | Foil limita letras/números ao estoque de cada cor; teclado com 44 px |
| #280 | Revisão visual de UX depois do merge em `dev` (abre issue com achados) |

## Esperando o dono

1. (#287) **Foil fora do montador:** números pretos, números candy (Azul Turquesa, Rosa Bebê) e números de 75 cm entram em "Números & Letras"? Hoje seguem como produto comum.
2. (#287) **3 produtos de balão de teste no staging** (`PxDfgxd5cfDrKPCRtTSl`, `d6GRVstnaEJWkc9W97AX`, `4YUBOVIWFhr5hwvkmLhi`):
   - desativar os 3 e devolver os 7 itens para "No catálogo"? Dá para desfazer.
3. (#287) **Linha Basic 6,5" (São Roque):** continua misturada no Liso. Separar como tipo próprio?
4. (#287) **Pares de cor que podem ser a mesma na prateleira:**
   - Tutti Frutti × Rosa Tutti Frutti;
   - Cristal × Transparente;
   - Verde Limão × Verde Lima;
   - Lilás × Lilás Baby;
   - Branco × Branco Polar;
   - Rosa × Rosa Baby.

   Parte deles agora caiu em outras marcas. Confirmar na loja.
5. (#287) **Estoque do Noturno parece acima do real** (ex.: 84 pacotes de Roxo Uva, 60 de Roxo 7"):
   - quer uma lista de conferência para uma funcionária marcar na prateleira?
6. (#288) **Decisões do mapa de skills:** as 5 da seção 3 de `docs/fluxo/mapa-de-skills.md`.
7. (#289) **`AGENTS.md` com mudança não salva** na pasta principal do projeto (branch antiga `feat/ux-visual-review`):
   - é o bloco que o `next dev` escreve sozinho;
   - commitar junto com algo, ou descartar.
8. (#289) **Pasta de trabalho antiga `mix-webapp-wt1`** (branch `fix/admin-auth-pwa-icons`), de outra sessão: manter ou apagar?
9. **Levar para produção** (etapa 3 do plano): merge `dev` → `master` é seu, depois do teste ponta a ponta.

## Passos do dono (no admin do staging)

1. **Reimportar o Excel do Noturno.** Grava o estoque novo:
   - por cor, tamanho e marca;
   - por letra/número do foil.
2. **Balões › Montar pelo Noturno:**
   - digitar o preço do **Neon** e de cada marca que for vender;
   - conferir a limpeza de cores;
   - **Aplicar** e depois **Salvar Configurações**. Isso também tira o "Gate" antigo do foil.
3. **Balões › Fotos dos pacotes:** buscar a foto de cada tipo e **Salvar Configurações**.
4. **Conferir na loja › Balões:**
   - o passo "Escolha a Marca";
   - as cores por tamanho;
   - o teclado do foil (letra que falta aparece riscada).
5. **Primeira medição de tokens:** numa conversa nova, pedir o `token-optimizer`. Ele mostra antes/depois e só muda algo com a sua aprovação.

## Pendências minhas (prometidas)

1. (#282) **Imagens quebradas no montador:**
   - "Linha Uniq";
   - cartões de marca "São Roque" e "Heppy e Joy" vazios (revisões de UX do #278/#279).

   Suspeita: `imageUrl` antigo quebrado salvo no catálogo. Investigar e corrigir.
2. (#283) **Nome da loja diferente entre telas:** "Mix Novidades (Em teste)" × "Mix WebApp", e o "(Em teste)" aparece para o cliente.
3. (#287) **Lista de conferência de prateleira**, se o dono quiser (item 5 acima).

## Achados em aberto (revisões, não corrigidos)

**🟡 Importantes, de UX:**
- Nome da loja inconsistente (#271, #273, #275, #279). Já está em "Pendências minhas".
- (#222) Mapa do rodapé aparece como caixa escura vazia, cerca de 250 px no celular (#271, #275, #277, #279). Pode ser o robô sem internet; conferir no celular.
- (#224) Home: "Iniciar Corte" e "Montar Agora" parecem texto sublinhado, não botão (#275, #277).
- (#284) Escolha de marca:
  - descrição do cartão São Roque cortada ("Metálic…") (#275, #277);
  - cartões desalinhados à esquerda no desktop (#275).
- (#285) Fitas:
  - frase de painel de dono para o cliente ("Gerencie seu estoque…") (#277);
  - estado vazio "Nenhum rolo fechado disponível." sem sugerir "Por Metro" (#277, #279).
- (#286) Admin › Lançamento: "Em que área da loja você está?" é o menor e mais claro texto da tela (#277).

**⚪ Menores, de código:**
- #273: um tipo cadastrado à mão num tamanho que o Noturno ainda não importou some da loja até a próxima importação. É a regra pedida; só fica o registro.

**Backlog já planejado** (etapa 5 do plano), sem mudança:
- #147, #105, #220–#228;
- depois #162 (Sentry), #203 (IA, decisão de custo), #253, #56.

## Decisões tomadas

- **Balões:**
  - não viram produto na loja: entram pelo montador (Montar pelo Noturno);
  - temáticos, coração, gigante e estampados são produto comum, agrupados em "Balões personalizados".
- **Cor e marca:**
  - a cor só aparece no tamanho em que o Noturno tem unidade; tamanho sem cor some;
  - **marca primeiro** no montador, São Roque na frente ("★ Mais pedida"), nome da marca visível; um cartão por marca;
  - **foil não se divide por marca** (letras/números parecidos em todas); cartão próprio "Números & Letras".
- **Neon:** tipo próprio no montador.
- **Imagens:** foto do **pacote** por tipo (busca padronizada), não logo.
- **Foil:** limitado às letras/números com estoque, contando repetidas por conjunto.
- **Revisão de UX:** depois do merge em `dev`; achado vira issue.
- **Fluxo:** PR aberto não para o trabalho (skill `fluxo-continuo`); um assunto por conversa; "fecha a conversa" faz este levantamento.
- **Dono:** dev solo, empresa **Nevalo**; a Mix Novidades é cliente (licenças avaliadas pela Nevalo).

## Primeira mensagem da próxima conversa

```
Contexto: balões e fluxo — continuação de 23/10 (ver docs/sessoes/2026-10-23-baloes-e-fluxo.md).
Estado: tudo no dev (#269–#280), nada em produção ainda.
Pendente comigo: itens 1–9 de "Esperando o dono" no documento.
Próximo passo: rodar o token-optimizer; depois corrigir as imagens quebradas dos cartões de marca e o nome da loja.
```
