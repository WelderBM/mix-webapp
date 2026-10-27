import { ImageResponse } from "next/og";

// Capa do link compartilhado (WhatsApp, Instagram, Google): sem ela o
// WhatsApp mostrava uma prévia vazia ou a da Vercel. Gerada no build, sem
// arquivo de imagem para manter.
export const alt = "Mix Novidades: fitas, balões e presentes em Boa Vista";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 96px",
          background: "linear-gradient(135deg, #7c3aed 0%, #c026d3 100%)",
          color: "white",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <div
            style={{
              width: 128,
              height: 128,
              borderRadius: 32,
              background: "white",
              color: "#7c3aed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 88,
              fontWeight: 800,
            }}
          >
            M
          </div>
          <div style={{ fontSize: 88, fontWeight: 800 }}>Mix Novidades</div>
        </div>
        <div style={{ marginTop: 48, fontSize: 44, opacity: 0.95 }}>
          Fitas, balões e presentes em Boa Vista - RR
        </div>
        <div style={{ marginTop: 16, fontSize: 34, opacity: 0.85 }}>
          Peça online e receba em casa
        </div>
      </div>
    ),
    size,
  );
}
