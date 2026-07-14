# QA Fase 2 — Checklist de teste ponta a ponta

Parte do roadmap "De construído a no ar e confiável" (ver `IMPROVEMENTS.md` / PRs #21-22 pro contexto de infraestrutura). Objetivo: alguém percorrer todo caminho real do pedido pelo menos uma vez, no ambiente isolado de staging, antes de qualquer cliente real fazer isso pela primeira vez.

## Ambiente

- **Site (staging):** preview do branch `dev` na Vercel — `https://mix-webapp-git-dev-welderbms-projects.vercel.app`
- **Banco de dados:** projeto Firebase `mix-webapp-staging` (isolado do banco real — pode testar à vontade, nada aqui afeta produção)
- **Não** teste em `www.mixnovidades.com` — esse é o site real.

## Pré-requisito único (fazer uma vez, 2 minutos)

Login de admin ainda não foi habilitado no staging (a CLI não expõe esse passo, precisa ser manual):

1. Abrir [console.firebase.google.com/project/mix-webapp-staging/authentication/providers](https://console.firebase.google.com/project/mix-webapp-staging/authentication/providers)
2. "Adicionar novo provedor" → Google → Ativar → Salvar
3. Ir em Firestore → coleção `whitelisted_staff` → criar documento com ID = seu e-mail (o mesmo que você usa no admin real), campo `active: true`
4. Testar login em `/admin` no site de staging

Sem isso, os testes 6-9 abaixo (tudo que envolve o painel admin) não vão funcionar.

---

## 1. Checkout — Retirada + PIX
- [ ] Adicionar 1+ produto ao carrinho
- [ ] Abrir carrinho, preencher nome e telefone
- [ ] Entrega: **Retirar**
- [ ] Pagamento: **PIX**, destino **Loja**
- [ ] Finalizar pedido
- **Esperado:** WhatsApp abre com mensagem completa (ID, itens, total, forma de pagamento, "Retirada no Local"); pedido aparece no admin (`OrdersTab`) com status "Recebido"

## 2. Checkout — Entrega + Dinheiro
- [ ] Mesmo fluxo, Entrega: **Entrega**, CEP de Boa Vista-RR válido
- [ ] Pagamento: **Dinheiro**
- **Esperado:** endereço completo aparece na mensagem de WhatsApp e no pedido do admin; campo de troco não existe hoje — confirmar se isso é um problema pra vocês (não está no escopo original, só observando)

## 3. Checkout — Entrega + Cartão
- [ ] Mesmo fluxo, Pagamento: **Cartão de Crédito** ou **Débito**
- **Esperado:** já que não existe gateway de pagamento online, confirmar se fica claro pro cliente, na mensagem de WhatsApp, que o cartão é cobrado **na entrega/retirada** (maquininha), não online. Se não estiver claro, isso vira item da Fase 3 (polimento de mensagem).

## 4. CEP inválido / fora de Boa Vista-RR
- [ ] Tentar entrega com um CEP de outra cidade (ex: CEP de São Paulo)
- **Esperado:** aviso de "Entregas apenas para Boa Vista - RR", checkout bloqueado até corrigir ou trocar pra retirada

## 5. Destino do PIX
- [ ] Entrega + PIX, alternar destino entre **Loja** e **Moto Táxi**
- **Esperado:** ao escolher "Moto Táxi", formas de pagamento Cartão ficam desabilitadas (só PIX/Dinheiro); mensagem final reflete o destino escolhido

## 6. Admin — recebimento de pedido *(precisa do pré-requisito de login)*
- [ ] Deixar o admin aberto numa aba, fazer um pedido de outra aba/dispositivo
- **Esperado:** som toca, toast aparece, notificação do navegador aparece com o texto "Novo Pedido - Mix Novidades" (não mais "Natura App")

## 7. Admin — mudança de status refletindo no rastreamento do cliente
- [ ] No admin, abrir o pedido recém-criado e mudar o status: Recebido → Preparando → Pronto/Saiu p/ Entrega → Entregue
- [ ] Em paralelo, manter `/meu-pedido?id=<idDoPedido>` aberto **numa aba anônima** (sem estar logado)
- **Esperado:** a barra de progresso no rastreamento avança em tempo real a cada mudança de status no admin, sem precisar recarregar a página. Esse é o teste que valida o fix da Fase 1 (regra de leitura anônima).

## 8. Admin — "Copiar Moto"
- [ ] Num pedido de entrega, clicar em "Copiar Moto"
- [ ] Colar o texto copiado em qualquer lugar (bloco de notas, WhatsApp)
- **Esperado:** texto traz endereço da loja, dados do cliente, endereço de entrega, telefone e instrução de pagamento corretos

## 9. Legibilidade da mensagem de WhatsApp no celular
- [ ] Fazer um pedido com 3+ itens diferentes pelo celular de verdade (não emulador)
- **Esperado:** mensagem gerada é fácil de ler no WhatsApp, sem cortes estranhos, itens organizados, total visível sem precisar rolar muito

---

## Registro de defeitos

| # | O que aconteceu | Esperado | Prioridade (P0/P1 quebra fluxo, P2 é polimento) |
|---|---|---|---|
| | | | |

Corrigir apenas P0/P1 nesta fase — polimento (copy, mensagens, valor mínimo) fica pra Fase 3, conforme o plano.
