import * as Sentry from "@sentry/nextjs";
import { env } from "@/lib/env";

/**
 * Hook de instrumentação do Next.js (App Router). Roda uma vez por
 * runtime (nodejs e edge) na inicialização do servidor.
 *
 * Sem NEXT_PUBLIC_SENTRY_DSN configurado (ex.: dev local, staging sem
 * projeto Sentry criado ainda), a inicialização é um no-op silencioso —
 * nenhuma chamada de rede é feita e o app sobe normalmente.
 */
export async function register() {
  if (!env.NEXT_PUBLIC_SENTRY_DSN) {
    return;
  }

  if (process.env.NEXT_RUNTIME === "nodejs") {
    Sentry.init({
      dsn: env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: 1,
    });
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({
      dsn: env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: 1,
    });
  }
}

// Captura erros ocorridos durante o ciclo de vida de request do App Router
// (Server Components, Route Handlers, Server Actions). Quando o DSN não
// está configurado, o Sentry.init acima nunca roda e este captureException
// simplesmente não tem transporte pra enviar nada — também no-op.
export const onRequestError = Sentry.captureRequestError;
