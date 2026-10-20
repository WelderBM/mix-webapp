---
name: auditoria-de-dependencias
description: Use quando o npm acusar vulnerabilidades (aviso pós-install, npm audit, alerta do Dependabot), ou pra rodar a checagem periódica de dependências — triar o que é risco real de produção vs. ruído transitivo/dev, e executar o fix como fatia própria no git flow. NÃO use pra atualizar dependências por feature/major upgrade planejado (isso é trabalho normal de issue), nem pra suspeita de pacote malicioso/supply-chain ativo (isso é incidente: parar e investigar, não rodar fix).
---

# Auditoria de dependências

**Por que essa skill existe**: o npm grita "15 vulnerabilities (2 critical)" a cada install, e as duas reações instintivas estão erradas. Ignorar é errado porque no meio do ruído pode haver um advisory real da tua dependência mais exposta (aconteceu: jul/2026, o próprio `next` com 23 advisories de middleware bypass/cache poisoning numa loja em produção). Rodar `npm audit fix` na hora é errado porque mexe no lockfile no meio de qualquer branch que estiver aberta, contaminando um PR com mudança fora do escopo — e `--force` pode trazer breaking change silencioso. Esta skill é o meio-termo: triagem por exposição real, fix como fatia própria.

**Regra de ouro nº 1: nunca rodar `npm audit fix` no meio de outra branch.** O fix mexe em `package.json`/`package-lock.json`; isso é uma Fatia própria, com issue própria, branch própria a partir de `dev`. Se o aviso apareceu durante a validação de um PR (o caso real: apareceu no `npm install` da validação do PR de Web Vitals), a resposta é: terminar o PR em curso normalmente — o aviso não é novo, a árvore já estava assim — e tratar as deps como a próxima fatia.

**Regra de ouro nº 2: `--force` nunca é automático.** `npm audit fix --force` faz upgrade com breaking change e reescreve o lockfile de forma difícil de auditar. Se o fix simples reportar que algo só resolve com force, isso NÃO se aplica automaticamente — lista o que sobrou e a decisão de major upgrade vira issue separada, avaliada com changelog na mão.

## Passo 1 — Separar o sinal do ruído

O número cru do aviso mente. Rode:

```
npm audit --omit=dev
```

Só o que afeta produção. O relatório completo (`npm audit`) serve pra ver o resto, mas a triagem é sobre o `--omit=dev`.

## Passo 2 — Classificar cada achado por EXPOSIÇÃO, não por severity

O CVSS "critical" de um pacote que tua aplicação não alcança vale menos que um "high" na tua dependência de borda. Três perguntas, nesta ordem:

1. **É dependência DIRETA de produção?** (está no teu `package.json`, roda na aplicação servida). Ex. real: `next` — a única direta da lista de jul/2026, e por isso o único achado 🔴. Classes que importam numa loja pública atrás de CDN: middleware/proxy bypass, cache poisoning (afeta o que OUTROS visitantes recebem), XSS, SSRF. Isso fura fila.
2. **É transitiva — e o cenário do advisory alcança teu uso?** Leia o advisory e pergunte: o ataque assume um papel que eu tenho? Ex. real: o bloco do Firebase (`@grpc/grpc-js`, `protobufjs` "critical", `websocket-driver`) — os cenários assumem majoritariamente rodar um SERVIDOR gRPC ou gerar código de schemas não confiáveis; como cliente do Firestore falando com o Google, a reachability é baixa. Classificação 🟡: real, exposição menor, conserta de carona.
3. **É tooling de build?** (`@babel/core`, `brace-expansion`, `js-yaml` transitivos) — roda em build time, não na aplicação servida. 🟢 ruído, cai junto no fix, não justifica urgência.

Atenção ao aninhamento: achados listados em `node_modules/<pacote-pai>/node_modules/...` (ex.: `postcss` e `sharp` dentro do `next`) são vendored do pai — resolvem no bump do pai, não são itens separados de triagem.

**Bônus de contexto**: cheque se algum achado 🔴 corresponde a um security release conhecido do framework (o caso real: os advisories do next eram o security release mensal de jul/2026, linha corrigida 16.2.11, e o projeto estava em `^16.2.1` — fix dentro do próprio range semver, ou seja, barato e sem breaking). Isso transforma "23 advisories assustadores" em "um bump de patch".

## Passo 3 — Decidir a urgência

- Algum 🔴 (direta de produção, classe relevante) — **fura a fila de execução**: vira a próxima issue, na frente do backlog planejado. Justificativa curta no corpo.
- Só 🟡/🟢 — vira issue normal, entra na fila sem furar. Ou, se TUDO for 🟢 e o fix for trivial, pode aguardar a próxima janela de manutenção — mas registre (issue P3), não deixe só na memória.

## Passo 4 — Executar como fatia

```
a. Issue via triagem-de-issues (modo criação):
   "[Deps] Security bump: <pacote principal> <versão> (+ transitivas)"
   Aceite: (1) npm audit --omit=dev zerado ou só ruído justificado por escrito;
   (2) <pacote> >= <versão corrigida>; (3) tsc/vitest/build verdes; (4) smoke local.
b. git checkout dev && git pull && git checkout -b chore/deps-security-<marco>
c. npm audit fix          # SEM --force (regra de ouro nº 2)
d. Diff do package.json + resumo do lockfile (quais pacotes andaram, de → pra).
   Confirmar a versão-alvo do achado 🔴.
e. npm audit --omit=dev de novo — resultado vai no corpo do PR.
f. Ritual do repo: tsc, vitest, build. Depois smoke manual das superfícies principais
   (home, página de produto, landing, admin, kit builder — o que o projeto tiver).
   Deps de imagem/renderização (ex.: sharp) merecem olhar as imagens renderizando.
g. auditoria-de-pr no diff — deve ser manifest+lockfile APENAS; qualquer arquivo de
   src/ no diff é sinal de erro (aborta e investiga).
h. PR pra dev com a triagem 🔴/🟡/🟢 resumida no corpo. Aberto pra validação local.
```

## O que esta skill NÃO cobre (e pra onde vai)

- **Sobrou vulnerabilidade sem fix upstream** (transitiva sem versão corrigida): documenta a aceitação de risco na issue (por que a exposição é baixa, link do advisory) e agenda re-checagem. `overrides` no package.json é a saída pra forçar versão de transitiva — mas é decisão manual, caso a caso, nunca do fix automático.
- **Major upgrade necessário** (o fix exige quebrar semver): issue própria de upgrade, com changelog/breaking changes lidos antes — vira trabalho planejado, não patch de segurança.
- **Suspeita de pacote malicioso** (typosquat, install script estranho, takeover de maintainer): NÃO é este fluxo. `npm audit` cobre CVE conhecido, não supply-chain ativo. Nesse caso: não instala, não builda, investiga o pacote (Socket, provenance, histórico do maintainer) antes de qualquer coisa.
- **Aviso durante validação de outro PR**: já coberto pela regra de ouro nº 1 — termina o PR, deps viram a próxima fatia.

## Caso-âncora (jul/2026) — pra reconhecer o padrão de novo

`npm install` na validação do PR de Web Vitals acusou "15 vulnerabilities (2 critical)".
Triagem: `--omit=dev` reduziu a 10 — **🔴 `next`** (direta, 23 advisories = security
release jul/2026, bypass/cache-poisoning/XSS; fix = 16.2.11, dentro do range semver;
postcss/sharp aninhados caíram junto) — **🟡 bloco Firebase** (grpc/protobufjs/websocket-driver,
cenários de servidor gRPC, reachability baixa como cliente Firestore) — **🟢 build**
(babel/brace-expansion/js-yaml). Decisão: furou a fila como issue 0, `npm audit fix`
sem force resolveu tudo, PR manifest+lockfile only. Os dois "critical" do aviso original
eram do bloco 🟡 — o achado que importava era um "high" da dependência direta.
