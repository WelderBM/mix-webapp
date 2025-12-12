"use client";

import { ArrowRight, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function RibbonBuilderTrigger() {
  return (
    <div className="max-w-6xl mx-auto w-full px-4 mb-8">
      <Link href="/laco-builder">
        <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-all cursor-pointer group">
          <div className="flex items-center gap-4">
            <div className="bg-purple-100 p-3 rounded-xl text-purple-700 group-hover:bg-purple-200 transition-colors">
              <Scissors size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                Crie seu Laço Personalizado
              </h3>
              <p className="text-sm text-slate-500">
                Escolha a fita, a metragem e o estilo. Laço pronto na hora!
              </p>
            </div>
          </div>
          <ArrowRight className="h-6 w-6 text-purple-500 group-hover:translate-x-1 transition-transform" />
        </div>
      </Link>
    </div>
  );
}
