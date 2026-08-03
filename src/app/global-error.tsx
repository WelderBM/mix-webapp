"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

/**
 * Error boundary de topo do App Router. Substitui o layout raiz inteiro
 * quando um erro não tratado escapa até aqui — por isso precisa dos
 * próprios <html>/<body>.
 *
 * `Sentry.captureException` é seguro de chamar mesmo sem DSN configurado
 * (o SDK não foi inicializado em instrumentation-client.ts nesse caso e a
 * chamada vira no-op, sem lançar nem travar a renderização do fallback).
 */
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body>
        <div
          style={{
            display: "flex",
            minHeight: "100vh",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.75rem",
            padding: "2rem",
            textAlign: "center",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>
            Algo deu errado
          </h1>
          <p style={{ color: "#666" }}>
            Já fomos notificados e vamos corrigir. Tente recarregar a
            página.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: "0.5rem",
              padding: "0.5rem 1.25rem",
              borderRadius: "0.5rem",
              border: "1px solid #ccc",
              cursor: "pointer",
              background: "transparent",
            }}
          >
            Recarregar
          </button>
        </div>
      </body>
    </html>
  );
}
