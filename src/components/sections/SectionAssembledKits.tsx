"use client";

import { useKitBuilderStore } from "@/store/kitBuilderStore";
import { Product } from "@/types"; // Ajuste o import conforme seus arquivos
import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";
import { getProductImage } from "@/lib/image-utils";
import { SafeImage } from "../ui/SafeImage";

interface SectionAssembledKitsProps {
  products: Product[];
}

export function SectionAssembledKits({ products }: SectionAssembledKitsProps) {
  // CORREÇÃO: Usamos openKitBuilder no lugar de selectKit
  const { openKitBuilder } = useKitBuilderStore();

  const kits = products.filter((p) => p.type === "ASSEMBLED_KIT");

  if (kits.length === 0) return null;

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold mb-6 text-slate-800">
          Kits Prontos para Presentear
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {kits.map((kit) => (
            <div
              key={kit.id}
              className="group border rounded-2xl p-4 hover:shadow-lg transition-all"
            >
              <div className="relative aspect-square mb-4 rounded-xl overflow-hidden bg-slate-100">
                <SafeImage
                  src={kit.imageUrl}
                  alt={kit.name}
                  name={kit.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <h3 className="font-bold text-slate-900 line-clamp-1">
                {kit.name}
              </h3>
              <p className="text-sm text-slate-500 mb-3 line-clamp-2">
                {kit.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="font-bold text-lg text-primary">
                  R$ {kit.price.toFixed(2)}
                </span>

                {/* CORREÇÃO AQUI: Chamando a função correta */}
                <Button size="sm" onClick={() => openKitBuilder(kit.id)}>
                  <ShoppingBag size={16} className="mr-2" /> Ver Detalhes
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
