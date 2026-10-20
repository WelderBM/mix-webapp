"use client";

import dynamic from "next/dynamic";

// `ssr: false` só é permitido dentro de um Client Component — src/app/layout.tsx
// é um Server Component, então o dynamic() precisa morar aqui. O layout importa
// este wrapper normalmente; é este arquivo que mantém o KitBuilderModal fora
// do chunk principal do layout raiz (issue #112).
const KitBuilderModal = dynamic(
  () =>
    import("@/components/features/KitBuilderModal").then(
      (mod) => mod.KitBuilderModal
    ),
  { ssr: false }
);

export function KitBuilderModalLoader() {
  return <KitBuilderModal />;
}
