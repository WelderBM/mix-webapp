"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Custom Balloon Icon since Lucide doesn't have one
const BalloonIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 2C7.58 2 4 5.42 4 9.5c0 2.65 1.5 5.06 4 6.44V20a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-4.06c2.5-1.38 4-3.79 4-6.44C20 5.42 16.42 2 12 2Z" />
    <path d="M10 22h4" />
    <path d="M10 14a3 3 0 0 1-2.8-2" />
  </svg>
);

export function BalloonBuilderTrigger() {
  return (
    <Link href="/baloes" className="block h-full">
      <div className="relative w-full h-full min-h-[180px] rounded-3xl overflow-hidden shadow-sm cursor-pointer group transition-all hover:shadow-xl hover:scale-[1.02] border border-slate-200 bg-slate-50">
        <div className="absolute top-[-30%] right-[-10%] w-60 h-60 bg-purple-100 rounded-full opacity-50 blur-3xl animate-pulse group-hover:bg-purple-200 transition-colors" />
        <div className="absolute bottom-[-20%] left-[-10%] w-40 h-40 bg-pink-100 rounded-full opacity-40 blur-2xl group-hover:bg-pink-200 transition-colors" />

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

        <div className="absolute top-1/2 -translate-y-1/2 right-6 text-slate-200 group-hover:text-purple-200/50 transition-colors rotate-12">
          <BalloonIcon className="w-[100px] h-[100px]" />
        </div>
      </div>
    </Link>
  );
}
