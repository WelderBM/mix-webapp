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

export function useDraftPersistence<T>(
  key: string,
  value: T,
  { debounceMs = DEFAULT_DEBOUNCE_MS, enabled = true }: UseDraftPersistenceOptions = {}
): UseDraftPersistenceResult<T> {
  const storageKey = `draft:${key}`;
  const [hasDraft, setHasDraft] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setHasDraft(window.localStorage.getItem(storageKey) !== null);
  }, [storageKey]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(value));
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
  }, [storageKey]);

  return { hasDraft, restoreDraft, clearDraft };
}
