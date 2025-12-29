"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Stylized Balloons Icon matching user reference
const BalloonIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Left Balloon */}
    <path d="M8 13.5a3.5 3.5 0 1 1 1-6.8 3.5 3.5 0 0 1-1 6.8Z" />
    <path d="M8 13.5l-1 2h2l-1-2" /> {/* Knot */}
    <path d="M6 9a2 2 0 0 1 1.5-1.5" /> {/* Reflection */}
    {/* Center Top Balloon */}
    <path d="M12 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z" />
    <path d="M12 12l-1 1.5h2L12 12" /> {/* Knot */}
    <path d="M10.5 6A2.5 2.5 0 0 1 13 5" /> {/* Reflection */}
    {/* Right Balloon */}
    <path d="M16 13.5a3.5 3.5 0 1 0 1-6.8 3.5 3.5 0 0 0-1 6.8Z" />
    <path d="M17 13.5l-1 2h2l-1-2" /> {/* Knot */}
    <path d="M18.5 9a2 2 0 0 0-1.5-1.5" /> {/* Reflection */}
    {/* Strings */}
    <path d="M8 15.5c0 2-1 4.5-2 6" />
    <path d="M12 13.5c0 2 0 5 0 8.5" />
    <path d="M17 15.5c0 2 1 4.5 2 6" />
    {/* Decorations (Confetti/Sparkles) */}
    <path d="M4 5l2 2m-2 0l2-2" /> {/* Top Left Cross */}
    <path d="M20 5l2 2m-2 0l2-2" /> {/* Top Right Cross */}
    <path d="M4 18l1.5 1.5m-1.5 0l1.5-1.5" /> {/* Bottom Left Cross */}
    <circle cx="20" cy="18" r="0.5" fill="currentColor" /> {/* Dot */}
    <circle cx="2" cy="10" r="0.5" fill="currentColor" /> {/* Dot */}
    <path d="M15 3l1 1" /> {/* Dash */}
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
