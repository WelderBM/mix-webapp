// Correção pontual da issue #65 — 4 produtos RIBBON de PRODUÇÃO com
// `rollPrice` nunca definido (rolo FECHADO, campo ausente/0), levantados
// pela auditoria manual em scripts/seed-data/from-production/products.ts
// (export de 2026-08-05). Nenhum dos casos batia com o padrão do incidente
// original (#52 — fita ABERTA com preço de rolo no campo por-metro); os 4
// aqui são rolos fechados invendáveis porque getEffectiveUnitPrice retorna
// null sem rollPrice.
//
// Aplica o default combinado com o usuário: rolo fechado = R$40,00.
// (Rolo aberto R$0,50/m já está correto nos docs existentes — não mexido.)
//
// Por padrão roda em modo dry-run (só lê e mostra o que faria). Escreve de
// verdade só com --confirm.
//
// Rodar:
//   FIREBASE_SERVICE_ACCOUNT_KEY_PATH=<chave-de-PRODUÇÃO> npx tsx scripts/fix-ribbon-rollprice.ts
//   FIREBASE_SERVICE_ACCOUNT_KEY_PATH=<chave-de-PRODUÇÃO> npx tsx scripts/fix-ribbon-rollprice.ts --confirm

import "dotenv/config";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function abort(message: string): never {
  console.error(`\n❌ ABORTADO: ${message}\n`);
  process.exit(1);
}

const DEFAULT_ROLL_PRICE = 40;

const TARGET_IDS = [
  "EaNESZieRZ8NkR6fJ5C4", // Fita Maxi Albano 3D ROSA
  "rLQoEuzlIPkdmhG55eCc", // Fita Maxi Albano 03D AZUL
  "rQVlDMWRUEBCcsUmjhnh", // Fita Maxi Albano 03D VERMELHO
  "vXkyE9BIw7btJYjXUDpD", // Fita Maxi Albano 03D AZUL
];

const CONFIRM = process.argv.includes("--confirm");

const serviceAccountKeyPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH;
if (!serviceAccountKeyPath) {
  abort(
    "FIREBASE_SERVICE_ACCOUNT_KEY_PATH não configurada. Aponte pro .json da " +
      "service account do projeto de PRODUÇÃO."
  );
}

let serviceAccount: { project_id?: string; [key: string]: unknown };
try {
  serviceAccount = JSON.parse(readFileSync(resolve(serviceAccountKeyPath), "utf-8"));
} catch (err) {
  abort(`Não consegui ler/parsear a service account key: ${(err as Error).message}`);
}

if (!serviceAccount.project_id) {
  abort("A service account key não tem project_id — arquivo inválido?");
}

if (serviceAccount.project_id.includes("staging")) {
  abort(
    `A service account key é do projeto "${serviceAccount.project_id}" (parece staging). ` +
      `Este fix é pra PRODUÇÃO — os IDs alvo só existem lá.`
  );
}

const app = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: cert(resolve(serviceAccountKeyPath)),
      projectId: serviceAccount.project_id,
    });
const db = getFirestore(app);

async function main() {
  console.log(
    `\n${CONFIRM ? "✍️  ESCREVENDO" : "🔍 DRY-RUN"} — projeto conectado: "${serviceAccount.project_id}"\n`
  );

  for (const id of TARGET_IDS) {
    const ref = db.collection("products").doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      console.log(`  ⚠️  ${id}: doc não existe (mudou desde a auditoria?) — pulando`);
      continue;
    }
    const data = snap.data()!;
    if (data.type !== "RIBBON" || data.ribbonInventory?.status !== "FECHADO") {
      console.log(
        `  ⚠️  ${id}: não é mais RIBBON/FECHADO (type=${data.type}, status=${data.ribbonInventory?.status}) — pulando`
      );
      continue;
    }
    if (data.rollPrice) {
      console.log(`  ⏭️  ${id} (${data.name}): já tem rollPrice=${data.rollPrice} — pulando`);
      continue;
    }
    console.log(
      `  ${CONFIRM ? "✅" : "→"} ${id} (${data.name}): rollPrice 0/ausente → ${DEFAULT_ROLL_PRICE}`
    );
    if (CONFIRM) {
      await ref.update({ rollPrice: DEFAULT_ROLL_PRICE });
    }
  }

  console.log(
    CONFIRM
      ? "\n✅ Gravado.\n"
      : "\n🔍 Nada foi escrito (dry-run). Rode de novo com --confirm pra aplicar.\n"
  );
}

main().catch((err) => {
  console.error("\n❌ Falhou:", err);
  process.exit(1);
});
