"use client";

import { StoreSection, AssembledKitProduct } from "@/types";
import { ProductCard } from "@/components/features/ProductCard";
import { useKitBuilderStore } from "@/store/kitBuilderStore";

interface SectionAssembledKitsProps {
  section: StoreSection;
  assembledKits: AssembledKitProduct[]; // Recebe apenas os kits
}

export const SectionAssembledKits = ({
  section,
  assembledKits,
}: SectionAssembledKitsProps) => {
  const { openKitBuilder, selectKit } = useKitBuilderStore();

  // Filtra os kits que pertencem a esta seção (pelos IDs configurados no Admin)
  const displayKits = section.productIds
    .map((id) => assembledKits.find((k) => k.id === id))
    .filter((k): k is AssembledKitProduct => k !== undefined);

  if (displayKits.length === 0) return null;

  const handleKitClick = (kit: AssembledKitProduct) => {
    // Ao clicar num kit pronto, abrimos o builder já "hidratado" com esse kit
    // Isso permite que a pessoa veja o kit e compre, ou faça pequenas alterações
    selectKit(kit.id);
    openKitBuilder();
  };

  return (
    <div className="py-8 bg-white/50 rounded-xl my-6">
      <div className="flex items-center justify-between mb-6 px-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            🎁 {section.title || "Nossas Sugestões Prontas"}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Kits montados com carinho, prontos para presentear
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-4">
        {displayKits.map((kit) => (
          <div key={kit.id} className="relative group">
            {/* Badge Exclusivo desta Vitrine */}
            <div className="absolute -top-2 -left-2 z-10 bg-purple-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
              PRONTO PARA ENVIO
            </div>

            <ProductCard
              product={kit}
              actionLabel="Ver Detalhes"
              onSelect={() => handleKitClick(kit)}
              // Oculta o botão padrão de adicionar, pois queremos abrir o modal
            />
          </div>
        ))}
      </div>
    </div>
  );
};
