"use client";

import { MapPin, Clock, ExternalLink } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";

export function StoreHeader() {
  const [storeStatus, setStoreStatus] = useState<{
    isOpen: boolean;
    text: string;
  } | null>(null);

  useEffect(() => {
    // Lógica de Horário Inteligente
    const now = new Date();
    const day = now.getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
    const hour = now.getHours();

    let isOpen = false;
    let text = "Fechado";

    // Regras de Horário
    if (day === 0) {
      // Domingo: 08:00 às 12:00
      if (hour >= 8 && hour < 12) {
        isOpen = true;
        text = "Aberto até 12:00";
      } else {
        text = "Fechado (Domingo: 8h às 12h)";
      }
    } else {
      // Segunda a Sábado: 08:00 às 19:00
      if (hour >= 8 && hour < 19) {
        isOpen = true;
        text = "Aberto até 19:00";
      } else {
        text = "Fechado (Abre às 08:00)";
      }
    }

    setStoreStatus({ isOpen, text });
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 pt-6 mb-6">
      <div className="relative w-full h-64 md:h-[450px] overflow-hidden rounded-3xl shadow-md group">
        {/* Imagem de Fundo (WebP) */}
        <div className="absolute inset-0">
          <Image
            src="/loja-fachada.webp"
            alt="Mix Novidades Fachada"
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent" />
        </div>

        {/* Conteúdo Sobreposto */}
        <div className="absolute bottom-0 left-0 w-full p-6 md:p-10 text-white">
          <div className="flex flex-col md:flex-row justify-between items-end gap-4">
            <div className="space-y-2 w-full md:w-auto">
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight drop-shadow-md">
                Mix Novidades
              </h1>

              <div className="flex flex-wrap gap-3 text-xs md:text-sm font-medium text-slate-200">
                {/* Botão de Localização Interativo */}
                <a
                  href="https://www.google.com/maps/search/?api=1&query=Rua+Pedro+Aldemar+Bantim,+945+Boa+Vista+RR"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-transparent hover:bg-white/20 hover:border-white/30 hover:scale-105 transition-all cursor-pointer group/pin"
                  title="Abrir no Google Maps"
                >
                  <MapPin
                    size={16}
                    className="text-orange-400 group-hover/pin:animate-bounce"
                  />
                  <span className="border-b border-transparent group-hover/pin:border-white/60 transition-colors">
                    Rua Pedro Aldemar Bantim, 945
                  </span>
                  <ExternalLink
                    size={12}
                    className="opacity-50 group-hover/pin:opacity-100"
                  />
                </a>

                {/* Status Aberto/Fechado Inteligente */}
                <div
                  className={`flex items-center gap-1.5 bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-transparent transition-opacity duration-500 ${
                    !storeStatus ? "opacity-0" : "opacity-100"
                  }`}
                >
                  <Clock
                    size={16}
                    className={
                      storeStatus?.isOpen ? "text-green-400" : "text-red-400"
                    }
                  />
                  <span>{storeStatus?.text}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
