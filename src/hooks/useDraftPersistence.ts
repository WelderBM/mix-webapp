"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseDraftPersistenceOptions {
  debounceMs?: number;
  // Controla quando o hook começa a gravar. Comece com `false` até decidir
  // o que fazer com um rascunho existente (restaurar ou descartar) — senão
  // o auto-save grava o estado em branco por cima do rascunho antes do
  // usuário conseguir responder ao prompt de restauração.
  enabled?: boolean;
}

interface UseDraftPersistenceResult<T> {
  hasDraft: boolean;
  restoreDraft: () => T | null;
  clearDraft: () => void;
}

const DEFAULT_DEBOUNCE_MS = 800;

function safeStringify(value: unknown): string | null {
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}

export function useDraftPersistence<T>(
  key: string,
  value: T,
  { debounceMs = DEFAULT_DEBOUNCE_MS, enabled = true }: UseDraftPersistenceOptions = {}
): UseDraftPersistenceResult<T> {
  const storageKey = `draft:${key}`;
  const [hasDraft, setHasDraft] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Último conteúdo conhecido como "limpo" (igual ao que está salvo/veio do
  // servidor), comparado por JSON — não por referência. onSnapshot recria
  // os objetos a cada disparo, inclusive ecos do próprio save local (um com
  // a escrita otimista, outro com a confirmação do servidor), então
  // comparar só a referência faz esses ecos parecerem edição nova e
  // regrava um rascunho logo depois de "Salvar Configurações" ter acabado
  // de limpar o anterior. Comparando o conteúdo, qualquer eco com o mesmo
  // JSON é ignorado; só uma mudança de conteúdo de verdade vira rascunho.
  const cleanSnapshotRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setHasDraft(window.localStorage.getItem(storageKey) !== null);
  }, [storageKey]);

  // Assim que liga (primeiro load real ou reabilitação após salvar/
  // descartar), o valor atual vira a nova baseline "limpa" — evita tratar
  // o próprio assentamento de estado como uma edição.
  useEffect(() => {
    cleanSnapshotRef.current = safeStringify(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, storageKey]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    const serialized = safeStringify(value);
    if (serialized === null || serialized === cleanSnapshotRef.current) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      try {
        window.localStorage.setItem(storageKey, serialized);
      } catch {
        // Quota do localStorage cheia ou valor não serializável — rascunho
        // é conveniência, não pode derrubar o formulário por causa disso.
      }
    }, debounceMs);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [value, storageKey, debounceMs, enabled]);

  const restoreDraft = useCallback((): T | null => {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }, [storageKey]);

  const clearDraft = useCallback(() => {
    if (typeof window === "undefined") return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    window.localStorage.removeItem(storageKey);
    setHasDraft(false);
    // O valor atual (ex: recém salvo no Firestore) vira a nova baseline —
    // ecos do onSnapshot pós-save não podem reviver um rascunho já limpo.
    cleanSnapshotRef.current = safeStringify(value);
  }, [storageKey, value]);

  return { hasDraft, restoreDraft, clearDraft };
}
