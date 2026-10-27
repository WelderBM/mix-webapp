import { balloonColor } from "./balloons";

// Arte de rolo de fita (#259): sem foto, cada cor da linha ganha um rolo
// desenhado na cor lida do nome (mesma tabela de cores dos balões). Estampa
// sem cor reconhecível vira um rolo neutro listrado. Aparece na loja e no
// montador de laço. Convertida em WebP no aparelho (renderBalloonImage).

export function ribbonSvg(name: string, caption: string): string {
  const { colors } = balloonColor(name);
  const known = colors.length > 0;
  const c = known ? colors : ["#cbd5e1", "#e2e8f0"];
  const stops = c
    .map((col, i) => `<stop offset="${Math.round((i / Math.max(1, c.length - 1)) * 100)}%" stop-color="${col}"/>`)
    .join("");
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="r" x1="0" y1="0" x2="1" y2="1">${stops}</linearGradient>
    <radialGradient id="sheen" cx="0.35" cy="0.3" r="0.8">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.55"/>
      <stop offset="60%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="512" height="512" fill="#ffffff"/>
  <circle cx="256" cy="236" r="190" fill="url(#r)" stroke="#94a3b8" stroke-width="3"/>
  ${[160, 130, 100].map((r) => `<circle cx="256" cy="236" r="${r}" fill="none" stroke="#ffffff" stroke-opacity="0.35" stroke-width="2"/>`).join("")}
  ${known ? "" : `<path d="M90 236 H422" stroke="#94a3b8" stroke-width="10" stroke-dasharray="18 14" opacity="0.6"/>`}
  <circle cx="256" cy="236" r="190" fill="url(#sheen)"/>
  <circle cx="256" cy="236" r="62" fill="#f8fafc" stroke="#94a3b8" stroke-width="3"/>
  <circle cx="256" cy="236" r="40" fill="#e2e8f0"/>
  <text x="256" y="486" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="26" fill="#475569">${esc(caption)}</text>
</svg>`;
}
