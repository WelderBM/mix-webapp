"use client";

import { PartyPopper, Sparkles } from "lucide-react";
import Link from "next/link";

export function BalloonBuilderTrigger() {
  return (
    <Link href="/baloes" className="block h-full">
      <div className="relative w-full h-full min-h-[180px] rounded-3xl overflow-hidden shadow-sm cursor-pointer group transition-all hover:shadow-xl hover:scale-[1.02] border border-slate-200 bg-slate-50">
        <div className="absolute top-[-30%] right-[-10%] w-60 h-60 bg-purple-100 rounded-full opacity-50 blur-3xl animate-pulse" />
        <div className="absolute bottom-[-20%] left-[-10%] w-40 h-40 bg-pink-100 rounded-full opacity-40 blur-2xl" />

        <div className="relative z-10 h-full p-8 flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full text-slate-600 text-xs font-bold border border-white/50 shadow-sm mb-3">
              <Sparkles size={12} className="text-purple-500" />
              <span>Personalize</span>
            </div>

            <h3 className="text-2xl font-bold text-slate-900 leading-tight">
              Balões <br /> Personalizados
            </h3>

            <p className="text-slate-500 text-sm mt-2 max-w-[220px] leading-relaxed">
              Bubble, Metalizado e Látex.
              <br /> Do seu jeito.
            </p>
          </div>

          <div className="flex items-center gap-2 mt-4 group-hover:translate-x-2 transition-transform">
            <span className="text-slate-900 font-bold underline decoration-2 underline-offset-4 decoration-slate-300 group-hover:decoration-purple-500 transition-all">
              Montar Agora
            </span>
          </div>
        </div>

        <div className="absolute top-1/2 -translate-y-1/2 right-6 text-slate-200 group-hover:text-slate-300 transition-colors rotate-12">
          <PartyPopper size={90} strokeWidth={1} />
        </div>
      </div>
    </Link>
  );
}
