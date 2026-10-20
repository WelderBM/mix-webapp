// Exportação SOMENTE-LEITURA do catálogo/config de PRODUÇÃO (categories,
// products, kit_recipes, settings) pra arquivos TS reutilizáveis em
// scripts/seed-data/from-production/ — o "esqueleto" do que foi cadastrado
// manualmente em produção, pronto pra popular staging via
// `npm run seed:staging -- --from-production`.
//
// Este script NUNCA escreve no Firestore — nenhum `set`/`update`/`delete`,
// em nenhum projeto. Mesmo padrão de segurança do audit-ribbon-prices.ts.
//
// DELIBERADAMENTE NÃO exporta `orders` — pedido real de cliente tem PII
// (nome, telefone, endereço) e staging é usado em preview da Vercel, mais
// exposto que produção. Teste de fluxo de pedido continua usando o
// synthetic scripts/seed-data/orders.ts.
//
// Rodar:
//   FIREBASE_SERVICE_ACCOUNT_KEY_PATH=<caminho-da-chave-de-PRODUÇÃO> npm run export:production-catalog
//
// A chave precisa ser do projeto de produção (mix-webapp, sem "staging" no
// nome) — o script recusa rodar contra um projeto cujo project_id contenha
// "staging" (proteção invertida da que existe no seed-staging.ts: aqui
// queremos garantir que a LEITURA é de produção, não da própria staging).

import "dotenv/config";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function abort(message: string): never {
  console.error(`\n❌ ABORTADO: ${message}\n`);
  process.exit(1);
}

const serviceAccountKeyPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH;
if (!serviceAccountKeyPath) {
  abort(
    "FIREBASE_SERVICE_ACCOUNT_KEY_PATH não configurada. Aponte pro .json da " +
      "service account do projeto de PRODUÇÃO (Firebase Console → " +
      "Configurações do Projeto → Contas de serviço → Gerar nova chave " +
      "privada). Nunca commite esse arquivo (já coberto pelo .gitignore)."
  );
}

let serviceAccount: { project_id?: string; [key: string]: unknown };
try {
  serviceAccount = JSON.parse(
    readFileSync(resolve(serviceAccountKeyPath), "utf-8")
  );
} catch (err) {
  abort(
    `Não consegui ler/parsear a service account key em "${serviceAccountKeyPath}": ${
      (err as Error).message
    }`
  );
}

if (!serviceAccount.project_id) {
  abort("A service account key não tem project_id — arquivo inválido?");
}

if (serviceAccount.project_id.includes("staging")) {
  abort(
    `A service account key é do projeto "${serviceAccount.project_id}" ` +
      `(parece staging, não produção). Este script existe pra exportar de ` +
      `PRODUÇÃO — use scripts/seed-staging.ts pra popular staging.`
  );
}

// Admin SDK, read-only: nenhuma chamada de escrita existe neste arquivo.
const app = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: cert(resolve(serviceAccountKeyPath)),
      projectId: serviceAccount.project_id,
    });
const db = getFirestore(app);

const OUT_DIR = resolve(__dirname, "seed-data", "from-production");

function header(collectionName: string): string {
  return (
    `// GERADO por scripts/export-production-catalog.ts em ${new Date().toISOString()}\n` +
    `// Projeto de origem: ${serviceAccount.project_id}\n` +
    `// Não editar à mão — rode o script de novo pra atualizar. Coleção: ${collectionName}.\n\n`
  );
}

async function exportCategories() {
  const snap = await db.collection("categories").get();
  const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const content =
    header("categories") +
    `import { Category } from "../../../src/types/category";\n\n` +
    `export const categories: Category[] = ${JSON.stringify(docs, null, 2)} as Category[];\n`;
  writeFileSync(resolve(OUT_DIR, "categories.ts"), content);
  console.log(`  ✅ categories: ${docs.length} doc(s)`);
  return docs;
}

async function exportProducts() {
  const snap = await db.collection("products").get();
  const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const content =
    header("products") +
    `import { Product } from "../../../src/types/product";\n\n` +
    `export const products: Product[] = ${JSON.stringify(docs, null, 2)} as unknown as Product[];\n`;
  writeFileSync(resolve(OUT_DIR, "products.ts"), content);
  console.log(`  ✅ products: ${docs.length} doc(s)`);
  return docs;
}

async function exportKitRecipes() {
  const snap = await db.collection("kit_recipes").get();
  const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const content =
    header("kit_recipes") +
    `import { KitRecipe } from "../../../src/types/kit";\n\n` +
    `export const kitRecipes: KitRecipe[] = ${JSON.stringify(docs, null, 2)} as unknown as KitRecipe[];\n`;
  writeFileSync(resolve(OUT_DIR, "kitRecipes.ts"), content);
  console.log(`  ✅ kit_recipes: ${docs.length} doc(s)`);
  return docs;
}

// `settings` é uma coleção de singletons (general, balloons, natura, ...) —
// lê a coleção inteira em vez de hardcodar os 2 docs que o seed sintético
// usa, pra não ficar cego a um singleton novo que produção já tenha e o
// seed ainda não conheça.
async function exportSettings() {
  const snap = await db.collection("settings").get();
  const byId: Record<string, unknown> = {};
  snap.docs.forEach((d) => {
    byId[d.id] = d.data();
  });
  const content =
    header("settings (todos os docs — general, balloons, natura, ...)") +
    `import { StoreSettings } from "../../../src/types/store";\n` +
    `import { BalloonConfig } from "../../../src/types/balloon";\n\n` +
    `// Chaveado pelo id do doc em settings/<id> — spread o que precisar.\n` +
    `export const settingsById: Record<string, unknown> = ${JSON.stringify(byId, null, 2)};\n\n` +
    `export const generalSettings = settingsById["general"] as StoreSettings | undefined;\n` +
    `export const balloonConfig = settingsById["balloons"] as BalloonConfig | undefined;\n`;
  writeFileSync(resolve(OUT_DIR, "settings.ts"), content);
  console.log(`  ✅ settings: ${snap.docs.length} doc(s) (${snap.docs.map((d) => d.id).join(", ")})`);
}

async function main() {
  console.log(
    `\n📤 Exportando catálogo de PRODUÇÃO — projeto conectado: "${serviceAccount.project_id}"\n` +
      `   (confira que é o projeto certo antes de confiar no resultado)\n`
  );

  mkdirSync(OUT_DIR, { recursive: true });

  console.log("📥 Lendo...");
  await exportCategories();
  await exportProducts();
  await exportKitRecipes();
  await exportSettings();

  console.log(
    `\n✅ Exportado pra ${OUT_DIR}\n` +
      `   Nada foi escrito no Firestore — isto é só leitura.\n` +
      `   Pra popular staging com esse esqueleto: npm run seed:staging -- --from-production\n` +
      `   NÃO exportei "orders" de propósito (PII de cliente) — orders de staging seguem sintéticos.\n`
  );
}

main().catch((err) => {
  console.error("\n❌ Exportação falhou:", err);
  process.exit(1);
});
