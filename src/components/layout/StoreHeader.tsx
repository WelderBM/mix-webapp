"use client";

import { MapPin } from "lucide-react";
import { StoreStatusBadge } from "./StoreStatusBadge";
import { SafeImage } from "../ui/SafeImage";
import { useSettingsStore } from "@/store/settingsStore";

// `compact`: telas internas (/fitas, /baloes, /categoria). No celular o
// banner fica baixo para a ação da página aparecer sem rolar, e o nome da
// loja deixa de ser <h1> (a página tem o seu) — #307.
export function StoreHeader({ compact = false }: { compact?: boolean }) {
  const storeName = useSettingsStore((state) => state.settings.storeName);
  const Title = compact ? "p" : "h1";
  return (
    <div className={compact ? "max-w-6xl mx-auto px-4 mt-4 mb-6 md:mt-6 md:mb-8" : "max-w-6xl mx-auto px-4 mt-6 mb-8"}>
      {/* VOLTOU PARA O FUNDO NEUTRO (bg-slate-900) */}
      <div
        className={`relative ${compact ? "h-[150px] md:h-[260px]" : "h-[280px] md:h-[350px]"} w-full overflow-hidden rounded-3xl shadow-xl flex justify-center items-center bg-slate-900`}
      >
        {/* A imagem continua contida para não perder qualidade */}
        <div className="relative h-full w-full max-w-5xl">
          <SafeImage
            src="/loja-fachada.webp"
            alt="Fachada da loja de presentes Mix Novidades"
            name="Fachada da loja de presentes Mix Novidades"
            fill
            sizes="(min-width: 1024px) 1024px, 100vw"
            className="object-contain opacity-90 hover:scale-105 transition-transform duration-700"
            priority
          />
        </div>

        <div className="absolute inset-0 bg-linear-to-t from-slate-900/95 via-slate-900/40 to-transparent pointer-events-none" />

        <div className={`absolute bottom-0 left-0 w-full ${compact ? "p-4 md:p-8" : "p-6 md:p-8"} z-20 text-white`}>
          <Title
            className={`${compact ? "text-xl md:text-4xl mb-2" : "text-3xl md:text-5xl mb-3"} font-extrabold tracking-tight drop-shadow-md`}
          >
            {storeName}
          </Title>

          <div className="flex flex-col sm:flex-row gap-3 text-sm font-medium text-slate-100">
            <a
              href="https://maps.google.com/?q=Rua+Pedro+Aldemar+Bantim,+945,+Doutor+Silvio+Botelho,+Boa+Vista+-+RR"
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-11 items-center gap-2 hover:text-purple-400 transition-colors bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10"
            >
              <MapPin size={16} className="text-purple-400" />
              Dr. Silvio Botelho, Boa Vista - RR
            </a>
            <StoreStatusBadge />
          </div>
        </div>
      </div>
    </div>
  );
}
