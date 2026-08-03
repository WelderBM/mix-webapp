// Auditoria SOMENTE-LEITURA da coleção `products` (type == "RIBBON") em
// produção — lista docs suspeitos de terem `rollPrice`/`price` trocados,
// causado pelo período em que `ProductFormDialog` só tinha um campo
// genérico "Preço" (ver #52, corrigido pra cadastros novos/editados; este
// script existe pra achar o dado ANTIGO que ficou ambíguo).
//
// Este script NUNCA escreve no Firestore — nenhum `set`/`update`/`delete`.
// A correção do que for encontrado é manual, via admin (ProductFormDialog)
// ou script pontual separado, depois de uma decisão humana olhando o
// relatório (não incluída aqui de propósito — ver #65).
//
// Rodar:
//   FIREBASE_SERVICE_ACCOUNT_KEY_PATH=<caminho-da-chave> npm run audit:ribbon-prices
//
// A chave de service account precisa ser do projeto que você quer auditar
// (produção, na prática — mas o script não recusa rodar contra outro
// projeto porque é read-only e não há risco de corromper dado; o project_id
// conectado é sempre impresso no topo do relatório pra você conferir antes
// de confiar no resultado).
//
// Heurísticas (heurísticas, não certezas — todo achado é "provável", exige
// olho humano antes de mexer no dado):
//   1. FECHADO com rollPrice ausente/0 ou < R$ 5 → provável preço de metro
//      digitado no lugar do preço do rolo.
//   2. ABERTO com price > R$ 10/metro → provável preço de rolo digitado no
//      lugar do preço por metro (o padrão do incidente original).
//   3. RIBBON sem rollPrice definido, independente do status → vai passar a
//      aparecer como "Preço não configurado" no admin; não é bug novo, é a
//      UI parando de esconder um dado que já faltava.

import "dotenv/config";
import { readFileSync } from "node:fs";
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
      "service account do projeto que você quer auditar (Firebase Console → " +
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

// Admin SDK, read-only: nenhuma chamada de escrita existe neste arquivo.
const app = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: cert(resolve(serviceAccountKeyPath)),
      projectId: serviceAccount.project_id,
    });
const db = getFirestore(app);

// Limiares das heurísticas — ver cabeçalho do arquivo.
const CLOSED_ROLL_PRICE_TOO_LOW = 5; // R$
const OPEN_METER_PRICE_TOO_HIGH = 10; // R$

interface Finding {
  id: string;
  name: string;
  status: string;
  price?: number;
  rollPrice?: number;
  heuristics: string[];
}

async function main() {
  console.log(`\n🔎 Auditoria de preços de fita — projeto conectado: "${serviceAccount.project_id}"\n`);

  const snap = await db.collection("products").where("type", "==", "RIBBON").get();
  console.log(`Docs RIBBON encontrados: ${snap.size}\n`);

  const findings: Finding[] = [];

  snap.forEach((doc) => {
    const data = doc.data();
    const status: string | undefined = data.ribbonInventory?.status;
    const price: number | undefined = data.price;
    const rollPrice: number | undefined = data.rollPrice;
    const heuristics: string[] = [];

    if (status === "FECHADO") {
      if (!rollPrice || rollPrice <= 0) {
        heuristics.push(
          "1. FECHADO sem rollPrice — provável preço de metro digitado no lugar do preço do rolo"
        );
      } else if (rollPrice < CLOSED_ROLL_PRICE_TOO_LOW) {
        heuristics.push(
          `1. FECHADO com rollPrice=${rollPrice} (< R$ ${CLOSED_ROLL_PRICE_TOO_LOW}) — parece preço de metro, não de rolo`
        );
      }
    }

    if (status === "ABERTO" && price !== undefined && price > OPEN_METER_PRICE_TOO_HIGH) {
      heuristics.push(
        `2. ABERTO com price=${price}/metro (> R$ ${OPEN_METER_PRICE_TOO_HIGH}) — parece preço de rolo fechado, não de metro`
      );
    }

    if (!rollPrice || rollPrice <= 0) {
      heuristics.push(
        "3. rollPrice não definido — vai aparecer como \"Preço não configurado\" no admin (RibbonsTab)"
      );
    }

    if (heuristics.length > 0) {
      findings.push({
        id: doc.id,
        name: data.name ?? "(sem nome)",
        status: status ?? "(sem ribbonInventory.status)",
        price,
        rollPrice,
        heuristics,
      });
    }
  });

  if (findings.length === 0) {
    console.log("✅ Nenhum doc suspeito pelas heurísticas atuais.\n");
    return;
  }

  console.log(`⚠️  ${findings.length} doc(s) suspeito(s):\n`);
  for (const f of findings) {
    console.log(`— ${f.id} — "${f.name}"`);
    console.log(`  status=${f.status} price=${f.price ?? "-"} rollPrice=${f.rollPrice ?? "-"}`);
    for (const h of f.heuristics) {
      console.log(`  ${h}`);
    }
    console.log("");
  }

  console.log(
    "Nenhum dado foi alterado por este script. Corrija manualmente via " +
      "admin (ProductFormDialog) os docs que, depois de olhar caso a caso, " +
      "forem confirmados como erro de cadastro.\n"
  );
}

main().catch((err) => {
  console.error("Erro ao rodar a auditoria:", err);
  process.exit(1);
});
