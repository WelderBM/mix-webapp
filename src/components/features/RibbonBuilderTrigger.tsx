"use client";

import { Scissors, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export function RibbonBuilderTrigger() {
  return (
    <Link
      href="/laco-builder"
      // ADICIONADO: 'h-full' para esticar a altura
      // GARANTIDO: 'items-center' já existe para centralizar verticalmente o ícone e o texto
      className="group relative h-full bg-white p-6 rounded-2xl shadow-sm border border-purple-100 flex items-center justify-between overflow-hidden hover:shadow-md transition-all"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-purple-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="relative flex items-center gap-4">
        <div className="bg-purple-100 p-3 rounded-xl text-purple-600 group-hover:scale-110 transition-transform">
          <Scissors size={24} />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Serviço
            </span>
            <Sparkles
              size={14}
              className="text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </div>
          <h3 className="text-lg font-bold text-slate-800 group-hover:text-purple-700 transition-colors">
            Laço Rápido
          </h3>
          <p className="text-sm text-slate-600">
            Escolha a fita e o tamanho, nós montamos.
          </p>
        </div>
      </div>

      <div className="relative bg-purple-50 p-2 rounded-full group-hover:bg-purple-100 text-purple-600 transition-all">
        <ArrowRight
          size={20}
          className="-rotate-45 group-hover:rotate-0 transition-transform"
        />
      </div>
    </Link>
  );
}
