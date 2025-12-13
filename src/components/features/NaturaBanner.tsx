"use client";

import { Leaf, Sparkles } from "lucide-react";

interface NaturaBannerProps {
  onClick?: () => void;
}

export function NaturaBanner({ onClick }: NaturaBannerProps) {
  return (
    <div
      onClick={onClick}
      // UNIFICADO: Fundo Neutro (Slate-50)
      className="relative w-full h-full min-h-[180px] rounded-3xl overflow-hidden shadow-sm cursor-pointer group transition-all hover:shadow-xl hover:scale-[1.02] border border-slate-200 bg-slate-50"
    >
      <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-slate-200 rounded-full blur-3xl opacity-30" />
      <div className="absolute bottom-[-10%] left-[-10%] w-32 h-32 bg-slate-200 rounded-full blur-2xl opacity-30" />

      <div className="relative z-10 h-full p-8 flex flex-col justify-center items-center text-center">
        <div className="mb-3 p-2 rounded-full bg-white/60 backdrop-blur-sm border border-slate-100 shadow-sm group-hover:scale-110 transition-transform duration-500">
          <Leaf size={24} className="text-slate-600" />
        </div>

        <h3 className="text-2xl font-serif font-bold text-slate-900 mb-2 tracking-tight">
          Universo Natura
        </h3>

        <p className="text-slate-500 text-sm max-w-[260px] mx-auto leading-relaxed font-medium">
          Perfumaria, corpo e banho. Essência do Brasil.
        </p>

        {/* UNIFICADO: Botão Preto */}
        <div className="mt-6 inline-flex items-center gap-2 text-slate-900 text-xs font-bold uppercase tracking-widest border-b border-slate-300 pb-1 group-hover:border-slate-900 transition-all">
          <Sparkles size={12} />
          <span>Explorar Coleção</span>
        </div>
      </div>
    </div>
  );
}
