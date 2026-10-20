import { Metadata } from "next";
import { BackButton } from "@/components/ui/BackButton";

// UI preservada do antigo estado `!product` do client component (issue #111
// — antes disso o "produto não encontrado" era um branch dentro do próprio
// componente cliente; agora page.tsx chama `notFound()` do Next.js, que
// renderiza este boundary da rota).
//
// Metadata própria é necessária aqui: quando `notFound()` é chamado dentro
// de page.tsx, o Next.js descarta o retorno de `generateMetadata` daquele
// segmento e usa a metadata deste boundary (ou a genérica do root layout, se
// esta não existisse) — o branch "produto não encontrado" dentro de
// `generateMetadata` em page.tsx nunca chega a ser exibido, só serve de
// defesa caso o comportamento do framework mude.
export const metadata: Metadata = {
  title: "Produto não encontrado",
  description: "Este produto não está mais disponível na Mix Novidades.",
};

export default function ProductNotFound() {
  return (
    <div className="h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold text-slate-800">
        Produto não encontrado 😕
      </h1>
      <BackButton variant="outline" />
    </div>
  );
}
