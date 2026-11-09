// Endereço público da loja, sem barra no fim. Base de canônicos, sitemap,
// robots e JSON-LD. O fallback é o domínio de produção: um fallback errado
// (mixnovidades.com.br, que não existe) já tirou /natura e /baloes-boa-vista
// do Google pelo canônico (#400).
export const SITE_URL = (
  process.env.NEXT_PUBLIC_BASE_URL || "https://www.mixnovidades.com"
).replace(/\/+$/, "");
