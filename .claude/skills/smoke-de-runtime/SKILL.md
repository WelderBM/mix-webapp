---
name: smoke-de-runtime
description: Use depois de merge de dependências, mudança de config/infra, ou antes de promover dev→produção — rodar o app em dev, percorrer as superfícies principais e colher TODOS os avisos de console/terminal, triando o que vira issue. NÃO use como substituto de vitest (isso é teste automatizado) nem pra auditar o diff de um PR (isso é auditoria-de-pr) — esta skill olha o app RODANDO, não o código parado.
---

# Smoke de runtime com colheita de console

**Por que existe**: auditoria estática olha o diff; teste automatizado olha o que foi
testado. Sobra uma classe inteira de problema que só aparece com o app rodando e alguém
navegando — e ela fica invisível porque ninguém lê o console. Caso-âncora (jul/2026):
o smoke de um bump de segurança lockfile-only colheu 5 achados pré-existentes que
nenhuma skill tinha pego: ícone 404 do manifest em toda página, `sizes` impreciso no
banner da home, 2 modais Radix sem aria-describedby, um Select trocando de uncontrolled
pra controlled (cheiro de bug real), e scroll-behavior sem data-attribute.

## Roteiro (mínimo; expandir se a mudança tocar outra área)
1. `npm run dev` — terminal fica visível o tempo todo; browser com console aberto.
2. Percorrer INTERAGINDO (clicar, rolar, abrir modal — não só carregar):
   home · /produto/[id] real · /natura · /fitas · /baloes · admin (todas as abas/views)
   · kit builder · fluxo de carrinho até o checkout abrir.
3. Colher TUDO: warnings do terminal (Next), warnings/erros do console do browser,
   404s de asset, avisos de hidratação. Copiar literal, não parafrasear.

## Triagem do colhido (regra do caso-âncora)
- **Cheiro de comportamento** (controlled/uncontrolled, hydration mismatch, erro de
  estado, 500 intermitente) → issue PRÓPRIA, label bug — precisa investigação.
- **Polish trivial** (asset 404, sizes, aria, data-attribute) → AGRUPAR numa issue
  única "[Polish] avisos de console <data>" com checkboxes — superfícies diferentes,
  mas separá-los é burocracia. Passa pela triagem-de-issues (modo criação) antes.
- **Ruído conhecido e aceito** (ex.: zustand persist "storage unavailable" nos testes)
  → não vira issue; se recorrente, registrar uma linha aqui embaixo.
## Ruídos conhecidos (não reportar de novo)
- `[zustand persist] Unable to update item 'cart-storage'` no vitest: esperado, storage
  não existe no ambiente de teste.
