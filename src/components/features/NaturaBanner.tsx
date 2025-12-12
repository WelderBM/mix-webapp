"use client";

import { ArrowRight, Droplets, Sparkles } from "lucide-react";

interface NaturaBannerProps {
  onClick: () => void;
}

export function NaturaBanner({ onClick }: NaturaBannerProps) {
  return (
    // REMOVIDO O DIV WRAPPER EXTERNO QUE TINHA 'max-w-6xl...'
    <div
      onClick={onClick}
      // ADICIONADO: 'h-full' para esticar a altura
      // ADICIONADO: 'flex flex-col justify-center' para garantir que o conteúdo fique no meio verticalmente se o outro banner for mais alto
      className="relative h-full flex flex-col justify-center overflow-hidden bg-gradient-to-r from-orange-100 to-rose-100 p-6 rounded-2xl shadow-sm border border-orange-200 cursor-pointer group hover:shadow-md transition-all"
    >
      {/* Elementos Decorativos de Fundo */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-orange-200 rounded-full opacity-50 blur-2xl group-hover:scale-150 transition-transform duration-700" />
      <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-20 h-20 bg-rose-200 rounded-full opacity-50 blur-2xl group-hover:scale-150 transition-transform duration-700" />

      <div className="relative flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <div className="bg-white/80 p-3 rounded-xl text-orange-600 shadow-sm group-hover:scale-110 transition-transform">
            <Droplets size={24} className="fill-orange-100" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-orange-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Destaque
              </span>
              <Sparkles size={14} className="text-orange-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 group-hover:text-orange-700 transition-colors">
              Festival de Hidratação
            </h3>
            <p className="text-sm text-slate-600">
              Linha completa Natura TodoDia, Ekos e mais.
            </p>
          </div>
        </div>

        <div className="bg-white/50 p-2 rounded-full group-hover:bg-white group-hover:text-orange-600 transition-all">
          <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-orange-600" />
        </div>
      </div>
    </div>
  );
}
