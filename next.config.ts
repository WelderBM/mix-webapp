import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Permite testar o dev server pelo celular na mesma rede (ex: pra
  // validar o gesto nativo de "voltar" em vez de só no navegador do PC).
  allowedDevOrigins: ["192.168.1.28"],
  images: {
    dangerouslyAllowSVG: true,
    remotePatterns: [
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "firebasestorage.googleapis.com" }, // Para o futuro
    ],
  },
};

// withSentryConfig instrumenta o build (upload de source maps, tunneling
// de erros client-side) — funciona como no-op de config normal quando
// SENTRY_AUTH_TOKEN não está setado (build local/CI sem projeto Sentry
// ainda configurado): o upload de source map é pulado, o resto do build
// segue normal. org/project/authToken reais só existem na Vercel (#82).
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  widenClientFileUpload: true,
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
});
