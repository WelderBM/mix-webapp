"use client";

import { MapPin, Clock } from "lucide-react";
import Image from "next/image";
import { StoreStatusBadge } from "./StoreStatusBadge";

export function StoreHeader() {
  return (
    <div className="max-w-6xl mx-auto px-4 mt-6 mb-8">
      {/* VOLTOU PARA O FUNDO NEUTRO (bg-slate-900) */}
      <div className="relative h-[280px] md:h-[350px] w-full overflow-hidden rounded-3xl shadow-xl flex justify-center items-center bg-slate-900">
        {/* A imagem continua contida para não perder qualidade */}
        <div className="relative h-full w-full max-w-5xl">
          <Image
            src="/loja-fachada.webp"
            alt="Fachada da loja de presentes Mix Novidades"
            fill
            className="object-contain opacity-90 hover:scale-105 transition-transform duration-700"
            priority
          />
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/40 to-transparent pointer-events-none" />

        <div className="absolute bottom-0 left-0 w-full p-6 md:p-8 z-20 text-white">
          <h1 className="text-3xl md:text-5xl font-extrabold mb-3 tracking-tight drop-shadow-md">
            Mix Novidades
          </h1>

          <div className="flex flex-col sm:flex-row gap-3 text-sm font-medium text-slate-100">
            <a
              href="https://maps.google.com/?q=Rua+Pedro+Aldemar+Bantim,+945"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-purple-400 transition-colors bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10"
            >
              <MapPin size={16} className="text-purple-400" />
              Rua Pedro Aldemar Bantim, 945
            </a>
            <StoreStatusBadge />
          </div>
        </div>
      </div>
    </div>
  );
}
