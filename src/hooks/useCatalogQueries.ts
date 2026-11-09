"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  documentId,
  getDocs,
  limit,
  query,
  where,
  type QueryConstraint,
  type QuerySnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useProductStore } from "@/store/productStore";
import { filterProductsByCategory } from "@/lib/categories";
import { resolveRecentlyViewedProducts } from "@/lib/recentlyViewed";
import type { Product } from "@/types";

// Recortes do catálogo sem baixar a coleção inteira (#399). Se a store já
// tem o catálogo (o visitante veio da home), filtra em memória e não lê
// nada; senão, lê só o recorte. Kit fica de fora da leitura recortada: se
// ele está à venda depende da receita, que só a store completa avalia.

const toProducts = (snap: QuerySnapshot): Product[] =>
  snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Product)
    .filter((p) => !p.disabled && p.type !== "ASSEMBLED_KIT");

const byCategory = (category: string, subcategory?: string): QueryConstraint[] => [
  where("category", "==", category),
  ...(subcategory ? [where("subcategory", "==", subcategory)] : []),
];

// `in` do Firestore aceita até 30 valores; o histórico guarda 10.
const IN_LIMIT = 30;

export function useCategoryProducts(categoryName: string | null) {
  const allProducts = useProductStore((s) => s.allProducts);
  const hasCatalog = allProducts.length > 0;
  const [loaded, setLoaded] = useState<{ key: string; products: Product[] } | null>(
    null
  );

  useEffect(() => {
    if (hasCatalog || !categoryName) return;
    let alive = true;
    (async () =>
      toProducts(await getDocs(query(collection(db, "products"), ...byCategory(categoryName)))))()
      .then((products) => alive && setLoaded({ key: categoryName, products }))
      .catch(() => alive && setLoaded({ key: categoryName, products: [] }));
    return () => {
      alive = false;
    };
  }, [hasCatalog, categoryName]);

  if (hasCatalog) return { products: allProducts, loading: false };
  const ready = loaded?.key === categoryName;
  return { products: ready ? loaded.products : [], loading: !!categoryName && !ready };
}

export function useProductNeighbors(
  product: Product,
  recentIds: string[],
  relatedLimit: number
) {
  const allProducts = useProductStore((s) => s.allProducts);
  const hasCatalog = allProducts.length > 0;
  const otherIds = recentIds.filter((id) => id !== product.id).slice(0, IN_LIMIT);
  const key = [product.id, product.category, product.subcategory, ...otherIds].join("|");
  const [loaded, setLoaded] = useState<{
    key: string;
    related: Product[];
    recent: Product[];
  } | null>(null);

  useEffect(() => {
    if (hasCatalog) return;
    let alive = true;
    // async: erro ao montar a consulta também cai no catch
    const load = async () => {
      const products = collection(db, "products");
      const related = product.category
        ? getDocs(
            query(
              products,
              ...byCategory(product.category, product.subcategory),
              // +4: o próprio produto e algum desativado não deixam faltar
              limit(relatedLimit + 4)
            )
          ).then(toProducts)
        : Promise.resolve([]);
      const recent = otherIds.length
        ? getDocs(query(products, where(documentId(), "in", otherIds))).then(toProducts)
        : Promise.resolve([]);
      return Promise.all([related, recent]);
    };
    load()
      .then(([r, v]) => alive && setLoaded({ key, related: r, recent: v }))
      .catch(() => alive && setLoaded({ key, related: [], recent: [] }));
    return () => {
      alive = false;
    };
    // `key` resume produto, categoria e histórico
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasCatalog, key]);

  const source = hasCatalog ? null : loaded?.key === key ? loaded : null;

  const recentlyViewedProducts = useMemo(
    () =>
      resolveRecentlyViewedProducts(
        recentIds,
        hasCatalog ? allProducts : (source?.recent ?? []),
        product.id
      ),
    [recentIds, hasCatalog, allProducts, source, product.id]
  );

  const relatedProducts = useMemo(() => {
    if (!product.category) return [];
    return filterProductsByCategory(
      hasCatalog ? allProducts : (source?.related ?? []),
      product.category,
      product.subcategory
    )
      .filter((p) => p.id !== product.id)
      .slice(0, relatedLimit);
  }, [hasCatalog, allProducts, source, product, relatedLimit]);

  return { relatedProducts, recentlyViewedProducts };
}
