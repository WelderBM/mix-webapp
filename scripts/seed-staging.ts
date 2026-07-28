// Seed do Firestore de STAGING com dado de teste tipado, pra reproduzir
// casos de borda conhecidos (fita aberta com sobra, produto sem preço, kit
// montado, pedido sem paymentTiming legado) sem depender de dado que "já
// esteja lá por acaso" ou de recriar tudo na mão pela UI do admin.
//
// Rodar: npm run seed:staging          (upsert — seguro rodar de novo)
//        npm run seed:staging -- --wipe (apaga o que é seed antes de inserir)
//
// MANUTENÇÃO — 3 formas de este script quebrar/ficar cego, de propósito:
//   1. Tipo alterado em src/types/* → tsc acusa aqui (o seed importa os
//      tipos reais, não duplica shape).
//   2. Membro novo em ProductType/OrderStatus → os `switch` com
//      `default: never` abaixo (productTypeLabel/orderStatusLabel) quebram
//      em compile — não fica silenciosamente cego pro tipo novo.
//   3. Coleção/singleton NOVO no Firestore, ou bug causado por estado de
//      dado → ver "Roteador de skills" no CLAUDE.md (atualizar
//      scripts/seed-data/ na MESMA fatia da mudança).
//
// REGRA DE FIDELIDADE DO SEED: todo campo seedado deve ser alcançável pela
// UI/admin. Campo de modelo sem caminho de admin: ou vira issue de
// admin-gap na hora, ou sai do seed. Seed exercita ESTADOS possíveis em
// produção, não features inalcançáveis. Regra VERIFICADA (não só
// documentada) em scripts/seed-data/fidelity.ts — todo campo marcado como
// unreachable lá precisa de uma issue de admin-gap associada, ou este
// script recusa rodar (guard abaixo, antes de qualquer inserção).
//
// Volume/carga: NÃO esticar este script pra testar performance/paginação —
// criar um scripts/seed-load.ts separado com writeBatch e geração
// procedural. Este arquivo é sobre cobertura de casos de borda, não volume.
//
// settings/general e settings/balloons são singletons que o site inteiro lê
// — este script SEMPRE sobrescreve os dois por completo (sem merge), de
// propósito: o objetivo de rodar antes de promover dev→master é deixar o
// staging num "estado conhecido", não preservar o que já estava lá.

import "dotenv/config";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

import { env } from "../src/lib/env";
import type { ProductType } from "../src/types/product";
import type { OrderStatus } from "../src/types/order";

import { categories } from "./seed-data/categories";
import { generalSettings, balloonConfig } from "./seed-data/settings";
import { products } from "./seed-data/products";
import { kitRecipes } from "./seed-data/kitRecipes";
import { orders } from "./seed-data/orders";
import { assertFidelityRegistryValid } from "./seed-data/fidelity";

const SEED_PREFIX = "seed-";
const WIPE = process.argv.includes("--wipe");

// ── Guard de segurança (inegociável) ────────────────────────────────────

function abort(message: string): never {
  console.error(`\n❌ ABORTADO: ${message}\n`);
  process.exit(1);
}

try {
  assertFidelityRegistryValid();
} catch (err) {
  abort((err as Error).message);
}

if (!env.NEXT_PUBLIC_FIREBASE_PROJECT_ID.includes("staging")) {
  abort(
    `projectId "${env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}" não contém "staging". ` +
      `Este script SÓ roda contra o Firebase de staging — confira o .env local.`
  );
}

const serviceAccountKeyPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH;
if (!serviceAccountKeyPath) {
  abort(
    "FIREBASE_SERVICE_ACCOUNT_KEY_PATH não configurada. Gere uma chave de " +
      "service account do projeto mix-webapp-staging (Firebase Console → " +
      "Configurações do Projeto → Contas de serviço → Gerar nova chave " +
      "privada) e aponte essa env pro caminho do arquivo .json baixado. " +
      "Nunca commite esse arquivo (já coberto pelo .gitignore)."
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

if (
  !serviceAccount.project_id ||
  !serviceAccount.project_id.includes("staging")
) {
  abort(
    `A service account key aponta pro projeto "${serviceAccount.project_id}", ` +
      `que não contém "staging". Recusando usar essa credencial.`
  );
}

if (serviceAccount.project_id !== env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
  abort(
    `Mismatch: a service account key é do projeto "${serviceAccount.project_id}", ` +
      `mas NEXT_PUBLIC_FIREBASE_PROJECT_ID é "${env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}". ` +
      `Os dois precisam apontar pro MESMO projeto staging.`
  );
}

// ── Init (client SDK não serve aqui: escrita em categories/products/
// settings/kit_recipes exige isAdmin() nas regras — Admin SDK ignora regras
// de propósito, é a via correta pra automação de confiança) ────────────────

const app = getApps().length
  ? getApps()[0]
  : initializeApp({
      // cert() aceita o CAMINHO do arquivo direto e faz seu próprio parse —
      // evita depender do shape solto que usamos acima só pra validação.
      credential: cert(resolve(serviceAccountKeyPath)),
      projectId: serviceAccount.project_id,
    });
const db = getFirestore(app);

// ── Exhaustiveness checks — membro novo na união quebra isto em compile ────

function productTypeLabel(type: ProductType): string {
  switch (type) {
    case "STANDARD_ITEM":
      return "Item padrão";
    case "RIBBON":
      return "Fita";
    case "BASE_CONTAINER":
      return "Base";
    case "FILLER":
      return "Recheio";
    case "WRAPPER":
      return "Embalagem";
    case "ACCESSORY":
      return "Acessório";
    case "ASSEMBLED_KIT":
      return "Kit montado";
    default: {
      const _exhaustive: never = type;
      throw new Error(`ProductType não coberto pelo seed: ${_exhaustive}`);
    }
  }
}

function orderStatusLabel(status: OrderStatus): string {
  switch (status) {
    case "pending":
      return "Pendente";
    case "preparing":
      return "Preparando";
    case "ready":
      return "Pronto";
    case "out_for_delivery":
      return "Saiu para entrega";
    case "delivered":
      return "Entregue";
    case "cancelled":
      return "Cancelado";
    default: {
      const _exhaustive: never = status;
      throw new Error(`OrderStatus não coberto pelo seed: ${_exhaustive}`);
    }
  }
}

// ── Wipe (opcional, atrás do mesmo guard — só limpa o que é seed) ─────────

async function wipeSeeded() {
  const collectionsToWipe = ["categories", "products", "kit_recipes", "orders"];
  for (const collectionName of collectionsToWipe) {
    const snapshot = await db.collection(collectionName).get();
    const seedDocs = snapshot.docs.filter((d) => d.id.startsWith(SEED_PREFIX));
    await Promise.all(seedDocs.map((d) => d.ref.delete()));
    console.log(`  🗑️  ${collectionName}: ${seedDocs.length} doc(s) removido(s)`);
  }
}

// ── Inserção (ordem respeita o grafo de referências) ───────────────────────

async function insertCategories() {
  await Promise.all(
    categories.map((c) => db.collection("categories").doc(c.id).set(c))
  );
  console.log(`  ✅ categories: ${categories.length}`);
}

async function insertSettings() {
  await db.collection("settings").doc("general").set(generalSettings);
  await db.collection("settings").doc("balloons").set(balloonConfig);
  console.log(`  ✅ settings/general, settings/balloons`);
}

async function insertProducts() {
  await Promise.all(
    products.map((p) => db.collection("products").doc(p.id).set(p))
  );
  const counts = products.reduce<Record<string, number>>((acc, p) => {
    const label = productTypeLabel(p.type);
    acc[label] = (acc[label] ?? 0) + 1;
    return acc;
  }, {});
  console.log(`  ✅ products: ${products.length} (${JSON.stringify(counts)})`);
}

async function insertKitRecipes() {
  await Promise.all(
    kitRecipes.map((r) => db.collection("kit_recipes").doc(r.id).set(r))
  );
  console.log(`  ✅ kit_recipes: ${kitRecipes.length}`);
}

async function insertOrders() {
  await Promise.all(
    orders.map((o) => db.collection("orders").doc(o.id).set(o))
  );
  const counts = orders.reduce<Record<string, number>>((acc, o) => {
    const label = orderStatusLabel(o.status);
    acc[label] = (acc[label] ?? 0) + 1;
    return acc;
  }, {});
  console.log(`  ✅ orders: ${orders.length} (${JSON.stringify(counts)})`);
}

// ── Validação pós-inserção ──────────────────────────────────────────────

async function validate() {
  const [categoriesSnap, productsSnap, kitRecipesSnap, ordersSnap] =
    await Promise.all([
      db.collection("categories").get(),
      db.collection("products").get(),
      db.collection("kit_recipes").get(),
      db.collection("orders").get(),
    ]);
  const settingsGeneralSnap = await db.collection("settings").doc("general").get();

  console.log(`\n📊 Contagens pós-inserção:`);
  console.log(`  categories: ${categoriesSnap.size}`);
  console.log(`  products: ${productsSnap.size}`);
  console.log(`  kit_recipes: ${kitRecipesSnap.size}`);
  console.log(`  orders: ${ordersSnap.size}`);

  const kitRecipeIds = new Set(kitRecipesSnap.docs.map((d) => d.id));
  const productIds = new Set(productsSnap.docs.map((d) => d.id));

  let invariantsFailed = false;

  // Invariante 1: ASSEMBLED_KIT.recipeId existe em kit_recipes.
  for (const doc of productsSnap.docs) {
    const data = doc.data();
    if (data.type === "ASSEMBLED_KIT") {
      if (!data.recipeId || !kitRecipeIds.has(data.recipeId)) {
        console.error(
          `  ❌ Invariante quebrada: products/${doc.id} (ASSEMBLED_KIT) referencia ` +
            `recipeId "${data.recipeId}", que não existe em kit_recipes.`
        );
        invariantsFailed = true;
      }
    }
  }

  // Invariante 2: todo StoreSection.productIds resolve pra um produto real.
  const settingsData = settingsGeneralSnap.data();
  const homeSections = (settingsData?.homeSections ?? []) as {
    id: string;
    productIds: string[];
  }[];
  for (const section of homeSections) {
    for (const productId of section.productIds) {
      if (!productIds.has(productId)) {
        console.error(
          `  ❌ Invariante quebrada: StoreSection "${section.id}" referencia ` +
            `productId "${productId}", que não existe em products.`
        );
        invariantsFailed = true;
      }
    }
  }

  if (invariantsFailed) {
    abort("uma ou mais invariantes de referência falharam (ver acima).");
  }

  console.log(`\n✅ Invariantes OK: ASSEMBLED_KIT.recipeId e StoreSection.productIds resolvem.`);
}

// ── main ────────────────────────────────────────────────────────────────

async function main() {
  console.log(
    `\n🌱 Seed de staging — projeto: ${env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}${
      WIPE ? " (com --wipe)" : ""
    }\n`
  );

  if (WIPE) {
    console.log("🗑️  Limpando docs seed-* existentes...");
    await wipeSeeded();
  }

  console.log("\n📥 Inserindo...");
  await insertCategories();
  await insertSettings();
  await insertProducts();
  await insertKitRecipes();
  await insertOrders();

  await validate();

  console.log("\n🌱 Seed concluído com sucesso.\n");
}

main().catch((err) => {
  console.error("\n❌ Seed falhou:", err);
  process.exit(1);
});
