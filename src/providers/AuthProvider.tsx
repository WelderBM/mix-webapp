// src/providers/AuthProvider.tsx
"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initializeAuthListener = useAuthStore(
    (state) => state.initializeAuthListener
  );
  const isLoading = useAuthStore((state) => state.isLoading);

  useEffect(() => {
    // Ativa o listener do Firebase quando o componente é montado
    const unsubscribe = initializeAuthListener();

    // Cleanup: Desativa o listener quando o componente é desmontado
    return () => unsubscribe();
  }, [initializeAuthListener]);

  if (isLoading) {
    // Opcional: Mostre um spinner enquanto o Firebase verifica o estado inicial
    return <div>Carregando Autenticação...</div>;
  }

  return children;
}
