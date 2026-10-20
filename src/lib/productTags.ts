// src/lib/productTags.ts
//
// Tags de SISTEMA (issue #68) — calculadas, nunca editáveis à mão, nunca
// gravadas como texto livre em `Product.tags`. Ficam deliberadamente
// separadas das tags manuais (que vivem em `product.tags`, selecionadas de
// `tags/{id}` no admin) pra não misturar "o que o lojista escolheu" com "o
// que o sistema deduziu" na mesma função.
import { Product } from "@/types/product";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const SYSTEM_TAG_NOVIDADES = "novidades" as const;
export const SYSTEM_TAG_PROMOCAO = "promocao" as const;

export const SYSTEM_TAGS = [
  SYSTEM_TAG_NOVIDADES,
  SYSTEM_TAG_PROMOCAO,
] as const;

export type SystemTag = (typeof SYSTEM_TAGS)[number];

// Limiar de "novidades": 30 dias corridos desde `createdAt`. Escolha
// arbitrária, documentada aqui em vez de virar mágica espalhada — alinhada
// ao ritmo comercial da loja (uma campanha/estação costuma durar semanas,
// não dias; 30 dias dá tempo do produto aparecer destacado sem o rótulo
// "novidade" grudar indefinidamente).
export const NOVIDADES_THRESHOLD_DAYS = 30;
const NOVIDADES_THRESHOLD_MS = NOVIDADES_THRESHOLD_DAYS * 24 * 60 * 60 * 1000;

// `createdAt` pode chegar como `Timestamp` do Firestore (leitura real via
// onSnapshot/getDocs — tem `.toMillis()`), `Date` (testes/serialização), ou
// `number` (epoch ms, defensivo). Qualquer outro formato — incluindo
// ausência total do campo (produto legado, confirmado em produção) — vira
// `null` aqui, nunca um valor arbitrário tipo "agora".
// Exportado pra reuso em ordenação por data (ex: `sort: "newest"` de
// StoreSection, ver src/lib/sections.ts) sem duplicar a lógica de parsing
// de Timestamp/Date/number aqui documentada.
export const toEpochMillis = (value: unknown): number | null => {
  if (value == null) return null;
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (
    typeof value === "object" &&
    typeof (value as { toMillis?: unknown }).toMillis === "function"
  ) {
    return (value as { toMillis: () => number }).toMillis();
  }
  return null;
};

// Guard explícito (AGENTS.md #5): produto sem `createdAt` reconhecível
// nunca ganha a tag `novidades` — não colapsa em `false` através de um
// `||`/coerção implícita, simplesmente não entra no cálculo (`null` é
// tratado à parte, não vira `0`/`NaN` disfarçado).
export const isNovidade = (
  product: Pick<Product, "createdAt">,
  now: Date = new Date()
): boolean => {
  const createdMs = toEpochMillis(product.createdAt);
  if (createdMs == null) return false;
  const ageMs = now.getTime() - createdMs;
  return ageMs >= 0 && ageMs <= NOVIDADES_THRESHOLD_MS;
};

// Guard explícito: NUNCA `||`/comparação implícita que colapse `0`/
// `undefined`. `originalPrice`/`price` são opcionais de propósito (ver
// types/product.ts) — só é promoção quando os dois existem E
// originalPrice > price.
export const isPromocao = (
  product: Pick<Product, "originalPrice" | "price">
): boolean =>
  product.originalPrice != null &&
  product.price != null &&
  product.originalPrice > product.price;

// Tags de sistema aplicáveis a um produto, na ordem de SYSTEM_TAGS. Nunca
// inclui tags manuais.
export const getSystemTags = (
  product: Pick<Product, "createdAt" | "originalPrice" | "price">,
  now: Date = new Date()
): SystemTag[] => {
  const tags: SystemTag[] = [];
  if (isNovidade(product, now)) tags.push(SYSTEM_TAG_NOVIDADES);
  if (isPromocao(product)) tags.push(SYSTEM_TAG_PROMOCAO);
  return tags;
};

export const isSystemTag = (tag: string): tag is SystemTag =>
  (SYSTEM_TAGS as readonly string[]).includes(tag);

// Tags manuais + tags de sistema combinadas, pra qualquer consumidor que
// precise do conjunto completo pra exibição/filtro (ex: badge de vitrine).
// Guard explícito em `product.tags` ausente (produto sem nenhuma tag
// manual, caso normal hoje) — vira lista vazia, não erro.
export const getAllProductTags = (
  product: Pick<Product, "tags" | "createdAt" | "originalPrice" | "price">,
  now: Date = new Date()
): string[] => {
  const manual = product.tags ?? [];
  return [...manual, ...getSystemTags(product, now)];
};

// Consulta produtos com `tagName` no array `tags` (Firestore
// array-contains). Cobre só tags MANUAIS — tags de sistema nunca são
// gravadas no documento, então nunca aparecem aqui (filtre por elas em
// memória com getSystemTags, depois de buscar os produtos).
export const queryProductsByTag = async (
  tagName: string
): Promise<Product[]> => {
  const snap = await getDocs(
    query(
      collection(db, "products"),
      where("tags", "array-contains", tagName)
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
};
