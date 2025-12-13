"use client";

import { Gift, Plus, Sparkles } from "lucide-react";
import { openKitBuilder } from "./KitBuilderModal";

export function BuilderTrigger() {
  return (
    <div
      onClick={() => openKitBuilder()}
      // UNIFICADO: Fundo Neutro (Slate-50)
      className="relative w-full h-full min-h-[180px] rounded-3xl overflow-hidden shadow-sm cursor-pointer group transition-all hover:shadow-xl hover:scale-[1.02] border border-slate-200 bg-slate-50"
    >
      <div className="absolute top-[-40%] right-[-20%] w-64 h-64 bg-white rounded-full opacity-80 blur-3xl" />
      <div className="absolute bottom-[-20%] left-[-10%] w-40 h-40 bg-white rounded-full opacity-60 blur-2xl" />

      <div className="relative z-10 h-full p-8 flex flex-col justify-between">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full text-slate-600 text-xs font-bold border border-white/50 shadow-sm w-fit">
            <Gift size={12} />
            <span>Presente Personalizado</span>
          </div>

          <h3 className="text-3xl font-serif font-bold text-slate-900 leading-tight tracking-tight">
            Monte seu Kit
          </h3>

          <p className="text-slate-500 text-sm font-medium max-w-[200px] leading-relaxed">
            Escolha a base e os itens. <br /> Nós montamos com carinho.
          </p>
        </div>

        {/* UNIFICADO: Botão Preto Neutro */}
        <div className="flex items-center gap-3 mt-2 group/btn">
          <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
            <Plus size={18} />
          </div>
          <span className="text-slate-900 font-bold text-sm group-hover:underline underline-offset-4 decoration-2 transition-all">
            Começar Agora
          </span>
        </div>
      </div>

      <div className="absolute bottom-6 right-6 text-slate-200 group-hover:text-slate-300 transition-colors duration-500 rotate-[-10deg]">
        <Gift size={100} strokeWidth={1} />
      </div>
    </div>
  );
}
