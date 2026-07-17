import type { NextConfig } from "next";

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

export default nextConfig;
