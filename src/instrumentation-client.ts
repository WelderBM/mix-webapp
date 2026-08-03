import * as Sentry from "@sentry/nextjs";
import { env } from "@/lib/env";

/**
 * Inicialização do Sentry no cliente (browser). O Next.js carrega este
 * arquivo automaticamente antes do resto da aplicação hidratar, desde
 * que ele exista na raiz de `src/`.
 *
 * Sem NEXT_PUBLIC_SENTRY_DSN configurado, `Sentry.init` nunca é chamado —
 * no-op silencioso, sem impacto no bundle carregado em runtime além do
 * SDK em si (que não abre conexão nenhuma sem DSN).
 */
if (env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 1,
    // Substitui e capturas de replay não são necessárias pro objetivo da
    // #82 (visibilidade de erro com stack trace); manter desligado evita
    // custo de banda/armazenamento sem uso real ainda.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
