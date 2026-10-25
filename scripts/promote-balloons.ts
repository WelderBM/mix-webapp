// Leva o catálogo de balões do STAGING para PRODUÇÃO (#319).
//
// O dono monta e confere o catálogo (tipos, tamanhos, preços, cores e
// fotos) no staging; quando estiver tudo certo, este script copia para
// produção sem redigitar.
//
// SEGURANÇA
// - Por padrão é SIMULAÇÃO: lê os dois projetos, mostra o que muda e NÃO
//   grava nada. Só grava com --apply.
// - Antes de gravar, salva o que havia em produção em
//   backups/balloons-<data>.json (pasta fora do git) para poder voltar.
// - As chaves são conferidas: a de origem tem de ser do staging e a de
//   destino NÃO pode ser do staging.
// - As fotos do catálogo são copiadas do bucket do staging para o de
//   produção (mesmo caminho) e os links são trocados. Foto que não é do
//   Firebase Storage do staging fica com o link como está.
// - O estoque (`settings/balloonStock`) só vai com --with-stock. Em
//   produção ele vem da importação do Noturno de lá; sem estoque
//   importado, o montador mostra todos os tamanhos e cores do catálogo.
//
// RODAR (PowerShell ou bash, a partir da raiz do projeto):
//   STAGING_KEY=<chave-do-staging.json> PROD_KEY=<chave-de-produção.json> \
//     npm run promote:balloons                  # simulação
//   ... npm run promote:balloons -- --apply     # grava em produção
//   ... npm run promote:balloons -- --restore backups/balloons-<data>.json [--apply]
//
// Opcional: PROD_STORAGE_BUCKET (padrão: <projeto>.firebasestorage.app).

import "dotenv/config";
import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { cert, initializeApp, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import type { BalloonConfig } from "../src/types/balloon";
import {
  catalogImageUrls,
  describeCatalogChange,
  downloadUrl,
  parseStorageUrl,
  rewriteImageUrls,
} from "./promote/balloons";

function abort(message: string): never {
  console.error(`\n❌ ABORTADO: ${message}\n`);
  process.exit(1);
}

const APPLY = process.argv.includes("--apply");
const WITH_STOCK = process.argv.includes("--with-stock");

function loadKey(envName: string): { path: string; projectId: string } {
  const path = process.env[envName];
  if (!path) abort(`${envName} não configurada (caminho do .json da service account).`);
  let json: { project_id?: string };
  try {
    json = JSON.parse(readFileSync(resolve(path), "utf-8"));
  } catch (err) {
    abort(`Não consegui ler a chave em "${path}": ${(err as Error).message}`);
  }
  if (!json.project_id) abort(`A chave em "${path}" não tem project_id.`);
  return { path: resolve(path), projectId: json.project_id };
}

const staging = loadKey("STAGING_KEY");
const prod = loadKey("PROD_KEY");
if (!staging.projectId.includes("staging")) {
  abort(`STAGING_KEY é do projeto "${staging.projectId}", que não parece staging.`);
}
if (prod.projectId.includes("staging")) {
  abort(`PROD_KEY é do projeto "${prod.projectId}", que parece staging, não produção.`);
}

const appOf = (k: { path: string; projectId: string }, name: string): App =>
  initializeApp({ credential: cert(k.path), projectId: k.projectId }, name);
const stagingApp = appOf(staging, "staging");
const prodApp = appOf(prod, "prod");
const stagingDb = getFirestore(stagingApp);
const prodDb = getFirestore(prodApp);
const prodBucketName = process.env.PROD_STORAGE_BUCKET || `${prod.projectId}.firebasestorage.app`;

// Volta atrás: regrava em produção o que a cópia de segurança guardou.
async function restore(file: string) {
  const b = JSON.parse(readFileSync(resolve(file), "utf-8")) as {
    projectId: string;
    balloons: BalloonConfig | null;
    balloonStock: Record<string, unknown> | null;
  };
  if (b.projectId !== prod.projectId) {
    abort(`A cópia é do projeto "${b.projectId}", não de "${prod.projectId}".`);
  }
  const now = (await prodDb.doc("settings/balloons").get()).data() as BalloonConfig | undefined;
  console.log(`\nRestaurar ${file} em ${prod.projectId} (${APPLY ? "GRAVANDO" : "simulação"})\n`);
  const lines = b.balloons ? describeCatalogChange(now ?? null, b.balloons) : ["(a cópia não tinha catálogo)"];
  console.log(lines.length ? lines.join("\n") : "Nenhuma mudança.");
  if (!APPLY) return console.log("\nSimulação: nada foi gravado. Rode de novo com --apply.\n");
  if (b.balloons) await prodDb.doc("settings/balloons").set(b.balloons);
  if (b.balloonStock) await prodDb.doc("settings/balloonStock").set(b.balloonStock);
  console.log("\n✔ Restaurado.\n");
}

async function main() {
  const r = process.argv.indexOf("--restore");
  if (r >= 0) {
    const file = process.argv[r + 1];
    if (!file) abort("Use: --restore backups/balloons-<data>.json");
    return restore(file);
  }
  console.log(`\nOrigem: ${staging.projectId} → destino: ${prod.projectId} (${APPLY ? "GRAVANDO" : "simulação"})\n`);

  const src = (await stagingDb.doc("settings/balloons").get()).data() as BalloonConfig | undefined;
  if (!src?.types?.length) abort("O staging não tem catálogo de balões (settings/balloons vazio).");
  const prodSnap = await prodDb.doc("settings/balloons").get();
  const current = (prodSnap.data() as BalloonConfig | undefined) ?? null;

  // Fotos: só as do Storage do staging são copiadas.
  const prodBucket = getStorage(prodApp).bucket(prodBucketName);
  const [bucketOk] = await prodBucket.exists();
  if (!bucketOk) abort(`O bucket de produção "${prodBucketName}" não existe. Defina PROD_STORAGE_BUCKET.`);
  const urlMap = new Map<string, string>();
  const toCopy: { url: string; bucket: string; path: string }[] = [];
  for (const url of catalogImageUrls(src)) {
    const ref = parseStorageUrl(url);
    if (!ref || !ref.bucket.includes("staging")) continue;
    toCopy.push({ url, ...ref });
  }

  const changes = describeCatalogChange(current, src);
  console.log(changes.length ? changes.join("\n") : "Nenhuma mudança de tipo, tamanho, preço ou cor.");
  console.log(`\nFotos a copiar para ${prodBucketName}: ${toCopy.length}`);
  if (WITH_STOCK) console.log("Estoque (settings/balloonStock) também será copiado.");

  if (!APPLY) {
    console.log("\nSimulação: nada foi gravado. Para gravar, rode de novo com --apply.\n");
    return;
  }

  // Cópia de segurança do que existe em produção.
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  mkdirSync(resolve("backups"), { recursive: true });
  const backup = {
    projectId: prod.projectId,
    savedAt: new Date().toISOString(),
    balloons: current,
    balloonStock: (await prodDb.doc("settings/balloonStock").get()).data() ?? null,
  };
  const backupPath = resolve("backups", `balloons-${stamp}.json`);
  writeFileSync(backupPath, JSON.stringify(backup, null, 2));
  console.log(`\nCópia de segurança: ${backupPath}`);

  const stagingStorage = getStorage(stagingApp);
  for (const c of toCopy) {
    // Foto já copiada antes (mesmo caminho = mesmo arquivo: o upload do
    // admin põe data no nome): reaproveita o token dela e não regrava.
    // Regravar trocaria o token e quebraria os links do catálogo vivo e
    // do backup de uma execução anterior.
    const target = prodBucket.file(c.path);
    const [exists] = await target.exists();
    let token: string | undefined;
    if (exists) {
      const [meta] = await target.getMetadata();
      token = String(meta.metadata?.firebaseStorageDownloadTokens ?? "").split(",")[0] || undefined;
    }
    if (!token) {
      const [buf] = await stagingStorage.bucket(c.bucket).file(c.path).download();
      const [meta] = await stagingStorage.bucket(c.bucket).file(c.path).getMetadata();
      token = randomUUID();
      await target.save(buf, {
        contentType: meta.contentType,
        metadata: { metadata: { firebaseStorageDownloadTokens: token } },
      });
      console.log(`  foto copiada: ${c.path}`);
    } else console.log(`  foto já existia: ${c.path}`);
    urlMap.set(c.url, downloadUrl(prodBucketName, c.path, token));
  }

  await prodDb.doc("settings/balloons").set(rewriteImageUrls(src, urlMap));
  console.log("✔ settings/balloons gravado em produção.");
  if (WITH_STOCK) {
    const stock = (await stagingDb.doc("settings/balloonStock").get()).data();
    if (stock) {
      await prodDb.doc("settings/balloonStock").set(stock);
      console.log("✔ settings/balloonStock gravado em produção.");
    }
  }
  console.log("\nPronto. Abra /baloes em produção para conferir.\n");
}

main().catch((err) => abort((err as Error).message));
