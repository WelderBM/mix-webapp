import type { BalloonInfo } from "./balloons";

// Arte gerada para balão sem foto (#236): SVG desenhado a partir dos
// atributos (formato, cor, letra/número), convertido em WebP no próprio
// aparelho e enviado como uma foto comum. Grátis, igual para todos os
// balões do mesmo tipo e no tamanho certo. Temático continua com foto.

const S = 512;

function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v + amt * 255)));
  const r = c((n >> 16) & 255);
  const g = c((n >> 8) & 255);
  const b = c(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Preenchimento: degradê de brilho (metalizado mais marcado) ou faixas
// de arco-íris/sortido.
function fillDefs(id: string, info: BalloonInfo): string {
  if (info.colors.length > 1) {
    const step = 100 / (info.colors.length - 1);
    const stops = info.colors
      .map((c, i) => `<stop offset="${(i * step).toFixed(0)}%" stop-color="${c}"/>`)
      .join("");
    // Letra/número arco-íris: faixas de cima para baixo, como o foil real,
    // medidas na altura da letra desenhada (a caixa do texto é mais alta
    // que a letra e cortaria o rosa e o azul das pontas).
    const vertical = info.shape === "letra" || info.shape === "numero";
    const axis = vertical
      ? 'gradientUnits="userSpaceOnUse" x1="0" y1="130" x2="0" y2="395"'
      : 'x1="0" y1="0" x2="1" y2="1"';
    return `<linearGradient id="${id}" ${axis}>${stops}</linearGradient>`;
  }
  const c = info.colors[0];
  return info.metallic
    ? `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
         <stop offset="0%" stop-color="${shade(c, 0.28)}"/>
         <stop offset="45%" stop-color="${c}"/>
         <stop offset="55%" stop-color="${shade(c, 0.18)}"/>
         <stop offset="100%" stop-color="${shade(c, -0.22)}"/>
       </linearGradient>`
    : `<radialGradient id="${id}" cx="0.35" cy="0.3" r="0.75">
         <stop offset="0%" stop-color="${shade(c, 0.3)}"/>
         <stop offset="70%" stop-color="${c}"/>
         <stop offset="100%" stop-color="${shade(c, -0.18)}"/>
       </radialGradient>`;
}

// Balão de látex (gota + nó + fio), centrado em (cx, cy), raio r.
function latex(cx: number, cy: number, r: number, fill: string, stroke: string): string {
  const h = r * 1.18;
  return `
    <path d="M ${cx} ${cy + h} C ${cx - r * 1.25} ${cy + h * 0.55}, ${cx - r * 1.1} ${cy - h}, ${cx} ${cy - h}
             C ${cx + r * 1.1} ${cy - h}, ${cx + r * 1.25} ${cy + h * 0.55}, ${cx} ${cy + h} Z"
          fill="${fill}" stroke="${stroke}" stroke-width="3"/>
    <path d="M ${cx - 9} ${cy + h + 14} L ${cx} ${cy + h - 2} L ${cx + 9} ${cy + h + 14} Z" fill="${stroke}"/>
    <path d="M ${cx} ${cy + h + 14} q 16 34 -5 66 q -14 22 4 44" fill="none" stroke="#94a3b8" stroke-width="2.5"/>
    <ellipse cx="${cx - r * 0.38}" cy="${cy - h * 0.45}" rx="${r * 0.16}" ry="${r * 0.3}"
             fill="#ffffff" opacity="0.45" transform="rotate(-25 ${cx - r * 0.38} ${cy - h * 0.45})"/>`;
}

function heart(fill: string, stroke: string): string {
  return `<path d="M256 430 C 120 330, 60 250, 90 170 C 115 105, 205 95, 256 165
                   C 307 95, 397 105, 422 170 C 452 250, 392 330, 256 430 Z"
                fill="${fill}" stroke="${stroke}" stroke-width="4"/>
          <ellipse cx="160" cy="180" rx="26" ry="44" fill="#fff" opacity="0.4" transform="rotate(-35 160 180)"/>`;
}

function star(fill: string, stroke: string): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? 185 : 82;
    pts.push(`${(256 + rr * Math.cos(a)).toFixed(1)},${(262 + rr * Math.sin(a)).toFixed(1)}`);
  }
  return `<polygon points="${pts.join(" ")}" fill="${fill}" stroke="${stroke}" stroke-width="4" stroke-linejoin="round"/>
          <ellipse cx="205" cy="200" rx="18" ry="34" fill="#fff" opacity="0.4" transform="rotate(-30 205 200)"/>`;
}

// Relevo do foil (#343): a luz bate no alto-esquerdo de um corpo estufado.
// O desfoque da silhueta vira um "volume"; a luz difusa escurece a borda
// do lado da sombra e a especular põe o brilho metálico.
function puffFilter(id: string): string {
  return `<filter id="${id}" x="-15%" y="-15%" width="130%" height="130%" color-interpolation-filters="sRGB">
    <feGaussianBlur in="SourceAlpha" stdDeviation="9" result="b"/>
    <feDiffuseLighting in="b" surfaceScale="6" diffuseConstant="1.15" lighting-color="#ffffff" result="d">
      <feDistantLight azimuth="225" elevation="55"/>
    </feDiffuseLighting>
    <feSpecularLighting in="b" surfaceScale="6" specularConstant="0.95" specularExponent="32" lighting-color="#ffffff" result="s">
      <feDistantLight azimuth="225" elevation="55"/>
    </feSpecularLighting>
    <feComposite in="SourceGraphic" in2="d" operator="arithmetic" k1="0.98" k2="0" k3="0" k4="0" result="lit"/>
    <feComposite in="s" in2="SourceAlpha" operator="in" result="shine"/>
    <feComposite in="lit" in2="shine" operator="arithmetic" k1="0" k2="1" k3="0.45" k4="0" result="out"/>
    <feComposite in="out" in2="SourceAlpha" operator="in"/>
  </filter>`;
}

// Letra/número foil o mais perto do real (#343): contorno grosso e
// arredondado (balão estufado), costura serrilhada na borda e o corpo com
// relevo de luz. Fonte pesada com traço largo = cantos redondos.
function glyph(text: string, fill: string, stroke: string, puffId: string): string {
  const t = (attrs: string) => `<text x="256" y="262" text-anchor="middle" dominant-baseline="middle"
                font-family="Arial, Helvetica, sans-serif" font-weight="700"
                font-size="${text.length > 1 ? 240 : 340}" stroke-linejoin="round" stroke-linecap="round"
                ${attrs}>${esc(text)}</text>`;
  return [
    // Borda da costura (mais escura).
    t(`fill="${stroke}" stroke="${stroke}" stroke-width="24"`),
    // Serrilhado da costura: pontinhos claros ao longo da borda.
    t(`fill="none" stroke="#ffffff" stroke-width="20" stroke-dasharray="2 7" opacity="0.4"`),
    // Corpo estufado na cor, com relevo.
    t(`fill="${fill}" stroke="${fill}" stroke-width="12" filter="url(#${puffId})"`),
  ].join("");
}

export function balloonSvg(
  info: BalloonInfo,
  glyphOverride?: string,
  // Montador da loja: sem legenda e com fundo transparente (vai dentro do
  // cartão, que já tem fundo e texto).
  // tight: os 3 balões do buquê bem juntos e sobrepostos (cor "Sortido",
  // relatório 27/10), para mostrar a mistura de cores.
  opts: { caption?: boolean; background?: boolean; tight?: boolean } = {},
): string {
  const showCaption = opts.caption !== false;
  const showBackground = opts.background !== false;
  const base = info.colors[0];
  const stroke = info.colors.length > 1 ? "#64748b" : shade(base, -0.3);
  // id único por arte: várias artes na mesma página não dividem degradê.
  const id = `b${info.shape}${info.colors.join("").replace(/#/g, "")}`;
  const fill = `url(#${id})`;
  let body: string;
  let extraDefs = "";
  switch (info.shape) {
    case "letra":
    case "numero":
      body = glyph(glyphOverride ?? info.glyph ?? "A", fill, stroke, `${id}-puff`);
      extraDefs = puffFilter(`${id}-puff`);
      break;
    case "coracao":
      body = heart(fill, stroke);
      break;
    case "estrela":
      body = star(fill, stroke);
      break;
    case "redondo":
      body = `<circle cx="256" cy="250" r="170" fill="${fill}" stroke="${stroke}" stroke-width="4"/>
              <ellipse cx="190" cy="180" rx="26" ry="48" fill="#fff" opacity="0.4" transform="rotate(-35 190 180)"/>`;
      break;
    default:
      // Látex: pacote vira um buquê de 3; unidade, um balão.
      if (info.colors.length > 1) {
        // Sortido/arco-íris: cada balão do buquê numa cor.
        const ids = [0, 1, 2].map((k) => `${id}-${k}`);
        extraDefs = ids
          .map((gid, k) =>
            fillDefs(gid, { ...info, colors: [info.colors[k % info.colors.length]] }),
          )
          .join("");
        const [a, b, c] = ids.map((gid) => `url(#${gid})`);
        // Agrupado: o de cima atrás, os dois da frente se cobrindo.
        body = opts.tight
          ? latex(256, 165, 104, c, "#64748b") +
            latex(196, 228, 98, a, "#64748b") +
            latex(316, 232, 98, b, "#64748b")
          : latex(170, 215, 82, a, "#64748b") +
            latex(342, 215, 82, b, "#64748b") +
            latex(256, 175, 92, c, "#64748b");
        break;
      }
      body = info.packQty && info.packQty > 1
        ? latex(170, 215, 82, fill, stroke) + latex(342, 215, 82, fill, stroke) + latex(256, 175, 92, fill, stroke)
        : latex(256, 200, 120, fill, stroke);
  }
  const caption = [
    info.packQty && info.packQty > 1 ? `Pacote c/ ${info.packQty}` : null,
    info.sizeLabel,
  ]
    .filter(Boolean)
    .join(" · ");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
  <defs>${fillDefs(id, info)}${extraDefs}</defs>
  ${showBackground ? `<rect width="${S}" height="${S}" fill="#ffffff"/>` : ""}
  ${body}
  ${showCaption && caption ? `<text x="256" y="490" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="26" fill="#475569">${esc(caption)}</text>` : ""}
</svg>`;
}

// SVG → WebP (JPEG se o aparelho não gerar WebP), no navegador.
export async function renderBalloonImage(svg: string, size = 800): Promise<Blob> {
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  try {
    const img = new Image();
    img.decoding = "async";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Não foi possível desenhar a arte do balão."));
      img.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas indisponível.");
    ctx.drawImage(img, 0, 0, size, size);
    const toBlob = (type: string) =>
      new Promise<Blob | null>((r) => canvas.toBlob(r, type, 0.85));
    const webp = await toBlob("image/webp");
    if (webp && webp.type === "image/webp") return webp;
    const jpeg = await toBlob("image/jpeg");
    if (!jpeg) throw new Error("Não foi possível gerar a imagem.");
    return jpeg;
  } finally {
    URL.revokeObjectURL(url);
  }
}
