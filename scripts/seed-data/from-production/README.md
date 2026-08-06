# Esqueleto real de produção

Arquivos deste diretório são **gerados** por `scripts/export-production-catalog.ts` — não edite à mão, rode o script de novo pra atualizar:

```
FIREBASE_SERVICE_ACCOUNT_KEY_PATH=<caminho-da-chave-de-produção> npm run export:production-catalog
```

Contém `categories`, `products`, `kit_recipes` e `settings` (todos os docs da coleção `settings`, incluindo singletons como `general`/`balloons`/`natura`) exportados **somente-leitura** de produção — o que foi cadastrado manualmente lá.

**Deliberadamente sem `orders`** — pedido tem PII de cliente (nome, telefone, endereço) e staging é usado em preview da Vercel, mais exposto que produção. Teste de fluxo de pedido continua usando o dado sintético em `scripts/seed-data/orders.ts`.

Pra popular staging com este esqueleto:

```
npm run seed:staging -- --from-production
```
