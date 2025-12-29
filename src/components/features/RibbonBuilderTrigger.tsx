"use client";

import { Scissors, Ruler, Grip } from "lucide-react";
import Link from "next/link";

export function RibbonBuilderTrigger() {
  return (
    <Link href="/fitas" className="block h-full">
      {/* UNIFICADO: Fundo Neutro (Slate-50) */}
      <div className="relative w-full h-full min-h-[180px] rounded-3xl overflow-hidden shadow-sm cursor-pointer group transition-all hover:shadow-xl hover:scale-[1.02] border border-slate-200 bg-slate-50">
        <div className="absolute top-[-30%] right-[-10%] w-60 h-60 bg-purple-100 rounded-full opacity-0 blur-3xl group-hover:opacity-60 transition-opacity duration-500" />
        <div className="absolute bottom-[-20%] left-[-10%] w-40 h-40 bg-pink-100 rounded-full opacity-0 blur-2xl group-hover:opacity-50 transition-opacity duration-500" />

        <div
          className="absolute inset-0 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity"
          style={{
            backgroundImage:
              "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />

        <div className="relative z-10 h-full p-8 flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full text-slate-600 text-xs font-bold border border-white/50 shadow-sm mb-3">
              <Grip
                size={12}
                className="group-hover:text-purple-500 transition-colors"
              />
              <span>Armarinho</span>
            </div>

            <h3 className="text-2xl font-bold text-slate-900 leading-tight">
              Central de Fitas
            </h3>

            <p className="text-slate-500 text-sm mt-2 max-w-[220px] leading-relaxed">
              Cetim, gorgurão e decorativas. <br /> Rolos ou metro.
            </p>
          </div>

          {/* UNIFICADO: Texto Preto */}
          <div className="flex items-center gap-2 mt-4 group-hover:translate-x-2 transition-transform">
            <span className="text-slate-900 font-bold underline decoration-2 underline-offset-4 decoration-slate-300 group-hover:decoration-purple-500 transition-all">
              Iniciar Corte
            </span>
          </div>
        </div>

        <div className="absolute top-1/2 -translate-y-1/2 right-6 text-slate-200 group-hover:text-purple-200/50 transition-colors -rotate-12">
          <Scissors size={90} strokeWidth={1} />
        </div>

        <div className="absolute bottom-0 left-0 w-full h-2 bg-slate-200 border-t border-slate-300 flex justify-between px-2 group-hover:bg-purple-100 group-hover:border-purple-200 transition-colors">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="w-px h-full bg-slate-300 group-hover:bg-purple-300/50"
            ></div>
          ))}
        </div>
      </div>
    </Link>
  );
}
